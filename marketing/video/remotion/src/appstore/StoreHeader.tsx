import React from 'react';
import { AbsoluteFill, Freeze, Img, OffthreadVideo, Sequence, random, staticFile, useCurrentFrame } from 'remotion';
import { CLARK_FULL, clipSrc } from '../clips';
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
export type HeaderVariant = 'space' | 'screens' | 'clark' | 'map' | 'mix-a' | 'mix-b' | 'mix-c' | 'mix-d' | 'mix-b2' | 'mix-c2' | 'l1' | 'l2' | 'l3' | 'l4' | 'f1' | 'f1s' | 'f2' | 'f2s' | 'g1' | 'g2' | 'g1s' | 'g1m' | 's1' | 's2' | 's3a' | 's3b' | 's3c' | 's3d';
/**
 * Device-safe box (Oct 16, measured from App Store Connect's Preview): iPhone shows the centre
 * ~66 % of the header's width at full height (status bar + island over the top sixth, back/share
 * at the upper corners); iPad shows the full width but only y 16–77 % of the height (the
 * Today/Games/Apps pill over the top centre); iPhone Duo shows nearly all of it (camera cutout top
 * right). A video also puts a play button dead centre. Essentials live inside the intersection.
 */
export const DEVICE_SAFE = { left: 891, top: 724, right: 4353, bottom: 2087 };
export const PLAY_BUTTON = { cx: 2622, cy: 1475, r: 240 };
/** which crop the bottom bar is pinned to: the 21:9 header (y 2599) or the 3:2 search card (y 2950) */
export type HeaderTarget = 'header' | 'search';
export const SUB_COPY = 'Tap a business. Scan a product. Track the platforms you use.'; // creator, Oct 15 (round 7)
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

const BEZEL = 28;
const RADIUS = 130; // round 8: "too round" at 200
const PHONE_RATIO = 2.05; // body height / width when the phone has to show whole (round 8: "too short" when clipped at the screen)
const MAP = staticFile('media/appstore/frames/map_pins.png'); // 1080×1926, no record up
const SCAN_TAB = staticFile('media/appstore/frames/scan_tab.png'); // 1206×2478, R11 at 0.5 s: the Scan tab, no record, status bar cropped
const SCAN_UPC = staticFile('media/appstore/frames/scan_upc.png'); // 1206×2478, R11 at 5.9 s: a barcode filling the scanner guide (round 3: "actually use a scanning UPC screenshot")
const TRACK = frameSrc('track'); // the Track tab (arena + platform list)
const SCAN_COKE2 = staticFile('media/appstore/frames/scan_coke2.png'); // 1206×2322, same frame cropped at y 300: no status bar, no dark SCAN BARCODE strip (review, round 16)
const SCAN_COKE = staticFile('media/appstore/frames/scan_coke.png'); // 1206×2478, R6 at 17.1 s: the Coke bottle in the scanner guide (creator's pick, round 4)
const TRACK_GRID = staticFile('media/appstore/frames/track_grid.png'); // 1206×2478, R5 at 2.0 s: the Track roster with every sprite in the grid, nothing avoided yet (round 7: "all the sprites, not Musk")
const MONEY_SCALE = 2.6; // the 24 px bills are specks at 5244 wide

/** denser pixel stars on top of the shared starfield ("way more aesthetic — def more stars"); `intense` = a milky band, bigger glows, far more of them */
/** `twinkle` (round 13): 0–1 position in the loop; each star's brightness breathes on its own whole-cycle rate, so frame 450 == frame 0 */
const DeepSpace: React.FC<{ count?: number; seed?: string; intense?: boolean; twinkle?: number }> = ({ count = 900, seed = 'deep', intense = false, twinkle }) => (
  <AbsoluteFill style={{ pointerEvents: 'none' }}>
    {intense ? <AbsoluteFill style={{ background: 'linear-gradient(112deg, transparent 30%, rgba(122,242,255,0.12) 46%, rgba(220,231,246,0.16) 52%, rgba(122,242,255,0.10) 58%, transparent 74%)' }} /> : null}
    {Array.from({ length: count }, (_, i) => {
      const r = (k: string) => random(`${seed}-${i}-${k}`);
      const s = intense ? (r('s') < 0.7 ? 3 : r('s') < 0.92 ? 6 : 11) : r('s') < 0.82 ? 3 : r('s') < 0.96 ? 5 : 8;
      const a0 = (intense ? 0.35 : 0.25) + r('a') * 0.65;
      const a = twinkle == null ? a0 : a0 * (0.55 + 0.45 * Math.sin(2 * Math.PI * (twinkle * (2 + Math.floor(r('tw') * 4)) + r('tp'))));
      const warm = r('c') < 0.12;
      return <div key={i} style={{ position: 'absolute', left: r('x') * HEADER_W, top: r('y') * HEADER_H, width: s, height: s, background: warm ? T.gold : r('c') < 0.3 ? T.cyan : '#FFFFFF', opacity: a, boxShadow: s >= 5 ? `0 0 ${s * (intense ? 3 : 2)}px rgba(255,255,255,${a * 0.6})` : undefined }} />;
    })}
    <AbsoluteFill style={{ background: intense ? 'radial-gradient(ellipse 65% 75% at 55% 45%, rgba(47,99,255,0.26), transparent 70%), radial-gradient(ellipse 45% 55% at 85% 20%, rgba(122,242,255,0.16), transparent 70%), radial-gradient(ellipse 50% 45% at 12% 85%, rgba(255,201,60,0.12), transparent 70%)' : 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(47,99,255,0.16), transparent 70%), radial-gradient(ellipse 40% 50% at 80% 20%, rgba(122,242,255,0.10), transparent 70%), radial-gradient(ellipse 50% 40% at 15% 85%, rgba(255,201,60,0.08), transparent 70%)' }} />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 75% at 50% 50%, transparent 55%, rgba(7,11,18,0.65) 100%)' }} />
  </AbsoluteFill>
);

