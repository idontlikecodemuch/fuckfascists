import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';

/** One white scanline flash, 3 frames: full flash → collapsing band → afterglow. */
export const CrtBlink: React.FC = () => {
  const f = useCurrentFrame();
  if (f > 2) return null;
  const bandH = [1920, 420, 10][f];
  const opacity = [0.92, 1, 0.55][f];
  return (
    <AbsoluteFill style={{ pointerEvents: 'none', justifyContent: 'center', alignItems: 'center' }}>
      <div
        style={{
          width: '100%',
          height: bandH,
          background: '#FFFFFF',
          opacity,
          backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 2px, transparent 2px, transparent 6px)',
          boxShadow: '0 0 60px rgba(255,255,255,0.9)',
        }}
      />
    </AbsoluteFill>
  );
};
