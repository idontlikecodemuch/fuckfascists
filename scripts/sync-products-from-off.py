#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import struct
import sys
import unicodedata
from collections import Counter
from copy import deepcopy
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_PRODUCTS_PATH = REPO_ROOT / "assets/data/products.json"
DEFAULT_ENTITIES_PATH = REPO_ROOT / "assets/data/entities.json"
DEFAULT_ARCHIVE_PATH = REPO_ROOT / "tools/off-bulk/openfoodfacts-mongodbdump"
DEFAULT_CHECKPOINT_DIR = REPO_ROOT / "tools/off-bulk/checkpoints"
DEFAULT_CHECKPOINT_PATH = DEFAULT_CHECKPOINT_DIR / "products-off-sync.checkpoint.json"
DEFAULT_SNAPSHOT_PATH = DEFAULT_CHECKPOINT_DIR / "products-off-sync.partial.json"
DEFAULT_RESULTS_PATH = DEFAULT_CHECKPOINT_DIR / "products-off-sync.results.json"

DEFAULT_EXACT_PRODUCT_LIMIT = 1000
EXACT_PRODUCT_POOL_LIMIT = 5000
EXACT_PRODUCTS_PER_PRODUCER = 60
MAX_BSON_DOCUMENT_SIZE = 32 * 1024 * 1024
COMPANY_SUFFIXES = {
    "co",
    "company",
    "corp",
    "corporation",
    "group",
    "holdings",
    "inc",
    "incorporated",
    "international",
    "limited",
    "llc",
    "ltd",
    "plc",
    "sa",
    "spa",
}
LEGAL_ENTITY_TOKENS = COMPANY_SUFFIXES | {
    "brands",
    "beverage",
    "beverages",
    "bakeries",
    "bakery",
    "brewery",
    "brewing",
    "coffee",
    "foods",
    "food",
    "house",
    "industries",
    "industry",
    "manufacturing",
    "usa",
}
GENERIC_DESCRIPTOR_TOKENS = {
    "beans",
    "blend",
    "blonde",
    "breakfast",
    "cappuccino",
    "coffee",
    "colombia",
    "columbia",
    "dark",
    "espresso",
    "flavored",
    "flavour",
    "house",
    "instant",
    "latte",
    "medium",
    "mocha",
    "origin",
    "roast",
    "restaurant",
    "seasonal",
    "single",
    "item",
    "vanilla",
    "white",
}


class BsonParseError(RuntimeError):
    pass


@dataclass
class ProducerSeed:
    canonical_name: str
    entity_id: str | None
    entity_id_exists: bool
    entity_match_type: str | None
    seed_brands: list[str]
    seed_brand_norms: dict[str, str]
    canonical_norm: str
    canonical_variants: set[str]


@dataclass
class ProducerAggregate:
    matched_product_count: int = 0
    prefix_counts: Counter[str] = field(default_factory=Counter)
    db_brand_counts: Counter[str] = field(default_factory=Counter)
    term_hits: Counter[str] = field(default_factory=Counter)


@dataclass
class EntityMatch:
    entity_id: str
    match_type: str


@dataclass
class ExactProductCandidate:
    barcode: str
    display_barcode: str
    product_name: str
    brand_name: str | None
    canonical_producer_name: str
    matched_term: str | None


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def atomic_write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = path.with_suffix(path.suffix + ".tmp")
    tmp_path.write_text(text, encoding="utf-8")
    tmp_path.replace(path)


def atomic_write_json(path: Path, payload: Any) -> None:
    atomic_write_text(path, json.dumps(payload, indent=2, ensure_ascii=False) + "\n")


