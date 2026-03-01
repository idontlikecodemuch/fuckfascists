/**
 * Converts GPS coordinates into a rough-area token used only as a cache key.
 *
 * Rounds lat/lng to 2 decimal places (~1.1 km grid at the equator) so that
 * nearby users share cached OpenSecrets results without leaking precise location.
 *
 * IMPORTANT: This token is used as a LocalCache.key, never stored as
 * coordinates. Raw lat/lng must never be written to disk or transmitted.
 */
export function toAreaHash(lat: number, lng: number): string {
  const roundedLat = Math.round(lat * 100) / 100;
  const roundedLng = Math.round(lng * 100) / 100;
  return `${roundedLat},${roundedLng}`;
}
