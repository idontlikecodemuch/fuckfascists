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
export type HeaderVariant = 'space' | 'screens' | 'clark' | 'map' | 'mix-a' | 'mix-b' | 'mix-c' | 'mix-d' | 'mix-b2' | 'mix-c2';
/**
 * Round 5 copy options (creator: "a little more copy, secondary a little larger"). line2 is the
 * secondary (uppercase, tracked), line3 the new third line (sentence case). Apple: no price, no
 * URL, a short phrase; brand: no party words, "Random drop between Friday and Saturday." verbatim.
 */
export const COPY = {
  c1: { line2: 'SEE WHERE THE MONEY GOES.', line3: 'Tap a business. Scan a barcode. Track the platforms you skip.' },
  c2: { line2: 'FINANCIAL CONTRIBUTIONS, ON FILE.', line3: 'Every dollar, straight from the FEC. No accounts. No tracking.' },
  c3: { line2: 'EVERY AVOID COUNTS.', line3: 'Tap, scan, track. Random drop between Friday and Saturday.' },
  c4: { line2: 'NO ACCOUNTS. NO TRACKING.', line3: 'Public records on your phone. Nothing leaves it.' },
} as const;
export type CopyId = keyof typeof COPY;

const BEZEL = 30;
const RADIUS = 200;
const MAP = staticFile('media/appstore/frames/map_pins.png'); // 1080×1926, no record up
const SCAN_TAB = staticFile('media/appstore/frames/scan_tab.png'); // 1206×2478, R11 at 0.5 s: the Scan tab, no record, status bar cropped
const SCAN_UPC = staticFile('media/appstore/frames/scan_upc.png'); // 1206×2478, R11 at 5.9 s: a barcode filling the scanner guide (round 3: "actually use a scanning UPC screenshot")
const TRACK = frameSrc('track'); // the Track tab (arena + platform list)
const SCAN_COKE = staticFile('media/appstore/frames/scan_coke.png'); // 1206×2478, R6 at 17.1 s: the Coke bottle in the scanner guide (creator's pick, round 4)
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

/**
 * Round 3 lockup: "more weight to Financial Contribution Kit so FCK stands out a little less".
 * FCK is the small line; the full name is the display line, on two or three rows.
 */
