import React from 'react';
import { AbsoluteFill, Img, Sequence } from 'remotion';
import { FULL, LayoutProvider } from '../LayoutContext';
import { CLARK_BUST, LOGO_H } from '../clips';
import { MoneyRain } from '../components/MoneyRain';
import { Starfield } from '../components/Starfield';
import { useFonts } from '../fonts';
import { FONT, T } from '../tokens';

/** 1200×630 link-preview image for fckfascists.com/free (Open Graph / Twitter card). */
export const SHARE_W = 1200;
export const SHARE_H = 630;

export const FreeShare: React.FC = () => {
  useFonts();
  return (
    <LayoutProvider layout={FULL}>
      <AbsoluteFill style={{ width: SHARE_W, height: SHARE_H, background: T.void, overflow: 'hidden' }}>
        <Starfield />
        <Sequence from={-64} durationInFrames={400} name="money">
          <MoneyRain count={10} seed="share-free" width={SHARE_W} height={SHARE_H} />
        </Sequence>
        <Img src={CLARK_BUST} style={{ position: 'absolute', left: 760, top: 150, width: 520, imageRendering: 'pixelated', filter: 'drop-shadow(0 16px 32px rgba(0,0,0,0.6))' }} />
        <Img src={LOGO_H} style={{ position: 'absolute', left: 70, top: 60, width: 380, imageRendering: 'pixelated', filter: 'drop-shadow(0 0 18px rgba(95,174,255,0.35))' }} />
        <div style={{ position: 'absolute', left: 70, top: 200, width: 700, fontFamily: FONT.display, fontSize: 92, lineHeight: 1.0, letterSpacing: 2, color: T.gold, whiteSpace: 'pre-line', textShadow: '0 0 30px rgba(255,201,60,0.45), 7px 7px 0 rgba(0,0,0,0.8)' }}>
          {'FREE UNTIL\nELECTION DAY.'}
        </div>
        <div style={{ position: 'absolute', left: 72, top: 410, fontFamily: FONT.body, fontWeight: 600, fontSize: 32, letterSpacing: 6, color: T.cyan, textShadow: '0 0 16px rgba(122,242,255,0.6), 3px 3px 0 rgba(0,0,0,0.85)' }}>
          THROUGH NOV 3
        </div>
        <div style={{ position: 'absolute', left: 72, top: 470, width: 660, fontFamily: FONT.body, fontWeight: 600, fontSize: 30, lineHeight: 1.35, color: T.cream, whiteSpace: 'pre-line', textShadow: '3px 3px 0 rgba(0,0,0,0.85)' }}>
          {'Tap a business. Scan a product.\nTrack the platforms you use.'}
        </div>
        <div style={{ position: 'absolute', left: 72, bottom: 34, fontFamily: FONT.body, fontWeight: 600, fontSize: 24, letterSpacing: 4, color: T.cyan, textShadow: '2px 2px 0 rgba(0,0,0,0.85)' }}>
          FCKfascists.com/free
        </div>
      </AbsoluteFill>
    </LayoutProvider>
  );
};
