import { useEffect, useState } from 'react';
import { clearLateCardWeek, readLateCardWeek } from '../data/lateCardNotice';

/**
 * Week of a card that was captured after its presentation window and has not
 * been announced yet. Re-read when refreshKey changes. Once `visible` (the
 * notice is on screen) the stored marker is cleared; the line stays for the
 * rest of this visit and is gone next time.
 */
export function useLateCardNotice(visible: boolean, refreshKey: number): string | null {
  const [lateWeek, setLateWeek] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const weekOf = await readLateCardWeek();
      if (!cancelled && weekOf) setLateWeek(weekOf);
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  useEffect(() => {
    if (lateWeek && visible) void clearLateCardWeek();
  }, [lateWeek, visible]);

  return lateWeek;
}