/** Round 7 pieces: the headline (money may cover it), the secondary line and the bottom bar (money may not) */
/** `fckGlow` (round 14): a stronger cyan halo on "FCK," */
const Headline: React.FC<{ left: number; top: number; width: number; align?: 'left' | 'center'; fck?: number; name?: number; rows?: 2 | 3; fckGlow?: boolean; fckNudge?: number }> = ({ left, top, width, align = 'center', fck = 240, name = 200, rows = 2, fckGlow = false, fckNudge = 0 }) => (
  <div style={{ position: 'absolute', left, top, width, display: 'flex', flexDirection: 'column', alignItems: align === 'center' ? 'center' : 'flex-start', textAlign: align, gap: 24 }}>
    <div style={{ marginLeft: fckNudge, fontFamily: FONT.display, fontSize: fck, lineHeight: 1, color: T.cyan, letterSpacing: 8, textShadow: fckGlow ? '0 0 26px rgba(122,242,255,0.95), 0 0 70px rgba(122,242,255,0.6), 0 0 160px rgba(122,242,255,0.3), 8px 8px 0 rgba(0,0,0,0.8)' : '0 0 30px rgba(122,242,255,0.5), 8px 8px 0 rgba(0,0,0,0.8)' }}>FCK,</div>
    <div style={{ fontFamily: FONT.display, fontSize: name, lineHeight: 1.02, color: T.gold, letterSpacing: 4, whiteSpace: 'pre-line', textShadow: '0 0 50px rgba(255,201,60,0.45), 12px 12px 0 rgba(0,0,0,0.8)' }}>{rows === 3 ? 'FINANCIAL\nCONTRIBUTION\nKIT' : 'FINANCIAL\nCONTRIBUTION KIT'}</div>
  </div>
);
const Secondary: React.FC<{ left: number; top: number; width: number; align?: 'left' | 'center'; size?: number; twoLines?: boolean }> = ({ left, top, width, align = 'center', size = 96, twoLines = false }) => (
  <div style={{ position: 'absolute', left, top, width, textAlign: align, fontFamily: FONT.body, fontWeight: 600, fontSize: size, lineHeight: 1.2, letterSpacing: 7, color: T.cream, whiteSpace: 'pre-line', textShadow: '0 0 20px rgba(232,224,208,0.25), 4px 4px 0 rgba(0,0,0,0.8)' }}>{twoLines ? 'SEE WHERE\nTHE MONEY GOES.' : 'SEE WHERE THE MONEY GOES.'}</div>
);
const SubBar: React.FC<{ target: HeaderTarget; height?: number; size?: number; overhang?: number; textLeft?: number; textWidth?: number }> = ({ target, height = 240, size = 110, overhang = 0, textLeft = 0, textWidth = HEADER_W }) => {
  const bottom = (target === 'header' ? SAFE.bottom : HEADER_H) + overhang; // overhang: the loop pans a little, so the bar runs past the crop edge
  // round 10 (review): opaque, so no phone UI or bill shows through under the copy; the copy sits on the headline's axis
  return (
    <div style={{ position: 'absolute', left: 0, top: bottom - height - overhang, width: HEADER_W, height: height + overhang, background: 'rgba(7,11,18,0.97)', borderTop: `4px solid ${T.cyan}`, boxShadow: `0 -2px 30px rgba(122,242,255,0.25)`, boxSizing: 'border-box' }}>
      <div style={{ position: 'absolute', left: textLeft, top: (height - size * 1.2) / 2, width: textWidth, textAlign: 'center', fontFamily: FONT.body, fontWeight: 600, fontSize: size, lineHeight: 1.2, letterSpacing: 2, color: T.cream, textShadow: '3px 3px 0 rgba(0,0,0,0.8)' }}>{SUB_COPY}</div>
    </div>
  );
};
/** Round 9 (G2): the three verbs as the third line of the left column, under a thin rule — clear of the phones */
const SubColumn: React.FC<{ left: number; top: number; width: number; size?: number }> = ({ left, top, width, size = 76 }) => (
  <div style={{ position: 'absolute', left, top, width }}>
    <div style={{ width: 520, height: 6, background: `linear-gradient(to right, ${T.cyan}, transparent)`, boxShadow: `0 0 14px rgba(122,242,255,0.5)`, marginBottom: 64 }} />
    <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: size, lineHeight: 1.3, letterSpacing: 1, color: T.text, textShadow: '3px 3px 0 rgba(0,0,0,0.85)', whiteSpace: 'pre-line' }}>{'Tap a business.\nScan a product.\nTrack the platforms you use.'}</div>
  </div>
);
/** F2's sub copy sits under the phones instead of on a bar (creator, round 8) */
const SubUnder: React.FC<{ left: number; top: number; width: number; size?: number }> = ({ left, top, width, size = 100 }) => (
  <div style={{ position: 'absolute', left, top, width, textAlign: 'center', fontFamily: FONT.body, fontWeight: 600, fontSize: size, lineHeight: 1.25, letterSpacing: 2, color: T.cream, textShadow: '0 0 20px rgba(232,224,208,0.2), 4px 4px 0 rgba(0,0,0,0.85)' }}>{SUB_COPY}</div>
);

