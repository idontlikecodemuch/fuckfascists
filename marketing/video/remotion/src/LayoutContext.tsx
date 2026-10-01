import React, { createContext, useContext } from 'react';
import { BOX, BOX_TOP, CLARK, CLARK_ASSET, CLARK_BODY, CLARK_CLOSEUP_SCALE, CLARK_OUTRO, H, PHONE, PHONE_LEFT, VERTICAL_CLARK_MODE, W } from './layout';

export type Rect = { left: number; top: number; width: number; height: number };
export type Placement = { left: number; top: number; scale: number };
export type LayoutMode = 'vertical' | 'wide' | 'full';
/** Dialogue box geometry: anchored to `top` or `bottom`, height follows the text. */
export type BoxGeo = { left: number; width: number; top?: number; bottom?: number; minHeight?: number; fontSize?: number; /** extra left padding so the text clears a character standing in front of the box */ padLeft?: number };

export type Layout = {
  mode: LayoutMode;
  /** how feature footage is staged: inside the device frame, or filling the canvas */
  stage: 'phone' | 'full';
  w: number;
  h: number;
  phone: Rect;
  box: BoxGeo & { fontSize: number; tail: boolean };
  clark: {
    asset: 'bust' | 'full';
    assetSize: { w: number; h: number; faceX: number; faceY: number };
    placement: Placement;
    closeup: Placement;
    clipBottom: number;
    slideOff: number; // px translateX for the share slide-off
    /** fade the bust's bottom edge (when he floats over footage instead of behind a box) */
    feather?: boolean;
    /** draw Clark above the dialogue box (the box pads its text to clear him) */
    front?: boolean;
  };
  pile: Rect; // money mound footprint
  folder: { from: { x: number; y: number }; to: { x: number; y: number } };
  phoneSlideIn: number; // px the frame travels in the intro
  /** how full-bleed vertical footage fills the canvas */
  fullBleed: 'cover' | 'pillar';
  /** centre x of the full-height pillar (wide only) */
  pillarCenterX?: number;
  hookCaptionSize: number;
  /** box position for the intro's first (close-up) line, when it must not cover the face */
  introBox?: BoxGeo;
  /** full-bleed: where the box goes while the file is up (top, over the app header, so the card and AVOID stay clear) */
  reportBox?: BoxGeo;
  outro: {
    logo: Rect;
    tagline: { top: number; left: number; width: number; size: number };
    sub: { top: number; left: number; width: number; size: number };
    /** "IT'S YOUR MOVE 🤘🏽" as part of the lockup (white) */
    move?: { top: number; left: number; width: number; size: number };
    lift: number;
    /** dialogue box on the end card; omitted = no box (the line still times the panel) */
    box?: BoxGeo;
    clark?: Placement;
    pile?: Rect;
  };
};

const faceAt = (cx: number, cy: number, scale: number, asset: { faceX: number; faceY: number }): Placement => ({
  left: cx - asset.faceX * scale,
  top: cy - asset.faceY * scale,
  scale,
});

const FULL_ASSET = { w: 497, h: 1191, faceX: 300, faceY: 190 };

export const VERTICAL: Layout = {
  mode: 'vertical',
  stage: 'phone',
  w: W,
  h: H,
  phone: { left: PHONE_LEFT, top: PHONE.top, width: PHONE.width, height: PHONE.height },
  box: { left: BOX.side, bottom: BOX.bottom, width: W - BOX.side * 2, minHeight: BOX.minHeight, fontSize: BOX.fontSize, tail: false },
  clark:
    VERTICAL_CLARK_MODE === 'body'
      ? {
          asset: 'full',
          assetSize: FULL_ASSET,
          placement: { left: CLARK_BODY.left, top: CLARK_BODY.top, scale: CLARK_BODY.scale },
          closeup: faceAt(540, 820, 2.3, FULL_ASSET),
          clipBottom: BOX_TOP + 24,
          slideOff: -1200,
        }
      : {
          asset: 'bust',
          assetSize: CLARK_ASSET,
          placement: { left: CLARK.left, top: CLARK.top, scale: CLARK.scale },
          closeup: faceAt(540, 820, CLARK_CLOSEUP_SCALE, CLARK_ASSET),
          clipBottom: BOX_TOP + 24,
          slideOff: -1200,
          feather: true,
        },
  pile: { left: -40, top: 1430, width: 600, height: 150 },
  folder: { from: { x: 330, y: 1470 }, to: { x: PHONE_LEFT + PHONE.width / 2, y: PHONE.top + PHONE.height / 2 } },
  phoneSlideIn: 980,
  fullBleed: 'cover',
  hookCaptionSize: 112,
  // End card = the wide's lockup stacked: logo, tagline, price/URL, "IT'S YOUR MOVE",
  // then Clark standing under it with the pile at his feet. No dialogue box (Sep 28).
  outro: {
    logo: { left: 190, top: 130, width: 700, height: Math.round((700 * 827) / 1466) },
    tagline: { top: 590, left: 0, width: W, size: 66 },
    sub: { top: 790, left: 40, width: W - 80, size: 30 },
    move: { top: 930, left: 0, width: W, size: 58 },
    lift: 0,
    clark:
      VERTICAL_CLARK_MODE === 'body'
        ? { left: -20, top: 1010, scale: 0.8 } // smaller, further left, most of the body in frame (creator, Sep 29)
        : { left: CLARK_OUTRO.left, top: CLARK_OUTRO.top, scale: CLARK_OUTRO.scale },
    pile: { left: -60, top: 1775, width: 560, height: 130 }, // a mound at his feet (it was scattered across his chest)
  },
};

