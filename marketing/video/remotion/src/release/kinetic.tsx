import React from 'react';
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import manifest from '../data/spriteManifest.json';
import { FONT, T } from '../tokens';

/**
 * Kinetic-type building blocks for the 1.2 release cut (creator, Oct 14: "more type focused,
 * more dynamic"). Every element takes absolute frames: `at` (slam in) and `until` (hard out),
 * so the piece is one flat timeline on the beat grid in Release.tsx — no Sequences, no Clark.
 */
export const W = 1080;
export const H = 1920;
export const RED = '#FF3B3B';

type Sheet = { file: string; grid: { cols: number; rows: number }; frameWidth: number; frameHeight: number; frames: Record<string, { col: number; row: number }> };
const SHEETS = (manifest as { sprites: Record<string, Sheet> }).sprites;

export const hexA = (hex: string, a: number): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

/**
 * Hard slam (creator, Oct 15: less bounce, "more like a slam"): 4 frames in on a cubic
 * ease-out, then a one-step settle (0.97 → 1 over 3 frames) instead of a spring overshoot.
 */
const useAt = (at: number, until?: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame - at;
  const on = t >= 0 && (until == null || frame < until);
  const s = t < 0 ? 0 : interpolate(t, [0, 4], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const settle = t < 4 ? 1 : interpolate(t, [4, 7], [0.97, 1], { extrapolateRight: 'clamp' });
  const fade = t < 0 ? 0 : Math.min(1, (t + 1) / 2);
  return { frame, fps, on, s, settle, fade, t };
};

export type SlamProps = {
  at: number;
  until?: number;
  text: string;
  size: number;
  color?: string;
  top: number;
  left?: number;
  width?: number;
  align?: 'left' | 'center' | 'right';
  font?: 'display' | 'body';
  weight?: number;
  letterSpacing?: number;
  rotate?: number;
  lineHeight?: number;
  glow?: boolean;
};
/** A line of display type that slams in (scale 1.6 → 1) and holds until `until`. */
export const Slam: React.FC<SlamProps> = ({ at, until, text, size, color = T.gold, top, left = 60, width = W - 120, align = 'center', font = 'display', weight = 400, letterSpacing = 2, rotate = 0, lineHeight = 1.0, glow = true }) => {
  const { on, s, settle, fade } = useAt(at, until);
  if (!on) return null;
  const scale = (1.7 - 0.7 * s) * settle;
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left,
        width,
        textAlign: align,
        fontFamily: font === 'display' ? FONT.display : FONT.body,
        fontWeight: weight,
        fontSize: size,
        lineHeight,
        letterSpacing,
        color,
        whiteSpace: 'pre-line',
        textShadow: glow ? `0 0 24px ${hexA(color, 0.55)}, 0 0 70px ${hexA(color, 0.25)}, 6px 6px 0 rgba(0,0,0,0.85)` : '5px 5px 0 rgba(0,0,0,0.85)',
        transform: `rotate(${rotate}deg) scale(${scale})`,
        transformOrigin: '50% 50%',
        opacity: fade,
      }}
    >
      {text}
    </div>
  );
};

/** A number rolling up to `to` over `frames`, with a bump when it lands. */
export const CountUp: React.FC<{ at: number; until?: number; to: number; frames: number; size: number; top: number; color?: string }> = ({ at, until, to, frames, size, top, color = T.gold }) => {
  const { on, t, fps, frame } = useAt(at, until);
  if (!on) return null;
  const v = Math.round(interpolate(t, [0, frames], [0, to], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }));
  const land = spring({ frame: frame - (at + frames), fps, config: { damping: 10, stiffness: 300, mass: 0.6 } });
  const scale = t < frames ? 1.15 - 0.15 * (t / frames) : 1 + 0.06 * (1 - land);
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        width: W,
        textAlign: 'center',
        fontFamily: FONT.display,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: 4,
        color,
        textShadow: `0 0 30px ${hexA(color, 0.6)}, 0 0 90px ${hexA(color, 0.3)}, 8px 8px 0 rgba(0,0,0,0.85)`,
        transform: `scale(${scale})`,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {v.toLocaleString('en-US')}
    </div>
  );
};

