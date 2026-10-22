import React from 'react';
import { AbsoluteFill, Audio, Easing, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { FULL, LayoutProvider } from '../LayoutContext';
import { LOGO, clipSrc } from '../clips';
import clipDims from '../data/clipDims.json';
import { CrtBlink } from '../components/CrtBlink';
import { MoneyRain } from '../components/MoneyRain';
import { Starfield } from '../components/Starfield';
import { useFonts } from '../fonts';
import { FONT, T } from '../tokens';
import { Flash, H, Slam, W, useHits } from './kinetic';
import { BAR, BEAT, STING } from './Release';

/**
 * "Free until Election Day" promo, 15 s, 9:16 (Oct 22, 2026). Same kinetic system as the
 * release cut on a short "free" bed (compose.py --style free): sting, hook bar, FREE hit,
 * tap / scan / track over real footage, the money bar, a riser, the tagline on the end hit.
 * Copy rules: "free" allowed, no price, no party words, no drop hours, ends on the tagline.
 */
/** absolute frame of `beat` in bar `bar` (bar 1 = the hook bar, right after the sting) */
const fb = (bar: number, beat = 0): number => STING + (bar - 1) * BAR + Math.round(beat * BEAT);
export const FREE_FRAMES = fb(9) + 12; // 432 = 14.4 s (the end hit rings out)
const MUSIC = 'media/music/fck_bed_free_15s.mp3';
const BED_GAIN = 0.42;

const ClipBurst: React.FC<{ at: number; until: number; file: string; startFrom: number; align?: 'top' | 'bottom'; dim?: number }> = ({ at, until, file, startFrom, align = 'top', dim = 0.45 }) => {
  const { fps } = useVideoConfig();
  const dims = (clipDims as Record<string, { w: number; h: number }>)[file] ?? { w: 1080, h: 1920 };
  const h = Math.round((W * dims.h) / dims.w);
  const top = align === 'bottom' ? -Math.max(0, h - H) : 0;
  return (
    <Sequence from={at} durationInFrames={until - at} name={`burst ${file}`}>
      <AbsoluteFill style={{ background: T.void }}>
        <OffthreadVideo src={clipSrc(file)} muted startFrom={Math.round(startFrom * fps)} style={{ position: 'absolute', left: 0, top, width: W, height: h }} />
        <AbsoluteFill style={{ background: `rgba(7,11,18,${dim})` }} />
      </AbsoluteFill>
    </Sequence>
  );
};

const Logo: React.FC<{ at: number; until?: number; top: number; width: number }> = ({ at, until, top, width }) => {
  const frame = useCurrentFrame();
  const t = frame - at;
  if (t < 0 || (until != null && frame >= until)) return null;
  const s = interpolate(t, [0, 4], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const settle = t < 4 ? 1 : interpolate(t, [4, 7], [0.97, 1], { extrapolateRight: 'clamp' });
  return <Img src={LOGO} style={{ position: 'absolute', left: (W - width) / 2, top, width, imageRendering: 'pixelated', transform: `scale(${(1.8 - 0.8 * s) * settle})`, opacity: Math.min(1, (t + 1) / 2), filter: 'drop-shadow(0 0 30px rgba(95,174,255,0.35))' }} />;
};

const SECTIONS = [fb(2), fb(3), fb(4), fb(5), fb(6), fb(7), fb(8)];
const HITS: Array<[number, number]> = [
  [0, 30], [12, 18],
  [fb(2), 34], [fb(2, 2), 14],
  [fb(3), 16], [fb(4), 16], [fb(5), 16],
  [fb(6), 20], [fb(6, 2), 12],
  [fb(7), 14], [fb(7, 2), 10],
  [fb(8), 30],
];

export const Free15: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame();
  const shake = useHits(HITS);
  return (
    <LayoutProvider layout={FULL}>
      <AbsoluteFill style={{ background: T.void }}>
        <Starfield />
        <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px) scale(${shake.zoom})`, transformOrigin: '50% 45%' }}>
          {/* OPEN — logo + hook line (bar 1) */}
          <MoneyRain burst count={22} seed="open" startFrame={0} />
          <Logo at={0} until={fb(2)} top={430} width={820} />
          <Slam at={12} until={fb(2)} text={'SEE WHERE\nTHE MONEY GOES.'} size={104} top={1120} />

          {/* FREE — bar 2 */}
          <Slam at={fb(2)} until={fb(3)} text="FREE." size={330} top={560} />
          <Slam at={fb(2, 2)} until={fb(3)} text={'UNTIL\nELECTION DAY.'} size={110} color={T.cream} top={980} />
          <MoneyRain burst count={26} seed="free" startFrame={fb(2)} />

          {/* TAP / SCAN / TRACK — bars 3–5, real footage behind the type */}
          <ClipBurst at={fb(3)} until={fb(4)} file="60_03_map_pins" startFrom={0.4} />
          <Slam at={fb(3)} until={fb(4)} text="TAP A BUSINESS." size={120} top={760} />
          <ClipBurst at={fb(4)} until={fb(5)} file="scan_clorox" startFrom={1.0} align="bottom" />
          <Slam at={fb(4)} until={fb(5)} text="SCAN A PRODUCT." size={120} top={760} />
          <ClipBurst at={fb(5)} until={fb(6)} file="60_06_track_grid" startFrom={2.6} />
          <Slam at={fb(5)} until={fb(6)} text={'TRACK THE\nPLATFORMS YOU USE.'} size={100} top={700} />

          {/* MONEY — bar 6: the real reveal behind the line */}
          <ClipBurst at={fb(6)} until={fb(7)} file="60_12_drop" startFrom={0.9} dim={0.55} />
          {frame >= fb(6) ? <MoneyRain count={22} seed="free-drop" startFrame={fb(6)} /> : null}
          <Slam at={fb(6)} until={fb(7)} text={'SEE WHERE\nTHE MONEY GOES.'} size={110} top={700} />

          {/* FREE THROUGH NOV 3 — bar 7 (riser) */}
          <Logo at={fb(7)} top={280} width={640} />
          <Slam at={fb(7)} text={'FREE\nTHROUGH NOV 3.'} size={100} top={790} />
          <Slam at={fb(7, 2)} text={'ON THE APP STORE · NO ACCOUNTS · NO TRACKING\n@fckfascists.app'} size={30} color={T.cyan} font="body" weight={500} letterSpacing={4} lineHeight={1.6} top={1040} glow={false} />

          {/* END — bar 8: the tagline on the hit */}
          <Slam at={fb(8)} text={"THE FASCISTS WON'T\nFCK THEMSELVES."} size={76} top={1290} />
          <Slam at={fb(8, 2)} text="🤘🏽" size={120} top={1500} glow={false} />
        </AbsoluteFill>
        {[0, 12, fb(2), fb(3), fb(4), fb(5), fb(6), fb(7), fb(8)].map((f) => (
          <Flash key={`fl-${f}`} at={f} frames={3} peak={f === fb(2) ? 0.5 : 0.28} />
        ))}
        {SECTIONS.map((f) => (
          <Sequence key={`crt-${f}`} from={f - 1} durationInFrames={3} name="CRT blink">
            <CrtBlink />
          </Sequence>
        ))}
        <Audio src={staticFile(MUSIC)} volume={(f) => (f > FREE_FRAMES - 24 ? BED_GAIN * Math.max(0, (FREE_FRAMES - f) / 24) : BED_GAIN)} />
      </AbsoluteFill>
    </LayoutProvider>
  );
};