// 16:9 — Clark full height on the left (legs run off the bottom), device frame
// right at 86% height, the box between them at his chest.
const WPH = { height: 864, width: Math.round((864 * 1206) / 2268), top: 60, left: 0 };
WPH.left = 1920 - 40 - WPH.width;
const WCLARK = { left: 20, top: -12, scale: 1.02 }; // 1215 px tall
const WBOX: BoxGeo = { left: 590, top: 380, width: WPH.left - 590 - 40, minHeight: 230, fontSize: 48 }; // 42 → 48 (Sep 29)
export const WIDE: Layout = {
  mode: 'wide',
  stage: 'phone',
  w: 1920,
  h: 1080,
  phone: WPH,
  box: { ...WBOX, fontSize: 48, tail: false },
  clark: {
    asset: 'full',
    assetSize: FULL_ASSET,
    placement: WCLARK,
    closeup: faceAt(1000, 380, 2.3, FULL_ASSET),
    clipBottom: 1080,
    slideOff: -900,
  },
  pile: { left: -20, top: 880, width: 640, height: 180 },
  folder: { from: { x: 330, y: 520 }, to: { x: WPH.left + WPH.width / 2, y: WPH.top + WPH.height / 2 } },
  phoneSlideIn: 900,
  fullBleed: 'pillar',
  pillarCenterX: WPH.left + WPH.width / 2,
  hookCaptionSize: 104,
  introBox: { left: 70, top: 700, width: 1060, minHeight: 220, fontSize: 48 },
  outro: {
    logo: { left: 1120, top: 150, width: 540, height: Math.round((540 * 827) / 1466) },
    tagline: { top: 500, left: 820, width: 1060, size: 60 },
    sub: { top: 680, left: 820, width: 1060, size: 26 },
    move: { top: 680 + 130, left: 820 + 8, width: 1060, size: 54 }, // +8: optically centred (creator nudge)
    lift: 0,
  },
};

// Full-bleed vertical alt (creator, Sep 29): the capture fills the canvas at its native
// scale (only the 5% aspect sliver is cropped, top/centre/bottom per beat, never zoomed or
// stretched). Clark is the full body BEHIND the box, head where the first proof's bust sat
// (face ≈ 200, 1285), body running on behind the box so no cut edge ever shows. Report
// beats (the card is up) drop the box and Clark glitches out. Each scene is its own composition.
const FBOX: BoxGeo = { left: 24, bottom: 24, width: W - 48, minHeight: 340, fontSize: 58 };
const FCLARK: Placement = { left: -100, top: 1095, scale: 1.0 }; // 497 px wide, face ≈ (200, 1285)
export const FULL: Layout = {
  ...VERTICAL,
  mode: 'full',
  stage: 'full',
  phone: { left: 0, top: 0, width: W, height: H },
  box: { ...FBOX, fontSize: 58, tail: false },
  introBox: { left: 24, bottom: 24, width: W - 48, minHeight: 340, fontSize: 58 }, // live Clark is in the scene
  reportBox: { left: 24, top: 182, width: W - 48, minHeight: 0, fontSize: 54 }, // just under the app title bar, which stays whole
  clark: { asset: 'full', assetSize: FULL_ASSET, placement: FCLARK, closeup: faceAt(540, 820, 2.3, FULL_ASSET), clipBottom: H, slideOff: -1200 },
  pile: { left: -40, top: 1400, width: 560, height: 200 }, // lands at his chest, above the box
  folder: { from: { x: 200, y: 1300 }, to: { x: W / 2, y: H / 2 } },
};
/** report beats: Clark glitches out over this many frames, then is gone (creator: "getting out of the way") */
export const REPORT_GLITCH_FRAMES = 10;

const LayoutCtx = createContext<Layout>(VERTICAL);
export const LayoutProvider: React.FC<{ layout: Layout; children: React.ReactNode }> = ({ layout, children }) => (
  <LayoutCtx.Provider value={layout}>{children}</LayoutCtx.Provider>
);
export const useLayout = (): Layout => useContext(LayoutCtx);