/** the blurred map as a backdrop */
const BlurredMap: React.FC<{ opacity?: number; blur?: number; lowerLit?: boolean }> = ({ opacity = 0.7, blur = 30, lowerLit = false }) => (
  <AbsoluteFill style={{ overflow: 'hidden' }}>
    <Img src={MAP} style={{ position: 'absolute', left: -200, top: -1400, width: HEADER_W + 400, height: ((HEADER_W + 400) * 1926) / 1080, filter: `blur(${blur}px) saturate(1.2)`, opacity }} />
    {/* lowerLit (round 10): dark behind the type up top, the map readable behind the phones below */}
    <AbsoluteFill style={{ background: lowerLit ? 'linear-gradient(to bottom, rgba(7,11,18,0.72), rgba(7,11,18,0.3))' : 'linear-gradient(to bottom, rgba(7,11,18,0.35), rgba(7,11,18,0.75))' }} />
  </AbsoluteFill>
);

/** falling money, frozen mid-fall for the still (the video just lets it run) */
const Money: React.FC<{ count?: number; seed?: string; keepOut?: { left: number; top: number; width: number; height: number } }> = ({ count = 18, seed = 'hdr', keepOut }) => (
  <LayoutProvider layout={FULL}>
    {/* round 10: the poster frame keeps the name clean — a hole punched over the headline with clip-path (the loop still lets bills cross it) */}
    <div style={{ position: 'absolute', left: 0, top: 0, width: HEADER_W, height: HEADER_H, clipPath: keepOut ? `polygon(0 0, ${HEADER_W}px 0, ${HEADER_W}px ${HEADER_H}px, 0 ${HEADER_H}px, 0 ${keepOut.top}px, ${keepOut.left}px ${keepOut.top}px, ${keepOut.left}px ${keepOut.top + keepOut.height}px, ${keepOut.left + keepOut.width}px ${keepOut.top + keepOut.height}px, ${keepOut.left + keepOut.width}px ${keepOut.top}px, 0 ${keepOut.top}px)` : undefined }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: HEADER_W / MONEY_SCALE, height: HEADER_H / MONEY_SCALE, transform: `scale(${MONEY_SCALE})`, transformOrigin: '0 0' }}>
        <Sequence from={-70} durationInFrames={400} name="money">
          <MoneyRain count={count} seed={seed} width={HEADER_W / MONEY_SCALE} height={HEADER_H / MONEY_SCALE} />
        </Sequence>
      </div>
    </div>
  </LayoutProvider>
);

/** Poster-frame money (round 16): the loop's bills frozen at one moment; any bill touching an `avoid` box is dropped whole, never clipped */
const StillMoney: React.FC<{ count: number; seed: string; avoid?: Box[]; at?: number }> = ({ count, seed, avoid = [], at = 0.37 }) => {
  const areaW = HEADER_W / MONEY_SCALE;
  const areaH = HEADER_H / MONEY_SCALE;
  const u = at;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: areaW, height: areaH, transform: `scale(${MONEY_SCALE})`, transformOrigin: '0 0', pointerEvents: 'none' }}>
      {Array.from({ length: count }, (_, i) => {
        const r = (k: string) => random(`${seed}-loop-${i}-${k}`);
        const sc = r('s') > 0.5 ? 4 : 3;
        const w = 24 * sc;
        const h = 17 * sc;
        const cycles = 2 + Math.floor(r('k') * 2);
        const span = areaH + h * 2;
        const y = (((u * cycles + r('p')) % 1) * span) - h;
        const m = 1 + Math.floor(r('m') * 3);
        const x = r('x') * (areaW + 80) - 40 + Math.sin(2 * Math.PI * (u * m + r('q'))) * (26 + r('a') * 56);
        const rot = (r('r') - 0.5) * 70 + Math.sin(2 * Math.PI * (u * (1 + Math.floor(r('n') * 2)) + r('o'))) * 18;
        if (hits(x * MONEY_SCALE, y * MONEY_SCALE, w * MONEY_SCALE, h * MONEY_SCALE, avoid)) return null;
        return <Img key={i} src={staticFile(`assets/cash_${Math.floor(r('i') * 4) % 4}.png`)} style={{ position: 'absolute', left: Math.round(x), top: Math.round(y), width: w, height: h, imageRendering: 'pixelated', transform: `rotate(${Math.round(rot)}deg)`, filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,0.45))' }} />;
      })}
    </div>
  );
};

