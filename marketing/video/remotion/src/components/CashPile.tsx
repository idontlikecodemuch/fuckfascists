import React from 'react';
import { Img, interpolate, random, useCurrentFrame } from 'remotion';
import { CASH } from '../clips';

type Props = {
  /** pile footprint */
  x: number;
  y: number; // top of the mound
  width: number;
  height: number;
  count?: number;
  seed?: string;
  /** local frame the pile starts building (bills land one by one over ~1 s) */
  startFrame?: number;
  scale?: number;
};

/** A mound of cash sprites: half-ellipse dome, bills tumbled at random angles. */
export const CashPile: React.FC<Props> = ({ x, y, width, height, count = 42, seed = 'pile', startFrame = 0, scale = 4 }) => {
  const frame = useCurrentFrame();
  const w = 24 * scale;
  const h = 17 * scale;
  const cx = x + width / 2;
  const bills = Array.from({ length: count }, (_, i) => {
    const r = (k: string) => random(`${seed}-${i}-${k}`);
    const bx = x + r('x') * width;
    const nx = (bx - cx) / (width / 2);
    const dome = 1 - Math.sqrt(Math.max(0, 1 - nx * nx));
    const by = y + dome * height + r('y') * height * 0.55;
    const order = r('o');
    return { i, bx: Math.round(bx - w / 2), by: Math.round(by), rot: Math.round((r('r') - 0.5) * 80), sprite: i % CASH.length, order };
  }).sort((a, b) => a.by - b.by);
  return (
    <>
      {bills.map((b) => {
        const landAt = startFrame + Math.round(b.order * 30);
        const drop = interpolate(frame, [landAt - 6, landAt], [-120, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        if (frame < landAt - 6) return null;
        return (
          <Img
            key={b.i}
            src={CASH[b.sprite]}
            style={{
              position: 'absolute',
              left: b.bx,
              top: b.by + drop,
              width: w,
              height: h,
              imageRendering: 'pixelated',
              transform: `rotate(${b.rot}deg)`,
              filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,0.5))',
            }}
          />
        );
      })}
    </>
  );
};
