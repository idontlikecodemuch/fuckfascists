import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Starfield } from '../components/Starfield';
import { useFonts } from '../fonts';
import { FONT, T } from '../tokens';

/**
 * Facebook Page cover, 1640×624 (shown 820×312 on desktop, 640×360 on phones — phones
 * crop the sides, so everything that matters sits in the central 68%). Creator, Oct 7:
 * the starfield, no logo (the avatar is the mark), and the copy in the upper two thirds so
 * the profile picture, which overlaps the cover's bottom-left, never covers it. No price.
 */
export const COVER_W = 1640;
export const COVER_H = 624;
const SAFE_W = Math.round(COVER_W * 0.68); // mobile-visible width

export const PageCover: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill style={{ width: COVER_W, height: COVER_H, backgroundColor: T.void, overflow: 'hidden' }}>
      <Starfield />
      {/* lockup, inside the phone-safe band */}
      <div
        style={{
          position: 'absolute',
          left: (COVER_W - SAFE_W) / 2,
          top: 0,
          width: SAFE_W,
          height: Math.round(COVER_H * 0.66), // clear of the avatar overlap along the bottom
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 18,
        }}
      >
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: 62,
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
