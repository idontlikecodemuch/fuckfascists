import React from 'react';
import { Img, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { APP_ICON } from '../clips';
import { FONT, T } from '../tokens';

type Props = { width: number; startFrame: number; scale?: number };

/** Mocked iOS banner, rendered inside the phone frame. */
export const Notification: React.FC<Props> = ({ width, startFrame, scale = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < startFrame) return null;
  const s = spring({ frame: frame - startFrame, fps, config: { damping: 16, stiffness: 170, mass: 0.9 } });
  const y = -230 + 246 * s;
  const w = (width - 28) / scale;
  return (
    <div
      style={{
        position: 'absolute',
        left: 14,
        top: y,
        width: w,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        boxSizing: 'border-box',
        padding: '18px 22px',
        borderRadius: 30,
        background: 'rgba(242,242,247,0.96)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        fontFamily: FONT.body,
        color: '#111',
      }}
    >
      <Img src={APP_ICON} style={{ width: 84, height: 84, borderRadius: 20, background: T.gold, flex: '0 0 auto' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontWeight: 600, fontSize: 29, lineHeight: 1.2 }}>Your Scorecard Is Ready.</div>
          <div style={{ fontSize: 22, color: '#8A8A8E', marginLeft: 10 }}>now</div>
        </div>
        <div style={{ fontSize: 27, lineHeight: 1.25, color: '#333', marginTop: 2 }}>Tap to see who you FCK'd this week.</div>
      </div>
    </div>
  );
};
