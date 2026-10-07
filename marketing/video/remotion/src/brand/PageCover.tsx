import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { LOGO_H, MAP_STILL } from '../clips';
import { useFonts } from '../fonts';
import { FONT, T } from '../tokens';

/**
 * Facebook Page cover, 1640×624 (shown 820×312 on desktop, 640×360 on phones — phones
 * crop the sides, so everything that matters sits in the central 68%). Same look as the
 * approved Instagram banner (Oct 5): the app's NYC map blurred past legibility, the
 * horizontal logo, the brand tagline, FCKapp.com. No price (organic surface).
 */
export const COVER_W = 1640;
export const COVER_H = 624;
const SAFE_W = Math.round(COVER_W * 0.68); // mobile-visible width

export const PageCover: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{ width: COVER_W, height: COVER_H, backgroundColor: T.void, overflow: 'hidden' }}>
      {/* map, blurred until no label reads */}
      <Img
        src={MAP_STILL}
        style={{ position: 'absolute', left: -120, top: -700, width: COVER_W + 240, height: 'auto', filter: 'blur(18px) saturate(1.15) brightness(0.72)' }}
      />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(7,11,18,0.35) 0%, rgba(7,11,18,0.15) 45%, rgba(7,11,18,0.75) 100%)' }} />
      {/* lockup, inside the phone-safe band */}
      <div
        style={{
          position: 'absolute',
          left: (COVER_W - SAFE_W) / 2,
          top: 0,
          width: SAFE_W,
          height: COVER_H,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        <Img src={LOGO_H} style={{ width: 900, height: 'auto', filter: 'drop-shadow(0 10px 24px rgba(0,0,0,0.7))' }} />
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: 46,
            letterSpacing: 2,
            color: T.gold,
            textShadow: '0 0 22px rgba(255,201,60,0.35), 4px 4px 0 rgba(0,0,0,0.8)',
            whiteSpace: 'nowrap',
          }}
        >
          THE FASCISTS WON&apos;T <span style={{ color: T.cyan, textShadow: '0 0 22px rgba(122,242,255,0.5), 4px 4px 0 rgba(0,0,0,0.8)' }}>FCK</span> THEMSELVES. 🤘🏽
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 26, letterSpacing: 4, color: T.cream, textShadow: '2px 2px 0 rgba(0,0,0,0.8)', whiteSpace: 'nowrap', textAlign: 'center' }}>
          FINANCIAL CONTRIBUTION KIT · NO ACCOUNTS · NO TRACKING
        </div>
        <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 28, letterSpacing: 3, color: T.cyan, textShadow: '2px 2px 0 rgba(0,0,0,0.8)' }}>FCKapp.com</div>
      </div>
    </AbsoluteFill>
  );
};
