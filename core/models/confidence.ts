/** Confidence is a 0–1 numeric score matching the entity matchScore scale.
 *  Use CONFIDENCE_THRESHOLD_HIGH / CONFIDENCE_THRESHOLD_MEDIUM from
 *  config/constants.ts to derive display labels (HIGH / MEDIUM) at render time.
 */
export type ConfidenceLevel = number;
