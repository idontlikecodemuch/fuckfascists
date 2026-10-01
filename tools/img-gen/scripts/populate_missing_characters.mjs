#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const MISSING_PATH = path.join(ROOT, 'tools/img-gen/missing-characters.json');
const OUTPUT_PATH = path.join(ROOT, 'tools/img-gen/missing-characters-populated.json');
const SKIPPED_PATH = path.join(ROOT, 'tools/img-gen/missing-characters-skipped.json');

const COMPANY_ALIAS = {
  'FMR LLC': 'Fidelity',
  'Early Warning Services LLC': 'Zelle',
  'Panda Restaurant Group Inc': 'Panda Express',
  'International Business Machines Corp': 'IBM',
  'PDD Holdings Inc': 'Temu',
  'First Look Media Works Inc': 'The Intercept',
  'Maplebear Inc': 'Instacart',
  'Foundation for National Progress': 'Mother Jones',
  'National Public Radio Inc': 'NPR',
  'Public Broadcasting Service': 'PBS',
  'WP Company LLC': 'Washington Post',
  'Roman Health Ventures Inc': 'Ro',
  'Self Esteem Brands LLC': 'Anytime Fitness',
  'GOAT Group': 'GOAT',
  'A Medium Corp': 'Medium',
  'ByteDance Ltd': 'TikTok',
  'Payward Inc': 'Kraken',
  'Intercontinental Exchange, Inc.': 'ICE',
  'Public Storage': 'Public Storage',
  'AMERCO': 'U-Haul',
  'Focus Brands LLC': 'Focus Brands',
  'Penske Media Corp': 'PMC',
  'JAB Holding Company SARL': 'JAB',
  'Recruit Holdings Co Ltd': 'Indeed',
  'Google DeepMind': 'DeepMind',
};

