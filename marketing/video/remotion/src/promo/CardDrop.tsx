import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { FULL, LayoutProvider } from '../LayoutContext';
import { MoneyRain } from '../components/MoneyRain';
import { Starfield } from '../components/Starfield';
import { useFonts } from '../fonts';
import { T } from '../tokens';
import { Flash, Slam, useHits } from '../release/kinetic';

/**
 * Scorecard drop template (social, Oct 22, 2026): any 1080×1920 card JPG in
 * (public/media/scorecards/<card>), a ~13 s 9:16 clip out. Hook → the card slams in with a
 * gold halo and money → a slow push over the I FCK'D line and the sprites → end card with the
 * drop line, the handle, FREE THROUGH NOV 3 during the window, then the tagline on the hit.
 * Music: the "free" bed's 12 s cut (sting, hook, three bars, blast, riser, end hit).
 * No hours, no price. Render per card with --props='{"card":"<file>","free":true}'.
 */
export const CARD_DROP_FRAMES = 387; // 12.9 s @ 30 fps
const W = 1080;
const H = 1920;
const HOOK = 36;
const SLAM = 84; // card in
const BLAST = 228; // money bar
const RISER = 276; // end card lines
const END = 324; // the hit: tagline
const MUSIC = 'media/music/fck_bed_free_12s.mp3';
const BED_GAIN = 0.42;
const CARD_W = 820;
const CARD_H = Math.round((CARD_W * 1920) / 1080);
const HITS: Array<[number, number]> = [[0, 24], [HOOK, 14], [HOOK + 24, 14], [SLAM, 34], [BLAST, 18], [RISER, 14], [END, 30]];

const Card: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  const t = frame - SLAM;
  if (t < 0) return null;
  const inS = interpolate(t, [0, 4], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const settle = t < 4 ? 1 : interpolate(t, [4, 7], [0.97, 1], { extrapolateRight: 'clamp' });
  // the slow push: from the settle to the riser, over the hero line and the top rows of sprites
  const push = interpolate(frame, [SLAM + 8, RISER], [1, 1.3], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });
  // out: drop and fade at the riser so the end card has the frame
  const out = interpolate(frame, [RISER, RISER + 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) });
  const scale = (1.8 - 0.8 * inS) * settle * push;
  return (
    <div style={{ position: 'absolute', left: (W - CARD_W) / 2, top: (H - CARD_H) / 2 + out * 1200, width: CARD_W, height: CARD_H, transform: `scale(${scale})`, transformOrigin: '50% 36%', opacity: Math.min(1, (t + 1) / 2) * (1 - out), borderRadius: 18, overflow: 'hidden', boxShadow: '0 0 0 4px rgba(255,201,60,0.9), 0 0 60px rgba(255,201,60,0.55), 0 0 160px rgba(255,201,60,0.35), 0 40px 90px rgba(0,0,0,0.7)' }}>
      <Img src={src} style={{ display: 'block', width: CARD_W, height: CARD_H }} />
    </div>
  );
};

export const CardDrop: React.FC<{ card: string; free: boolean }> = ({ card, free }) => {
  useFonts();
  const shake = useHits(HITS);
  const src = staticFile(`media/scorecards/${card}`);
  return (
    <LayoutProvider layout={FULL}>
      <AbsoluteFill style={{ width: W, height: H, background: T.void, overflow: 'hidden' }}>
        <Starfield />
        <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px) scale(${shake.zoom})`, transformOrigin: '50% 45%' }}>
          <MoneyRain burst count={18} seed="card-open" startFrame={0} />
          {/* HOOK — bar 1 */}
          <Slam at={HOOK} until={SLAM} text="YOUR WEEK." size={120} top={700} />
          <Slam at={HOOK + 24} until={SLAM} text="ONE CARD." size={120} top={850} color={T.cream} />
          {/* THE CARD — slams in, money, the push */}
          <MoneyRain burst count={28} seed="card-slam" startFrame={SLAM} />
          <MoneyRain burst count={20} seed="card-blast" startFrame={BLAST} />
          <Card src={src} />
          {/* END CARD — riser: the drop line, the handle, the free line; the tagline on the hit */}
          <Slam at={RISER} text={'RANDOM DROP\nBETWEEN FRIDAY\nAND SATURDAY.'} size={86} top={420} />
          <Slam at={RISER + 12} text="@fckfascists.app" size={34} color={T.cyan} font="body" weight={600} letterSpacing={5} top={760} glow={false} />
          {free ? <Slam at={RISER + 24} text="FREE THROUGH NOV 3" size={64} color={T.cream} top={860} /> : null}
          <Slam at={END} text={"THE FASCISTS WON'T\nFCK THEMSELVES."} size={76} top={1190} />
          <Slam at={END + 12} text="🤘🏽" size={120} top={1400} glow={false} />
          <MoneyRain burst count={16} seed="card-end" startFrame={END} />
        </AbsoluteFill>
        <Flash at={0} frames={3} peak={0.28} />
        <Flash at={SLAM} frames={4} peak={0.5} />
        <Flash at={END} frames={3} peak={0.32} />
        <Audio src={staticFile(MUSIC)} volume={BED_GAIN} />
      </AbsoluteFill>
    </LayoutProvider>
  );
};