/** Round 17: the name as a small two-line unit ("FCK," over "FINANCIAL CONTRIBUTION KIT"), and the hero line as the display type */
const NameSmall: React.FC<{ left: number; top: number; width: number; size?: number; align?: 'left' | 'center'; oneLine?: boolean }> = ({ left, top, width, size = 96, align = 'center', oneLine = false }) => (
  <div style={{ position: 'absolute', left, top, width, textAlign: align, fontFamily: FONT.display, fontSize: size, lineHeight: 1.12, letterSpacing: 6, whiteSpace: oneLine ? 'nowrap' : 'pre-line', textShadow: '0 0 22px rgba(122,242,255,0.45), 6px 6px 0 rgba(0,0,0,0.8)' }}>
    <span style={{ color: T.cyan, textShadow: '0 0 24px rgba(122,242,255,0.9), 0 0 60px rgba(122,242,255,0.5), 6px 6px 0 rgba(0,0,0,0.8)' }}>FCK,</span>
    {oneLine ? ' ' : '\n'}
    <span style={{ color: T.cream }}>FINANCIAL CONTRIBUTION KIT</span>
  </div>
);
const Hero: React.FC<{ left: number; top: number; width: number; size: number; font?: 'display' | 'body'; twoLines?: boolean; color?: string }> = ({ left, top, width, size, font = 'display', twoLines = false, color = T.gold }) => (
  <div style={{ position: 'absolute', left, top, width, textAlign: 'center', fontFamily: font === 'display' ? FONT.display : FONT.body, fontWeight: font === 'display' ? 400 : 600, fontSize: size, lineHeight: 1.02, letterSpacing: font === 'display' ? 4 : 7, color, whiteSpace: 'pre-line', textShadow: color === T.gold ? '0 0 50px rgba(255,201,60,0.45), 12px 12px 0 rgba(0,0,0,0.8)' : '0 0 24px rgba(232,224,208,0.3), 10px 10px 0 rgba(0,0,0,0.8)' }}>
    {twoLines ? 'SEE WHERE\nTHE MONEY GOES.' : 'SEE WHERE THE MONEY GOES.'}
  </div>
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
/** `bleed`: the body runs to the canvas bottom (the crop edge cuts it like a real device coming up from below); otherwise a whole phone at PHONE_RATIO with a dark chin under a clipped screen. `bob`: vertical offset for the loop. */
/** `video` (round 12): in loop mode the screen plays a slow 15 s ping-pong clip (scripts/prep-header-loops.sh, 1080×1926) instead of the screenshot */
const Phone: React.FC<{ src: string; aspect: number; left: number; top: number; width: number; rotate?: number; cut?: number; bleed?: boolean; bob?: number; shiftY?: number; video?: string }> = ({ src, aspect, left, top, width, rotate = 0, cut = 1, bleed = false, bob = 0, shiftY = 0, video }) => {
  const screenH = (width / aspect) * cut;
  const bodyH = bleed ? HEADER_H : Math.max(screenH, width * PHONE_RATIO) + BEZEL * 2;
  return (
    <div style={{ position: 'absolute', left: left - BEZEL, top: top - BEZEL + bob, width: width + BEZEL * 2, height: bodyH, borderRadius: RADIUS, background: '#0B0D12', transform: `rotate(${rotate}deg)`, transformOrigin: '50% 100%', boxShadow: '0 0 0 4px #3A4A66, 0 0 0 6px rgba(0,0,0,0.6), 0 0 44px rgba(122,242,255,0.18), 0 30px 70px rgba(0,0,0,0.55)' }}>
      <div style={{ position: 'absolute', left: BEZEL, top: BEZEL, width, height: bleed ? bodyH : screenH, borderRadius: RADIUS - BEZEL, overflow: 'hidden', background: T.void }}>
        {video ? (
          <OffthreadVideo src={clipSrc(video)} muted style={{ display: 'block', width, height: (width * 1926) / 1080, transform: `translateY(${shiftY}px)` }} />
        ) : (
          <Img src={src} style={{ display: 'block', width, height: width / aspect, transform: `translateY(${shiftY}px)` }} />
        )}
      </div>
    </div>
  );
};

/** Money for the loops: every bill's fall, sway and spin are whole cycles of `loop` frames, so frame `loop` equals frame 0. */
type Box = { left: number; top: number; width: number; height: number };
const hits = (x: number, y: number, w: number, h: number, boxes: Box[]): boolean => boxes.some((b) => x < b.left + b.width && x + w > b.left && y < b.top + b.height && y + h > b.top);
/** `avoid` (round 16): bills fade out while they cross these boxes (the two lower lines, the screens) */
const LoopMoney: React.FC<{ count: number; seed: string; loop: number; frame: number; avoid?: Box[] }> = ({ count, seed, loop, frame, avoid = [] }) => {
  const areaW = HEADER_W / MONEY_SCALE;
  const areaH = HEADER_H / MONEY_SCALE;
  const u = frame / loop;
  return (
    <LayoutProvider layout={FULL}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: areaW, height: areaH, transform: `scale(${MONEY_SCALE})`, transformOrigin: '0 0', pointerEvents: 'none' }}>
        {Array.from({ length: count }, (_, i) => {
          const r = (k: string) => random(`${seed}-loop-${i}-${k}`);
          const sc = r('s') > 0.5 ? 4 : 3;
          const w = 24 * sc;
          const h = 17 * sc;
          const cycles = 2 + Math.floor(r('k') * 2); // round 13 ("more movement"): 2 or 3 falls per loop
          const span = areaH + h * 2;
          const y = (((u * cycles + r('p')) % 1) * span) - h;
          const m = 1 + Math.floor(r('m') * 3);
          const x = r('x') * (areaW + 80) - 40 + Math.sin(2 * Math.PI * (u * m + r('q'))) * (26 + r('a') * 56);
          const rot = (r('r') - 0.5) * 70 + Math.sin(2 * Math.PI * (u * (1 + Math.floor(r('n') * 2)) + r('o'))) * 18;
          const inBox = hits(x * MONEY_SCALE, y * MONEY_SCALE, w * MONEY_SCALE, h * MONEY_SCALE, avoid);
          return <Img key={i} src={staticFile(`assets/cash_${Math.floor(r('i') * 4) % 4}.png`)} style={{ position: 'absolute', left: Math.round(x), top: Math.round(y), width: w, height: h, imageRendering: 'pixelated', opacity: inBox ? 0 : 1, transition: 'none', transform: `rotate(${Math.round(rot)}deg)`, filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,0.45))' }} />;
        })}
      </div>
    </LayoutProvider>
  );
};

