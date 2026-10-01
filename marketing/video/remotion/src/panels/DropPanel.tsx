import React from 'react';
import { AbsoluteFill, Img, interpolate, useCurrentFrame } from 'remotion';
import { useLayout } from '../LayoutContext';
import { CLIPS, PREVIEW_STILL, clipSrc } from '../clips';
import { CashPile } from '../components/CashPile';
import { FullBleed } from '../components/FullBleed';
import { MoneyRain } from '../components/MoneyRain';
import { PhoneFrame, coverTop } from '../components/PhoneFrame';
import { Starfield } from '../components/Starfield';
import { sec, type PanelTL } from '../timing';
import { T } from '../tokens';
import { Boxes, ClarkLayer, useShake } from './shared';
import type { VeoMap } from '../vo';

/** Environmental switch: the device frame dissolves, the reveal goes full-bleed, gold takes over, rain. On the full layout Clark is off screen for the reveal and returns for the share. */
export const DropPanel: React.FC<{ p: PanelTL; veo: VeoMap }> = ({ p, veo }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const clip = CLIPS[p.key];
  const revealF = clip?.revealAt != null ? sec(clip.revealAt) : null;
  const rainF = clip?.rainAt != null ? sec(clip.rainAt) : sec(1.2);
  const shake = useShake(revealF, 3, 12);
  const frameFade = interpolate(frame, [0, 9], [1, 0], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ background: T.void }}>
      <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}>
        {clip ? <FullBleed src={clipSrc(clip.file)} /> : null}
        {frameFade > 0 ? (
          <>
            <Starfield opacity={frameFade} />
            <PhoneFrame opacity={frameFade} scale={1 + 0.05 * (1 - frameFade)}>
              <Img src={PREVIEW_STILL} style={coverTop} />
            </PhoneFrame>
          </>
        ) : null}
        <MoneyRain count={L.mode === 'wide' ? 44 : 34} seed={`drop-${p.key}`} startFrame={rainF} />
        {L.stage === 'full' ? null : (
          <>
            <ClarkLayer boxes={p.boxes} veo={veo} />
            <CashPile x={L.pile.left} y={L.pile.top} width={L.pile.width} height={L.pile.height} startFrame={rainF + 14} seed={`pile-${p.key}`} />
          </>
        )}
        <Boxes boxes={p.boxes} gold />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
