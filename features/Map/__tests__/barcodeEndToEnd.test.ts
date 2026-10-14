import { findBundledProductByBarcode } from '../barcode/productIndex';
import { normalizeBarcode } from '../barcode/normalizeBarcode';
import { parseEntityList } from '../../../core/data/entityList';
import bundledEntitiesRaw from '../../../assets/data/entities.json';
import bundledProductsRaw from '../../../assets/data/products.json';
import curatedRaw from '../../../scripts/data/curated-prefixes.json';

/**
 * End-to-end barcode check from docs/HOUSEHOLD_BARCODES_PLAN_2026-10-14.md: real US
 * barcodes run through the bundled products.json and entities.json. `null` means the
 * scanner must return no bundled match (owner untracked, unconfirmed, or a mixed block).
 */
const entities = parseEntityList(bundledEntitiesRaw);

function bundledOwner(code: string): string | null {
  const scan = normalizeBarcode(code, code.length === 13 ? 'ean13' : 'upc_a');
  if (!scan) throw new Error(`unparseable test barcode ${code}`);
  return findBundledProductByBarcode(scan, entities)?.entity.id ?? null;
}

describe('20-barcode end-to-end list (bundled data)', () => {
  it.each([
    ['Advil tablets', '305730150200', 'haleon'],
    ['Crest Kids toothpaste', '037000555674', 'procter-gamble'],
    ['Colgate Total Clean Mint', '035000459862', 'colgate-palmolive'],
    ['Tylenol 8 HR (Kenvue, not J&J)', '300450297211', null],
    ['Listerine Cool Mint (Kenvue, not J&J)', '312547427357', null],
    ['Mucinex Sinus-Max', '363824834368', 'reckitt'],
    ['Zicam fruit drops', '732216301359', 'church-dwight'],
    ['Claritin (Bayer, untracked)', '041100595416', null],
    ['Aleve (Bayer, untracked)', '025866591981', null],
    ['NyQuil Severe Max', '323900038158', 'procter-gamble'],
    ['Windex Original', '019800701956', 'sc-johnson'],
    ['Clorox 2 Free & Clear', '044600300467', 'clorox'],
    ['Tide Coldwater', '037000874201', 'procter-gamble'],
    ['Huggies wipes', '036000504071', 'kimberly-clark'],
    ['Purina Beneful (not reviewed yet)', '017800179669', null],
    ['Milk-Bone (mixed block)', '079100514113', null],
    ['Nature Made (Pharmavite, untracked)', '031604026653', null],
    ['Equate bandages (Walmart store brand)', '681131006767', 'walmart'],
    ['Suave Invisible Solid 2026 label (untracked owner)', '383711002564', null],
  ])('%s %s -> %s', (_name, code, expected) => {
    expect(bundledOwner(code)).toBe(expected);
  });

  // #19 in the plan, Suave's older code in Unilever's mixed 079400 block, still resolves to
  // Unilever; splitting that block is owner Decision 2 for 1.2.2.
  it('leaves the mixed 079400 Unilever block unchanged for now', () => {
    expect(bundledOwner('079400404114')).toBe('unilever');
  });
});

describe('regressions from the 2026-10-14 barcode audit', () => {
  it.each([
    ['Barbasol (was Campbell via the 13-digit form)', '051009009341', null],
    ["O'Keeffe's (was PepsiCo via the 13-digit form)", '722510026003', null],
    ['Great Value block (was B&G Foods)', '078742075327', 'walmart'],
    ['Touchland in a shared 85 block (was Ottogi)', '850028448007', 'church-dwight'],
    ['First Aid Beauty in a shared 81 block', '810160801900', 'procter-gamble'],
    ['Curlsmith in a shared 85 block (was Asahi)', '850005417163', null],
    ['OLLY in a shared 85 block (was Beyond Meat)', '850004462065', null],
    ['Beyond Burger exact row still matches', '850004207024', 'beyond-meat'],
    ['Batiste EAN-13', '5010724526774', 'church-dwight'],
    ['Nutella EAN-13', '3017620422003', 'ferrero'],
    ['beta-reported PepsiCo EAN', '5201156250881', 'pepsico'],
  ])('%s %s -> %s', (_name, code, expected) => {
    expect(bundledOwner(code)).toBe(expected);
  });
});

interface CuratedPrefixRow {
  prefix: string;
  space?: string;
  entityId: string;
  action: string;
}
interface CuratedProductRow {
  barcode: string;
  entityId: string;
  action: string;
}
interface ProducerRow {
  entityId: string;
  prefixes: string[];
  prefixSpace?: string;
}

describe('products.json carries scripts/data/curated-prefixes.json', () => {
  const curated = curatedRaw as unknown as { prefixes: CuratedPrefixRow[]; products: CuratedProductRow[] };
  const payload = bundledProductsRaw as unknown as {
    producers: ProducerRow[];
    products: { barcode: string; entityId: string }[];
  };
  const entityIds = new Set(entities.map((entity) => entity.id));
  const gtin13 = (code: string) => (code.length === 12 ? `0${code}` : code);

  it('ships every curated prefix add in its space, owned only by its entity', () => {
    for (const row of curated.prefixes.filter((r) => r.action === 'add')) {
      expect(entityIds.has(row.entityId)).toBe(true);
      const owners = payload.producers.filter((producer) => producer.prefixes.includes(row.prefix));
      expect(owners.map((owner) => [owner.entityId, owner.prefixSpace])).toEqual([[row.entityId, row.space]]);
    }
  });

  it('ships no curated prefix block', () => {
    for (const row of curated.prefixes.filter((r) => r.action === 'block')) {
      const owners = payload.producers.filter(
        (producer) => producer.entityId === row.entityId && producer.prefixes.includes(row.prefix),
      );
      expect(owners).toEqual([]);
    }
  });

  it('applies every curated exact-row add and block', () => {
    const rows = new Map(payload.products.map((product) => [product.barcode, product.entityId]));
    for (const row of curated.products) {
      const shipped = rows.get(gtin13(row.barcode));
      if (row.action === 'add') expect(shipped).toBe(row.entityId);
      else expect(shipped).toBeUndefined();
    }
  });
});
