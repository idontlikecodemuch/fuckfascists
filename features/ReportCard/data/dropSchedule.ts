import type { DropSchedule } from '../types';
import { DROP_SCHEDULE_URL } from '../../../config/constants';

/**
 * Fetches the weekly drop schedule from the CDN.
 * Returns null on any network or parse failure — callers fall back to
 * hiding the card until the next successful fetch.
 */
export async function fetchDropSchedule(): Promise<DropSchedule | null> {
  try {
    const res = await fetch(DROP_SCHEDULE_URL);
    if (!res.ok) return null;

    const json = (await res.json()) as Record<string, unknown>;

    if (typeof json.dropAt !== 'number' || typeof json.weekOf !== 'string') {
      return null;
    }

    return { dropAt: json.dropAt, weekOf: json.weekOf };
  } catch {
    return null;
  }
}