/** `loop` (frames): animate for the header video — frozen base stars, drifting deep stars and map, bobbing phones, periodic money. */
export const StoreHeader: React.FC<{ variant: HeaderVariant; copy?: CopyId; target?: HeaderTarget; loop?: number }> = ({ variant, copy, target = 'header', loop }) => {
  useFonts();
  const frame = useCurrentFrame();
  const ph = loop ? (2 * Math.PI * frame) / loop : 0;
  const bob = (phase: number): number => (loop ? Math.round(10 * Math.sin(ph + phase)) : 0);
  const drift = loop ? `translate(${Math.round(22 * Math.sin(ph + 1))}px, ${Math.round(30 * Math.sin(ph))}px)` : undefined;
  const mapDrift = loop ? `translate(${Math.round(40 * Math.sin(ph + 0.5))}px, ${Math.round(26 * Math.cos(ph))}px)` : undefined;
  // the 3:2 search render keeps the header's bottom geometry: phones sit 351 px lower so their tab bars stay below the edge / behind the bar
  const dy = target === 'search' ? HEADER_H - SAFE.bottom : 0;
  const money = (count: number, seed: string, keepOut?: { left: number; top: number; width: number; height: number }): React.ReactNode => (loop ? <LoopMoney count={count} seed={seed} loop={loop} frame={frame} /> : <Money count={count} seed={seed} keepOut={keepOut} />);
  return (
    <AbsoluteFill style={{ width: HEADER_W, height: HEADER_H, backgroundColor: T.void, overflow: 'hidden' }}>
      {loop ? <Freeze frame={0}><Starfield /></Freeze> : <Starfield />}
      {variant === 'map' ? <BlurredMap /> : null}
      {variant === 'clark' || variant === 'mix-a' ? <BlurredMap opacity={0.26} blur={44} /> : null}
      {variant === 'mix-b' || variant === 'mix-d' || variant === 'mix-b2' ? <BlurredMap opacity={0.45} blur={36} /> : null}
      {variant === 'mix-c' || variant === 'mix-c2' ? <BlurredMap opacity={0.7} blur={30} /> : null}
      {variant === 'l1' || variant === 'l2' || variant === 'l3' || variant === 'l4' || variant === 'f1' || variant === 'f2' ? <AbsoluteFill style={{ transform: mapDrift }}><BlurredMap opacity={0.5} blur={34} /></AbsoluteFill> : null}
      {variant === 'g1' || variant === 'g2' ? <AbsoluteFill style={{ transform: mapDrift }}><BlurredMap opacity={0.62} blur={34} lowerLit /></AbsoluteFill> : null}
      {variant === 'g1m' || variant === 's1' || variant === 's2' || variant.startsWith('s3') ? <AbsoluteFill style={{ transform: loop ? `translate(${Math.round(150 * Math.sin(ph + 0.5))}px, ${Math.round(60 * Math.cos(ph))}px) scale(1.08)` : 'scale(1.08)' }}><BlurredMap opacity={0.66} blur={34} lowerLit /></AbsoluteFill> : null}
      <AbsoluteFill style={{ transform: variant === 'g1s' && loop ? `translate(${Math.round(70 * Math.sin(ph + 1))}px, ${Math.round(40 * Math.sin(ph))}px) scale(1.04)` : variant === 'g1s' ? 'scale(1.04)' : drift }}>
        <DeepSpace count={variant === 'space' ? 1400 : variant === 'f1s' || variant === 'f2s' || variant === 'g1' || variant === 'g2' || variant === 'g1s' || variant === 'g1m' || variant === 's1' || variant === 's2' || variant.startsWith('s3') ? 2600 : 800} intense={variant === 'f1s' || variant === 'f2s' || variant === 'g1' || variant === 'g2' || variant === 'g1s' || variant === 'g1m' || variant === 's1' || variant === 's2' || variant.startsWith('s3')} twinkle={loop && (variant === 'g1s' || variant === 'g1m' || variant === 's1' || variant === 's2' || variant.startsWith('s3')) ? frame / loop : undefined} />
      </AbsoluteFill>
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
      {/* Round 9 — G1/G2: map + intense stars together; every phone rises from the bottom edge (one mask, tab bars hidden); G1 fan tighter; G2 copy as a left column clear of the phones */}
      {variant === 's3a' || variant === 's3b' || variant === 's3c' || variant === 's3d' ? (
        // round 17 comps: small two-line name under the iPad pill, the hero line big; a = Bungee hero one line, b = Bungee hero two lines (biggest), c = Plex hero one line
        <>
          <Clark left={870} top={1230} width={700} />
          <Phone src={MAP} aspect={1080 / 1926} left={2220} top={2000 + dy} width={520} rotate={-7} bleed bob={bob(0)} />
          <Phone src={SCAN_COKE2} aspect={1206 / 2322} left={2930} top={1960 + dy} width={520} rotate={0} bleed bob={bob(2.1)} />
          <Phone src={TRACK_GRID} aspect={1206 / 2478} left={3640} top={2000 + dy} width={520} rotate={7} bleed bob={bob(4.2)} />
          {/* copy centred on the free width right of Clark (x 1650–4300), so the hero line never crosses him */}
          {variant === 's3a' ? (
            <>
              <NameSmall left={1650} top={1150} width={2650} size={96} />
              <Hero left={1650} top={1410} width={2650} size={140} />
              <SubUnder left={2025} top={1600} width={1900} size={80} />
            </>
          ) : variant === 's3b' ? (
            <>
              {/* chosen Oct 16: s3b with the name on one line */}
              <NameSmall left={1650} top={1180} width={2650} size={84} oneLine />
              <Hero left={1650} top={1330} width={2650} size={224} twoLines />
              <SubUnder left={1933} top={1820} width={2084} size={66} />
            </>
          ) : variant === 's3d' ? (
            <>
              {/* s3d comp: s3b with the copy centred on the canvas (x 2622, also the iPhone band centre) instead of on the column right of Clark; hero 216 so "THE MONEY GOES." clears Clark's ink (right edge 1515 at that height) */}
              <NameSmall left={1297} top={1180} width={2650} size={84} oneLine />
              <Hero left={1297} top={1330} width={2650} size={216} twoLines />
              <SubUnder left={1580} top={1820} width={2084} size={66} />
            </>
          ) : (
            <>
              <NameSmall left={1650} top={1150} width={2650} size={96} />
              <Hero left={1650} top={1410} width={2650} size={130} font="body" color={T.cream} />
              <SubUnder left={2025} top={1600} width={1900} size={80} />
            </>
          )}
          {loop ? (
            <LoopMoney count={20} seed={`${variant}-b`} loop={loop} frame={frame} avoid={[{ left: variant === 's3d' ? 1100 : 1200, top: 1100, width: 2850, height: 850 }, { left: 2150, top: 1900, width: 2080, height: 1050 }]} />
          ) : (
            <StillMoney count={20} seed={`${variant}-b`} avoid={[{ left: variant === 's3d' ? 1100 : 1200, top: 1100, width: 2850, height: 850 }, { left: 2150, top: 1900, width: 2080, height: 1050 }]} />
          )}
        </>
      ) : null}
      {variant === 's2' ? (
        // round 16 (outside review applied): stack lowered under the iPad pill (y ≥ 1060), FCK and name equal, third line 80 on two lines, Clark below the iPhone back button and clear of the lines, fan moved left and tilted less so Track survives the iPhone crop, screenshots bleed past the crop, bills never on the lower lines or the screens
        <>
          <Clark left={870} top={1230} width={700} />
          <Phone src={MAP} aspect={1080 / 1926} left={2220} top={2000 + dy} width={520} rotate={-7} bleed bob={bob(0)} />
          <Phone src={SCAN_COKE2} aspect={1206 / 2322} left={2930} top={1960 + dy} width={520} rotate={0} bleed bob={bob(2.1)} />
          <Phone src={TRACK_GRID} aspect={1206 / 2478} left={3640} top={2000 + dy} width={520} rotate={7} bleed bob={bob(4.2)} />
          <Headline left={DEVICE_SAFE.left} top={1060} width={DEVICE_SAFE.right - DEVICE_SAFE.left} fck={150} name={150} fckGlow fckNudge={38} />
          {loop ? (
            <LoopMoney count={20} seed={`${variant}-b`} loop={loop} frame={frame} avoid={[{ left: 1560, top: 1560, width: 2130, height: 380 }, { left: 2150, top: 1900, width: 2080, height: 1050 }]} />
          ) : (
            <StillMoney count={20} seed={`${variant}-b`} avoid={[{ left: 1560, top: 1560, width: 2130, height: 380 }, { left: 2150, top: 1900, width: 2080, height: 1050 }]} />
          )}
          <Secondary left={DEVICE_SAFE.left} top={1580} width={DEVICE_SAFE.right - DEVICE_SAFE.left} size={90} />
          <SubUnder left={1672} top={1720} width={1900} size={80} />
        </>
      ) : null}
      {variant === 's1' ? (
        // round 15: everything that matters inside DEVICE_SAFE and clear of the play button — Clark's bust left, the copy as a right column, the fan below it, no bar
        <>
          <Clark left={920} top={740} width={900} />
          <Phone src={MAP} aspect={1080 / 1926} left={1400} top={1760 + dy} width={470} rotate={-9} bleed bob={bob(0)} />
          <Phone src={SCAN_COKE} aspect={1206 / 2478} left={1880} top={1700 + dy} width={470} rotate={0} bleed bob={bob(2.1)} shiftY={-120} />
          <Phone src={TRACK_GRID} aspect={1206 / 2478} left={2360} top={1760 + dy} width={470} rotate={9} bleed bob={bob(4.2)} />
          <Headline left={2950} top={790} width={1400} align="left" fck={130} name={130} rows={3} fckGlow />
          {money(16, `${variant}-a`, { left: 2900, top: 740, width: 1460, height: 640 })}
          <Secondary left={2950} top={1390} width={1400} align="left" size={72} twoLines />
          <SubColumn left={2950} top={1610} width={1400} size={54} />
        </>
      ) : null}
      {variant === 'g1s' || variant === 'g1m' ? (
        // round 13: G1 as the base — Clark bigger and higher, screenshots in the phones, busier money, moving background (stars twinkle + pan, or the map pans)
        <>
          <Clark left={380} top={600} width={1420} />
          <Phone src={MAP} aspect={1080 / 1926} left={2150} top={1500 + dy} width={760} rotate={-9} bleed bob={bob(0)} />
          <Phone src={SCAN_COKE} aspect={1206 / 2478} left={2860} top={1380 + dy} width={760} rotate={0} bleed bob={bob(2.1)} shiftY={-200} />
          <Phone src={TRACK_GRID} aspect={1206 / 2478} left={3570} top={1500 + dy} width={760} rotate={9} bleed bob={bob(4.2)} />
          <Headline left={1640} top={400} width={3195} fck={200} fckGlow />
          {money(20, `${variant}-c`, { left: 1640, top: 360, width: 3195, height: 800 })}
          <Secondary left={1640} top={1100} width={3195} size={124} />
          <SubBar target={target} overhang={loop ? 80 : 0} textLeft={1640} textWidth={3195} />
        </>
      ) : null}
      {variant === 'g1' ? (
        // round 10 (review): Clark inside the 3:2 crop, "FCK," smaller, secondary larger, Coke screenshot lifted, bar opaque with its copy on the headline's axis
        <>
          <Clark left={420} top={780} width={1250} />
          <Phone src={MAP} aspect={1080 / 1926} left={2150} top={1500 + dy} width={760} rotate={-9} bleed bob={bob(0)} video={loop ? 'loop_map' : undefined} />
          <Phone src={SCAN_COKE} aspect={1206 / 2478} left={2860} top={1380 + dy} width={760} rotate={0} bleed bob={bob(2.1)} shiftY={loop ? 0 : -200} video={loop ? 'loop_scan' : undefined} />
          <Phone src={TRACK_GRID} aspect={1206 / 2478} left={3570} top={1500 + dy} width={760} rotate={9} bleed bob={bob(4.2)} />
          <Headline left={1640} top={420} width={3195} fck={170} />
          {money(12, `${variant}-b`, { left: 1640, top: 380, width: 3195, height: 760 })}
          <Secondary left={1640} top={1100} width={3195} size={124} />
          <SubBar target={target} overhang={loop ? 80 : 0} textLeft={1640} textWidth={3195} />
        </>
      ) : null}
      {variant === 'g2' ? (
        // round 10 (review): fan sunk and scaled (no tab bar, Track inside the crop), column lower and off Clark, secondary on two lines, rule spaced, third line +50 %, scrim behind the column
        <>
          <Clark left={420} top={700} width={1050} />
          <div style={{ position: 'absolute', left: 1200, top: 300, width: 2000, height: 2000, background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(7,11,18,0.55), transparent 70%)' }} />
          <Phone src={MAP} aspect={1080 / 1926} left={2990} top={1450 + dy} width={680} rotate={-8} bleed bob={bob(0)} video={loop ? 'loop_map' : undefined} />
          <Phone src={SCAN_COKE} aspect={1206 / 2478} left={3560} top={1400 + dy} width={680} rotate={0} bleed bob={bob(2.1)} video={loop ? 'loop_scan' : undefined} />
          <Phone src={TRACK_GRID} aspect={1206 / 2478} left={4130} top={1450 + dy} width={680} rotate={8} bleed bob={bob(4.2)} />
          <Headline left={1560} top={560} width={1380} align="left" fck={200} name={170} rows={3} />
          {money(12, `${variant}-b`, { left: 1520, top: 520, width: 1460, height: 760 })}
          <Secondary left={1560} top={1360} width={1380} align="left" size={100} twoLines />
          <SubColumn left={1560} top={1660} width={1380} size={92} />
        </>
      ) : null}
      {/* Round 7 — F1/F2 (L1/L2 reworked): Clark higher, sub copy on a bottom bar, full sprite grid for Track; `s` = intense stars instead of the map. Order = headline, money, secondary, bar: money may cover the headline, never the subheads. */}
      {variant === 'f1' || variant === 'f1s' ? (
        <>
          <Clark left={260} top={780} width={1250} />
          <Phone src={MAP} aspect={1080 / 1926} left={1800} top={1500} width={760} rotate={-10} bleed bob={bob(0)} />
          <Phone src={SCAN_COKE} aspect={1206 / 2478} left={2860} top={1380} width={760} rotate={0} bleed bob={bob(2.1)} />
          <Phone src={TRACK_GRID} aspect={1206 / 2478} left={3920} top={1500} width={760} rotate={10} bleed bob={bob(4.2)} />
          <Headline left={1640} top={400} width={3195} />
          {money(12, variant)}
          <Secondary left={1640} top={1130} width={3195} />
          <SubBar target={target} overhang={loop ? 80 : 0} />
        </>
      ) : null}
      {variant === 'f2' || variant === 'f2s' ? (
        // round 8: Clark further left, bigger secondary, sub copy under the phones (no bar), whole phones at real proportions
        <>
          <Clark left={180} top={640} width={1100} />
          <Phone src={MAP} aspect={1080 / 1926} left={3050} top={560} width={700} rotate={-8} bob={bob(0)} />
          <Phone src={SCAN_COKE} aspect={1206 / 2478} left={3740} top={480} width={700} rotate={0} bob={bob(2.1)} />
          <Phone src={TRACK_GRID} aspect={1206 / 2478} cut={0.87} left={4430} top={560} width={660} rotate={8} bob={bob(4.2)} />
          <Headline left={1380} top={480} width={1600} align="left" fck={220} name={170} rows={3} />
          {money(12, variant)}
          <Secondary left={1380} top={1330} width={1700} align="left" size={100} />
          <SubUnder left={3000} top={2060} width={2100} size={100} />
        </>
      ) : null}
      {/* Round 6 — copy locked to c1, third line 80 px ("the map/track copy is too small"), four layouts */}
      {variant === 'l1' ? (
        // L1 — fan under the name (B2 refined): Clark far left, name centred, map / Coke / Track fanned along the bottom
        <>
          <Clark left={260} top={1100} width={1250} />
          <Phone src={MAP} aspect={1080 / 1926} left={1800} top={1640} width={760} rotate={-10} />
          <Phone src={SCAN_COKE} aspect={1206 / 2478} cut={0.86} left={2860} top={1520} width={760} rotate={0} />
          <Phone src={TRACK} aspect={1206 / 2622} cut={0.87} left={3920} top={1640} width={760} rotate={10} />
          <Money count={10} seed="l1" />
          <Name2 left={1640} top={470} width={3195} align="center" fck={240} name={200} copy="c1" line2Size={96} line3Size={80} />
        </>
      ) : null}
      {variant === 'l2' ? (
        // L2 — name left, Clark under it, the three screens fanned at right
        <>
          <Name2 left={520} top={540} width={2150} fck={240} name={200} copy="c1" line2Size={92} line3Size={74} />
          <Clark left={1300} top={1900} width={1100} />
          <Phone src={MAP} aspect={1080 / 1926} left={2760} top={780} width={720} rotate={-8} />
          <Phone src={SCAN_COKE} aspect={1206 / 2478} cut={0.86} left={3500} top={640} width={720} rotate={0} />
          <Phone src={TRACK} aspect={1206 / 2622} cut={0.87} left={4240} top={780} width={700} rotate={8} />
          <Money count={10} seed="l2" />
        </>
      ) : null}
      {variant === 'l3' ? (
        // L3 — symmetric: screens on the outside, name centred, Clark centred under it
        <>
          <Phone src={MAP} aspect={1080 / 1926} left={500} top={900} width={760} rotate={-9} />
          <Phone src={SCAN_COKE} aspect={1206 / 2478} cut={0.86} left={3720} top={820} width={740} rotate={4} />
          <Phone src={TRACK} aspect={1206 / 2622} cut={0.87} left={4440} top={1040} width={700} rotate={11} />
          <Clark left={2050} top={1560} width={1150} />
          <Money count={10} seed="l3" />
          <Name2 left={1300} top={420} width={2644} align="center" fck={240} name={200} copy="c1" line2Size={92} line3Size={74} />
        </>
      ) : null}
      {variant === 'l4' ? (
        // L4 — the fan at left under the name, Clark at right, bigger screens
        <>
          <Phone src={MAP} aspect={1080 / 1926} left={850} top={1560} width={820} rotate={-12} />
          <Phone src={SCAN_COKE} aspect={1206 / 2478} cut={0.86} left={1860} top={1420} width={820} rotate={-3} />
          <Phone src={TRACK} aspect={1206 / 2622} cut={0.87} left={2870} top={1560} width={820} rotate={7} />
          <Clark left={3900} top={760} width={1300} />
          <Money count={10} seed="l4" />
          <Name2 left={SAFE.left} top={440} width={3500} align="center" fck={240} name={200} copy="c1" line2Size={96} line3Size={80} />
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