const IMPORTANT_OVERRIDES = {
  'abigail-johnson': {
    likeness: 'Shoulder-length blonde hair, pale skin, slim build, angular face, sharp nose, calm smile',
    outfitA: 'Tailored navy pantsuit, pale blouse, tiny Fidelity green pin, black flats, visible company logo on chest',
    outfitB: 'Cream blazer over silk blouse, dark slacks, sensible heels, finance-summit lanyard, visible company logo on chest',
  },
  'adam-aron': {
    likeness: 'Short silver hair, pale skin, stocky build, square jaw, broad smile lines, clean-shaven',
    outfitA: 'Dark navy suit, white shirt, bright red AMC tie, black dress shoes, visible company logo on chest',
    outfitB: 'Black AMC quarter-zip, dark jeans, white sneakers, oversized popcorn-bucket energy, visible company logo on chest',
  },
  'albert-bourla': {
    likeness: 'Short silver-gray hair, olive skin, medium build, rectangular glasses, long face, clean-shaven',
    outfitA: 'Dark suit, white shirt, Pfizer-blue tie, black dress shoes, visible company logo on chest',
    outfitB: 'White pharma-conference coat over blue dress shirt, dark slacks, conference badge, visible company logo on chest',
  },
  'alex-karp': {
    likeness: 'Wild gray hair, pale skin, gaunt build, long face, hooded eyes, intense expression',
    outfitA: 'Black suit over black open-collar shirt, black dress shoes, visible company logo on chest',
    outfitB: 'Faded gray athletic t-shirt, tiny black running shorts, trail shoes, disheveled surveillance-oracle posture, visible company logo on chest',
  },
  'andy-jassy': {
    likeness: 'Short gray-brown hair, pale skin, lean build, long face, narrow jaw, clean-shaven',
    outfitA: 'Dark navy blazer over pale blue shirt, dark pants, brown shoes, visible company logo on chest',
    outfitB: 'Blue Amazon operations vest over white oxford shirt, khaki pants, clipboard-manager sneakers, visible company logo on chest',
  },
  'aravind-srinivas': {
    likeness: 'Curly dark hair, medium-brown skin, slim build, short beard shadow, narrow face, bright eyes',
    outfitA: 'Black Perplexity t-shirt, dark jeans, white sneakers, visible company logo on chest',
    outfitB: 'Black bomber jacket over charcoal tee, dark pants, founder-conference lanyard, visible company logo on chest',
  },
  'arvind-krishna': {
    likeness: 'Bald head, medium-brown skin, slim build, rectangular glasses, narrow face, clean-shaven',
    outfitA: 'Dark navy suit, pale blue tie, tiny IBM pin, black dress shoes, visible company logo on chest',
    outfitB: 'Navy IBM quarter-zip over white button-down, gray slacks, black sneakers, visible company logo on chest',
  },
  'barry-diller': {
    likeness: 'Bald crown with white hair at the sides, pale skin, medium build, long face, deep smile lines, clean-shaven',
    outfitA: 'Black tuxedo jacket, white shirt, slim black bow tie, black dress shoes, visible company logo on chest',
    outfitB: 'Cream resort shirt open at the collar, tan trousers, loafers, mogul-on-vacation confidence, visible company logo on chest',
  },
  'brian-armstrong': {
    likeness: 'Short light-brown hair, pale skin, lean build, long face, close-set eyes, clean-shaven',
    outfitA: 'Black Coinbase t-shirt, dark jeans, white sneakers, visible company logo on chest',
    outfitB: 'Charcoal zip hoodie over black tee, dark pants, startup-libertarian lanyard, visible company logo on chest',
  },
  'brian-niccol': {
    likeness: 'Dark hair graying at the temples, tanned light skin, medium build, square jaw, broad smile, clean-shaven',
    outfitA: 'Tailored dark suit, white shirt, Starbucks-green tie, black dress shoes, visible company logo on chest',
    outfitB: 'Green apron over crisp white button-down, dark pants, trying-hard store-visit loafers, visible company logo on chest',
  },
  'dan-clancy': {
    likeness: 'Long white hair, full white beard, pale skin, lanky build, rosy cheeks, friendly eyes',
    outfitA: 'Purple Twitch t-shirt, tan pants, green sneakers, visible company logo on chest',
    outfitB: 'Purple patterned short-sleeve shirt, brown corduroy pants, sandals, permanently-online professor vibe, visible company logo on chest',
  },
  'dara-khosrowshahi': {
    likeness: 'Short salt-and-pepper hair, olive skin, slim build, rectangular glasses, angular face, clean-shaven',
    outfitA: 'Dark suit, white shirt, black tie, black dress shoes, visible company logo on chest',
    outfitB: 'Black Uber bomber jacket over charcoal polo, dark pants, airport-terminal executive sneakers, visible company logo on chest',
  },
  'dario-amodei': {
    likeness: 'Short curly brown hair, pale skin, medium build, round glasses, soft jaw, thoughtful expression',
    outfitA: 'Muted blue button-down, dark pants, gray sneakers, visible company logo on chest',
    outfitB: 'Charcoal tech-fleece over plain gray t-shirt, dark jeans, white sneakers, visible company logo on chest',
  },
  'david-baszucki': {
    likeness: 'Gray hair combed back, pale skin, slim build, long face, heavy brow, clean-shaven',
    outfitA: 'Black Roblox blazer over black t-shirt, dark jeans, white sneakers, visible company logo on chest',
    outfitB: 'Red Roblox hoodie, dark joggers, chunky sneakers, metaverse-dad optimism, visible company logo on chest',
  },
  'david-zaslav': {
    likeness: 'Short silver hair, tanned light skin, medium build, wide smile, square jaw, clean-shaven',
    outfitA: 'Expensive navy suit, pale blue tie, black dress shoes, visible company logo on chest',
    outfitB: 'Dark golf quarter-zip, khaki pants, loafers, deleted-cartoon executive posture, visible company logo on chest',
  },
  'demis-hassabis': {
    likeness: 'Bald head, medium skin, slim build, round glasses, neat beard shadow, narrow face',
    outfitA: 'Dark blazer over black t-shirt, dark pants, white sneakers, visible company logo on chest',
    outfitB: 'DeepMind navy zip hoodie over gray tee, dark joggers, lab-founder calm, visible company logo on chest',
  },
  'drew-houston': {
    likeness: 'Styled dark-blond hair, pale skin, slim build, long face, light stubble, sharp nose',
    outfitA: 'Dark Dropbox t-shirt under black blazer, dark jeans, white sneakers, visible company logo on chest',
    outfitB: 'Blue Dropbox hoodie, black pants, minimalist sneakers, startup-lakehouse posture, visible company logo on chest',
  },
  'ed-bastian': {
    likeness: 'Swept-back silver hair, pale skin, medium build, square glasses, long face, clean-shaven',
    outfitA: 'Tailored dark suit, white shirt, Delta-red tie, black dress shoes, visible company logo on chest',
    outfitB: 'Navy airline bomber jacket over blue shirt, dark slacks, polished black shoes, visible company logo on chest',
  },
  'eric-yuan': {
    likeness: 'Short black hair, medium skin, medium build, oval face, gentle smile, clean-shaven',
    outfitA: 'Bright blue Zoom polo shirt, dark pants, gray sneakers, visible company logo on chest',
    outfitB: 'Navy blazer over pale shirt, conference badge, dark slacks, black shoes, visible company logo on chest',
  },
  'jack-dorsey': {
    likeness: 'Dark hair, olive skin, slim build, sharp cheekbones, intense eyes, full dark beard',
    outfitA: 'Black fitted t-shirt, dark jeans, black boots, visible company logo on chest',
    outfitB: 'Sleeveless black tank, dark drawstring pants, meditation beads, bare feet, wellness-guru billionaire aura, visible company logo on chest',
  },
  'jane-fraser': {
    likeness: 'Shoulder-length blonde hair, pale skin, slim build, angular face, sharp cheekbones, composed smile',
    outfitA: 'Tailored Citi-blue pantsuit, white blouse, black heels, visible company logo on chest',
    outfitB: 'Rolled-sleeve pale blue oxford, dark slacks, sensible flats, banker-town-hall badge, visible company logo on chest',
  },
  'jason-citron': {
    likeness: 'Curly dark-brown hair, pale skin, medium build, round face, beard shadow, expressive eyebrows',
    outfitA: 'Black Discord t-shirt, dark jeans, white sneakers, visible company logo on chest',
    outfitB: 'Black gamer hoodie, dark joggers, over-ear headset around neck, visible company logo on chest',
  },
  'jim-farley': {
    likeness: 'Short silver-brown hair, pale skin, athletic build, square jaw, light stubble, deep smile lines',
    outfitA: 'Navy Ford work jacket over blue button-down, dark jeans, brown boots, visible company logo on chest',
    outfitB: 'Rolled-sleeve denim shirt, dark chinos, Detroit auto-show sneakers, visible company logo on chest',
  },
  'katherine-maher': {
    likeness: 'Shoulder-length curly blonde hair, pale skin, slim build, bright smile, narrow jaw, high cheekbones',
    outfitA: 'Navy blazer over dark top, dark pants, black flats, visible company logo on chest',
    outfitB: 'Public-radio tote bag over shoulder, giant studio headphones around neck, soft gray sweater, visible company logo on chest',
  },
  'ken-griffin': {
    likeness: 'Short brown-gray receding hair, pale skin, medium build, angular face, thin lips, clean-shaven',
    outfitA: 'Perfectly tailored navy suit, white shirt, red tie, black dress shoes, visible company logo on chest',
    outfitB: 'Charcoal finance-bro fleece vest over pale blue shirt, khaki pants, expensive loafers, visible company logo on chest',
  },
  'lachlan-murdoch': {
    likeness: 'Dark hair swept back, tanned light skin, medium build, square jaw, deep-set eyes, clean-shaven',
    outfitA: 'Dark navy suit, white shirt, blue tie, black dress shoes, visible company logo on chest',
    outfitB: 'Open-collar resort shirt, cream pants, loafers, inherited-empire yacht mode, visible company logo on chest',
  },
  'lisa-su': {
    likeness: 'Short silver-gray hair, medium skin, slim build, oval face, warm smile, dark eyes',
    outfitA: 'Sharp black blazer over dark top, black pants, low heels, visible company logo on chest',
    outfitB: 'Red AMD keynote jacket over black t-shirt, dark jeans, white sneakers, visible company logo on chest',
  },
  'luis-von-ahn': {
    likeness: 'Curly dark-brown hair, pale skin, slim build, large round glasses, narrow face, quick smile',
    outfitA: 'Green Duolingo t-shirt, dark jeans, white sneakers, visible company logo on chest',
    outfitB: 'Bright green owl hoodie, khaki pants, language-app chaos energy, visible company logo on chest',
  },
  'marc-benioff': {
    likeness: 'Dark wavy hair graying at the sides, tanned light skin, heavy build, broad face, big grin, clean-shaven',
    outfitA: 'Blue Salesforce varsity jacket over white t-shirt, dark jeans, white sneakers, visible company logo on chest',
    outfitB: 'Loud blue Hawaiian shirt, white pants, loafers, Dreamforce-shaman confidence, visible company logo on chest',
  },
  'mary-barra': {
    likeness: 'Shoulder-length blonde hair, pale skin, slim build, oval face, bright smile, clean makeup',
    outfitA: 'Tailored charcoal blazer over pale blouse, matching slacks, black heels, visible company logo on chest',
    outfitB: 'Black leather auto-show jacket, dark jeans, ankle boots, visible company logo on chest',
  },
  'matthew-prince': {
    likeness: 'Curly graying hair, pale skin, stocky build, broad face, high forehead, clean-shaven',
    outfitA: 'Black Cloudflare t-shirt under charcoal blazer, dark jeans, black sneakers, visible company logo on chest',
    outfitB: 'Orange-accent zip hoodie, dark joggers, infrastructure-doom presentation badge, visible company logo on chest',
  },
  'melanie-perkins': {
    likeness: 'Long straight dark hair, medium skin, slim build, narrow face, soft smile, dark eyes',
    outfitA: 'Sleek black dress, black flats, minimal jewelry, visible company logo on chest',
    outfitB: 'Pastel keynote blouse, cream pants, headset mic, cheerful design-software founder glow, visible company logo on chest',
  },
  'meredith-kopit-levien': {
    likeness: 'Long wavy brown hair, pale skin, slim build, narrow face, high cheekbones, composed expression',
    outfitA: 'Tailored black blazer over silk blouse, dark pants, black heels, visible company logo on chest',
    outfitB: 'Cream coat over dark dress, oversized newspaper tote, Manhattan media-baroness calm, visible company logo on chest',
  },
  'patrick-collison': {
    likeness: 'Curly reddish-blond hair, pale skin, slim build, long face, large ears, clean-shaven',
    outfitA: 'Blue Stripe t-shirt, dark jeans, white sneakers, visible company logo on chest',
    outfitB: 'Rumpled blue oxford under charcoal cardigan, dark pants, startup-philosopher posture, visible company logo on chest',
  },
  'safra-catz': {
    likeness: 'Straight dark-brown shoulder-length hair, olive skin, slim build, angular face, sharp nose, serious eyes',
    outfitA: 'Tailored black power suit, pale blouse, black heels, visible company logo on chest',
    outfitB: 'Oracle-red blazer over black top, dark slacks, severe boardroom heels, visible company logo on chest',
  },
  'sal-khan': {
    likeness: 'Short dark hair graying at the temples, medium-brown skin, slim build, narrow face, warm smile, clean-shaven',
    outfitA: 'Burnt-orange crewneck sweater, dark jeans, brown shoes, visible company logo on chest',
    outfitB: 'Dark zip hoodie, khaki pants, headset mic, dry-erase-marker teacher energy, visible company logo on chest',
  },
  'scott-kirby': {
    likeness: 'Short silver hair, pale skin, medium build, square jaw, bright smile lines, clean-shaven',
    outfitA: 'Dark navy suit, white shirt, United-blue tie, black dress shoes, visible company logo on chest',
    outfitB: 'Navy airline quarter-zip over collared shirt, dark pants, polished loafers, visible company logo on chest',
  },
  'shantanu-narayen': {
    likeness: 'Balding gray hair at the sides, medium-brown skin, slim build, close beard, rectangular glasses, narrow face',
    outfitA: 'Dark blazer over black t-shirt, dark pants, brown shoes, visible company logo on chest',
    outfitB: 'Red-accent Adobe zip jacket, dark jeans, conference sneakers, visible company logo on chest',
  },
  'shou-zi-chew': {
    likeness: 'Short dark hair parted neatly, medium skin, slim build, youthful face, straight nose, clean-shaven',
    outfitA: 'Charcoal congressional suit, white shirt, dark tie, black dress shoes, visible company logo on chest',
    outfitB: 'Black TikTok bomber jacket over dark t-shirt, dark pants, white sneakers, impossible-pr-job composure, visible company logo on chest',
  },
  'steve-huffman': {
    likeness: 'Short blond hair, pale skin, slim build, narrow face, sharp nose, clean-shaven',
    outfitA: 'Black Reddit hoodie over dark jeans, white sneakers, visible company logo on chest',
    outfitB: 'Black denim jacket over dark t-shirt, dark pants, startup-podcast mic clipped to collar, visible company logo on chest',
  },
  'thomas-dohmke': {
    likeness: 'Short brown hair, pale skin, slim build, angular face, light stubble, rectangular glasses',
    outfitA: 'Black GitHub hoodie over black t-shirt, dark jeans, white sneakers, visible company logo on chest',
    outfitB: 'Black bomber jacket over Octocat tee, dark pants, conference-stage sneakers, visible company logo on chest',
  },
  'tobi-ltke': {
    likeness: 'Dark hair hidden under black cap, pale skin, slim build, round glasses, narrow face, light stubble',
    outfitA: 'Black Shopify t-shirt, black cap, dark jeans, white sneakers, visible company logo on chest',
    outfitB: 'Dark motorsport jacket, black pants, racing-driver posture, visible company logo on chest',
  },
  'tony-xu': {
    likeness: 'Short black hair styled up, light-medium skin, slim build, rectangular glasses, oval face, clean-shaven',
    outfitA: 'Red DoorDash hoodie, dark jeans, white sneakers, visible company logo on chest',
    outfitB: 'Dark blazer over charcoal t-shirt, black pants, delivery-bag strap across shoulder, visible company logo on chest',
  },
  'vlad-tenev': {
    likeness: 'Thick dark hair, olive skin, slim build, strong nose, square jaw, clean-shaven',
    outfitA: 'Black leather jacket over black t-shirt, dark jeans, black sneakers, visible company logo on chest',
    outfitB: 'Charcoal mock-neck sweater, dark pants, neon-green cuff detail, app-emperor posture, visible company logo on chest',
  },
};

