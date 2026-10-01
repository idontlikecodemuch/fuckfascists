import React from 'react';
import { Img, interpolate, useCurrentFrame } from 'remotion';
import { LOGO_H } from '../clips';
import { useLayout } from '../LayoutContext';
import { FONT } from '../tokens';

/**
 * Persistent branding for the wide layout: the horizontal logo bottom-right with
 * the URL centred under it in white. Fades in over the first few frames.
 */
export const Brand: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: 'clamp' });
  const width = 340;
  return (
    <div
      style={{
        position: 'absolute',
        left: L.phone.left + L.phone.width - width,
        top: L.phone.top + L.phone.height + 16,
        width,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        opacity: opacity * fade,
        pointerEvents: 'none',
      }}
    >
      <Img
        src={LOGO_H}
        style={{ width, height: 'auto', imageRendering: 'pixelated', display: 'block', filter: 'drop-shadow(0 3px 0 rgba(0,0,0,0.7)) drop-shadow(0 0 18px rgba(95,174,255,0.35))' }}
      />
      <div
        style={{
          fontFamily: FONT.body,
          fontWeight: 600,
          fontSize: 22,
          letterSpacing: 3,
          color: '#FFFFFF',
          textAlign: 'center',
          textShadow: '0 0 10px rgba(255,255,255,0.35), 2px 2px 0 rgba(0,0,0,0.8)',
        }}
      >
        FCKapp.com
      </div>
    </div>
  );
};