/** A bar drawn through a word, left to right in 7 frames. */
export const Strike: React.FC<{ at: number; until?: number; top: number; left: number; width: number; height?: number; color?: string; rotate?: number }> = ({ at, until, top, left, width, height = 16, color = RED, rotate = -3 }) => {
  const { on, t } = useAt(at, until);
  if (!on) return null;
  const w = interpolate(t, [0, 7], [0, width], { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  return <div style={{ position: 'absolute', top, left, width: w, height, background: color, boxShadow: `0 0 18px ${hexA(color, 0.7)}`, transform: `rotate(${rotate}deg)`, transformOrigin: '0 50%' }} />;
};

/** Rubber stamp: bordered word, slams down from 2.4× with a tilt. */
export const Stamp: React.FC<{ at: number; until?: number; text: string; top: number; left?: number; width?: number; color?: string; size?: number; rotate?: number }> = ({ at, until, text, top, left = 120, width = W - 240, color = RED, size = 110, rotate = -9 }) => {
  const { on, s, settle, fade } = useAt(at, until);
  if (!on) return null;
  const scale = (2.6 - 1.6 * s) * settle;
  return (
    <div style={{ position: 'absolute', top, left, width, display: 'flex', justifyContent: 'center', transform: `rotate(${rotate - 6 * (1 - s)}deg) scale(${scale})`, opacity: fade }}>
      <div
        style={{
          border: `10px solid ${color}`,
          borderRadius: 18,
          padding: '10px 36px',
          fontFamily: FONT.display,
          fontSize: size,
          letterSpacing: 6,
          color,
          textShadow: `0 0 20px ${hexA(color, 0.6)}`,
          boxShadow: `0 0 28px ${hexA(color, 0.35)}, inset 0 0 28px ${hexA(color, 0.2)}`,
          background: 'rgba(7,11,18,0.35)',
        }}
      >
        {text}
      </div>
    </div>
  );
};

/** A barcode drawing in bar by bar, a cyan scan line sweeping it, then the green lock. */
export const Barcode: React.FC<{ at: number; until?: number; top: number; left?: number; width?: number; height?: number; sweepAt: number; lockAt: number; seed?: string }> = ({ at, until, top, left = 120, width = W - 240, height = 300, sweepAt, lockAt, seed = 'bar' }) => {
  const { frame, on, t } = useAt(at, until);
  if (!on) return null;
  const N = 46;
  const widths = Array.from({ length: N }, (_, i) => 1 + Math.floor(random(`${seed}-w-${i}`) * 4));
  const unit = width / (widths.reduce((a, b) => a + b, 0) + (N - 1) * 1.5);
  const shown = Math.min(N, Math.floor(interpolate(t, [0, 12], [0, N], { extrapolateRight: 'clamp' })));
  const locked = frame >= lockAt;
  const color = locked ? T.green : T.cream;
  let x = 0;
  const bars = widths.map((w, i) => {
    const el = i < shown ? <div key={i} style={{ position: 'absolute', left: x, top: 0, width: w * unit, height, background: color, boxShadow: locked ? `0 0 12px ${hexA(T.green, 0.6)}` : undefined }} /> : null;
    x += (w + 1.5) * unit;
    return el;
  });
  const sweepX = frame >= sweepAt ? interpolate(frame - sweepAt, [0, 14], [0, width], { extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) }) : null;
  const flash = locked ? interpolate(frame - lockAt, [0, 8], [0.6, 0], { extrapolateRight: 'clamp' }) : 0;
  const corner = (cx: number, cy: number, i: number) => (
    <div
      key={i}
      style={{
        position: 'absolute',
        left: cx ? width - 20 : -40,
        top: cy ? height - 20 : -40,
        width: 60,
        height: 60,
        borderTop: cy ? 'none' : `8px solid ${color}`,
        borderBottom: cy ? `8px solid ${color}` : 'none',
        borderLeft: cx ? 'none' : `8px solid ${color}`,
        borderRight: cx ? `8px solid ${color}` : 'none',
      }}
    />
  );
  return (
    <div style={{ position: 'absolute', top, left, width, height }}>
      {flash > 0 ? <div style={{ position: 'absolute', inset: -40, background: T.green, opacity: flash, filter: 'blur(30px)' }} /> : null}
      {bars}
      {sweepX != null && frame < lockAt + 6 ? <div style={{ position: 'absolute', left: sweepX - 3, top: -30, width: 6, height: height + 60, background: T.cyan, boxShadow: `0 0 24px ${T.cyan}, 0 0 60px ${hexA(T.cyan, 0.6)}` }} /> : null}
      {[corner(0, 0, 0), corner(1, 0, 1), corner(0, 1, 2), corner(1, 1, 3)]}
    </div>
  );
};

/** One CEO sprite, neutral frame, cropped to a bust in a gold-framed tile; pops in with a tilt. */
export const SpriteBust: React.FC<{ at: number; until?: number; id: string; label?: string; left: number; top: number; size: number; crop?: number }> = ({ at, until, id, label, left, top, size, crop = 0.62 }) => {
  const { on, s, settle, fade } = useAt(at, until);
  const sheet = SHEETS[id];
  if (!on || !sheet) return null;
  const f = sheet.frames.varA_neutral ?? { col: 0, row: 0 };
  const sc = size / (sheet.frameHeight * crop);
  const sheetW = sheet.grid.cols * sheet.frameWidth * sc;
  const sheetH = sheet.grid.rows * sheet.frameHeight * sc;
  const offX = (size - sheet.frameWidth * sc) / 2 - f.col * sheet.frameWidth * sc;
  const offY = -f.row * sheet.frameHeight * sc;
  return (
    <div style={{ position: 'absolute', left, top, width: size, transform: `scale(${(1.6 - 0.6 * s) * settle}) rotate(${(1 - s) * 10}deg)`, opacity: fade }}>
      <div style={{ width: size, height: size, boxSizing: 'border-box', overflow: 'hidden', border: `4px solid ${T.gold}`, background: T.panel, boxShadow: `0 0 18px ${hexA(T.gold, 0.35)}`, position: 'relative' }}>
        <Img src={staticFile(`assets/sprites/${sheet.file}`)} style={{ position: 'absolute', left: offX, top: offY, width: sheetW, height: sheetH, imageRendering: 'pixelated' }} />
      </div>
      {label ? (
        <div style={{ marginTop: 8, textAlign: 'center', fontFamily: FONT.body, fontWeight: 600, fontSize: 24, letterSpacing: 1, color: T.cream, textShadow: '2px 2px 0 rgba(0,0,0,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      ) : null}
    </div>
  );
};

/** The app's red "no sprite" X (assets/pixel/scorecard/no_sprite_x.png), huge, slamming in with a red flash. */
export const BigX: React.FC<{ at: number; until?: number; size: number; top: number }> = ({ at, until, size, top }) => {
  const { on, s, settle, fade, t } = useAt(at, until);
  if (!on) return null;
  const scale = (3.4 - 2.4 * s) * settle;
  const flash = interpolate(t, [0, 12], [0.8, 0], { extrapolateRight: 'clamp' });
  return (
    <>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% ${((top + size / 2) / H) * 100}%, ${hexA(RED, 0.9)}, transparent 60%)`, opacity: flash }} />
      <Img
        src={staticFile('assets/no_sprite_x.png')}
        style={{ position: 'absolute', left: (W - size) / 2, top, width: size, height: size, imageRendering: 'pixelated', transform: `scale(${scale})`, opacity: fade, filter: `drop-shadow(0 0 40px ${hexA(RED, 0.7)})` }}
      />
    </>
  );
};

/** Phone screenshots (1206×2622) fanned like a hand of cards, rising in one after another. */
export const RecordFan: React.FC<{ at: number; until?: number; files: string[]; top: number; cardW: number; stagger?: number; spread?: number }> = ({ at, until, files, top, cardW, stagger = 6, spread = 170 }) => {
  const { frame, fps, on } = useAt(at, until);
  if (!on) return null;
  const n = files.length;
  const cardH = Math.round((cardW * 2622) / 1206);
  return (
    <>
      {files.map((f, i) => {
        const s = spring({ frame: frame - (at + i * stagger), fps, config: { damping: 14, stiffness: 200, mass: 0.9 } });
        const rot = (i - (n - 1) / 2) * 7;
        const x = W / 2 - cardW / 2 + (i - (n - 1) / 2) * spread;
        return (
          <div
            key={f}
            style={{ position: 'absolute', left: x, top: top + (1 - s) * 420, width: cardW, height: cardH, borderRadius: 40, overflow: 'hidden', border: `6px solid ${T.gold}`, boxShadow: '0 24px 60px rgba(0,0,0,0.6)', transform: `rotate(${rot}deg)`, transformOrigin: '50% 100%', opacity: Math.min(1, s * 2), background: T.panel }}
          >
            <Img src={staticFile(f)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        );
      })}
    </>
  );
};

/** Screen shake + punch zoom summed over a list of [frame, px] hits (8-frame decay each; the zoom caps at 5 %). */
export const useHits = (hits: Array<[frame: number, px: number]>, dur = 8): { x: number; y: number; zoom: number } => {
  const frame = useCurrentFrame();
  let x = 0;
  let y = 0;
  let zoom = 1;
  for (const [h, px] of hits) {
    const d = frame - h;
    if (d >= 0 && d < dur) {
      const k = 1 - d / dur;
      const amp = px * 1.3 * k;
      x += (random(`hx-${h}-${frame}`) - 0.5) * 2 * amp;
      y += (random(`hy-${h}-${frame}`) - 0.5) * 2 * amp;
      zoom = Math.max(zoom, 1 + Math.min(0.05, px / 500) * k);
    }
  }
  return { x: Math.round(x), y: Math.round(y), zoom };
};

/** Full-frame colour flash decaying over `frames`. */
export const Flash: React.FC<{ at: number; color?: string; frames?: number; peak?: number }> = ({ at, color = '#FFFFFF', frames = 6, peak = 0.7 }) => {
  const frame = useCurrentFrame();
  const d = frame - at;
  if (d < 0 || d >= frames) return null;
  return <AbsoluteFill style={{ background: color, opacity: peak * (1 - d / frames), pointerEvents: 'none' }} />;
};

/**
 * A tall web-page screenshot panned top to bottom inside a tilted, rounded frame: "scrolling
 * the products on a website" (creator, Oct 15). `w`/`h` are the capture's pixel size; the pan
 * runs from `at` to `until` with ease-in-out.
 */
export const WebScroll: React.FC<{ at: number; until: number; file: string; w: number; h: number; top: number; frameW: number; frameH: number; rotate?: number; left?: number }> = ({ at, until, file, w, h, top, frameW, frameH, rotate = -6, left }) => {
  const { frame, fps, on, t } = useAt(at, until);
  if (!on) return null;
  const s = spring({ frame: frame - at, fps, config: { damping: 20, stiffness: 180, mass: 0.9 } });
  const scale = frameW / w;
  const imgH = h * scale;
  const travel = Math.max(0, imgH - frameH);
  const y = interpolate(t, [10, until - at - 6], [0, -travel], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  return (
    <div
      style={{ position: 'absolute', left: left ?? (W - frameW) / 2, top: top + (1 - s) * 500, width: frameW, height: frameH, overflow: 'hidden', borderRadius: 36, border: `6px solid ${T.cyan}`, boxShadow: `0 30px 80px rgba(0,0,0,0.65), 0 0 40px ${hexA(T.cyan, 0.25)}`, transform: `rotate(${rotate}deg)`, transformOrigin: '50% 100%', opacity: Math.min(1, s * 2), background: '#FFFFFF' }}
    >
      <Img src={staticFile(file)} style={{ position: 'absolute', left: 0, top: y, width: frameW, height: imgH }} />
    </div>
  );
};