def normalize_term(value: str | None) -> str:
    if not value:
        return ""
    normalized = unicodedata.normalize("NFKD", value)
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    normalized = normalized.replace("&", " and ")
    normalized = normalized.replace("'", "")
    normalized = normalized.lower()
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def split_csv_like(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [part.strip() for part in raw.split(",") if part.strip()]


def clean_display_label(raw: str | None) -> str:
    if not raw:
        return ""
    compact = unicodedata.normalize("NFKC", raw)
    compact = re.sub(r"\s+", " ", compact).strip()
    compact = re.sub(r"\s+([,./&])", r"\1", compact)
    compact = re.sub(r"([,./&-])\1+", r"\1", compact)
    compact = re.sub(r"[,\./&\-\s]+$", "", compact)
    compact = re.sub(r"\s+", " ", compact).strip()
    return compact


def titleize_brand(raw: str) -> str:
    compact = clean_display_label(raw).replace("-", " ")
    if not compact:
        return ""
    return " ".join(part[:1].upper() + part[1:] for part in compact.split(" "))


def producer_term_variants(raw: str | None, strip_suffixes: bool) -> set[str]:
    base = normalize_term(raw)
    if not base:
        return set()

    variants = {base}
    if strip_suffixes:
        tokens = base.split()
        while tokens and tokens[-1] in COMPANY_SUFFIXES:
            tokens = tokens[:-1]
            if tokens:
                variants.add(" ".join(tokens))
    return {variant for variant in variants if variant}


def load_entity_lookup(entities_path: Path = DEFAULT_ENTITIES_PATH) -> dict[str, EntityMatch]:
    raw = json.loads(entities_path.read_text(encoding="utf-8"))
    entities = raw.get("entities") if isinstance(raw, dict) else raw
    if not isinstance(entities, list):
        raise RuntimeError(f"{entities_path} does not contain an entity list")

    lookup: dict[str, EntityMatch] = {}
    ambiguous: set[str] = set()

    def add_term(term: str, entity_id: str, match_type: str) -> None:
        normalized = normalize_term(term)
        if not normalized:
            return
        existing = lookup.get(normalized)
        if existing and existing.entity_id != entity_id:
            ambiguous.add(normalized)
            return
        lookup[normalized] = EntityMatch(entity_id=entity_id, match_type=match_type)

    for entity in entities:
        if not isinstance(entity, dict):
            continue
        entity_id = entity.get("id")
        if not isinstance(entity_id, str) or not entity_id:
            continue

        canonical_name = entity.get("canonicalName")
        if isinstance(canonical_name, str):
            for variant in producer_term_variants(canonical_name, strip_suffixes=True):
                add_term(variant, entity_id, "canonical")

        aliases = entity.get("aliases")
        if isinstance(aliases, list):
            for alias in aliases:
                if isinstance(alias, str):
                    for variant in producer_term_variants(alias, strip_suffixes=True):
                        add_term(variant, entity_id, "alias")

    for term in ambiguous:
        lookup.pop(term, None)

    return lookup


def prefix_from_code(code: Any) -> str | None:
    digits = re.sub(r"\D", "", str(code or ""))
    if len(digits) == 13 and digits.startswith("0"):
        digits = digits[1:]
    if len(digits) < 12:
        return None
    return digits[:6]


def barcode_values_from_code(code: Any) -> tuple[str, str] | None:
    digits = re.sub(r"\D", "", str(code or ""))
    if len(digits) == 12:
        return "0" + digits, digits
    if len(digits) == 13:
        display = digits[1:] if digits.startswith("0") else digits
        return digits, display
    return None


def prefix_threshold(matched_product_count: int) -> int:
    if matched_product_count >= 1000:
        return 5
    if matched_product_count >= 250:
        return 3
    return 2


def filter_prefixes(prefix_counts: Counter[str], matched_product_count: int) -> tuple[int, list[str]]:
    threshold = prefix_threshold(matched_product_count)
    prefixes = [
        prefix
        for prefix, count in sorted(prefix_counts.items(), key=lambda item: (-item[1], item[0]))
        if count >= threshold
    ]
    return threshold, prefixes


def looks_like_self_name(normalized: str, seed: ProducerSeed) -> bool:
    if not normalized:
        return True
    if normalized in seed.canonical_variants:
        return True

    canonical_tokens = [token for token in seed.canonical_norm.split() if token not in {"and"}]
    brand_tokens = normalized.split()
    if canonical_tokens and all(token in brand_tokens for token in canonical_tokens):
        extras = [
            token
            for token in brand_tokens
            if token not in canonical_tokens and token not in {"the"} and token not in LEGAL_ENTITY_TOKENS
        ]
        if not extras:
            return True

    return False


def looks_like_legal_entity(normalized: str) -> bool:
    tokens = normalized.split()
    if len(tokens) < 2:
        return False
    if tokens[-1] in LEGAL_ENTITY_TOKENS:
        return True
    return bool(set(tokens) & LEGAL_ENTITY_TOKENS and len(tokens) >= 3)


def looks_like_descriptor(normalized: str) -> bool:
    tokens = normalized.split()
    if len(tokens) < 1:
        return False
    if len(tokens) == 1:
        return tokens[0] in GENERIC_DESCRIPTOR_TOKENS
    descriptor_hits = sum(1 for token in tokens if token in GENERIC_DESCRIPTOR_TOKENS)
    if len(tokens) == 2:
        return descriptor_hits == 2
    return descriptor_hits >= len(tokens) - 1


def quality_product_name(raw: str | None) -> str | None:
    label = clean_display_label(raw)
    normalized = normalize_term(label)
    if not label or not normalized:
        return None
    if len(label) < 3:
        return None
    if normalized in {"product", "unknown", "no name", "sans marque", "sin marca"}:
        return None
    if looks_like_descriptor(normalized):
        return None
    return label


def read_cstring(buffer: bytes, position: int, end: int) -> tuple[str, int]:
    zero_index = buffer.find(b"\x00", position, end)
    if zero_index == -1:
        raise BsonParseError("unterminated cstring")
    return buffer[position:zero_index].decode("utf-8", errors="replace"), zero_index + 1


def skip_value(value_type: int, buffer: bytes, position: int, end: int) -> int:
    if value_type in (0x01, 0x09, 0x11, 0x12):
        return position + 8
    if value_type in (0x07,):
        return position + 12
    if value_type in (0x08,):
        return position + 1
    if value_type in (0x0A, 0x06, 0xFF, 0x7F):
        return position
    if value_type in (0x10,):
        return position + 4
    if value_type in (0x13,):
        return position + 16
    if value_type in (0x02, 0x0D, 0x0E):
        if position + 4 > end:
            raise BsonParseError("truncated string")
        size = struct.unpack_from("<i", buffer, position)[0]
        return position + 4 + size
    if value_type in (0x03, 0x04):
        if position + 4 > end:
            raise BsonParseError("truncated embedded document")
        size = struct.unpack_from("<i", buffer, position)[0]
        return position + size
    if value_type == 0x05:
        if position + 5 > end:
            raise BsonParseError("truncated binary")
        size = struct.unpack_from("<i", buffer, position)[0]
        return position + 5 + size
    if value_type == 0x0B:
        _, position = read_cstring(buffer, position, end)
        _, position = read_cstring(buffer, position, end)
        return position
    if value_type == 0x0C:
        if position + 4 > end:
            raise BsonParseError("truncated dbpointer")
        size = struct.unpack_from("<i", buffer, position)[0]
        return position + 4 + size + 12
    if value_type == 0x0F:
        if position + 4 > end:
            raise BsonParseError("truncated code_w_scope")
        size = struct.unpack_from("<i", buffer, position)[0]
        return position + size
    raise BsonParseError(f"unsupported bson type 0x{value_type:02x}")


def parse_string_value(buffer: bytes, position: int, end: int) -> tuple[str, int]:
    if position + 4 > end:
        raise BsonParseError("truncated string length")
    size = struct.unpack_from("<i", buffer, position)[0]
    string_start = position + 4
    string_end = string_start + size
    if size < 1 or string_end > end:
        raise BsonParseError("invalid string length")
    return buffer[string_start:string_end - 1].decode("utf-8", errors="replace"), string_end


def parse_array_of_strings(buffer: bytes, position: int, end: int) -> tuple[list[str], int]:
    if position + 4 > end:
        raise BsonParseError("truncated array length")
    size = struct.unpack_from("<i", buffer, position)[0]
    array_end = position + size
    if size < 5 or array_end > end:
        raise BsonParseError("invalid array length")

    values: list[str] = []
    cursor = position + 4
    while cursor < array_end - 1:
        value_type = buffer[cursor]
        cursor += 1
        _, cursor = read_cstring(buffer, cursor, array_end - 1)
        if value_type == 0x02:
            value, cursor = parse_string_value(buffer, cursor, array_end - 1)
            if value:
                values.append(value)
        else:
            cursor = skip_value(value_type, buffer, cursor, array_end - 1)
        if cursor > array_end:
            raise BsonParseError("array cursor overrun")

    if buffer[array_end - 1] != 0:
        raise BsonParseError("array missing terminator")
    return values, array_end


def parse_document_fields(document: bytes, wanted_keys: set[str]) -> dict[str, Any]:
    if len(document) < 5:
        raise BsonParseError("document too small")
    declared_size = struct.unpack_from("<i", document, 0)[0]
    if declared_size != len(document):
        raise BsonParseError("document length mismatch")
    if document[-1] != 0:
        raise BsonParseError("document missing terminator")

    output: dict[str, Any] = {}
    cursor = 4
    end = len(document) - 1

    while cursor < end:
        value_type = document[cursor]
        cursor += 1
        if value_type == 0:
            break

        key, cursor = read_cstring(document, cursor, end)
        interested = key in wanted_keys

        if value_type == 0x02:
            value, cursor = parse_string_value(document, cursor, end)
            if interested:
                output[key] = value
            continue

        if value_type == 0x04:
            values, cursor = parse_array_of_strings(document, cursor, end)
            if interested:
                output[key] = values
            continue

        if interested and value_type == 0x07:
            output[key] = document[cursor:cursor + 12].hex()
            cursor += 12
            continue

        if interested and value_type == 0x10:
            output[key] = struct.unpack_from("<i", document, cursor)[0]
            cursor += 4
            continue

        if interested and value_type == 0x12:
            output[key] = struct.unpack_from("<q", document, cursor)[0]
            cursor += 8
            continue

        cursor = skip_value(value_type, document, cursor, end)
        if cursor > len(document):
            raise BsonParseError("document cursor overrun")

    return output


def detect_first_bson_offset(archive_path: Path, probe_bytes: int = 512 * 1024) -> int:
    with archive_path.open("rb") as handle:
        sample = handle.read(probe_bytes)
    for offset in range(max(0, len(sample) - 5)):
        declared_size = struct.unpack_from("<i", sample, offset)[0]
        if declared_size < 32 or declared_size > MAX_BSON_DOCUMENT_SIZE:
            continue
        end = offset + declared_size
        if end > len(sample) or sample[end - 1] != 0:
            continue
        try:
            parsed = parse_document_fields(sample[offset:end], {"_id", "code"})
        except BsonParseError:
            continue
        if "_id" in parsed or "code" in parsed:
            return offset
    raise RuntimeError(f"Could not locate the first BSON document in {archive_path}")


def resolve_research_entity(entry: dict[str, Any], entity_lookup: dict[str, EntityMatch]) -> EntityMatch | None:
    candidate_terms = [entry.get("canonicalProducerName")]
    candidate_terms.extend(entry.get("observedBrands") or [])
    candidate_terms.extend(entry.get("dbConfirmedAliases") or [])

    for term in candidate_terms:
        if not isinstance(term, str):
            continue
        for variant in producer_term_variants(term, strip_suffixes=True):
            match = entity_lookup.get(variant)
            if match:
                return match

    return None


def build_seed_index(payload: dict[str, Any]) -> tuple[list[ProducerSeed], dict[str, int]]:
    producer_research = payload.get("producerResearch")
    if not isinstance(producer_research, list):
        raise RuntimeError("products.json is missing producerResearch")

    entity_lookup = load_entity_lookup()
    seeds: list[ProducerSeed] = []
    term_to_index: dict[str, int] = {}
    ambiguous_terms: set[str] = set()

    for entry in producer_research:
        canonical_name = str(entry.get("canonicalProducerName") or "").strip()
        if not canonical_name:
            continue

        seed_index = len(seeds)
        entity_match = resolve_research_entity(entry, entity_lookup)
        if entity_match:
            entry["entityId"] = entity_match.entity_id
            entry["entityIdExists"] = True
            entry["entityMatchType"] = entity_match.match_type
            entry["missingEntityCandidate"] = False
        else:
            entry["entityIdExists"] = False
            if not isinstance(entry.get("entityId"), str):
                entry["entityId"] = None
            if not isinstance(entry.get("entityMatchType"), str):
                entry["entityMatchType"] = None

        seed_brands = [brand.strip() for brand in entry.get("observedBrands") or [] if isinstance(brand, str) and brand.strip()]
        canonical_variants = producer_term_variants(canonical_name, strip_suffixes=True)
        seed_brand_norms = {
            normalized: brand
            for brand in seed_brands
            if (normalized := normalize_term(brand))
        }
        seeds.append(
            ProducerSeed(
                canonical_name=canonical_name,
                entity_id=entity_match.entity_id if entity_match else None,
                entity_id_exists=bool(entity_match),
                entity_match_type=entity_match.match_type if entity_match else None,
                seed_brands=seed_brands,
                seed_brand_norms=seed_brand_norms,
                canonical_norm=normalize_term(canonical_name),
                canonical_variants=canonical_variants,
            )
        )

        terms = set(canonical_variants)
        for brand in seed_brands:
            terms.update(producer_term_variants(brand, strip_suffixes=False))

        for term in terms:
            existing_index = term_to_index.get(term)
            if existing_index is None:
                term_to_index[term] = seed_index
            elif existing_index != seed_index:
                ambiguous_terms.add(term)

    for term in ambiguous_terms:
        term_to_index.pop(term, None)

    return seeds, term_to_index


def init_aggregates(seeds: list[ProducerSeed]) -> dict[str, ProducerAggregate]:
    return {seed.canonical_name: ProducerAggregate() for seed in seeds}


def hydrate_aggregates(
    checkpoint_payload: dict[str, Any] | None,
    seeds: list[ProducerSeed],
) -> tuple[dict[str, ProducerAggregate], int, int, int, list[ExactProductCandidate]]:
    aggregates = init_aggregates(seeds)
    if not checkpoint_payload:
        return aggregates, 0, 0, 0, []

    stored_results = checkpoint_payload.get("results") or {}
    for seed in seeds:
        stored = stored_results.get(seed.canonical_name)
        if not isinstance(stored, dict):
            continue

        aggregate = aggregates[seed.canonical_name]
        aggregate.matched_product_count = int(stored.get("matchedProductCount") or 0)
        aggregate.prefix_counts.update({str(k): int(v) for k, v in (stored.get("prefixCounts") or {}).items()})
        aggregate.db_brand_counts.update({str(k): int(v) for k, v in (stored.get("dbBrandCounts") or {}).items()})
        aggregate.term_hits.update({str(k): int(v) for k, v in (stored.get("termHits") or {}).items()})

    exact_products: list[ExactProductCandidate] = []
    for item in checkpoint_payload.get("exactProducts") or []:
        if not isinstance(item, dict):
            continue
        barcode = str(item.get("barcode") or "").strip()
        display_barcode = str(item.get("displayBarcode") or "").strip()
        product_name = str(item.get("productName") or "").strip()
        canonical_producer_name = str(item.get("canonicalProducerName") or "").strip()
        if not barcode or not display_barcode or not product_name or not canonical_producer_name:
            continue
        brand_name = item.get("brandName")
        matched_term = item.get("matchedTerm")
        exact_products.append(
            ExactProductCandidate(
                barcode=barcode,
                display_barcode=display_barcode,
                product_name=product_name,
                brand_name=brand_name if isinstance(brand_name, str) and brand_name.strip() else None,
                canonical_producer_name=canonical_producer_name,
                matched_term=matched_term if isinstance(matched_term, str) and matched_term.strip() else None,
            )
        )

    return (
        aggregates,
        int(checkpoint_payload.get("offset") or 0),
        int(checkpoint_payload.get("documentsScanned") or 0),
        int(checkpoint_payload.get("parseErrors") or 0),
        exact_products,
    )


def checkpoint_payload(
    *,
    archive_path: Path,
    archive_size: int,
    offset: int,
    documents_scanned: int,
    parse_errors: int,
    aggregates: dict[str, ProducerAggregate],
    exact_products: list[ExactProductCandidate],
    status: str,
) -> dict[str, Any]:
    return {
        "version": 1,
        "status": status,
        "updatedAt": utc_now(),
        "archivePath": str(archive_path),
        "archiveSize": archive_size,
        "offset": offset,
        "documentsScanned": documents_scanned,
        "parseErrors": parse_errors,
        "exactProducts": [
            {
                "barcode": product.barcode,
                "displayBarcode": product.display_barcode,
                "productName": product.product_name,
                "brandName": product.brand_name,
                "canonicalProducerName": product.canonical_producer_name,
                "matchedTerm": product.matched_term,
            }
            for product in exact_products
        ],
        "results": {
            name: {
                "matchedProductCount": aggregate.matched_product_count,
                "prefixCounts": dict(sorted(aggregate.prefix_counts.items())),
                "dbBrandCounts": dict(sorted(aggregate.db_brand_counts.items())),
                "termHits": dict(sorted(aggregate.term_hits.items())),
            }
            for name, aggregate in aggregates.items()
        },
    }


def db_brand_displays(parsed_doc: dict[str, Any]) -> list[str]:
    brands = [brand for brand in split_csv_like(parsed_doc.get("brands")) if brand]
    if brands:
        return brands

    tag_values = parsed_doc.get("brands_tags") or []
    if not isinstance(tag_values, list):
        return []
    return [display for display in (titleize_brand(tag) for tag in tag_values[:10]) if display]


def match_terms(parsed_doc: dict[str, Any], term_to_index: dict[str, int]) -> tuple[set[int], set[str]]:
    normalized_terms: set[str] = set()

    for raw_owner_key in ("brand_owner", "brand_owner_imported"):
        raw_owner = parsed_doc.get(raw_owner_key)
        if isinstance(raw_owner, str):
            normalized_terms.update(producer_term_variants(raw_owner, strip_suffixes=True))

    for raw_brand in split_csv_like(parsed_doc.get("brands")):
        normalized = normalize_term(raw_brand)
        if normalized:
            normalized_terms.add(normalized)

    raw_brand_tags = parsed_doc.get("brands_tags")
    if isinstance(raw_brand_tags, list):
        for raw_tag in raw_brand_tags:
            normalized = normalize_term(raw_tag if isinstance(raw_tag, str) else None)
            if normalized:
                normalized_terms.add(normalized)

    matched_indices = {term_to_index[term] for term in normalized_terms if term in term_to_index}
    return matched_indices, normalized_terms


def mentions_other_producer(normalized: str, seed: ProducerSeed, seeds: list[ProducerSeed]) -> bool:
    for other_seed in seeds:
        if other_seed.canonical_name == seed.canonical_name:
            continue
        if normalized in other_seed.canonical_variants or normalized in other_seed.seed_brand_norms:
            return True
        if len(other_seed.canonical_norm) >= 4 and other_seed.canonical_norm in normalized:
            return True
        if other_seed.canonical_norm.startswith(normalized + " "):
            remainder = other_seed.canonical_norm[len(normalized):].strip().split()
            if remainder and all(token in LEGAL_ENTITY_TOKENS for token in remainder):
                return True
    return False


def quality_brand_label(raw: str | None, seed: ProducerSeed, seeds: list[ProducerSeed]) -> str | None:
    label = clean_display_label(raw)
    normalized = normalize_term(label)
    if not label or not normalized:
        return None
    if label.lower().startswith("by "):
        return None
    if normalized.endswith(" and"):
        return None
    if looks_like_self_name(normalized, seed):
        return None
    if looks_like_legal_entity(normalized):
        return None
    if looks_like_descriptor(normalized):
        return None
    if mentions_other_producer(normalized, seed, seeds):
        return None
    return label


def matches_seed_identity(normalized: str, seed: ProducerSeed) -> bool:
    if any(variant in normalized for variant in seed.canonical_variants):
        return True
    return any(brand_norm in normalized for brand_norm in seed.seed_brand_norms)


def ordered_db_brands(
    seed: ProducerSeed,
    aggregate: ProducerAggregate,
    seeds: list[ProducerSeed],
    *,
    limit: int,
) -> list[str]:
    ordered: list[str] = []
    seen: set[str] = set()

    for brand, _count in aggregate.db_brand_counts.most_common():
        label = quality_brand_label(brand, seed, seeds)
        normalized = normalize_term(label)
        if not label or not normalized or normalized in seen:
            continue
        ordered.append(label)
        seen.add(normalized)
        if len(ordered) >= limit:
            break

    return ordered


def confirmed_aliases(seed: ProducerSeed, aggregate: ProducerAggregate, seeds: list[ProducerSeed]) -> list[str]:
    confirmed: list[str] = []
    for normalized, display in seed.seed_brand_norms.items():
        label = quality_brand_label(display, seed, seeds)
        if aggregate.term_hits[normalized] > 0 and label:
            confirmed.append(label)
    return confirmed


def suggested_aliases(
    seed: ProducerSeed,
    aggregate: ProducerAggregate,
    seeds: list[ProducerSeed],
    *,
    limit: int,
    min_count: int = 2,
) -> list[str]:
    seed_norms = set(seed.seed_brand_norms)
    suggestions: list[str] = []
    seen: set[str] = set()
    has_confirmed_aliases = bool(confirmed_aliases(seed, aggregate, seeds))

    for brand, count in aggregate.db_brand_counts.most_common():
        label = quality_brand_label(brand, seed, seeds)
        normalized = normalize_term(label)
        if (
            count < min_count
            or not label
            or not normalized
            or normalized in seed.canonical_variants
            or normalized in seed_norms
            or normalized in seen
        ):
            continue
        if not has_confirmed_aliases and not matches_seed_identity(normalized, seed):
            continue
        suggestions.append(label)
        seen.add(normalized)
        if len(suggestions) >= limit:
            break

    return suggestions


def runtime_brands(seed: ProducerSeed, aggregate: ProducerAggregate, seeds: list[ProducerSeed], *, limit: int) -> list[str]:
    ordered: list[str] = []
    seen: set[str] = set()

    for brand in confirmed_aliases(seed, aggregate, seeds):
        normalized = normalize_term(brand)
        if normalized and normalized not in seen:
            ordered.append(brand)
            seen.add(normalized)

    for brand in seed.seed_brands:
        label = quality_brand_label(brand, seed, seeds)
        normalized = normalize_term(label)
        if label and normalized and normalized not in seen:
            ordered.append(label)
            seen.add(normalized)

    for brand in suggested_aliases(seed, aggregate, seeds, limit=limit):
        normalized = normalize_term(brand)
        if normalized and normalized not in seen:
            ordered.append(brand)
            seen.add(normalized)
        if len(ordered) >= limit:
            break

    return ordered[:limit]


def product_brand_label(parsed_doc: dict[str, Any], seed: ProducerSeed) -> str | None:
    for raw_brand in db_brand_displays(parsed_doc):
        label = clean_display_label(raw_brand)
        normalized = normalize_term(label)
        if label and normalized and not looks_like_descriptor(normalized):
            return label

    for seed_brand in seed.seed_brands:
        label = clean_display_label(seed_brand)
        if label:
            return label

    return clean_display_label(seed.canonical_name) or None


def exact_product_candidate(
    parsed_doc: dict[str, Any],
    matched_indices: set[int],
    matched_terms: set[str],
    term_to_index: dict[str, int],
    seeds: list[ProducerSeed],
) -> ExactProductCandidate | None:
    if len(matched_indices) != 1:
        return None

    matched_index = next(iter(matched_indices))
    seed = seeds[matched_index]
    if not seed.entity_id_exists or not seed.entity_id:
        return None

    barcode_values = barcode_values_from_code(parsed_doc.get("code"))
    if not barcode_values:
        return None

    product_name = quality_product_name(parsed_doc.get("product_name"))
    if not product_name:
        return None

    matched_term = next(
        (
            term
            for term in sorted(matched_terms)
            if term_to_index.get(term) == matched_index
        ),
        None,
    )
    barcode, display_barcode = barcode_values

    return ExactProductCandidate(
        barcode=barcode,
        display_barcode=display_barcode,
        product_name=product_name,
        brand_name=product_brand_label(parsed_doc, seed),
        canonical_producer_name=seed.canonical_name,
        matched_term=matched_term,
    )


def build_runtime_products(
    exact_products: list[ExactProductCandidate],
    seeds: list[ProducerSeed],
    aggregates: dict[str, ProducerAggregate],
    *,
    limit: int,
) -> list[dict[str, Any]]:
    seed_by_name = {seed.canonical_name: seed for seed in seeds}
    grouped_rows: dict[str, list[dict[str, Any]]] = {}
    producer_weights: dict[str, int] = {}
    seen_barcodes: set[str] = set()

    for product in exact_products:
        if product.barcode in seen_barcodes:
            continue
        seed = seed_by_name.get(product.canonical_producer_name)
        if not seed or not seed.entity_id_exists or not seed.entity_id:
            continue
        aggregate = aggregates.get(seed.canonical_name)
        if not aggregate or aggregate.matched_product_count <= 0:
            continue

        seen_barcodes.add(product.barcode)
        producer_weights[seed.canonical_name] = aggregate.matched_product_count
        row: dict[str, Any] = {
            "barcode": product.barcode,
            "displayBarcode": product.display_barcode,
            "productName": product.product_name,
            "canonicalProducerName": seed.canonical_name,
            "entityId": seed.entity_id,
            "entityMatchType": seed.entity_match_type,
            "matchedProducerProductCount": aggregate.matched_product_count,
            "source": "off-bulk-exact",
        }
        if product.brand_name:
            row["brandName"] = product.brand_name
        if product.matched_term:
            row["matchedTerm"] = product.matched_term
        grouped_rows.setdefault(seed.canonical_name, []).append(row)

    for rows in grouped_rows.values():
        rows.sort(key=lambda item: (str(item["productName"]), str(item["barcode"])))

    producer_order = sorted(
        grouped_rows,
        key=lambda name: (-producer_weights.get(name, 0), name),
    )
    selected: list[dict[str, Any]] = []
    row_index = 0

    while len(selected) < limit:
        added_this_round = False
        for producer_name in producer_order:
            rows = grouped_rows[producer_name]
            if row_index >= len(rows):
                continue
            selected.append(rows[row_index])
            added_this_round = True
            if len(selected) >= limit:
                break
        if not added_this_round:
            break
        row_index += 1

    return selected


def build_products_snapshot(
    payload: dict[str, Any],
    seeds: list[ProducerSeed],
    aggregates: dict[str, ProducerAggregate],
    exact_products: list[ExactProductCandidate],
    *,
    scan_offset: int,
    documents_scanned: int,
    archive_path: Path,
    exact_product_limit: int,
    partial: bool,
) -> dict[str, Any]:
    snapshot = deepcopy(payload)
    producer_research = snapshot.get("producerResearch") or []
    runtime_producers: list[dict[str, Any]] = []

    for entry, seed in zip(producer_research, seeds):
        aggregate = aggregates[seed.canonical_name]
        threshold, prefixes = filter_prefixes(aggregate.prefix_counts, aggregate.matched_product_count)
        db_brands = ordered_db_brands(seed, aggregate, seeds, limit=12)
        confirmed = confirmed_aliases(seed, aggregate, seeds)
        suggested = suggested_aliases(seed, aggregate, seeds, limit=12)

        entry["dbMatchedProductCount"] = aggregate.matched_product_count
        entry["dbObservedPrefixes"] = prefixes
        entry["dbObservedBrands"] = db_brands
        entry["dbConfirmedAliases"] = confirmed
        entry["dbSuggestedAliases"] = suggested

        if seed.entity_id_exists and seed.entity_id and aggregate.matched_product_count >= 20 and prefixes:
            runtime_producers.append(
                {
                    "canonicalProducerName": seed.canonical_name,
                    "entityId": seed.entity_id,
                    "entityMatchType": seed.entity_match_type,
                    "matchedProductCount": aggregate.matched_product_count,
                    "prefixThreshold": threshold,
                    "prefixes": prefixes,
                    "observedBrands": runtime_brands(seed, aggregate, seeds, limit=8),
                    "source": "off-bulk",
                }
            )

    runtime_producers.sort(key=lambda item: (-int(item["matchedProductCount"]), item["canonicalProducerName"]))
    snapshot["producers"] = runtime_producers
    snapshot["products"] = build_runtime_products(
        exact_products,
        seeds,
        aggregates,
        limit=exact_product_limit,
    )

    meta = snapshot.setdefault("_meta", {})
    meta["producerCount"] = len(runtime_producers)
    meta["productCount"] = len(snapshot["products"])
    meta["researchEntryCount"] = len(producer_research)
    meta["producerSource"] = "Runtime producers come from OFF bulk DB prefix aggregation filtered to repeated UPC evidence."
    meta["productSource"] = "Runtime exact products come from OFF bulk DB product rows that match one existing producer seed and current entity ID."
    meta["lastUpdated"] = datetime.now().date().isoformat()
    meta["syncCheckpoint"] = {
        "partial": partial,
        "archivePath": str(archive_path),
        "scanOffset": scan_offset,
        "documentsScanned": documents_scanned,
        "updatedAt": utc_now(),
    }
    return snapshot


def persist_progress(
    *,
    payload: dict[str, Any],
    seeds: list[ProducerSeed],
    aggregates: dict[str, ProducerAggregate],
    exact_products: list[ExactProductCandidate],
    archive_path: Path,
    checkpoint_path: Path,
    snapshot_path: Path,
    results_path: Path,
    offset: int,
    documents_scanned: int,
    parse_errors: int,
    exact_product_limit: int,
    status: str,
    partial: bool,
) -> None:
    archive_size = archive_path.stat().st_size
    checkpoint = checkpoint_payload(
        archive_path=archive_path,
        archive_size=archive_size,
        offset=offset,
        documents_scanned=documents_scanned,
        parse_errors=parse_errors,
        aggregates=aggregates,
        exact_products=exact_products,
        status=status,
    )
    snapshot = build_products_snapshot(
        payload,
        seeds,
        aggregates,
        exact_products,
        scan_offset=offset,
        documents_scanned=documents_scanned,
        archive_path=archive_path,
        exact_product_limit=exact_product_limit,
        partial=partial,
    )

    atomic_write_json(checkpoint_path, checkpoint)
    atomic_write_json(snapshot_path, snapshot)
    atomic_write_json(results_path, checkpoint["results"])


def scan_archive(
    *,
    archive_path: Path,
    start_offset: int,
    term_to_index: dict[str, int],
    seeds: list[ProducerSeed],
    aggregates: dict[str, ProducerAggregate],
    exact_products: list[ExactProductCandidate],
    documents_scanned: int,
    checkpoint_every_docs: int,
    block_size_bytes: int,
    checkpoint_callback,
    limit: int | None,
) -> tuple[int, int, int, bool]:
    offset = start_offset
    parse_errors = 0
    documents_since_checkpoint = 0
    completed = False
    exact_product_seen = {product.barcode for product in exact_products}
    exact_products_by_producer = Counter(product.canonical_producer_name for product in exact_products)

    with archive_path.open("rb") as handle:
        handle.seek(start_offset)
        buffer = bytearray()

        while True:
            chunk = handle.read(block_size_bytes)
            if chunk:
                buffer.extend(chunk)

            while True:
                if len(buffer) < 4:
                    break

                declared_size = struct.unpack_from("<i", buffer, 0)[0]
                if declared_size == -1:
                    del buffer[:4]
                    offset += 4
                    completed = True
                    break

                if declared_size < 5 or declared_size > MAX_BSON_DOCUMENT_SIZE:
                    raise RuntimeError(f"Unexpected BSON document size {declared_size} at byte offset {offset}")

                if len(buffer) < declared_size:
                    break

                document = bytes(buffer[:declared_size])
                del buffer[:declared_size]
                offset += declared_size
                documents_scanned += 1
                documents_since_checkpoint += 1

                try:
                    parsed_doc = parse_document_fields(
                        document,
                        {"code", "product_name", "brands", "brands_tags", "brand_owner", "brand_owner_imported"},
                    )
                except BsonParseError:
                    parse_errors += 1
                    parsed_doc = {}

                matched_indices, matched_terms = match_terms(parsed_doc, term_to_index)
                prefix = prefix_from_code(parsed_doc.get("code"))

                if matched_indices:
                    brands = db_brand_displays(parsed_doc)
                    for matched_index in matched_indices:
                        seed = seeds[matched_index]
                        aggregate = aggregates[seed.canonical_name]
                        aggregate.matched_product_count += 1
                        if prefix:
                            aggregate.prefix_counts[prefix] += 1
                        for brand in brands:
                            aggregate.db_brand_counts[brand] += 1
                        for term in matched_terms:
                            if term in seed.canonical_variants or term_to_index.get(term) == matched_index:
                                aggregate.term_hits[term] += 1

                    product = exact_product_candidate(parsed_doc, matched_indices, matched_terms, term_to_index, seeds)
                    if (
                        product
                        and product.barcode not in exact_product_seen
                        and exact_products_by_producer[product.canonical_producer_name] < EXACT_PRODUCTS_PER_PRODUCER
                        and len(exact_products) < EXACT_PRODUCT_POOL_LIMIT
                    ):
                        exact_products.append(product)
                        exact_product_seen.add(product.barcode)
                        exact_products_by_producer[product.canonical_producer_name] += 1

                if checkpoint_every_docs > 0 and documents_since_checkpoint >= checkpoint_every_docs:
                    checkpoint_callback(offset=offset, documents_scanned=documents_scanned, parse_errors=parse_errors)
                    documents_since_checkpoint = 0

                if limit and documents_scanned >= limit:
                    checkpoint_callback(offset=offset, documents_scanned=documents_scanned, parse_errors=parse_errors)
                    return offset, documents_scanned, parse_errors, False

            if completed:
                break
            if not chunk:
                break

    if documents_since_checkpoint:
        checkpoint_callback(offset=offset, documents_scanned=documents_scanned, parse_errors=parse_errors)

    return offset, documents_scanned, parse_errors, completed


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Sync products.json producer prefixes from the local Open Food Facts bulk archive with resumable checkpoints."
    )
    parser.add_argument("--products-path", type=Path, default=DEFAULT_PRODUCTS_PATH)
    parser.add_argument("--archive-path", type=Path, default=DEFAULT_ARCHIVE_PATH)
    parser.add_argument("--checkpoint-path", type=Path, default=DEFAULT_CHECKPOINT_PATH)
    parser.add_argument("--snapshot-path", type=Path, default=DEFAULT_SNAPSHOT_PATH)
    parser.add_argument("--results-path", type=Path, default=DEFAULT_RESULTS_PATH)
    parser.add_argument("--checkpoint-every-docs", type=int, default=50000)
    parser.add_argument("--block-size-mb", type=int, default=8)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument(
        "--exact-product-limit",
        type=int,
        default=DEFAULT_EXACT_PRODUCT_LIMIT,
        help="Maximum exact barcode product rows to include in products.json.",
    )
    parser.add_argument("--fresh", action="store_true", help="Ignore any saved checkpoint and start from the first OFF document.")
    parser.add_argument("--no-final-write", action="store_true", help="Do not overwrite products.json even if the scan completes.")
    parser.add_argument(
        "--rebuild-from-checkpoint",
        action="store_true",
        help="Rebuild the partial/final products snapshots from the saved checkpoint results without rescanning the OFF archive.",
    )
    return parser.parse_args()


