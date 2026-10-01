import React from 'react';
import { useLayout } from '../LayoutContext';
import { PHONE } from '../layout';

type Props = {
  children?: React.ReactNode;
  translateX?: number;
  opacity?: number;
  scale?: number;
  rect?: { left: number; top: number; width: number; height: number };
};

/** Device frame: 6 px black border, 64 px radius, soft cyan glow. Content is clipped inside. */
export const PhoneFrame: React.FC<Props> = ({ children, translateX = 0, opacity = 1, scale = 1, rect }) => {
  const L = useLayout();
  const r = rect ?? L.phone;
  const radius = Math.round(PHONE.radius * (r.width / PHONE.width));
  return (
    <div
      style={{
        position: 'absolute',
        left: r.left,
        top: r.top,
        width: r.width,
        height: r.height,
        borderRadius: radius,
        border: `${PHONE.border}px solid #000`,
        boxSizing: 'border-box',
        background: '#000',
        boxShadow: '0 0 0 2px rgba(122,242,255,0.35), 0 0 36px rgba(122,242,255,0.22), 0 24px 60px rgba(0,0,0,0.55)',
        overflow: 'hidden',
        transform: `translateX(${translateX}px) scale(${scale})`,
        transformOrigin: 'center',
        opacity,
      }}
    >
      <div style={{ position: 'absolute', inset: 0, borderRadius: radius - PHONE.border, overflow: 'hidden' }}>{children}</div>
    </div>
  );
};

export const coverTop: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 0%' };
export const coverBottom: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 100%' };
