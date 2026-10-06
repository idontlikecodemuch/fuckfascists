import React from 'react';
import { AbsoluteFill, Easing, OffthreadVideo, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { useLayout } from '../LayoutContext';
import { COLD_OPEN, clipSrc } from '../clips';
import clipDims from '../data/clipDims.json';
import { MoneyRain } from '../components/MoneyRain';
import { CAPTURE } from '../layout';
import type { Cut } from '../timing';
import { sec } from '../timing';
import { T } from '../tokens';
import { useShake } from './shared';

/**
 * Outcome-first cold open for the per-tab shorts (creator, Oct 6: each short opens
 * differently, on its own payoff, not the icon title card): ~1.5 s of the real moment —
 * the AVOID stamp, the arena defeat, the barcode lock → record, the rain on the card —
 * full-bleed at native scale with a slow punch-in, a 2 px shake on the hit, then the
 * CRT blink into the title card. The 60/30 keep their slam; it is not reused here.
 */
export const ColdOpenPanel: React.FC<{ cut: Cut }> = ({ cut }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const spec = COLD_OPEN[cut];
  const shake = useShake(spec?.shakeAt != null ? sec(spec.shakeAt) : null, 3, 10);
  if (!spec) return <AbsoluteFill style={{ background: T.void }} />;
  // same sizing as the feature beats: fit the width, crop only the overhang from the spare edge
  const dims = (clipDims as Record<string, { w: number; h: number }>)[spec.file] ?? CAPTURE;
  const h = Math.round((L.w * dims.h) / dims.w);
  const excess = Math.max(0, h - L.h);
  const top = spec.align === 'bottom' ? -excess : spec.align === 'center' ? -Math.round(excess / 2) : 0;
  // slow punch-in over the open so the first frame isn't a static screenshot
  const zoom = interpolate(frame, [0, sec(1.5)], [1.08, 1.0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  return (
    <AbsoluteFill style={{ background: T.void }}>
      <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px) scale(${zoom})`, transformOrigin: '50% 40%' }}>
        <OffthreadVideo
          src={clipSrc(spec.file)}
          muted
          startFrom={Math.round(spec.startFrom * fps)}
          style={{ position: 'absolute', left: 0, top, width: L.w, height: h }}
        />
      </AbsoluteFill>
      {spec.rain ? <MoneyRain count={28} seed={`cold-${cut}`} startFrame={0} /> : null}
    </AbsoluteFill>
  );
};
