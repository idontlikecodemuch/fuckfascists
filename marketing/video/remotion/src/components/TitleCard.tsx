import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import tabIcons from '../data/tabIcons.json';
import { useLayout } from '../LayoutContext';
import type { Feature } from '../timing';
import { FONT, T } from '../tokens';
import { Starfield } from './Starfield';

type IconMap = Record<string, { name: string; code: number }>;
const ICONS = tabIcons as IconMap;

/**
 * Section title card: the app's own tab icon (Ionicons, as the tab bar draws it,
 * in the active-tab gold) over the feature name in the game font. Full-screen,
 * replaces the folder wipe between features.
 */
export const TitleCard: React.FC<{ feature: Feature }> = ({ feature }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wide = L.mode === 'wide';
  const icon = ICONS[feature];
  const glyph = icon ? String.fromCodePoint(icon.code) : '';
  const iconSize = wide ? 250 : 320;
  // long words (SCORECARD) must still fit the 1080 canvas
  const wordSize = wide ? (feature.length > 6 ? 150 : 170) : feature.length > 6 ? 116 : 190;

  const stamp = spring({ frame, fps, config: { damping: 14, stiffness: 240, mass: 0.7 } });
  const wordIn = spring({ frame: frame - 3, fps, config: { damping: 16, stiffness: 220, mass: 0.8 } });
  const ruleW = interpolate(frame, [4, 14], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const flicker = frame % 14 === 6 ? 0.92 : 1; // CRT pulse, like the arena

  return (
    <AbsoluteFill style={{ background: T.void }}>
      <Starfield />
      <AbsoluteFill style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: wide ? 10 : 18 }}>
        <div
          style={{
            fontFamily: "'Ionicons'",
            fontSize: iconSize,
            lineHeight: 1,
            color: T.gold,
            transform: `scale(${1.5 - 0.5 * stamp})`,
            opacity: Math.min(1, stamp * 1.6) * flicker,
            textShadow: '0 0 24px rgba(255,201,60,0.7), 0 0 70px rgba(255,201,60,0.35), 6px 6px 0 rgba(0,0,0,0.75)',
          }}
        >
          {glyph}
        </div>
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: wordSize,
            lineHeight: 1,
            letterSpacing: 8,
            color: T.gold,
            transform: `translateY(${(1 - wordIn) * 40}px)`,
            opacity: Math.min(1, wordIn * 1.6) * flicker,
            textShadow: '0 0 20px rgba(255,201,60,0.75), 0 0 60px rgba(255,201,60,0.35), 6px 6px 0 rgba(0,0,0,0.8)',
          }}
        >
          {feature}
        </div>
        <div
          style={{
            width: (wide ? 620 : 700) * ruleW,
            height: 6,
            marginTop: wide ? 18 : 26,
            background: `linear-gradient(to right, transparent, ${T.cyan}, transparent)`,
            boxShadow: `0 0 18px ${T.cyan}`,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
