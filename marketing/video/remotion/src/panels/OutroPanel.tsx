import React from 'react';
import { AbsoluteFill, Img, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { useLayout } from '../LayoutContext';
import { LOGO } from '../clips';
import { CashPile } from '../components/CashPile';
import { Starfield } from '../components/Starfield';
import type { Cut, PanelTL } from '../timing';
import { FONT, T } from '../tokens';
import { HORNS_DELAY_S } from '../timing';
import { Boxes, ClarkLayer } from './shared';
import type { VeoMap } from '../vo';

// URL is FCKapp.com in marketing (easier to spell); the in-app share card keeps FCKFASCISTS.COM
// No price on any end card (creator, Oct 6 2026: organic copy carries no price); the store shows it.
const SHORT_COPY = { tagline: 'OUT NOW', sub: 'NO ADS · NO TRACKING\nFCKapp.com · @fckfascists.app' };
const COPY: Record<Cut, { tagline: string; sub: string }> = {
  '60': { tagline: "THE FASCISTS WON'T\nFCK THEMSELVES.", sub: 'OUT NOW · NO ADS · NO TRACKING\nFCKapp.com · @fckfascists.app' },
  '30': { tagline: "THE FASCISTS WON'T\nFCK THEMSELVES.", sub: 'OUT NOW · NO ADS · NO TRACKING\nFCKapp.com · @fckfascists.app' },
  '15': SHORT_COPY,
  map: SHORT_COPY,
  track: SHORT_COPY,
  scan: SHORT_COPY,
  card: SHORT_COPY,
};

/** Brand card on the starfield: lockup + "IT'S YOUR MOVE", Clark under it with the pile; 🤘🏽 lands last. No dialogue box on any layout. */
export const OutroPanel: React.FC<{ p: PanelTL; cut: Cut; veo: VeoMap }> = ({ p, cut, veo }) => {
  const L = useLayout();
  const O = L.outro;
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = (delay: number) => spring({ frame: frame - delay, fps, config: { damping: 13, stiffness: 200, mass: 0.7 } });
  const logo = pop(2);
  const tag = pop(9);
  const sub = pop(16);
  const copy = COPY[cut];
  const pile = O.pile ?? L.pile;
  const move = pop(26);
  const hornsAt = 26 + Math.round(HORNS_DELAY_S * fps);
  const hornsOn = frame >= hornsAt;
  return (
    <AbsoluteFill style={{ background: T.void }}>
      <Starfield />
      <Img
        src={LOGO}
        style={{
          position: 'absolute',
          left: O.logo.left,
          top: O.logo.top,
          width: O.logo.width,
          height: O.logo.height,
          imageRendering: 'pixelated',
          transform: `scale(${0.6 + 0.4 * logo})`,
          opacity: Math.min(1, logo * 1.5),
          filter: 'drop-shadow(0 0 30px rgba(95,174,255,0.35))',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: O.tagline.top,
          left: O.tagline.left,
          width: O.tagline.width,
          textAlign: 'center',
          fontFamily: FONT.display,
          fontSize: O.tagline.size,
          lineHeight: 1.2,
          color: T.gold,
          whiteSpace: 'pre-line',
          textShadow: `0 0 18px rgba(255,201,60,0.8), 0 0 46px rgba(255,201,60,0.45), 4px 4px 0 rgba(0,0,0,0.7)`,
          transform: `translateY(${(1 - tag) * 30}px)`,
          opacity: Math.min(1, tag * 1.5),
        }}
      >
        {copy.tagline}
      </div>
      <div
        style={{
          position: 'absolute',
          top: O.sub.top,
          left: O.sub.left,
          width: O.sub.width,
          textAlign: 'center',
          fontFamily: FONT.body,
          fontWeight: 500,
          fontSize: O.sub.size,
          letterSpacing: 5,
          lineHeight: 1.6,
          color: T.cyan,
          whiteSpace: 'pre-line',
          textShadow: '0 0 12px rgba(122,242,255,0.5)',
          opacity: Math.min(1, sub * 1.5),
        }}
      >
        {copy.sub}
      </div>
      {O.move ? (
        <div
          style={{
            position: 'absolute',
            top: O.move.top,
            left: O.move.left,
            width: O.move.width,
            textAlign: 'center',
            fontFamily: FONT.display,
            fontSize: O.move.size,
            letterSpacing: 3,
            color: '#FFFFFF',
            textShadow: '0 0 16px rgba(255,255,255,0.35), 4px 4px 0 rgba(0,0,0,0.8)',
            transform: `translateY(${(1 - move) * 24}px)`,
            opacity: Math.min(1, move * 1.5),
          }}
        >
          IT'S YOUR MOVE <span style={{ opacity: hornsOn ? 1 : 0 }}>🤘🏽</span>
        </div>
      ) : null}
      <AbsoluteFill style={{ transform: `translateY(${O.lift}px)` }}>
        <ClarkLayer boxes={p.boxes} veo={veo} placement={O.clark} clipBottom={O.box ? undefined : L.h} />
        <CashPile x={pile.left} y={pile.top} width={pile.width} height={pile.height} startFrame={-60} seed={`pile-${p.key}`} />
        {O.box ? <Boxes boxes={p.boxes} rect={O.box} /> : null}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
