import React from 'react';
import { AbsoluteFill, Img, Sequence, random, staticFile } from 'remotion';
import { CLARK_FULL } from '../clips';
import { MoneyRain } from '../components/MoneyRain';
import { Starfield } from '../components/Starfield';
import { useFonts } from '../fonts';
import { FULL, LayoutProvider } from '../LayoutContext';
import { FONT, T } from '../tokens';
import { frameSrc } from './tiles';

/**
 * App Store creative asset (iOS 27 header + search results), Oct 15 2026, round 2.
 * Creator: the name "FCK, Financial Contribution Kit", far more aesthetic (stars, blurred
 * map, falling money), no specific company on screen, and it will become a video — so each
 * still is one frame of a loop. Universal 16:9 5244×2950; App Store Connect centre-crops it
 * to the 21:9 header and the 3:2 search card, so the focal content sits inside SAFE.
 *   space   — the name in deep space, money drifting (video: star parallax, slow drift)
 *   screens — three generic screens fanned beside the name (video: they scroll and drift)
 *   clark   — Clark with the name, money falling (video: stars drift, he blinks/idles)
 *   map     — the map blurred into a backdrop, the name over it (video: slow pan, money)
 */
export const HEADER_W = 5244;
export const HEADER_H = 2950;
export const SAFE = { left: 410, top: 351, right: 4835, bottom: 2599 };
export type HeaderVariant = 'space' | 'screens' | 'clark' | 'map';

const BEZEL = 30;
const RADIUS = 200;
const MAP = staticFile('media/appstore/frames/map_pins.png'); // 1080×1926, no record up
const SCAN_TAB = staticFile('media/appstore/frames/scan_tab.png'); // 1206×2478, R11 at 0.5 s: the Scan tab, no record, status bar cropped
const MONEY_SCALE = 2.6; // the 24 px bills are specks at 5244 wide

/** denser pixel stars on top of the shared starfield ("way more aesthetic — def more stars") */
const DeepSpace: React.FC<{ count?: number; seed?: string }> = ({ count = 900, seed = 'deep' }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    {Array.from({ length: count }, (_, i) => {
      const r = (k: string) => random(`${seed}-${i}-${k}`);
      const s = r('s') < 0.82 ? 3 : r('s') < 0.96 ? 5 : 8;
      const a = 0.25 + r('a') * 0.75;
      const warm = r('c') < 0.12;
      return <div key={i} style={{ position: 'absolute', left: r('x') * HEADER_W, top: r('y') * HEADER_H, width: s, height: s, background: warm ? T.gold : r('c') < 0.3 ? T.cyan : '#FFFFFF', opacity: a, boxShadow: s >= 5 ? `0 0 ${s * 2}px rgba(255,255,255,${a * 0.6})` : undefined }} />;
    })}
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(47,99,255,0.16), transparent 70%), radial-gradient(ellipse 40% 50% at 80% 20%, rgba(122,242,255,0.10), transparent 70%), radial-gradient(ellipse 50% 40% at 15% 85%, rgba(255,201,60,0.08), transparent 70%)' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 55%, rgba(7,11,18,0.65) 100%)' }} />
  </AbsoluteFill>
);

/** the blurred map as a backdrop */
const BlurredMap: React.FC<{ opacity?: number; blur?: number }> = ({ opacity = 0.7, blur = 30 }) => (
  <AbsoluteFill style={{ overflow: 'hidden' }}>
    <Img src={MAP} style={{ position: 'absolute', left: -200, top: -1400, width: HEADER_W + 400, height: ((HEADER_W + 400) * 1926) / 1080, filter: `blur(${blur}px) saturate(1.2)`, opacity }} />
    <AbsoluteFill style={{ background: 'linear-gradient(to bottom, rgba(7,11,18,0.35), rgba(7,11,18,0.75))' }} />
  </AbsoluteFill>
);

/** falling money, frozen mid-fall for the still (the video just lets it run) */
const Money: React.FC<{ count?: number; seed?: string }> = ({ count = 18, seed = 'hdr' }) => (
  <LayoutProvider layout={FULL}>
    <div style={{ position: 'absolute', left: 0, top: 0, width: HEADER_W / MONEY_SCALE, height: HEADER_H / MONEY_SCALE, transform: `scale(${MONEY_SCALE})`, transformOrigin: '0 0' }}>
      <Sequence from={-70} durationInFrames={400} name="money">
        <MoneyRain count={count} seed={seed} width={HEADER_W / MONEY_SCALE} height={HEADER_H / MONEY_SCALE} />
      </Sequence>
    </div>
  </LayoutProvider>
);