const Name2: React.FC<{ left: number; top: number; width: number; align?: 'left' | 'center'; fck?: number; name?: number; rows?: 2 | 3; fckColor?: string; nameColor?: string; tagline?: boolean; plate?: boolean; copy?: CopyId; line2Size?: number; line3Size?: number }> = ({ left, top, width, align = 'left', fck = 260, name = 200, rows = 2, fckColor = T.cyan, nameColor = T.gold, tagline = true, plate = false, copy, line2Size = 84, line3Size = 60 }) => (
  <div style={{ position: 'absolute', left, top, width, display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', textAlign: align, gap: 24 }}>
    {plate ? <div style={{ position: 'absolute', inset: -140, background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(7,11,18,0.85), transparent 72%)', pointerEvents: 'none' }} /> : null}
    <div style={{ position: 'relative', fontFamily: FONT.display, fontSize: fck, lineHeight: 1, color: fckColor, letterSpacing: 8, textShadow: `0 0 30px ${fckColor === T.cyan ? 'rgba(122,242,255,0.5)' : 'rgba(255,201,60,0.4)'}, 8px 8px 0 rgba(0,0,0,0.8)` }}>FCK,</div>
    <div style={{ position: 'relative', fontFamily: FONT.display, fontSize: name, lineHeight: 1.02, color: nameColor, letterSpacing: 4, whiteSpace: 'pre-line', textShadow: `0 0 50px ${nameColor === T.gold ? 'rgba(255,201,60,0.45)' : 'rgba(232,224,208,0.3)'}, 12px 12px 0 rgba(0,0,0,0.8)` }}>
      {rows === 3 ? 'FINANCIAL\nCONTRIBUTION\nKIT' : 'FINANCIAL\nCONTRIBUTION KIT'}
    </div>
    {copy ? (
      <>
        <div style={{ position: 'relative', marginTop: 26, fontFamily: FONT.body, fontWeight: 600, fontSize: line2Size, lineHeight: 1.2, letterSpacing: 7, color: T.cream, textShadow: '0 0 20px rgba(232,224,208,0.25), 4px 4px 0 rgba(0,0,0,0.8)' }}>{COPY[copy].line2}</div>
        <div style={{ position: 'relative', marginTop: 6, fontFamily: FONT.body, fontWeight: 500, fontSize: line3Size, lineHeight: 1.35, letterSpacing: 1, color: T.text, textShadow: '3px 3px 0 rgba(0,0,0,0.8)' }}>{COPY[copy].line3}</div>
      </>
    ) : tagline ? (
      <div style={{ position: 'relative', marginTop: 20, fontFamily: FONT.body, fontWeight: 600, fontSize: 62, letterSpacing: 8, color: T.cream, textShadow: '3px 3px 0 rgba(0,0,0,0.8)' }}>FINANCIAL CONTRIBUTIONS, ON FILE.</div>
    ) : null}
  </div>
);

const Clark: React.FC<{ left: number; top: number; width: number }> = ({ left, top, width }) => (
  <Img src={CLARK_FULL} style={{ position: 'absolute', left, top, width, filter: 'drop-shadow(0 30px 60px rgba(0,0,0,0.6))' }} />
);

/**
 * `cut` = fraction of the screenshot shown from the top (the Debug build's tab bar with its DEV
 * tab sits in the bottom ~13 %). Round 4: the body is only as tall as the screen plus the bezel,
 * so a rotated phone no longer swings a full-height black slab out below the crop (the "weird
 * drop shadow" on mix-c), and the shadow is a tight contact shadow.
 */
const Phone: React.FC<{ src: string; aspect: number; left: number; top: number; width: number; rotate?: number; cut?: number }> = ({ src, aspect, left, top, width, rotate = 0, cut = 1 }) => {
  const screenH = (width / aspect) * cut;
  return (
    <div style={{ position: 'absolute', left: left - BEZEL, top: top - BEZEL, width: width + BEZEL * 2, height: screenH + BEZEL * 2, borderRadius: RADIUS, background: '#0B0D12', transform: `rotate(${rotate}deg)`, transformOrigin: '50% 100%', boxShadow: '0 0 0 4px #2A2D30, 0 0 0 6px rgba(0,0,0,0.6), 0 30px 70px rgba(0,0,0,0.55)' }}>
      <div style={{ position: 'absolute', left: BEZEL, top: BEZEL, width, height: screenH, borderRadius: RADIUS - BEZEL, overflow: 'hidden', background: T.void }}>
        <Img src={src} style={{ display: 'block', width, height: width / aspect }} />
      </div>
    </div>
  );
};

export const StoreHeader: React.FC<{ variant: HeaderVariant; copy?: CopyId }> = ({ variant, copy }) => {
  useFonts();
  return (
    <AbsoluteFill style={{ width: HEADER_W, height: HEADER_H, backgroundColor: T.void, overflow: 'hidden' }}>
      <Starfield />
      {variant === 'map' ? <BlurredMap /> : null}
      {variant === 'clark' || variant === 'mix-a' ? <BlurredMap opacity={0.26} blur={44} /> : null}
      {variant === 'mix-b' || variant === 'mix-d' || variant === 'mix-b2' ? <BlurredMap opacity={0.45} blur={36} /> : null}
      {variant === 'mix-c' || variant === 'mix-c2' ? <BlurredMap opacity={0.7} blur={30} /> : null}
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
          <Phone src={SCAN_TAB} aspect={1206 / 2478} cut={0.86} left={3440} top={760} width={780} rotate={0} />
          <Phone src={frameSrc('memo')} aspect={1206 / 2622} left={4180} top={560} width={780} rotate={7} />
          <Money count={8} seed="screens" />
        </>
      ) : null}
      {variant === 'mix-a' ? (
        // A — Clark at the desk: name left, Clark centre-right in front of the map screen, the UPC scan and Track beside him
        <>
          <Phone src={MAP} aspect={1080 / 1926} left={2250} top={520} width={720} rotate={-8} />
          <Clark left={2450} top={700} width={1500} />
          <Phone src={SCAN_UPC} aspect={1206 / 2478} cut={0.86} left={3500} top={600} width={760} rotate={-5} />
          <Phone src={TRACK} aspect={1206 / 2622} cut={0.87} left={4150} top={760} width={760} rotate={6} />
          <Money count={10} seed="mix-a" />
          <Name2 left={520} top={1020} width={1900} fck={260} name={200} />
        </>
      ) : null}
      {variant === 'mix-b' ? (
        // B — name over the fan: the name up top, three screens fanned along the bottom, Clark looking in from the right
        <>
          <Phone src={MAP} aspect={1080 / 1926} left={1150} top={1500} width={760} rotate={-10} />
          <Phone src={SCAN_UPC} aspect={1206 / 2478} cut={0.86} left={2240} top={1380} width={760} rotate={0} />
          <Phone src={TRACK} aspect={1206 / 2622} cut={0.87} left={3330} top={1500} width={760} rotate={10} />
          <Clark left={3950} top={900} width={1250} />
          <Money count={10} seed="mix-b" />
          <Name2 left={SAFE.left} top={420} width={SAFE.right - SAFE.left} align="center" fck={240} name={200} />
        </>
      ) : null}
      {variant === 'mix-b2' ? (
        // B2 — Clark clear of the screens: Clark at the far left, the name centred over the fan, map / Coke scan / Track fanned along the bottom
        <>
          <Clark left={260} top={1060} width={1250} />
          <Phone src={MAP} aspect={1080 / 1926} left={1800} top={1520} width={760} rotate={-10} />
          <Phone src={SCAN_COKE} aspect={1206 / 2478} cut={0.86} left={2860} top={1400} width={760} rotate={0} />
          <Phone src={TRACK} aspect={1206 / 2622} cut={0.87} left={3920} top={1520} width={760} rotate={10} />
          <Money count={10} seed="mix-b2" />
          <Name2 left={1640} top={380} width={3195} align="center" fck={240} name={200} copy={copy} />
        </>
      ) : null}
      {variant === 'mix-c2' ? (
        // C2 — Clark presents, no slab: Clark big at left, the name in three rows, the Coke scan + Track at right, bodies sized to the screens
        <>
          <Clark left={300} top={560} width={1750} />
          <Phone src={SCAN_COKE} aspect={1206 / 2478} cut={0.86} left={3650} top={520} width={800} rotate={-6} />
          <Phone src={TRACK} aspect={1206 / 2622} cut={0.87} left={4250} top={760} width={760} rotate={6} />
          <Money count={8} seed="mix-c2" />
          <Name2 left={2150} top={620} width={1500} fck={220} name={190} rows={3} copy={copy} line2Size={72} line3Size={54} />
        </>
      ) : null}
      {variant === 'mix-c' ? (
        // C — Clark presents: Clark big at left, the name in three rows, the UPC scan and Track at right, the map strong behind
        <>
          <Clark left={300} top={560} width={1750} />
          <Phone src={SCAN_UPC} aspect={1206 / 2478} cut={0.86} left={3650} top={520} width={800} rotate={-6} />
          <Phone src={TRACK} aspect={1206 / 2622} cut={0.87} left={4250} top={760} width={760} rotate={6} />
          <Money count={8} seed="mix-c" />
          <Name2 left={2150} top={760} width={1500} fck={220} name={190} rows={3} />
        </>
      ) : null}
      {variant === 'mix-d' ? (
        // D — wide fan: four screens fanned across the whole width, darkened, the name centred over them, Clark low left
        <>
          <Phone src={frameSrc('memo')} aspect={1206 / 2622} left={700} top={900} width={820} rotate={-14} />
          <Phone src={MAP} aspect={1080 / 1926} left={1700} top={700} width={820} rotate={-5} />
          <Phone src={SCAN_UPC} aspect={1206 / 2478} cut={0.86} left={2750} top={700} width={820} rotate={5} />
          <Phone src={TRACK} aspect={1206 / 2622} cut={0.87} left={3750} top={900} width={820} rotate={14} />
          <AbsoluteFill style={{ background: 'rgba(7,11,18,0.42)' }} />
          <Clark left={250} top={1850} width={950} />
          <Money count={8} seed="mix-d" />
          <Name2 left={SAFE.left} top={980} width={SAFE.right - SAFE.left} align="center" fck={300} name={220} fckColor={T.gold} nameColor={T.cream} plate />
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
