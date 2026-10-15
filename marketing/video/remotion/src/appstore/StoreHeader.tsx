import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { LOGO } from '../clips';
import { Starfield } from '../components/Starfield';
import { useFonts } from '../fonts';
import { FONT, T } from '../tokens';
import { SOURCE_W, frameSrc } from './tiles';

/**
 * App Store creative asset (iOS 27 product page header + search results), Oct 15 2026.
 * One "universal" 16:9 PNG at 5244×2950: App Store Connect crops it to the 21:9 header
 * (3840×1646) and the 3:2 search card (3840×2560). Both are centre crops, so everything
 * that matters sits inside their intersection, x 410–4835 × y 351–2599 (SAFE below), and
 * scripts/appstore.sh header also writes the two dedicated crops. Apple's rules: no alpha,
 * no price, no URL, one clear idea, text as a short phrase (not a description), 4+ safe.
 *   file  — Clark voice for the store: the record card on the phone + "Financial
 *           contributions, on file." (the search card must "state the obvious").
 *   brand — the logo and the hook line; stronger, but the logo carries the asterisk.
 */
export const HEADER_W = 5244;
export const HEADER_H = 2950;
export const SAFE = { left: 410, top: 351, right: 4835, bottom: 2599 };
export type HeaderVariant = 'file' | 'brand';

const SCREEN_W = 1300; // small enough that the record's totals sit inside the 21:9 crop (y < 2599)
const BEZEL = 34;
const RADIUS = 230;

const Phone: React.FC<{ frame: string; left: number; top: number }> = ({ frame, left, top }) => (
  <div
    style={{
      position: 'absolute',
      left: left - BEZEL,
      top: top - BEZEL,
      width: SCREEN_W + BEZEL * 2,
      height: HEADER_H,
      borderRadius: RADIUS,
      background: '#0B0D12',
      boxShadow: '0 0 0 4px #2A2D30, 0 0 0 6px rgba(0,0,0,0.6), 0 -10px 120px rgba(0,0,0,0.75), 0 0 180px rgba(122,242,255,0.10)',
    }}
  >
    <div style={{ position: 'absolute', left: BEZEL, top: BEZEL, width: SCREEN_W, height: HEADER_H, borderRadius: RADIUS - BEZEL, overflow: 'hidden', background: T.void }}>
      <Img src={frameSrc(frame)} style={{ display: 'block', width: SCREEN_W, height: (SCREEN_W * 2622) / SOURCE_W }} />
    </div>
  </div>
);

export const StoreHeader: React.FC<{ variant: HeaderVariant }> = ({ variant }) => {
  useFonts();
  return (
    <AbsoluteFill style={{ width: HEADER_W, height: HEADER_H, backgroundColor: T.void, overflow: 'hidden' }}>
      <Starfield />
      {variant === 'file' ? (
        <>
          <Phone frame="map_card" left={900} top={470} />
          <div style={{ position: 'absolute', left: 2450, top: 0, width: SAFE.right - 2450, height: HEADER_H, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 70 }}>
            <div style={{ fontFamily: FONT.display, fontSize: 196, lineHeight: 1.05, color: T.gold, letterSpacing: 2, textShadow: '0 0 40px rgba(255,201,60,0.35), 8px 8px 0 rgba(0,0,0,0.8)' }}>
              Financial
              <br />
              contributions,
              <br />
              on file.
            </div>
            <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 74, lineHeight: 1.35, color: T.cream, textShadow: '3px 3px 0 rgba(0,0,0,0.8)' }}>
              Tap a business. Scan a barcode.
              <br />
              Track the platforms you skip.
            </div>
            <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 56, letterSpacing: 8, color: T.cyan, textShadow: '0 0 18px rgba(122,242,255,0.5), 3px 3px 0 rgba(0,0,0,0.8)' }}>
              NO ACCOUNTS · NO TRACKING
            </div>
          </div>
        </>
      ) : (
        <div style={{ position: 'absolute', left: SAFE.left, top: SAFE.top, width: SAFE.right - SAFE.left, height: SAFE.bottom - SAFE.top, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 90 }}>
          <Img src={LOGO} style={{ width: 1500, imageRendering: 'pixelated', filter: 'drop-shadow(0 0 60px rgba(95,174,255,0.35))' }} />
          <div style={{ fontFamily: FONT.display, fontSize: 170, lineHeight: 1, color: T.gold, letterSpacing: 4, textShadow: '0 0 40px rgba(255,201,60,0.4), 8px 8px 0 rgba(0,0,0,0.8)', whiteSpace: 'nowrap' }}>
            SEE WHERE THE MONEY GOES.
          </div>
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 60, letterSpacing: 10, color: T.cyan, textShadow: '0 0 18px rgba(122,242,255,0.5), 3px 3px 0 rgba(0,0,0,0.8)' }}>
            FINANCIAL CONTRIBUTION KIT · NO ACCOUNTS · NO TRACKING
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
