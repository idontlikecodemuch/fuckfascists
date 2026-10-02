import { staticFile } from 'remotion';

/**
 * App Store screenshot tiles for 1.2 (6.9" canvas, 1320×2868). Each tile is one
 * frame pulled from the Sep 21–26 simulator/phone captures (v1.1.0 build 9 code)
 * into media/appstore/frames/ by scripts/appstore.sh, under a caption band. The
 * phone bleeds off the bottom of the canvas just below the tab bar's yellow line,
 * so the Debug build's DEV tab never shows.
 */
export type Tile = { id: string; frame: string; headline: string; sub: string };

export const TILE_W = 1320;
export const TILE_H = 2868;
/** source rows kept: through the 2 px brand-yellow line on top of the tab bar (y 2314–2317) */
export const SOURCE_W = 1206;
export const SOURCE_H = 2622;
export const CUT_Y = 2319;

export const TILES: Tile[] = [
  {
    id: 'drop',
    frame: 'drop',
    headline: 'EVERY AVOID\nCOUNTS.',
    sub: 'Random drop between Friday and Saturday.\nShare it.',
  },
  {
    id: 'map-file',
    frame: 'map_card',
    headline: 'TAP A BUSINESS.\nHERE’S THE FILE.',
    sub: 'Every dollar, straight from FEC.gov.\nSix election cycles, 2016–2026.',
  },
  {
    id: 'map-avoid',
    frame: 'map_avoid',
    headline: 'DON’T WANT TO\nSUPPORT THEM?\nTAP AVOID.',
    sub: 'Stamp the file. It counts toward your week.',
  },
  {
    id: 'track',
    frame: 'track',
    headline: 'SKIP A PLATFORM.\nLOG THE DAY.',
    sub: 'Pick the platforms you use.\nEvery day you skip one counts all week.',
  },
  {
    id: 'scan',
    frame: 'scan',
    headline: 'AT THE STORE?\nSCAN A BARCODE.',
    sub: 'Clark finds the parent company\nand pulls their file.',
  },
  {
    id: 'clark',
    frame: 'memo',
    headline: 'MEET CLARK,\nYOUR PUBLIC\nRECORDS CLERK.',
    sub: 'Hundreds of gigabytes of FEC filings,\norganized so you can use them.',
  },
  {
    id: 'privacy',
    frame: 'privacy',
    headline: 'NO ACCOUNTS.\nNO TRACKING.\nNO SERVERS.',
    sub: 'Everything stays on your phone.\nOpen source. Data from FEC.gov.',
  },
];

export const frameSrc = (frame: string): string => staticFile(`media/appstore/frames/${frame}.png`);
