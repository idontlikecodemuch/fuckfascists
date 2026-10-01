import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { useLayout } from '../LayoutContext';
import { CLIPS, clipSrc } from '../clips';
import { FullBleed } from '../components/FullBleed';
import { sec, type PanelTL } from '../timing';
import { T } from '../tokens';
import { Boxes, ClarkLayer } from './shared';
import type { VeoMap } from '../vo';

/** Swipe up → share sheet. Clark slides off frame-left; his box collapses with him. */
export const SharePanel: React.FC<{ p: PanelTL; veo: VeoMap }> = ({ p, veo }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const clip = CLIPS[p.key];
  const slideFrames = sec(0.4);
  const slideStart = p.duration - slideFrames - 2;
  const s = interpolate(frame, [slideStart, slideStart + slideFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  const dx = L.clark.slideOff * s;
  return (
    <AbsoluteFill style={{ background: T.void }}>
      {clip ? <FullBleed src={clipSrc(clip.file)} anchor="bottom" /> : null}
      <ClarkLayer boxes={p.boxes} veo={veo} translateX={dx} />
      <Boxes boxes={p.boxes} translateX={dx} collapse={Math.max(0, 1 - s / 0.7)} />
    </AbsoluteFill>
  );
};