/** FCK, Financial Contribution Kit — the store name as the lockup, optional line under it */
const Name: React.FC<{ left: number; top: number; width: number; align?: 'left' | 'center'; scale?: number; tagline?: boolean }> = ({ left, top, width, align = 'center', scale = 1, tagline = true }) => (
  <div style={{ position: 'absolute', left, top, width, display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', textAlign: align, gap: 30 * scale }}>
    <div style={{ fontFamily: FONT.display, fontSize: 520 * scale, lineHeight: 0.95, color: T.gold, letterSpacing: 6, textShadow: '0 0 60px rgba(255,201,60,0.45), 0 0 160px rgba(255,201,60,0.2), 14px 14px 0 rgba(0,0,0,0.8)' }}>FCK,</div>
    <div style={{ fontFamily: FONT.display, fontSize: 132 * scale, lineHeight: 1.05, color: T.cream, letterSpacing: 4, textShadow: '0 0 30px rgba(232,224,208,0.25), 7px 7px 0 rgba(0,0,0,0.8)' }}>FINANCIAL CONTRIBUTION KIT</div>
    {tagline ? <div style={{ marginTop: 26 * scale, fontFamily: FONT.body, fontWeight: 600, fontSize: 66 * scale, letterSpacing: 8, color: T.cyan, textShadow: '0 0 18px rgba(122,242,255,0.5), 3px 3px 0 rgba(0,0,0,0.8)' }}>FINANCIAL CONTRIBUTIONS, ON FILE.</div> : null}
  </div>
);

const Phone: React.FC<{ src: string; aspect: number; left: number; top: number; width: number; rotate?: number }> = ({ src, aspect, left, top, width, rotate = 0 }) => (
  <div style={{ position: 'absolute', left: left - BEZEL, top: top - BEZEL, width: width + BEZEL * 2, height: HEADER_H, borderRadius: RADIUS, background: '#0B0D12', transform: `rotate(${rotate}deg)`, transformOrigin: '50% 100%', boxShadow: '0 0 0 4px #2A2D30, 0 0 0 6px rgba(0,0,0,0.6), 0 -10px 120px rgba(0,0,0,0.75), 0 0 160px rgba(122,242,255,0.10)' }}>
    <div style={{ position: 'absolute', left: BEZEL, top: BEZEL, width, height: HEADER_H, borderRadius: RADIUS - BEZEL, overflow: 'hidden', background: T.void }}>
      <Img src={src} style={{ display: 'block', width, height: width / aspect }} />
    </div>
  </div>
);

export const StoreHeader: React.FC<{ variant: HeaderVariant }> = ({ variant }) => {
  useFonts();
  return (
    <AbsoluteFill style={{ width: HEADER_W, height: HEADER_H, backgroundColor: T.void, overflow: 'hidden' }}>
      <Starfield />
      {variant === 'map' ? <BlurredMap /> : null}
      {variant === 'clark' ? <BlurredMap opacity={0.26} blur={44} /> : null}
      <DeepSpace count={variant === 'space' ? 1400 : 800} />
      {variant === 'space' ? (
        <>
          <Money count={14} seed="space" />
          <Name left={SAFE.left} top={1060} width={SAFE.right - SAFE.left} />
        </>
      ) : null}
      {variant === 'map' ? (
        <>
          <Money count={12} seed="map" />
          <Name left={SAFE.left} top={1060} width={SAFE.right - SAFE.left} />
        </>
      ) : null}
      {variant === 'screens' ? (
        <>
          <Name left={520} top={1120} width={2000} align="left" scale={0.6} />
          <Phone src={MAP} aspect={1080 / 1926} left={2700} top={560} width={780} rotate={-7} />
          <Phone src={SCAN_TAB} aspect={1206 / 2478} left={3440} top={760} width={780} rotate={0} />
          <Phone src={frameSrc('memo')} aspect={1206 / 2622} left={4180} top={560} width={780} rotate={7} />
          <Money count={8} seed="screens" />
        </>
      ) : null}
      {variant === 'clark' ? (
        <>
          <Money count={12} seed="clark" />
          <Name left={520} top={1000} width={2600} align="left" scale={0.9} />
          <Img src={CLARK_FULL} style={{ position: 'absolute', left: 3250, top: 480, width: 1500, filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.6))' }} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};
