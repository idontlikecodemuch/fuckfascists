import React from 'react';
import { Audio, useVideoConfig } from 'remotion';
import { musicSrc } from '../clips';
import type { Cut } from '../timing';

type Range = { from: number; to: number };
const BED_GAIN = 0.42; // bed −16 LUFS → about −23.5; VO is −18 LUFS
const DUCK = 0.2; // −14 dB under VO
const FADE_S = 1.5;

export const Music: React.FC<{ cut: Cut; totalFrames: number; duck: Range[] }> = ({ cut, totalFrames, duck }) => {
  const { fps } = useVideoConfig();
  const fade = Math.round(FADE_S * fps);
  return (
    <Audio
      src={musicSrc(cut)}
      volume={(f) => {
        let v = BED_GAIN;
        if (duck.some((r) => f >= r.from - 6 && f < r.to + 6)) v *= DUCK;
        if (f > totalFrames - fade) v *= Math.max(0, (totalFrames - f) / fade);
        return v;
      }}
    />
  );
};
