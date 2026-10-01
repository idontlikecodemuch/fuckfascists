import React from 'react';
import { Img, useCurrentFrame, useVideoConfig } from 'remotion';
import { type Placement, useLayout } from '../LayoutContext';
import { CLARK_BUST, CLARK_FULL, clarkVeoFrame } from '../clips';

export type ClarkPlacement = Placement;

const BUST_SIZE = { w: 994, h: 952, faceX: 500, faceY: 330 };

/** 2 px idle bob, ~1.3 s period, stepped so the pixel art never sits on a half pixel. */
export const useIdleBob = (): number => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  return Math.round(1 - Math.cos((t / 1.3) * Math.PI * 2)); // 0 | 1 | 2
};

type Props = {
  placement?: ClarkPlacement;
  opacity?: number;
  bob?: boolean;
  /** Animated (keyed) Veo PNG sequence for the current line, if prepped. */
  veoLineId?: string | null;
  veoFrames?: number;
  translateX?: number;
  /** everything below this y is hidden (the dialogue box covers his chest) */
  clipBottom?: number;
};

export const Clark: React.FC<Props> = ({ placement, opacity = 1, bob = true, veoLineId = null, veoFrames = 0, translateX = 0, clipBottom }) => {
  const L = useLayout();
  const p0 = placement ?? L.clark.placement;
  const bobY = useIdleBob();
  const frame = useCurrentFrame();
  const animated = Boolean(veoLineId && veoFrames > 0);
  // The Veo frames are always the 2x BUST (994x952, face at 500,330). When the
  // layout stages the full-body asset, re-anchor the bust on the same face point
  // at half the scale so heads match between animated and static frames.
  const A = L.clark.assetSize;
  const asset = animated ? BUST_SIZE : A;
  let p = p0;
  if (animated && L.clark.asset === 'full') {
    const faceX = p0.left + A.faceX * p0.scale;
    const faceY = p0.top + A.faceY * p0.scale;
    const scale = p0.scale / 2;
    p = { left: faceX - BUST_SIZE.faceX * scale, top: faceY - BUST_SIZE.faceY * scale, scale };
  }
  const style: React.CSSProperties = {
    position: 'absolute',
    left: p.left,
    top: p.top + (bob ? bobY : 0),
    width: asset.w * p.scale,
    height: asset.h * p.scale,
    imageRendering: 'pixelated',
    opacity,
    transform: `translateX(${translateX}px)`,
    filter: 'drop-shadow(2px 3px 0 rgba(0,0,0,0.55))',
  };
  const clip: React.CSSProperties = { position: 'absolute', left: 0, top: 0, width: L.w, height: clipBottom ?? L.clark.clipBottom, overflow: 'hidden', zIndex: L.clark.front ? 2 : undefined };
  if (animated && veoLineId) {
    const idx = Math.max(0, Math.min(veoFrames - 1, frame));
    const fullUnder = L.clark.asset === 'full';
    // On the full-body layout the static body sits under the animated bust; the
    // bust's bottom edge is feathered so the chest line doesn't show a seam.
    const mask = 'linear-gradient(to bottom, #000 82%, transparent 97%)';
    return (
      <div style={clip}>
        {fullUnder ? (
          <Img
            src={CLARK_FULL}
            style={{
              position: 'absolute',
              // hide the static head/shoulders: only what's under the bust's feather shows
              clipPath: `inset(${Math.max(0, p.top + asset.h * p.scale * 0.84 - p0.top)}px 0 0 0)`,
              left: p0.left,
              top: p0.top + (bob ? bobY : 0),
              width: A.w * p0.scale,
              height: A.h * p0.scale,
              imageRendering: 'pixelated',
              opacity,
              transform: `translateX(${translateX}px)`,
              filter: 'drop-shadow(2px 3px 0 rgba(0,0,0,0.55))',
            }}
          />
        ) : null}
        <Img src={clarkVeoFrame(veoLineId, idx)} style={fullUnder ? { ...style, maskImage: mask, WebkitMaskImage: mask } : style} />
      </div>
    );
  }
  const featherMask = 'linear-gradient(to bottom, #000 76%, transparent 100%)';
  const featherStyle = L.clark.feather ? { maskImage: featherMask, WebkitMaskImage: featherMask } : {};
  return (
    <div style={clip}>
      <Img src={L.clark.asset === 'full' ? CLARK_FULL : CLARK_BUST} style={{ ...style, ...featherStyle }} />
    </div>
  );
};
