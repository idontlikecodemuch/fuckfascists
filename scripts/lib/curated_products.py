"""Merge the reviewed curated barcode layer (scripts/data/curated-prefixes.json) into products.json.

Used by scripts/sync-products-from-off.py after every build (fresh scan, resume, or
--rebuild-from-checkpoint) and by its --apply-curated-only mode. The merge is idempotent:
it first drops the curated/manual entries a previous run added, then reapplies the file.

Prefix rows:
  action "add"   ships `prefix` for `entityId` in `space` ("upcA" or "ean13"). It replaces any
                 OFF-derived row with the same prefix, whichever entity carried it.
  action "block" removes `prefix` from `entityId`'s OFF-derived rows.
Product rows (exact barcodes):
  action "add"   sets the exact row for `barcode` (in place when an OFF row already exists).
  action "block" removes the exact row for `barcode`.
"""

from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path
from typing import Any

CURATED_PRODUCER_SOURCE = "curated-prefixes"
CURATED_PRODUCT_SOURCE = "curated-exact"
# Entries written by earlier manual passes; the curated file now owns them.
LEGACY_MANUAL_SOURCES = {"manual-ownership-2026-10-01", "beta-feedback-exact"}
PREFIX_SPACES = {"upcA", "ean13"}
PREFIX_ACTIONS = {"add", "block"}
PRODUCT_ACTIONS = {"add", "block"}


class CuratedLayerError(ValueError):
    pass


def load_curated(path: Path) -> dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    validate_curated(payload)
    return payload


def gtin13(value: str) -> str:
    digits = "".join(ch for ch in str(value) if ch.isdigit())
    if len(digits) == 12:
        return "0" + digits
    if len(digits) == 13:
        return digits
    raise CuratedLayerError(f"Barcode must have 12 or 13 digits: {value!r}")


def check_digit_ok(code: str) -> bool:
    digits = [int(ch) for ch in code]
    body, check = digits[:-1], digits[-1]
    total = sum(d * (3 if (len(body) - i) % 2 == 1 else 1) for i, d in enumerate(body))
    return (10 - total % 10) % 10 == check


def validate_curated(payload: dict[str, Any]) -> None:
    errors: list[str] = []
    seen_adds: dict[str, str] = {}
    for index, row in enumerate(payload.get("prefixes") or []):
        label = f"prefixes[{index}] {row.get('prefix')!r}"
        prefix = str(row.get("prefix") or "")
        if not prefix.isdigit() or not 6 <= len(prefix) <= 10:
            errors.append(f"{label}: prefix must be 6 to 10 digits")
        if row.get("action") not in PREFIX_ACTIONS:
            errors.append(f"{label}: action must be one of {sorted(PREFIX_ACTIONS)}")
        if not row.get("entityId"):
            errors.append(f"{label}: entityId is required")
        if row.get("action") == "add":
            if row.get("space") not in PREFIX_SPACES:
                errors.append(f"{label}: add rows need space upcA or ean13")
            if row.get("space") == "upcA" and len(prefix) > 12:
                errors.append(f"{label}: upcA prefix longer than a UPC-A")
            if not row.get("ownershipCheckedAt"):
                errors.append(f"{label}: add rows need ownershipCheckedAt")
            if prefix in seen_adds and seen_adds[prefix] != row.get("entityId"):
                errors.append(f"{label}: also added for {seen_adds[prefix]}")
            seen_adds[prefix] = str(row.get("entityId"))
        for evidence in row.get("evidence") or []:
            gtin = str(evidence.get("gtin") or "")
            if gtin and (not gtin.isdigit() or len(gtin) not in (12, 13) or not check_digit_ok(gtin)):
                errors.append(f"{label}: evidence barcode {gtin!r} fails its check digit")
    for index, row in enumerate(payload.get("products") or []):
        label = f"products[{index}] {row.get('barcode')!r}"
        try:
            gtin13(str(row.get("barcode") or ""))
        except CuratedLayerError as exc:
            errors.append(f"{label}: {exc}")
        if row.get("action") not in PRODUCT_ACTIONS:
            errors.append(f"{label}: action must be one of {sorted(PRODUCT_ACTIONS)}")
        if row.get("action") == "add" and not (row.get("entityId") and row.get("productName")):
            errors.append(f"{label}: add rows need entityId and productName")
    if errors:
        raise CuratedLayerError("Invalid curated-prefixes.json:\n  " + "\n  ".join(errors))


def _is_curated_producer(entry: dict[str, Any]) -> bool:
    source = str(entry.get("source") or "")
    return source == CURATED_PRODUCER_SOURCE or source in LEGACY_MANUAL_SOURCES


