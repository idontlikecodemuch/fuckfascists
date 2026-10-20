import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { findCardForWeek } from '../data/cardArchive';
import { lateCardMarker } from '../data/weekMarkers';

export interface LateCardReveal {
  /** Card of a missed drop waiting for its one reveal, or null. */
  uri: string | null;
  /** Call once the reveal is on screen: it never shows again. */
  markShown: () => void;
  /** Ends the reveal (the user dismissed it). */
  dismiss: () => void;
}

/**
 * A missed drop's card (captured more than the presentation window after its
 * drop, see lateCardMarker) gets the full presentation once, the next time the
 * Scorecard tab shows. Re-reads the marker whenever the shell's cards change.
 * When this drop's own card is in its window (`newerCardInWindow`), the newer
 * card wins: the late card is never shown and its marker is cleared.
 */
export function useLateCardReveal(refreshKey: number, newerCardInWindow: boolean): LateCardReveal {
  const [uri, setUri] = useState<string | null>(null);
  // Sync ref: read after the async marker lookup, so a newer in-window card
  // that appeared meanwhile still wins.
  const newerRef = useRef(newerCardInWindow);
  newerRef.current = newerCardInWindow;
  // Once on screen, the reveal stays until dismissed, even if a later re-read
  // (its marker is already cleared) finds nothing.
  const shownRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const weekOf = await lateCardMarker.read();
      const card = weekOf ? await findCardForWeek(weekOf).catch(() => null) : null;
      if (cancelled || shownRef.current) return;
      if (card && !newerRef.current) {
        setUri(card.uri);
        return;
      }
      setUri(null);
      if (weekOf) await lateCardMarker.clear();
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  useEffect(() => {
    if (!newerCardInWindow) return;
    shownRef.current = false;
    setUri(null);
    void lateCardMarker.clear();
  }, [newerCardInWindow]);

  const markShown = useCallback(() => {
    shownRef.current = true;
    void lateCardMarker.clear();
  }, []);
  const dismiss = useCallback(() => {
    shownRef.current = false;
    setUri(null);
  }, []);
  return useMemo(() => ({ uri, markShown, dismiss }), [uri, markShown, dismiss]);
}