const STANDARD_OVERRIDES = {
  'anthony-noto': {
    likeness: 'Short dark-gray hair, pale skin, athletic build, square jaw, straight nose, clean-shaven',
    outfitA: 'Blue SoFi quarter-zip over white t-shirt, dark joggers, white sneakers, visible company logo on chest',
  },
  'chuck-robbins': {
    likeness: 'Short silver hair, pale skin, medium build, long face, square jaw, clean-shaven',
    outfitA: 'Dark blazer over Cisco-blue polo, dark slacks, black shoes, visible company logo on chest',
  },
  'cristiano-amon': {
    likeness: 'Closely cropped dark hair, light-medium skin, medium build, trimmed beard, rectangular glasses, broad forehead',
    outfitA: 'Dark blazer over black t-shirt, dark jeans, white sneakers, visible company logo on chest',
  },
  'carl-eschenbach': {
    likeness: 'Short gray-brown hair, pale skin, medium build, long face, sharp jaw, clean-shaven',
    outfitA: 'Bright blue Workday quarter-zip over white shirt, dark pants, brown shoes, visible company logo on chest',
  },
  'chris-best': {
    likeness: 'Short brown hair, pale skin, slim build, narrow face, light stubble, deep-set eyes',
    outfitA: 'White t-shirt under brown chore jacket, dark jeans, white sneakers, visible company logo on chest',
  },
  'dylan-field': {
    likeness: 'Short dark hair, pale skin, slim build, youthful face, sharp jaw, clean-shaven',
    outfitA: 'Black Figma t-shirt, dark jeans, white sneakers, visible company logo on chest',
  },
  'fidji-simo': {
    likeness: 'Long dark-brown hair, olive skin, slim build, narrow face, dark eyes, poised smile',
    outfitA: 'Cream blazer over black top, dark pants, black heels, visible company logo on chest',
  },
  'gail-boudreaux': {
    likeness: 'Shoulder-length blonde hair, dark skin, slim build, oval face, bright smile, clean makeup',
    outfitA: 'Blue Elevance Health quarter-zip over pale button-down, dark slacks, black shoes, visible company logo on chest',
  },
  'gabriel-weinberg': {
    likeness: 'Short dark hair, pale skin, slim build, rectangular glasses, narrow face, light stubble',
    outfitA: 'Black DuckDuckGo hoodie, dark jeans, gray sneakers, visible company logo on chest',
  },
  'goli-sheikholeslami': {
    likeness: 'Dark shoulder-length wavy hair, olive skin, slim build, oval face, bright eyes, poised smile',
    outfitA: 'Dark blazer over open-collar shirt, dark pants, black shoes, press badge, visible company logo on chest',
  },
  'greg-peters': {
    likeness: 'Short brown-gray hair, pale skin, slim build, long face, light stubble, narrow jaw',
    outfitA: 'Black Netflix zip jacket over dark t-shirt, dark jeans, white sneakers, visible company logo on chest',
  },
  'hock-tan': {
    likeness: 'Short black hair, medium skin, medium build, full face, heavy eyelids, clean-shaven',
    outfitA: 'Dark blazer over white shirt, black pants, black shoes, visible company logo on chest',
  },
  'jane-sun': {
    likeness: 'Dark shoulder-length hair, light-medium skin, slim build, oval face, bright smile, clean makeup',
    outfitA: 'Navy blazer over pale blouse, dark slacks, black flats, visible company logo on chest',
  },
  'jennifer-witz': {
    likeness: 'Shoulder-length blonde hair, pale skin, slim build, oval face, bright smile, clean makeup',
    outfitA: 'Dark blazer over open-collar shirt, dark pants, black shoes, press badge, visible company logo on chest',
  },
  'liz-hamren': {
    likeness: 'Shoulder-length auburn hair, pale skin, slim build, angular face, sharp nose, focused smile',
    outfitA: 'Black Ring zip jacket over dark top, black pants, white sneakers, visible company logo on chest',
  },
  'matt-mullenweg': {
    likeness: 'Swept-back sandy-brown hair, pale skin, slim build, short beard, narrow face, calm eyes',
    outfitA: 'Black WordPress t-shirt under dark jacket, dark jeans, black boots, visible company logo on chest',
  },
  'michael-miebach': {
    likeness: 'Short brown-gray hair, pale skin, medium build, oval face, narrow jaw, clean-shaven',
    outfitA: 'Dark suit, white shirt, Mastercard-red tie, black dress shoes, visible company logo on chest',
  },
  'mike-sievert': {
    likeness: 'Short silver-blond hair, pale skin, athletic build, square jaw, energetic smile, clean-shaven',
    outfitA: 'Magenta T-Mobile polo shirt, dark pants, white sneakers, visible company logo on chest',
  },
  'nicholas-thompson': {
    likeness: 'Short brown hair graying at the temples, pale skin, slim build, narrow face, clean-shaven, lively eyes',
    outfitA: 'Dark blazer over open-collar shirt, dark pants, brown shoes, visible company logo on chest',
  },
  'omar-abbosh': {
    likeness: 'Short dark-gray hair, olive skin, medium build, long face, straight nose, clean-shaven',
    outfitA: 'Dark blazer over collared shirt, dark pants, black shoes, visible company logo on chest',
  },
  'patrick-soon-shiong': {
    likeness: 'Short silver hair, light-medium skin, medium build, round face, rectangular glasses, clean-shaven',
    outfitA: 'Dark blazer over pale shirt, dark slacks, black shoes, visible company logo on chest',
  },
  'patti-poppe': {
    likeness: 'Shoulder-length blonde hair, pale skin, slim build, oval face, bright smile, clean makeup',
    outfitA: 'Dark Pacific Gas and Electric work jacket over collared shirt, dark pants, brown work shoes, visible company logo on chest',
  },
  'paula-kerger': {
    likeness: 'Shoulder-length blonde hair, pale skin, slim build, oval face, bright smile, clean makeup',
    outfitA: 'Navy blazer over white blouse, dark pants, black flats, visible company logo on chest',
  },
  'ryan-roslansky': {
    likeness: 'Short dark hair, pale skin, medium build, oval face, clean-shaven, broad smile lines',
    outfitA: 'Blue LinkedIn blazer over pale shirt, dark jeans, white sneakers, visible company logo on chest',
  },
  'rahul-purini': {
    likeness: 'Short dark hair, medium-brown skin, slim build, rectangular glasses, narrow face, clean-shaven',
    outfitA: 'Crunchyroll hoodie over plain t-shirt, dark jeans, white sneakers, visible company logo on chest',
  },
  'sridhar-ramaswamy': {
    likeness: 'Short salt-and-pepper hair, medium-brown skin, slim build, rectangular glasses, trimmed beard, narrow face',
    outfitA: 'Black Snowflake t-shirt under dark blazer, dark jeans, white sneakers, visible company logo on chest',
  },
  'ted-pick': {
    likeness: 'Short gray hair, pale skin, medium build, angular face, heavy brow, clean-shaven',
    outfitA: 'Dark suit, white shirt, blue tie, black dress shoes, visible company logo on chest',
  },
  'lynsi-snyder': {
    likeness: 'Long blonde hair, tanned light skin, slim build, oval face, bright smile, clean makeup',
    outfitA: 'Branded In-N-Out Burger manager polo, dark pants, non-slip black shoes, visible company logo on chest',
  },
};

