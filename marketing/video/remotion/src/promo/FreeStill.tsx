import React from 'react';
import { AbsoluteFill, Img, Sequence } from 'remotion';
import { FULL, LayoutProvider } from '../LayoutContext';
import { CLARK_BUST, LOGO_H } from '../clips';
import { MoneyRain } from '../components/MoneyRain';
import { Starfield } from '../components/Starfield';
import { useFonts } from '../fonts';
import { FONT, T } from '../tokens';

/**
 * Free-until-Election-Day social stills (Oct 22, 2026): feed 1080×1440 (3:4, the grid's ratio)
 * and story 1080×1920 (key text clear of the top 250 / bottom 340 px). Same system as the App
 * Store header: starfield, Bungee gold with a glow, cyan detail line, Clark, falling money
 * behind the type. Variants for the series: the announce, the last weekend, the last days.
 */
export type FreeVariant = 'free' | 'weekend' | 'lastdays';
export const FEED_W = 1080;
export const FEED_H = 1440;
export const STORY_W = 1080;
export const STORY_H = 1920;
const HEADLINE: Record<FreeVariant, string> = { free: 'FREE UNTIL\nELECTION DAY', weekend: 'LAST WEEKEND\nFREE', lastdays: 'LAST DAYS\nFREE' };
const SUB = 'THROUGH NOV 3';
const VERBS = 'Tap a business. Scan a product.\nTrack the platforms you use.';

export const FreeStill: React.FC<{ variant: FreeVariant; format: 'feed' | 'story' }> = ({ variant, format }) => {
  useFonts();
  const W = format === 'feed' ? FEED_W : STORY_W;
  const H = format === 'feed' ? FEED_H : STORY_H;
  // vertical plan: the story keeps everything between y 250 and y 1580; the feed uses the whole height
  const top0 = format === 'feed' ? 70 : 300;
  const headTop = format === 'feed' ? 240 : 520;
  // Bungee runs about 0.67 em per character here, so the longest line sets the size that keeps two lines inside W - 80
  const headSize = variant === 'lastdays' ? 150 : 124;
  const clarkW = format === 'feed' ? 720 : 800;
  const clarkTop = H - Math.round(clarkW * (format === 'feed' ? 0.86 : 0.92));
  return (
    <LayoutProvider layout={FULL}>
      <AbsoluteFill style={{ width: W, height: H, background: T.void, overflow: 'hidden' }}>
        <Starfield />
        {/* money, frozen mid-fall (a Sequence offset puts the bills across the frame), behind Clark and the type */}
        <Sequence from={-64} durationInFrames={400} name="money">
          <MoneyRain count={format === 'feed' ? 16 : 20} seed={`free-${variant}-${format}`} width={W} height={H} />
        </Sequence>
        <Img src={CLARK_BUST} style={{ position: 'absolute', left: (W - clarkW) / 2 + (format === 'feed' ? 120 : 140), top: clarkTop, width: clarkW, imageRendering: 'pixelated', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.6))' }} />
        <Img src={LOGO_H} style={{ position: 'absolute', left: (W - 560) / 2, top: top0, width: 560, imageRendering: 'pixelated', filter: 'drop-shadow(0 0 24px rgba(95,174,255,0.35))' }} />
        {/* the type as one flowing column, so the detail line and the verbs always sit under the headline whatever it wraps to */}
        <div style={{ position: 'absolute', left: 40, top: headTop, width: W - 80, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34, textAlign: 'center' }}>
          <div style={{ fontFamily: FONT.display, fontSize: headSize, lineHeight: 1.0, letterSpacing: 2, color: T.gold, whiteSpace: 'pre-line', textShadow: '0 0 40px rgba(255,201,60,0.45), 10px 10px 0 rgba(0,0,0,0.8)' }}>
            {HEADLINE[variant]}
          </div>
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 46, letterSpacing: 8, color: T.cyan, textShadow: '0 0 20px rgba(122,242,255,0.6), 4px 4px 0 rgba(0,0,0,0.85)' }}>
            {SUB}
          </div>
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 42, lineHeight: 1.3, letterSpacing: 1, color: T.cream, whiteSpace: 'pre-line', textShadow: '4px 4px 0 rgba(0,0,0,0.85)' }}>
            {VERBS}
          </div>
        </div>
        {/* bottom-left: the ask, clear of Clark */}
        <div style={{ position: 'absolute', left: 60, bottom: format === 'feed' ? 50 : 370, fontFamily: FONT.body, fontWeight: 600, fontSize: 30, letterSpacing: 4, color: T.cyan, textShadow: '3px 3px 0 rgba(0,0,0,0.85)' }}>
          @fckfascists.app
        </div>
      </AbsoluteFill>
    </LayoutProvider>
  );
};
