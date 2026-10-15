import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { FULL, LayoutProvider } from '../LayoutContext';
import { LOGO, NUDGE, clipSrc } from '../clips';
import clipDims from '../data/clipDims.json';
import webCaptures from '../data/webCaptures.json';
import { CrtBlink } from '../components/CrtBlink';
import { MoneyRain } from '../components/MoneyRain';
import { Notification } from '../components/Notification';
import { Starfield } from '../components/Starfield';
import { useFonts } from '../fonts';
import { FONT, T } from '../tokens';
import { Barcode, BigX, CountUp, Flash, H, RED, Slam, SpriteBust, Stamp, Strike, W, WebScroll, useHits } from './kinetic';

/**
 * 1.2 release cut, kinetic type (creator, Oct 14: "a different style, more type focused,
 * different music, show some of the new sprites, a big X, screenshots of the home
 * products, generally more dynamic"). One flat timeline on the music's beat grid:
 * the "drive" bed is 150 bpm = 12 frames a beat, 48 a bar, after a 3-beat sting.
 * Lines come from marketing/notes/script-1.2-whats-new.md, set as type.
 */
export const BEAT = 12;
export const BAR = 48;
export const STING = 36;
/** absolute frame of `beat` (0–3, fractions ok) in bar `bar` (bars count from 2 after the sting) */
export const b = (bar: number, beat = 0): number => STING + (bar - 2) * BAR + Math.round(beat * BEAT);
export const RELEASE_FRAMES = b(21); // 948 = 31.6 s
export const MUSIC = 'media/music/fck_bed_hardcore_32s.mp3'; // Oct 15: hardcore over the same grid (compose.py --style hardcore)

/** Brand product pages, captured tall in the browser (scripts/web-captures.sh): "scrolling the products on a website". */
const WEB = webCaptures as Record<string, { file: string; w: number; h: number }>;

/** A short burst of real app footage, full-bleed (mixed media): fit the width, crop the overhang from the spare edge, slow punch-in. */
const ClipBurst: React.FC<{ at: number; until: number; file: string; startFrom: number; align?: 'top' | 'bottom'; dim?: number }> = ({ at, until, file, startFrom, align = 'top', dim = 0.35 }) => {
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
/** twelve of the 49 new sprites, household names first */
const FACES: Array<[id: string, label: string]> = [
  ['john-furner', 'Walmart'], ['michael-fiddelke', 'Target'], ['ramon-laguarta', 'PepsiCo'],
  ['dirk-van-de-put', 'Mondelez'], ['shailesh-jejurikar', 'P&G'], ['greg-foran', 'Kroger'],
  ['josh-damaro', 'Disney'], ['srini-gopalan', 'T-Mobile'], ['enrique-lores', 'PayPal'],
  ['mike-motz', 'Walgreens'], ['kirk-tanner', 'Hershey'], ['jeff-harmening', 'General Mills'],
];
const SECTIONS = [b(2), b(4), b(8), b(10), b(12), b(15), b(16), b(18), b(19)];
const HITS: Array<[number, number]> = [
  [0, 22], [14, 22],
  [b(2), 12], [b(3), 16], [b(3, 2), 10],
  [b(4, 1), 14], [b(4, 3), 14], [b(5, 1), 14], [b(5, 3), 14], [b(6, 1), 18], [b(7, 1), 24],
  [b(8), 12], [b(9), 14], [b(9, 2), 18],
  [b(10, 3), 16], [b(11, 1), 12],
  [b(14), 16], [b(15), 12], [b(15, 2), 34],
  [b(16), 10], [b(16, 2), 10],
  [b(18), 18], [b(19), 16],
];
const BED_GAIN = 0.42;

const Logo: React.FC<{ at: number }> = ({ at }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 12, stiffness: 220, mass: 0.8 } });
  return <Img src={LOGO} style={{ position: 'absolute', left: (W - 720) / 2, top: 380, width: 720, imageRendering: 'pixelated', transform: `scale(${0.5 + 0.5 * s})`, opacity: Math.min(1, s * 1.6), filter: 'drop-shadow(0 0 30px rgba(95,174,255,0.35))' }} />;
};