function companyLabel(company) {
  if (COMPANY_ALIAS[company]) return COMPANY_ALIAS[company];
  return company
    .replace(/\s+(Inc|LLC|Corp|Corporation|PLC|Co|Ltd|NV|PBC|SARL|GmbH)\.?$/i, '')
    .replace(/\s+Holdings$/i, '')
    .replace(/\s+Group$/i, '')
    .trim();
}

function inferSector(company, slug) {
  const text = `${company} ${slug}`.toLowerCase();

  if (/(restaurant|burger|pizza|coffee|pretzel|deli|bros|wawa|sheetz|7-eleven|quiktrip|panera|subway|krispy|wingstop|whataburger|red robin|cracker barrel|shake shack|raising cane|papa john|little caesar|jason's deli|in-n-out|five guys|denny|bob evans|planet fitness|massage envy|sport clips|great clips)/.test(text)) {
    return 'restaurant';
  }
  if (/(air|airlines|hotel|hotels|resort|resorts|travel|expedia|booking|trip|marriott|hilton|hyatt|intercontinental|wyndham|royal caribbean|carnival|uber|lyft|avis|hertz|enterprise)/.test(text)) {
    return 'travel';
  }
  if (/(health|pfizer|johnson & johnson|teladoc|cigna|humana|mckesson|cardinal|medtronic|abbott|merck|boston scientific|stryk|goodrx|hims|tenet|hca|concentra)/.test(text)) {
    return 'health';
  }
  if (/(energy|electric|shell|sunoco|valero|baker hughes|devon|conoco|phillips 66|nextera|dominion|entergy|exelon|duke|southern company|marathon petroleum|pacific gas|consolidated edison)/.test(text)) {
    return 'industrial';
  }
  if (/(bank|bancorp|financial|capital|visa|mastercard|paypal|coinbase|robinhood|sofi|betterment|acorns|nerdwallet|stripe|citadel|discover|ally|u-s-bancorp|u.s. bancorp|synchrony|lendingtree|intercontinental exchange|kraken|rocket companies)/.test(text)) {
    return 'finance';
  }
  if (/(media|news|broadcast|discovery|npr|pbs|politico|buzzfeed|vox|axios|atlantic|times|washington post|conde|hearst|fox|warner|paramount|sirius|iheart|news corp|penske|intercept|propublica|mother jones)/.test(text)) {
    return 'media';
  }
  if (/(fitness|gym|la fitness|gold's gym|anytime fitness|planet fitness|massage envy)/.test(text)) {
    return 'fitness';
  }
  if (/(ford|boeing|intel|amd|qualcomm|broadcom|michelin|stellantis|new balance|bridgestone|goodyear|abc supply|pep boys|baker hughes|halliburton|northrop|rtx|general dynamics|sony|hp|ring|vivint|simpli|adt)/.test(text)) {
    return 'industrial';
  }
  if (/(twitch|discord|github|dropbox|figma|zoom|reddit|shopify|doordash|tiktok|block|perplexity|anthropic|deepmind|adobe|github|snowflake|asana|chegg|coursera|quizlet|ring|thumbtack|wix|workday|servicenow|substack|duckduckgo|netflix|github|cloudflare|canva|masterclass|glassdoor|indeed|linkedin|yahoo|lyft|ro|github)/.test(text)) {
    return 'tech';
  }
  if (/(store|stores|restaurant|retail|ross|wawa|ross stores|bath & body works|victoria's secret|campbell|mondelez|general mills|hormel|conagra|pepsi|coca-cola|brown-forman|molson coors|constellation brands|perdue|mars|walmart|target)/.test(text)) {
    return 'retail';
  }
  return 'corporate';
}

function defaultOutfit(item) {
  if (STANDARD_OVERRIDES[item.slug]?.outfitA) return STANDARD_OVERRIDES[item.slug].outfitA;

  const brand = companyLabel(item.company);
  const sector = inferSector(item.company, item.slug);

  if (sector === 'restaurant') {
    return `Branded ${brand} manager polo, dark pants, non-slip black shoes, visible company logo on chest`;
  }
  if (sector === 'travel') {
    return `Navy ${brand} blazer over open-collar shirt, dark slacks, black shoes, travel lanyard, visible company logo on chest`;
  }
  if (sector === 'health') {
    return `Blue ${brand} quarter-zip over pale button-down, dark slacks, black shoes, visible company logo on chest`;
  }
  if (sector === 'industrial') {
    return `Dark ${brand} work jacket over collared shirt, dark pants, brown work shoes, visible company logo on chest`;
  }
  if (sector === 'finance') {
    return `Dark navy suit, white shirt, blue tie, tiny ${brand} pin, black dress shoes, visible company logo on chest`;
  }
  if (sector === 'media') {
    return `Dark blazer over open-collar shirt, dark pants, black shoes, press badge, visible company logo on chest`;
  }
  if (sector === 'fitness') {
    return `${brand} performance quarter-zip, dark joggers, trainers, visible company logo on chest`;
  }
  if (sector === 'tech') {
    return `${brand} hoodie over plain t-shirt, dark jeans, white sneakers, visible company logo on chest`;
  }
  if (sector === 'retail') {
    return `${brand} polo shirt, dark pants, black sneakers, visible company logo on chest, plain black belt`;
  }
  return `Dark blazer over collared shirt, dark pants, black shoes, visible company logo on chest`;
}

function resolveId(item) {
  if (item.slug === 'michael-rhodes') {
    if (item.company.includes('Discover')) return 'michael-rhodes-discover';
    if (item.company.includes('Ally')) return 'michael-rhodes-ally';
  }
  return item.slug;
}

function buildEntry(item) {
  const important = IMPORTANT_OVERRIDES[item.slug];
  if (important) {
    return {
      id: resolveId(item),
      name: item.name,
      tier: 'important',
      likeness: important.likeness,
      variants: {
        A: { outfit: important.outfitA },
        B: { outfit: important.outfitB },
      },
    };
  }

  const standard = STANDARD_OVERRIDES[item.slug];
  if (!standard) return null;

  return {
    id: resolveId(item),
    name: item.name,
    tier: 'standard',
    likeness: standard.likeness,
    variants: {
      A: {
        outfit: standard.outfitA || defaultOutfit(item),
      },
    },
  };
}

function main() {
  const missing = JSON.parse(fs.readFileSync(MISSING_PATH, 'utf8'));
  const generated = [];
  const skipped = [];

  for (const item of missing) {
    const entry = buildEntry(item);
    if (entry) {
      generated.push(entry);
    } else {
      skipped.push(item);
    }
  }

  fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(generated, null, 2)}\n`);
  fs.writeFileSync(SKIPPED_PATH, `${JSON.stringify(skipped, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        generated: generated.length,
        outputPath: OUTPUT_PATH,
        skipped: skipped.length,
        skippedPath: SKIPPED_PATH,
        importantAdded: generated.filter((entry) => entry.tier === 'important').length,
      },
      null,
      2,
    ),
  );
}

main();
