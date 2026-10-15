import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { T } from '../tokens';
import { HEADER_H, HEADER_W, SAFE, StoreHeader, type HeaderVariant } from './StoreHeader';

/**
 * App Store product-page header VIDEO (21:9, 3840×1646, 15 s, loops): the universal still
 * scaled into the header crop with a slow periodic pan; the still animates itself in `loop`
 * mode (bobbing phones, drifting stars and map, money on whole cycles). Frame LOOP == frame 0.
 * Apple: 5–30 s, 30 or 60 fps, muted first, "avoid quick cuts and fast-moving visuals".
 */
export const VIDEO_W = 3840;
export const VIDEO_H = 1646;
export const LOOP = 450; // 15 s @ 30 fps
const S = VIDEO_W / HEADER_W; // 0.7323
const CROP_TOP = SAFE.top; // the 21:9 band of the universal canvas

export const HeaderVideo: React.FC<{ variant: HeaderVariant }> = ({ variant }) => {
  const frame = useCurrentFrame();
  const ph = (2 * Math.PI * frame) / LOOP;
  const panX = 34 * Math.sin(ph); // universal px; both whole cycles, so the loop closes
  const panY = 16 * Math.sin(ph + 2.2);
  return (
    <AbsoluteFill style={{ background: T.void, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: HEADER_W, height: HEADER_H, transform: `scale(${S}) translate(${-panX}px, ${-CROP_TOP - panY}px)`, transformOrigin: '0 0' }}>
        <StoreHeader variant={variant} target="header" loop={LOOP} />
      </div>
    </AbsoluteFill>
  );
};
