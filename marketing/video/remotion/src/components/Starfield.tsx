import React from 'react';
import { AbsoluteFill, random, useCurrentFrame } from 'remotion';
import { STARFIELD } from '../clips';
import { T } from '../tokens';

const SPARKLES = 46;

/**
 * Decorative pixel sky: the app's tiled starfield in two parallax layers, a faint
 * blue/gold nebula, twinkling pixel sparks, CRT scanlines and a vignette.
 */
export const Starfield: React.FC<{ opacity?: number; sparkles?: boolean }> = ({ opacity = 1, sparkles = true }) => {
  const frame = useCurrentFrame();
  const y1 = Math.round(frame * 0.14) % 1600;
  const y2 = Math.round(frame * 0.05) % 2400;
  return (
    <AbsoluteFill style={{ backgroundColor: T.void, opacity }}>
      {/* far layer: bigger, dimmer, slower */}
      <AbsoluteFill
        style={{
          backgroundImage: `url(${STARFIELD})`,
          backgroundSize: '1200px 2400px',
          backgroundRepeat: 'repeat',
          backgroundPosition: `300px ${y2}px`,
          imageRendering: 'pixelated',
          opacity: 0.45,
        }}
      />
      {/* near layer */}
      <AbsoluteFill
        style={{
          backgroundImage: `url(${STARFIELD})`,
          backgroundSize: '800px 1600px',
          backgroundRepeat: 'repeat',
          backgroundPosition: `0px ${y1}px`,
          imageRendering: 'pixelated',
        }}
      />
      {/* nebula */}
      <AbsoluteFill
        style={{
          background: [
            'radial-gradient(ellipse 70% 55% at 62% 30%, rgba(47,99,255,0.22), transparent 70%)',
            'radial-gradient(ellipse 45% 40% at 18% 78%, rgba(122,242,255,0.10), transparent 70%)',
            'radial-gradient(ellipse 40% 30% at 85% 85%, rgba(255,201,60,0.07), transparent 70%)',
          ].join(', '),
        }}
      />
      {sparkles
        ? Array.from({ length: SPARKLES }, (_, i) => {
            const x = random(`sx${i}`) * 100;
            const y = random(`sy${i}`) * 100;
            const size = 2 + Math.floor(random(`ss${i}`) * 3) * 2; // 2 | 4 | 6 px
            const period = 40 + Math.floor(random(`sp${i}`) * 70);
            const phase = random(`sf${i}`) * period;
            const t = ((frame + phase) % period) / period;
            const tw = t < 0.5 ? t * 2 : (1 - t) * 2; // triangle 0..1..0
            const bright = tw > 0.55 ? 1 : tw > 0.3 ? 0.55 : 0.18; // stepped, not smooth
            const gold = random(`sg${i}`) > 0.8;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  width: size,
                  height: size,
                  background: gold ? T.gold : T.cyan,
                  opacity: bright * 0.9,
                  boxShadow: bright > 0.9 ? `0 0 ${size * 2}px ${gold ? T.gold : T.cyan}` : 'none',
                }}
              />
            );
          })
        : null}
      {/* scanlines + vignette */}
      <AbsoluteFill
        style={{
          background: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.10) 0 1px, transparent 1px 4px)',
          pointerEvents: 'none',
        }}
      />
      <AbsoluteFill style={{ boxShadow: 'inset 0 0 220px rgba(0,0,0,0.6)', pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};
