import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion';
import { FULL, LayoutProvider } from '../LayoutContext';
import { CLARK_BUST, LOGO_H } from '../clips';
import { useIdleBob } from '../components/Clark';
import { MoneyRain } from '../components/MoneyRain';
import { Starfield } from '../components/Starfield';
import { useFonts } from '../fonts';
import { T } from '../tokens';
import { Flash, Slam, useHits } from '../release/kinetic';
import type { FreeVariant } from './FreeStill';

/**
 * Motion versions of the free-window stills (social went video-only, Oct 22, 2026): 9:16,
 * 7 s, same layout as FreeStill's story, the pieces slam in on the "free" bed's 7 s cut
 * (sting, hook, the FREE hit, end hit), money falls throughout, Clark idles, the last
 * frame holds. Key text stays inside the centre 1080×1440 so the Reel-on-grid crop keeps it.
 */
export const FREE_MOTION_FRAMES = 210; // 7.0 s @ 30 fps
const W = 1080;
const H = 1920;
const STING = 36;
const HOOK = 36;
const HIT = 84; // the FREE bar
const END = 132; // the end hit; held to 210
const MUSIC = 'media/music/fck_bed_free_7s.mp3';
const BED_GAIN = 0.42;
const HEADLINE: Record<FreeVariant, string> = { free: 'FREE UNTIL\nELECTION DAY', weekend: 'LAST WEEKEND\nFREE', lastdays: 'LAST DAYS\nFREE' };
const HEAD_SIZE: Record<FreeVariant, number> = { free: 114, weekend: 114, lastdays: 150 }; // Slam's column is 1000 wide here; two lines, never three
const HITS: Array<[number, number]> = [[0, 24], [HOOK, 16], [HIT, 22], [END, 26]];

const ClarkIdle: React.FC = () => {
  const frame = useCurrentFrame();
  const bob = useIdleBob();
  const w = 800;
  const rise = interpolate(frame, [0, 14], [160, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  return <Img src={CLARK_BUST} style={{ position: 'absolute', left: (W - w) / 2 + 210, top: H - Math.round(w * 0.92) + rise + bob, width: w, imageRendering: 'pixelated', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.6))' }} />;
};

const LogoSlam: React.FC = () => {
  const frame = useCurrentFrame();
  const s = interpolate(frame, [0, 4], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const settle = frame < 4 ? 1 : interpolate(frame, [4, 7], [0.97, 1], { extrapolateRight: 'clamp' });
  return <Img src={LOGO_H} style={{ position: 'absolute', left: (W - 560) / 2, top: 300, width: 560, imageRendering: 'pixelated', transform: `scale(${(1.8 - 0.8 * s) * settle})`, opacity: Math.min(1, (frame + 1) / 2), filter: 'drop-shadow(0 0 24px rgba(95,174,255,0.35))' }} />;
};

export const FreeMotion: React.FC<{ variant: FreeVariant }> = ({ variant }) => {
  useFonts();
  const shake = useHits(HITS);
  const headSize = HEAD_SIZE[variant];
  const headTop = 520;
  const subTop = headTop + headSize * 2 + 34;
  const verbsTop = subTop + 56 + 34;
  return (
    <LayoutProvider layout={FULL}>
      <AbsoluteFill style={{ width: W, height: H, background: T.void, overflow: 'hidden' }}>
        <Starfield />
        <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px) scale(${shake.zoom})`, transformOrigin: '50% 45%' }}>
          <MoneyRain count={18} seed={`motion-${variant}`} startFrame={0} />
          <MoneyRain burst count={24} seed={`motion-hit-${variant}`} startFrame={HIT} />
          <ClarkIdle />
          <LogoSlam />
          <Slam at={HOOK} text={HEADLINE[variant]} size={headSize} top={headTop} left={40} width={1000} />
          <Slam at={HOOK + 24} text="THROUGH NOV 3" size={46} color={T.cyan} font="body" weight={600} letterSpacing={8} top={subTop} glow={false} />
          <Slam at={HIT} text={'Tap a business. Scan a product.\nTrack the platforms you use.'} size={42} color={T.cream} font="body" weight={600} letterSpacing={1} lineHeight={1.3} top={verbsTop} glow={false} />
          <Slam at={END} text="@fckfascists.app" size={30} color={T.cyan} font="body" weight={600} letterSpacing={4} align="left" left={60} width={600} top={1510} glow={false} />
        </AbsoluteFill>
        <Flash at={0} frames={3} peak={0.28} />
        <Flash at={HIT} frames={3} peak={0.4} />
        <Flash at={END} frames={3} peak={0.28} />
        <Audio src={staticFile(MUSIC)} volume={BED_GAIN} />
      </AbsoluteFill>
    </LayoutProvider>
  );
};
