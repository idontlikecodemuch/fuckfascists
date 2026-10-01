import React from 'react';
import { AbsoluteFill, Img, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { CASH } from '../clips';
import { useLayout } from '../LayoutContext';

const SPRITE_W = 24;
const SPRITE_H = 17;

type Props = {
  count?: number;
  seed?: string;
  /** frame (local) when the rain starts falling; before it nothing is drawn */
  startFrame?: number;
  /** stop spawning after this frame — existing bills keep falling out */
  width?: number;
  height?: number;
};

/** Falling cash sprites (the app's MoneyRainfall look, re-created so bills can land on Clark). */
export const MoneyRain: React.FC<Props> = ({ count = 26, seed = 'rain', startFrame = 0, width, height }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < startFrame) return null;
  const areaW = width ?? L.w;
  const areaH = height ?? L.h;
  const t = (frame - startFrame) / fps;
  const fadeIn = interpolate(frame - startFrame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const bills = Array.from({ length: count }, (_, i) => {
    const r = (k: string) => random(`${seed}-${i}-${k}`);
    const scale = r('s') > 0.5 ? 4 : 3;
    const w = SPRITE_W * scale;
    const h = SPRITE_H * scale;
    const speed = 420 + r('v') * 360; // px/s
    const delay = r('d') * 1.4; // stagger the first wave
    const span = areaH + h * 2;
    const yRaw = Math.max(0, t - delay) * speed - h;
    const y = t < delay ? -h * 2 : ((yRaw + h) % span) - h;
    const sway = 18 + r('a') * 40;
    const x = r('x') * (areaW + 80) - 40 + Math.sin(t * (1.4 + r('f') * 1.6) + r('p') * 6.28) * sway;
    const rot = (r('r') - 0.5) * 70 + Math.sin(t * 2.2 + r('q') * 6) * 18;
    return { i, x: Math.round(x), y: Math.round(y), w, h, rot: Math.round(rot), sprite: Math.floor(r('i') * CASH.length) % CASH.length };
  });
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', opacity: fadeIn }}>
      {bills.map((b) => (
        <Img
          key={b.i}
          src={CASH[b.sprite]}
          style={{
            position: 'absolute',
            left: b.x,
            top: b.y,
            width: b.w,
            height: b.h,
            imageRendering: 'pixelated',
            transform: `rotate(${b.rot}deg)`,
            filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,0.45))',
          }}
        />
      ))}
    </AbsoluteFill>
  );
};
