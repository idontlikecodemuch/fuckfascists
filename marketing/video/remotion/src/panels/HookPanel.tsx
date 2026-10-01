import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { useLayout } from '../LayoutContext';
import { HOOK_CLIP, clipSrc } from '../clips';
import { FullBleed } from '../components/FullBleed';
import { MoneyRain } from '../components/MoneyRain';
import type { HookStyle } from '../timing';
import { FONT, T } from '../tokens';
import { useShake } from './shared';

const SLAM_LAND = 16; // frame the card hits the screen (~0.5 s)

/**
 * The real card, full-bleed, rain still falling. Caption only on the 60/30.
 * 'slam': the card drops from the viewer onto the screen, lands with a flash and
 * a shake, the rain starts on impact, then the caption pops.
 */
export const HookPanel: React.FC<{ caption: boolean; variant?: HookStyle }> = ({ caption, variant = 'rain' }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slam = variant === 'slam';
  const captionAt = slam ? SLAM_LAND + 14 : 2;
  const pop = spring({ frame: frame - captionAt, fps, config: { damping: 11, stiffness: 220, mass: 0.7 } });
  const shake = useShake(slam ? SLAM_LAND : null, 12, 14);

  // slam: scale 3.2 → 1 with a quick ease-in (falling onto the screen), then a squash
  const drop = interpolate(frame, [2, SLAM_LAND], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad) });
  const squash = frame >= SLAM_LAND ? 1 - 0.06 * Math.sin(Math.min(1, (frame - SLAM_LAND) / 9) * Math.PI) : 1;
  // opens on the dark backdrop; the card fades in as it falls (no bright first frame)
  const cardScale = slam ? (frame < SLAM_LAND ? 3.6 - 2.6 * drop : squash) : 1;
  const cardOpacity = slam ? interpolate(frame, [1, 9], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;
  const backdrop = slam ? interpolate(frame, [0, SLAM_LAND], [0.2, 1], { extrapolateRight: 'clamp' }) : 1;
  // impact flash: a two-frame blink, not a white screen
  const flash = slam && frame >= SLAM_LAND ? interpolate(frame, [SLAM_LAND, SLAM_LAND + 2], [0.4, 0], { extrapolateRight: 'clamp' }) : 0;
  // both only exist after the landing (clamping to the start value put a 40% white layer over the whole drop)
  const ring = slam && frame >= SLAM_LAND ? interpolate(frame, [SLAM_LAND, SLAM_LAND + 16], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }) : 1;

  return (
    <AbsoluteFill style={{ background: T.void }}>
      <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}>
        <FullBleed
          src={clipSrc(HOOK_CLIP)}
          centerX={L.w / 2}
          fullHeight
          transform={slam ? `scale(${cardScale})` : undefined}
          opacity={cardOpacity}
          backdropOpacity={backdrop}
        />
        {slam && ring < 1 ? (
          <div
            style={{
              position: 'absolute',
              left: L.w / 2,
              top: L.h / 2,
              width: 300,
              height: 300,
              marginLeft: -150,
              marginTop: -150,
              borderRadius: '50%',
              border: `8px solid ${T.cyan}`,
              boxShadow: `0 0 40px ${T.cyan}`,
              transform: `scale(${0.6 + ring * 5})`,
              opacity: (1 - ring) * 0.8,
            }}
          />
        ) : null}
        <MoneyRain count={L.mode === 'wide' ? 40 : 28} seed="hook" startFrame={slam ? SLAM_LAND + 2 : 0} />
        {caption ? (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: L.mode === 'wide' ? 1400 : 1000,
              textAlign: 'center',
              whiteSpace: 'pre-line',
              fontFamily: FONT.display,
              fontSize: L.hookCaptionSize,
              lineHeight: 1.05,
              letterSpacing: 2,
              color: T.cyan,
              textShadow: `0 0 18px ${T.cyan}, 0 0 50px rgba(122,242,255,0.7), 0 0 120px rgba(7,11,18,0.9), 5px 5px 0 rgba(0,0,0,0.8)`,
              transform: `translate(-50%, -50%) scale(${0.7 + 0.3 * pop})`,
              opacity: Math.min(1, pop * 1.5),
            }}
          >
            {'WHAT THE FCK\nIS THAT?'}
          </div>
        ) : null}
      </AbsoluteFill>
      {flash > 0 ? <AbsoluteFill style={{ background: '#fff', opacity: flash, pointerEvents: 'none' }} /> : null}
    </AbsoluteFill>
  );
};
