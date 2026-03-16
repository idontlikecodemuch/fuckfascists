/**
 * Re-exports bundled info content from its canonical location in copy/.
 * Kept as a thin re-export so existing imports (tests, hooks) don't break.
 * The editorial content itself lives in copy/infoContent.ts.
 */
export { BUNDLED_INFO_CONTENT as BUNDLED_CONTENT } from '../../../copy/infoContent';
