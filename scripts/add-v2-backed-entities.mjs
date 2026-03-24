import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ENTITIES_PATH = path.join(ROOT, 'assets/data/entities.json');

function today() {
  return new Date().toISOString().slice(0, 10);
}

const V2_BACKED_ENTITIES = [
  {
    id: 'bloomberg',
    canonicalName: 'Bloomberg L.P.',
    aliases: ['Bloomberg', 'Bloomberg LP', 'Bloomberg Inc'],
    domains: ['bloomberg.com'],
    categoryTags: ['finance', 'media', 'news'],
    publicFigureName: 'Michael Bloomberg',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'citadel',
    canonicalName: 'Citadel LLC',
    aliases: ['Citadel', 'Citadel Investment Group'],
    domains: ['citadel.com'],
    categoryTags: ['finance', 'investing'],
    ceoName: 'Ken Griffin',
    publicFigureName: 'Ken Griffin',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'farallon-capital',
    canonicalName: 'Farallon Capital Management, L.L.C.',
    aliases: ['Farallon Capital', 'Farallon Capital Management'],
    domains: ['faralloncapital.com'],
    categoryTags: ['finance', 'investing'],
    publicFigureName: 'Tom Steyer',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'soros-fund-management',
    canonicalName: 'Soros Fund Management LLC',
    aliases: ['Soros Fund Management'],
    domains: [],
    categoryTags: ['finance', 'investing'],
    publicFigureName: 'George Soros',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'susquehanna-international-group',
    canonicalName: 'Susquehanna International Group, LLP',
    aliases: ['Susquehanna International Group', 'Susquehanna', 'SIG'],
    domains: ['sig.com'],
    categoryTags: ['finance', 'investing'],
    publicFigureName: 'Jeff Yass',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'elliott-management',
    canonicalName: 'Elliott Management',
    aliases: ['Elliott Management', 'Elliott Investment Management'],
    domains: [],
    categoryTags: ['finance', 'investing'],
    publicFigureName: 'Paul Singer',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'asana',
    canonicalName: 'Asana, Inc.',
    aliases: ['Asana'],
    domains: ['asana.com'],
    categoryTags: ['productivity', 'saas', 'tech'],
    ceoName: 'Dan Rogers',
    publicFigureName: 'Dustin Moskovitz',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'newsweb-corporation',
    canonicalName: 'Newsweb Corporation',
    aliases: ['Newsweb'],
    domains: [],
    categoryTags: ['media', 'news', 'radio'],
    publicFigureName: 'Fred Eychaner',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'renaissance-technologies',
    canonicalName: 'Renaissance Technologies LLC',
    aliases: ['Renaissance Technologies', 'Rentec'],
    domains: ['rentec.com'],
    categoryTags: ['finance', 'investing'],
    publicFigureName: 'James Simons',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'abc-supply',
    canonicalName: 'ABC Supply Co., Inc.',
    aliases: ['ABC Supply', 'ABC Supply Co', 'ABC Supply Co., Inc.'],
    domains: ['abcsupply.com'],
    categoryTags: ['home-improvement', 'retail'],
    ceoName: 'Keith Rozolis',
    publicFigureName: 'Diane Hendricks',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'simon-property-group',
    canonicalName: 'Simon Property Group, Inc.',
    aliases: ['Simon Property Group', 'Simon'],
    domains: ['simon.com'],
    categoryTags: ['real-estate'],
    publicFigureName: 'Deborah Simon',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'stephens-inc',
    canonicalName: 'Stephens Inc.',
    aliases: ['Stephens', 'Stephens Inc'],
    domains: ['stephens.com'],
    categoryTags: ['finance', 'investing'],
    ceoName: 'Warren Stephens',
    publicFigureName: 'Warren Stephens',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'mountaire',
    canonicalName: 'Mountaire Farms',
    aliases: ['Mountaire', 'Mountaire Farms', 'Mountaire Corporation'],
    domains: ['mountaire.com'],
    categoryTags: ['agriculture', 'food'],
    publicFigureName: 'Ronald Cameron',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'paloma-partners',
    canonicalName: 'Paloma Partners Management Company',
    aliases: ['Paloma Partners', 'Paloma Partners Management Company'],
    domains: ['paloma.com'],
    categoryTags: ['finance', 'investing'],
    publicFigureName: 'Donald Sussman',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'ryan-specialty',
    canonicalName: 'Ryan Specialty Holdings, Inc.',
    aliases: ['Ryan Specialty', 'Ryan Specialty Group'],
    domains: ['ryanspecialty.com'],
    categoryTags: ['finance', 'insurance'],
    publicFigureName: 'Patrick Ryan',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'duchossois-group',
    canonicalName: 'The Duchossois Group',
    aliases: ['Duchossois Group', 'The Duchossois Group'],
    domains: [],
    categoryTags: ['holding-company'],
    publicFigureName: 'Craig Duchossois',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'ftx',
    canonicalName: 'FTX Trading Ltd.',
    aliases: ['FTX'],
    domains: ['ftx.com'],
    categoryTags: ['crypto', 'finance'],
    publicFigureName: 'Sam Bankman-Fried',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
    notes:
      'Historical entity added from people.json V2 forward refs. FTX collapsed into bankruptcy proceedings in 2022.',
  },
  {
    id: 'lone-pine-capital',
    canonicalName: 'Lone Pine Capital LLC',
    aliases: ['Lone Pine Capital'],
    domains: [],
    categoryTags: ['finance', 'investing'],
    publicFigureName: 'Stephen Mandel',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'marcus-millichap',
    canonicalName: 'Marcus & Millichap, Inc.',
    aliases: ['Marcus & Millichap', 'Marcus and Millichap'],
    domains: ['marcusmillichap.com'],
    categoryTags: ['real-estate'],
    publicFigureName: 'George Marcus',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'energy-transfer',
    canonicalName: 'Energy Transfer LP',
    aliases: ['Energy Transfer'],
    domains: ['energytransfer.com'],
    categoryTags: ['energy', 'oil-gas'],
    publicFigureName: 'Kelcy Warren',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'td-ameritrade',
    canonicalName: 'TD Ameritrade',
    aliases: ['TD Ameritrade'],
    domains: ['tdameritrade.com'],
    categoryTags: ['finance', 'investing'],
    publicFigureName: 'Joe Ricketts',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
    notes:
      'Historical entity added from people.json V2 forward refs. TD Ameritrade was acquired by Charles Schwab and the standalone brand was retired.',
  },
  {
    id: 'reyes-holdings',
    canonicalName: 'Reyes Holdings, LLC',
    aliases: ['Reyes Holdings'],
    domains: ['reyesholdings.com'],
    categoryTags: ['beverage', 'food', 'logistics'],
    publicFigureName: 'Chris Reyes',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'interactive-brokers',
    canonicalName: 'Interactive Brokers Group, Inc.',
    aliases: ['Interactive Brokers', 'IBKR'],
    domains: ['interactivebrokers.com', 'ibkr.com'],
    categoryTags: ['finance', 'investing'],
    publicFigureName: 'Thomas Peterffy',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'saban-entertainment',
    canonicalName: 'Saban Entertainment',
    aliases: ['Saban Entertainment'],
    domains: [],
    categoryTags: ['entertainment', 'television'],
    publicFigureName: 'Haim Saban',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
    notes:
      'Historical entity added from people.json V2 forward refs. Saban Entertainment is no longer an active standalone company.',
  },
  {
    id: 'roivant-sciences',
    canonicalName: 'Roivant Sciences Ltd.',
    aliases: ['Roivant Sciences', 'Roivant'],
    domains: ['roivant.com'],
    categoryTags: ['healthcare', 'pharma'],
    publicFigureName: 'Vivek Ramaswamy',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'fisher-investments',
    canonicalName: 'Fisher Investments',
    aliases: ['Fisher Investments'],
    domains: ['fisherinvestments.com'],
    categoryTags: ['finance', 'investing'],
    publicFigureName: 'Ken Fisher',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'new-balance',
    canonicalName: 'New Balance Athletics, Inc.',
    aliases: ['New Balance'],
    domains: ['newbalance.com'],
    categoryTags: ['apparel', 'footwear'],
    ceoName: 'Joe Preston',
    publicFigureName: 'James Davis',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'sequoia-capital',
    canonicalName: 'Sequoia Capital',
    aliases: ['Sequoia Capital', 'Sequoia'],
    domains: ['sequoiacap.com'],
    categoryTags: ['finance', 'investing'],
    publicFigureName: 'Michael Moritz',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'grosvenor-capital-management',
    canonicalName: 'GCM Grosvenor',
    aliases: ['GCM Grosvenor', 'Grosvenor Capital Management'],
    domains: ['gcmgrosvenor.com'],
    categoryTags: ['finance', 'investing'],
    publicFigureName: 'Michael Sacks',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'intercontinental-exchange',
    canonicalName: 'Intercontinental Exchange, Inc.',
    aliases: ['Intercontinental Exchange', 'ICE'],
    domains: ['theice.com'],
    categoryTags: ['finance', 'fintech'],
    ceoName: 'Jeffrey Sprecher',
    publicFigureName: 'Jeffrey Sprecher',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
  {
    id: 'silver-eagle-beverages',
    canonicalName: 'Silver Eagle Beverages',
    aliases: ['Silver Eagle Beverages', 'Silver Eagle'],
    domains: [],
    categoryTags: ['beverage', 'logistics'],
    publicFigureName: 'John Nau',
    fecCommitteeId: '',
    verificationStatus: 'unverified',
  },
];

async function main() {
  const raw = JSON.parse(await readFile(ENTITIES_PATH, 'utf8'));
  const entities = Array.isArray(raw) ? raw : raw.entities;
  const existingIds = new Set(entities.map((entity) => entity.id));
  const additions = [];

  for (const entity of V2_BACKED_ENTITIES) {
    if (existingIds.has(entity.id)) continue;
    additions.push({
      ...entity,
      lastVerifiedDate: today(),
    });
  }

  if (additions.length === 0) {
    console.log('No new entities to add.');
    return;
  }

  entities.push(...additions);

  const output = Array.isArray(raw)
    ? entities
    : {
        ...raw,
        _meta: {
          ...(raw._meta ?? {}),
          totalEntities: entities.length,
          updatedAt: today(),
        },
        entities,
      };

  await writeFile(ENTITIES_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');
  console.log(`Added ${additions.length} V2-backed entities.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