def load_products_payload(products_path: Path) -> dict[str, Any]:
    return json.loads(products_path.read_text(encoding="utf-8"))


def load_checkpoint_payload(args: argparse.Namespace) -> dict[str, Any] | None:
    if args.fresh or not args.checkpoint_path.exists():
        return None
    payload = json.loads(args.checkpoint_path.read_text(encoding="utf-8"))
    if str(args.archive_path) != str(payload.get("archivePath")):
        return None
    if args.archive_path.exists() and int(payload.get("archiveSize") or 0) != args.archive_path.stat().st_size:
        return None
    return payload


def main() -> int:
    args = parse_args()
    if not args.products_path.exists():
        raise RuntimeError(f"Missing products file: {args.products_path}")
    if not args.archive_path.exists():
        raise RuntimeError(f"Missing OFF archive: {args.archive_path}")

    payload = load_products_payload(args.products_path)
    seeds, term_to_index = build_seed_index(payload)
    checkpoint = load_checkpoint_payload(args)
    aggregates, checkpoint_offset, documents_scanned, resumed_parse_errors, exact_products = hydrate_aggregates(checkpoint, seeds)
    exact_product_limit = max(0, args.exact_product_limit)

    if args.rebuild_from_checkpoint:
        if not checkpoint:
            raise RuntimeError("Cannot rebuild from checkpoint because no compatible checkpoint file was found.")

        status = str(checkpoint.get("status") or "paused")
        persist_progress(
            payload=payload,
            seeds=seeds,
            aggregates=aggregates,
            exact_products=exact_products,
            archive_path=args.archive_path,
            checkpoint_path=args.checkpoint_path,
            snapshot_path=args.snapshot_path,
            results_path=args.results_path,
            offset=checkpoint_offset,
            documents_scanned=documents_scanned,
            parse_errors=resumed_parse_errors,
            exact_product_limit=exact_product_limit,
            status=status,
            partial=status != "complete",
        )

        if not args.no_final_write:
            final_payload = build_products_snapshot(
                payload,
                seeds,
                aggregates,
                exact_products,
                scan_offset=checkpoint_offset,
                documents_scanned=documents_scanned,
                archive_path=args.archive_path,
                exact_product_limit=exact_product_limit,
                partial=False,
            )
            atomic_write_json(args.products_path, final_payload)
            print(f"Rebuilt products data from checkpoint into {args.products_path}", file=sys.stderr)

        print(
            json.dumps(
                {
                    "completed": status == "complete",
                    "documentsScanned": documents_scanned,
                    "offset": checkpoint_offset,
                    "parseErrors": resumed_parse_errors,
                    "checkpointPath": str(args.checkpoint_path),
                    "snapshotPath": str(args.snapshot_path),
                    "exactProducts": len(exact_products),
                    "runtimeExactProducts": min(len(exact_products), exact_product_limit),
                    "rebuildOnly": True,
                },
                indent=2,
            )
        )
        return 0

    if checkpoint_offset > 0:
        start_offset = checkpoint_offset
        print(f"Resuming from byte offset {start_offset:,} after {documents_scanned:,} documents.", file=sys.stderr)
    else:
        start_offset = detect_first_bson_offset(args.archive_path)
        print(f"Starting fresh from first BSON document at byte offset {start_offset:,}.", file=sys.stderr)

    def save_progress(*, offset: int, documents_scanned: int, parse_errors: int) -> None:
        status = "running"
        total_parse_errors = resumed_parse_errors + parse_errors
        persist_progress(
            payload=payload,
            seeds=seeds,
            aggregates=aggregates,
            exact_products=exact_products,
            archive_path=args.archive_path,
            checkpoint_path=args.checkpoint_path,
            snapshot_path=args.snapshot_path,
            results_path=args.results_path,
            offset=offset,
            documents_scanned=documents_scanned,
            parse_errors=total_parse_errors,
            exact_product_limit=exact_product_limit,
            status=status,
            partial=True,
        )
        print(
            f"Checkpoint saved at doc {documents_scanned:,} byte {offset:,} -> {args.checkpoint_path}",
            file=sys.stderr,
        )

    offset, documents_scanned, scan_parse_errors, completed = scan_archive(
        archive_path=args.archive_path,
        start_offset=start_offset,
        term_to_index=term_to_index,
        seeds=seeds,
        aggregates=aggregates,
        exact_products=exact_products,
        documents_scanned=documents_scanned,
        checkpoint_every_docs=args.checkpoint_every_docs,
        block_size_bytes=max(1, args.block_size_mb) * 1024 * 1024,
        checkpoint_callback=save_progress,
        limit=args.limit,
    )
    parse_errors = resumed_parse_errors + scan_parse_errors

    final_status = "complete" if completed and not args.limit else "paused"
    persist_progress(
        payload=payload,
        seeds=seeds,
        aggregates=aggregates,
        exact_products=exact_products,
        archive_path=args.archive_path,
        checkpoint_path=args.checkpoint_path,
        snapshot_path=args.snapshot_path,
        results_path=args.results_path,
        offset=offset,
        documents_scanned=documents_scanned,
        parse_errors=parse_errors,
        exact_product_limit=exact_product_limit,
        status=final_status,
        partial=not completed or bool(args.limit),
    )

    if completed and not args.no_final_write and not args.limit:
        final_payload = build_products_snapshot(
            payload,
            seeds,
            aggregates,
            exact_products,
            scan_offset=offset,
            documents_scanned=documents_scanned,
            archive_path=args.archive_path,
            exact_product_limit=exact_product_limit,
            partial=False,
        )
        atomic_write_json(args.products_path, final_payload)
        print(f"Wrote final products data to {args.products_path}", file=sys.stderr)
    else:
        print(
            f"Left final products file untouched; partial snapshot is at {args.snapshot_path}",
            file=sys.stderr,
        )

    print(
        json.dumps(
            {
                "completed": completed and not args.limit,
                "documentsScanned": documents_scanned,
                "offset": offset,
                "parseErrors": parse_errors,
                "checkpointPath": str(args.checkpoint_path),
                "snapshotPath": str(args.snapshot_path),
                "exactProducts": len(exact_products),
                "runtimeExactProducts": min(len(exact_products), exact_product_limit),
            },
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