def apply_curated_layer(
    payload: dict[str, Any],
    curated: dict[str, Any],
    entity_names: dict[str, str] | None = None,
) -> tuple[dict[str, Any], dict[str, Any]]:
    """Return (new payload, report). `entity_names` maps entity id -> canonical name; when given,
    curated rows pointing at unknown entities are reported and skipped."""
    result = deepcopy(payload)
    report: dict[str, Any] = {
        "prefixesAdded": 0,
        "prefixesBlocked": [],
        "blocksWithoutEffect": [],
        "replacedByCuratedAdd": [],
        "productsSet": 0,
        "productsBlocked": 0,
        "productBlocksWithoutEffect": [],
        "unknownEntities": [],
    }

    def known(entity_id: str) -> bool:
        if entity_names is None or entity_id in entity_names:
            return True
        report["unknownEntities"].append(entity_id)
        return False

    producers = [entry for entry in result.get("producers") or [] if not _is_curated_producer(entry)]
    prefix_rows = curated.get("prefixes") or []
    adds = [row for row in prefix_rows if row["action"] == "add" and known(row["entityId"])]
    added_prefixes = {row["prefix"] for row in adds}

    for row in prefix_rows:
        if row["action"] != "block":
            continue
        hit = False
        for entry in producers:
            if entry.get("entityId") == row["entityId"] and row["prefix"] in entry.get("prefixes", []):
                entry["prefixes"] = [p for p in entry["prefixes"] if p != row["prefix"]]
                hit = True
        (report["prefixesBlocked"] if hit else report["blocksWithoutEffect"]).append(
            f"{row['prefix']} {row['entityId']}"
        )

    for entry in producers:
        overlap = [p for p in entry.get("prefixes", []) if p in added_prefixes]
        if overlap:
            entry["prefixes"] = [p for p in entry["prefixes"] if p not in added_prefixes]
            report["replacedByCuratedAdd"].extend(f"{p} {entry.get('entityId')}" for p in overlap)
    producers = [entry for entry in producers if entry.get("prefixes")]

    grouped: dict[tuple[str, str], dict[str, Any]] = {}
    for row in adds:
        key = (row["entityId"], row["space"])
        entry = grouped.get(key)
        if entry is None:
            name = (entity_names or {}).get(row["entityId"], row["entityId"])
            entry = {
                "canonicalProducerName": name,
                "entityId": row["entityId"],
                "entityMatchType": "curated",
                "matchedProductCount": 0,
                "prefixThreshold": None,
                "prefixes": [],
                "prefixSpace": row["space"],
                "observedBrands": [],
                "source": CURATED_PRODUCER_SOURCE,
            }
            grouped[key] = entry
        entry["prefixes"].append(row["prefix"])
        entry["matchedProductCount"] += int((row.get("evidenceSummary") or {}).get("distinctBarcodes") or 0)
        for brand in row.get("brands") or []:
            if brand not in entry["observedBrands"]:
                entry["observedBrands"].append(brand)
        report["prefixesAdded"] += 1
    result["producers"] = producers + list(grouped.values())

    # Keep earlier curated rows in place (so reapplying is stable) unless the file dropped them.
    curated_adds = {
        gtin13(row["barcode"]) for row in curated.get("products") or [] if row["action"] == "add"
    }
    products = [
        row for row in result.get("products") or []
        if str(row.get("source") or "") != CURATED_PRODUCT_SOURCE or gtin13(row["barcode"]) in curated_adds
    ]
    by_barcode = {gtin13(row["barcode"]): index for index, row in enumerate(products)}
    removed: set[int] = set()
    for row in curated.get("products") or []:
        barcode = gtin13(row["barcode"])
        index = by_barcode.get(barcode)
        if row["action"] == "block":
            if index is None or index in removed:
                report["productBlocksWithoutEffect"].append(barcode)
            else:
                removed.add(index)
                report["productsBlocked"] += 1
            continue
        if not known(row["entityId"]):
            continue
        new_row: dict[str, Any] = {
            "barcode": barcode,
            "displayBarcode": row.get("displayBarcode") or (barcode[1:] if barcode.startswith("0") else barcode),
            "productName": row["productName"],
            "canonicalProducerName": (entity_names or {}).get(row["entityId"], row["entityId"]),
            "entityId": row["entityId"],
            "entityMatchType": "curated",
            "source": CURATED_PRODUCT_SOURCE,
        }
        if row.get("brandName"):
            new_row["brandName"] = row["brandName"]
        if index is None:
            by_barcode[barcode] = len(products)
            products.append(new_row)
        else:
            products[index] = new_row
            removed.discard(index)
        report["productsSet"] += 1
    result["products"] = [row for index, row in enumerate(products) if index not in removed]

    meta = result.setdefault("_meta", {})
    meta["producerCount"] = len(result["producers"])
    meta["productCount"] = len(result["products"])
    # Counts of rows in the curated file (not effects), so a rebuild and a reapply stamp the same summary.
    meta["curatedLayer"] = {
        "path": "scripts/data/curated-prefixes.json",
        "lastReviewed": (curated.get("_meta") or {}).get("lastReviewed"),
        "prefixAdds": sum(1 for row in prefix_rows if row["action"] == "add"),
        "prefixBlocks": sum(1 for row in prefix_rows if row["action"] == "block"),
        "productAdds": sum(1 for row in curated.get("products") or [] if row["action"] == "add"),
        "productBlocks": sum(1 for row in curated.get("products") or [] if row["action"] == "block"),
    }
    report["unknownEntities"] = sorted(set(report["unknownEntities"]))
    return result, report
