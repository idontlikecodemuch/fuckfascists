import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import type { TextStyle, StyleProp } from 'react-native';
import { formatDonationAmount } from '../../../core/models';
import { DONATION_COUNT_UP_MS, DONATION_COUNT_UP_START_DELAY_MS } from '../../../config/constants';

interface CountUpAmountProps {
  /** Final displayed value — the animation interpolates 0 → value. */
  value: number;
  /** Static prefix prepended to the formatted amount (e.g. "R:", "D:"). */
  prefix: string;
  style?: StyleProp<TextStyle>;
  /** Override the default cubic-out duration from constants. */
  durationMs?: number;
}

/**
 * Ticker-style count-up for donation amounts on the business card (#126).
 * Reformats through `formatDonationAmount` at every frame so the displayed
 * string naturally moves through "$0 → $157 → $1K → $18K" as it rises.
 * Respects Reduce Motion — skips directly to the final value when enabled.
 *
 * Uses requestAnimationFrame rather than Animated.Value because the output
 * is a formatted string, not a numeric style property. setState is
 * component-local and batched by React — typical run is ~36 renders over
 * 650ms on a 60Hz display.
 */
export function CountUpAmount({
  value,
  prefix,
  style,
  durationMs = DONATION_COUNT_UP_MS,
}: CountUpAmountProps) {
  const [display, setDisplay] = useState(0);
  const reducedMotionRef = useRef<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Cache the Reduce Motion check across effect runs so we don't hit
      // AccessibilityInfo again for every value change.
      if (reducedMotionRef.current === null) {
        try {
          reducedMotionRef.current = await AccessibilityInfo.isReduceMotionEnabled();
        } catch {
          reducedMotionRef.current = false;
        }
      }
      if (cancelled) return;

      if (reducedMotionRef.current || value <= 0) {
        setDisplay(value);
        return;
      }

      // Let the card's first paint — especially the sprite perch Image's
      // async layout/decode on recycled Fabric native views — complete
      // before we start pushing ~60Hz setState updates. See
      // DONATION_COUNT_UP_START_DELAY_MS comment for the full story.
      await new Promise<void>((resolve) => setTimeout(resolve, DONATION_COUNT_UP_START_DELAY_MS));
      if (cancelled) return;

      const start = Date.now();
      let raf = 0;
      const tick = () => {
        const elapsed = Date.now() - start;
        const t = Math.min(1, elapsed / durationMs);
        // Cubic-out easing: fast initial ticker, soft landing
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(value * eased));
        if (t < 1 && !cancelled) {
          raf = requestAnimationFrame(tick);
        } else if (!cancelled) {
          setDisplay(value);
        }
      };
      raf = requestAnimationFrame(tick);

      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
      };
    };

    const cleanupPromise = run();
    return () => {
      cancelled = true;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [value, durationMs]);

  return (
    <Text style={style} allowFontScaling>
      {prefix} {formatDonationAmount(display)}
    </Text>
  );
}