export const Release: React.FC = () => {
  useFonts();
  const frame = useCurrentFrame(); // one hook call, unconditionally (React #310 otherwise)
  const shake = useHits(HITS);
  const nudgeOn = frame >= b(16) && frame < b(18);
  return (
    <LayoutProvider layout={FULL}>
      <AbsoluteFill style={{ background: T.void }}>
        <Starfield />
        {nudgeOn ? <AbsoluteFill style={{ background: 'rgba(7,11,18,0.55)' }} /> : null}
        <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px) scale(${shake.zoom})`, transformOrigin: '50% 45%' }}>
          {/* OPEN — the sting */}
          <Slam at={0} until={b(2)} text="UPDATE 1.2" size={150} color={T.cyan} top={700} />
          <Slam at={14} until={b(2)} text="NEW FILES." size={200} top={870} />

          {/* FILES — bars 2–3 */}
          <CountUp at={b(2)} until={b(4)} to={761} frames={30} size={420} top={520} />
          <Slam at={b(3)} until={b(4)} text={'COMPANIES\nON FILE.'} size={120} color={T.cream} top={980} />
          <Slam at={b(3, 1)} until={b(4)} text={'1,097 DONORS & EXECUTIVES\nEVERY RECORD REFRESHED OCT 12'} size={44} color={T.cyan} font="body" weight={600} letterSpacing={4} lineHeight={1.5} top={1290} glow={false} />

          {/* HOUSEHOLD — bars 4–7 */}
          <Slam at={b(4)} until={b(8)} text="NOW ON FILE:" size={54} color={T.cyan} font="body" weight={600} letterSpacing={6} top={300} glow={false} />
          <Slam at={b(4, 1)} until={b(8)} text="WINDEX" size={150} top={400} />
          <Slam at={b(4, 3)} until={b(8)} text="CLOROX" size={150} top={570} />
          <Slam at={b(5, 1)} until={b(8)} text="HEFTY" size={150} top={740} />
          <Slam at={b(5, 3)} until={b(8)} text="GREAT VALUE" size={130} top={910} />
          <Slam at={b(6, 1)} until={b(8)} text="THAT'S WALMART." size={96} color={T.cyan} top={1080} />
          <WebScroll at={b(4, 1)} until={b(6)} file={WEB.windex.file} w={WEB.windex.w} h={WEB.windex.h} top={1240} frameW={640} frameH={760} rotate={-6} />
          <WebScroll at={b(6)} until={b(8)} file={WEB.clorox.file} w={WEB.clorox.w} h={WEB.clorox.h} top={1240} frameW={640} frameH={760} rotate={5} />
          <Stamp at={b(7, 1)} until={b(8)} text="ON FILE" top={1560} />

          {/* OWNERS — bars 8–9 */}
          <Slam at={b(8)} until={b(10)} text={'BRANDS FOLLOW\nTHEIR OWNERS.'} size={88} color={T.cream} top={420} />
          <Slam at={b(8, 2)} until={b(10)} text="BEN & JERRY'S" size={96} top={760} />
          <Strike at={b(9)} until={b(10)} top={812} left={110} width={860} rotate={-2} />
          <Slam at={b(9, 1)} until={b(10)} text="FILED UNDER" size={48} color={T.cyan} font="body" weight={600} letterSpacing={6} top={920} glow={false} />
          <Slam at={b(9, 2)} until={b(10)} text="MAGNUM" size={190} top={990} />

          {/* SCAN — bars 10–11 (mixed media: the real barcode lock for the last two beats) */}
          <ClipBurst at={b(11, 2)} until={b(12)} file="30_05_scan" startFrom={0.7} align="bottom" dim={0.5} />
          <Barcode at={b(10)} until={b(12)} top={520} sweepAt={b(10, 1)} lockAt={b(10, 3)} />
          <Slam at={b(10, 3)} until={b(12)} text="SHORT BARCODES." size={90} top={940} />
          <Slam at={b(11, 1)} until={b(12)} text="CLOSER FOCUS." size={100} color={T.cyan} top={1080} />
          <Slam at={b(11, 3)} until={b(12)} text="SMALL LABELS LOCK FASTER." size={46} color={T.cream} font="body" weight={600} letterSpacing={4} top={1240} glow={false} />

          {/* FACES — bars 12–14 */}
          {FACES.map(([id, label], i) => (
            <SpriteBust key={id} at={b(12) + i * 5} until={b(15)} id={id} label={label} left={110 + (i % 3) * 300} top={300 + Math.floor(i / 3) * 330} size={260} />
          ))}
          <Slam at={b(14)} until={b(15)} text="49 NEW FACES." size={120} top={1610} />

          {/* THE X — bar 15 */}
          <Slam at={b(15)} until={b(16)} text="STILL NO SPRITE?" size={110} color={T.cream} top={460} />
          <BigX at={b(15, 2)} until={b(16)} size={760} top={700} />
          <Flash at={b(15, 2)} color={RED} frames={5} peak={0.5} />
          <Slam at={b(15, 3)} until={b(16)} text="RED X." size={170} color={RED} top={1560} />

          {/* NUDGE — bars 16–17 */}
          {nudgeOn ? (
            <>
              <div style={{ position: 'absolute', top: 260, left: 40, width: W - 80 }}>
                <Notification width={W - 80} scale={1.25} startFrame={b(16)} title={NUDGE.monday.title} body={NUDGE.monday.body} />
              </div>
              <div style={{ position: 'absolute', top: 540, left: 40, width: W - 80 }}>
                <Notification width={W - 80} scale={1.25} startFrame={b(16, 2)} title={NUDGE.taco.title} body={NUDGE.taco.body} />
              </div>
            </>
          ) : null}
          <Slam at={b(17)} until={b(18)} text={'A NUDGE LANDS\nMONDAY OR TUESDAY.'} size={78} top={880} />
          <Slam at={b(17, 2)} until={b(18)} text="TAP IT. THE RIGHT TAB OPENS." size={46} color={T.cyan} font="body" weight={600} letterSpacing={4} top={1110} glow={false} />

          {/* DROP — bar 18 (the real reveal behind the type) */}
          <ClipBurst at={b(18)} until={b(19)} file="60_12_drop" startFrom={0.9} align="top" dim={0.45} />
          {frame >= b(18) ? <MoneyRain count={40} seed="release-drop" startFrame={b(18)} /> : null}
          <Slam at={b(18)} until={b(19)} text="RANDOM DROP" size={115} top={600} />
          <Slam at={b(18, 1.5)} until={b(19)} text={'BETWEEN FRIDAY\nAND SATURDAY.'} size={88} color={T.cream} top={760} />

          {/* END — bars 19–20 */}
          <Logo at={b(19)} />
          <Slam at={b(19, 1)} text="UPDATE OUT NOW" size={96} top={990} />
          <Slam at={b(19, 2)} text={'NO ADS · NO TRACKING\nFCKapp.com · @fckfascists.app'} size={36} color={T.cyan} font="body" weight={500} letterSpacing={5} lineHeight={1.6} top={1130} glow={false} />
          <Slam at={b(20)} text="IT'S YOUR MOVE 🤘🏽" size={72} color="#FFFFFF" top={1300} />
        </AbsoluteFill>
        {/* white flash frames on the heavy hits */}
        {[0, 14, b(4, 1), b(7, 1), b(9, 2), b(10, 3), b(14), b(15, 2), b(18), b(19)].map((f) => (
          <Flash key={`fl-${f}`} at={f} frames={3} peak={0.28} />
        ))}
        {SECTIONS.map((f) => (
          <Sequence key={`crt-${f}`} from={f - 1} durationInFrames={3} name="CRT blink">
            <CrtBlink />
          </Sequence>
        ))}
        <Audio src={staticFile(MUSIC)} volume={(f) => (f > RELEASE_FRAMES - 36 ? BED_GAIN * Math.max(0, (RELEASE_FRAMES - f) / 36) : BED_GAIN)} />
      </AbsoluteFill>
    </LayoutProvider>
  );
};
