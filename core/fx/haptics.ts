import * as Haptics from 'expo-haptics';

/**
 * Centralized haptic feedback for the app. All call sites route through here
 * so we have one tuning surface (intensity, sequence timing, a future
 * user-toggle) instead of impactAsync calls sprinkled across components.
 *
 * iOS respects the system "Vibration" accessibility setting automatically,
 * so users who've disabled haptics OS-wide won't feel these — no separate
 * gating needed.
 */

// Avoid uncaught rejections from the platform API while keeping the call
// fire-and-forget. We don't surface haptic errors anywhere.
function safe<T>(p: Promise<T>): void {
  p.catch(() => {});
}

/**
 * Light, snappy tap — selection feedback. For ordinary button presses,
 * tab switches, dismiss/close, link taps, secondary CTAs. Not a celebration,
 * just acknowledgement.
 */
export function tap(): void {
  safe(Haptics.selectionAsync());
}

/**
 * Map entity hit — stronger than a plain tap, shorter than avoid/share.
 * Fired when a map tap resolves to a matched entity or when an entity marker
 * is tapped.
 */
export function mapEntity(): void {
  safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}

/**
 * "I just did the thing" feel for avoid taps. Heavy impact followed by a
 * brief success notification — meaningful punctuation without being chaotic.
 * Fires on both surfaces (Map/Scan BusinessCard avoid + Track row avoid +
 * Track day-circles past-day avoid) so the feedback is consistent.
 */
export function avoid(): void {
  safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  // Quick affirmative ping ~120ms later. Two beats reads as "done +
  // recorded" — louder than a single tap, shorter than the celebration.
  setTimeout(() => {
    safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  }, 120);
}

/**
 * Share moment — three rapid medium impacts. Bigger than a regular tap
 * (it's an act the user wants to feel rewarded for), smaller than the
 * full reveal celebration (it's not the headline moment).
 *
 * Fired from CardPresentation.handleShare so the same haptic plays for
 * the SHARE tap AND the swipe-up gesture AND the Android screenshot
 * auto-share path — one source of truth.
 */
export function share(): void {
  const beat = () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  beat();
  setTimeout(beat, 80);
  setTimeout(beat, 160);
}

/**
 * Scorecard drop celebration — triumph pattern with breathing space.
 * ~1800ms, 8 beats, 4 deliberate pauses.
 *
 * Arc:
 *   Drumroll (3 heavy)  →  pause  →  breath beat  →  pause (dramatic)
 *   Climax (2 heavy)    →  pause  →  success peak  →  pause
 *   Coda stomp + grand-finale success
 *
 * The pauses are the design — gaps of 240–380ms let each phase land
 * before the next begins, so the sequence reads as a *composed moment*
 * rather than a continuous buzz. Apple HIG aligns: significant moments
 * deserve distinct, intentional beats with silence between them.
 *
 * Fired once on CardPresentation mount when cardUri first goes active.
 */
export function celebration(): void {
  const heavy = () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  const medium = () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  const success = () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));

  heavy();                        //    0 — opening
  setTimeout(heavy,   130);       //  130
  setTimeout(heavy,   260);       //  260 — drumroll closes
  // ── pause 320ms ───────────────────────────────────────────
  setTimeout(medium,  580);       //  580 — breath beat
  // ── pause 380ms (dramatic — the longest gap) ─────────────
  setTimeout(heavy,   960);       //  960 — climax pair opens
  setTimeout(heavy,  1090);       // 1090
  // ── pause 240ms ───────────────────────────────────────────
  setTimeout(success, 1330);      // 1330 — success peak
  // ── pause 280ms ───────────────────────────────────────────
  setTimeout(heavy,  1610);       // 1610 — coda stomp
  setTimeout(success, 1800);      // 1800 — grand finale
}

export const haptics = { tap, mapEntity, avoid, share, celebration };
