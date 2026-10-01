import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { REPORT_GLITCH_FRAMES, useLayout } from '../LayoutContext';
import { CLIPS, clipSrc } from '../clips';
import clipDims from '../data/clipDims.json';
import { Notification } from '../components/Notification';
import { PhoneFrame, coverTop } from '../components/PhoneFrame';
import { Starfield } from '../components/Starfield';
import { CAPTURE, PHONE } from '../layout';
import { TYPE_CPS, sec, typingFrames, type Box, type PanelTL } from '../timing';
import { T } from '../tokens';
import { Boxes, ClarkLayer, useShake } from './shared';
import type { VeoMap } from '../vo';

/**
 * CRT break-up: three horizontal bands of the child slide apart with a flicker, the whole
 * thing fading to nothing by `frames`; after that nothing is drawn.
 */
export const GlitchOut: React.FC<{ frames: number; seed: string; children: React.ReactNode }> = ({ frames, seed, children }) => {
  const frame = useCurrentFrame();
  if (frame >= frames) return null;
  const t = frame / frames;
  const r = (k: string) => random(`${seed}-glitch-${frame}-${k}`);
  const bands: Array<[number, number]> = [
    [0, 38],
    [38, 66],
    [66, 100],
  ];
  const flicker = frame % 3 === 1 ? 0.35 : 1;
  return (
    <>
      {bands.map(([a, b], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            clipPath: `inset(${a}% 0 ${100 - b}% 0)`,
            transform: `translateX(${Math.round((r(`x${i}`) - 0.5) * 2 * (24 + 90 * t))}px)`,
            opacity: (1 - t * t) * flicker,
            filter: i === 1 ? `hue-rotate(${Math.round(r('h') * 60)}deg)` : undefined,
          }}
        >
          {children}
        </div>
      ))}
    </>
  );
};

/** The sentences of `text` that finish typing inside `seconds` (at least the first one). */
const sentencesThatFit = (text: string, seconds: number): string => {
  const parts = text.match(/[^.?!]+[.?!]+\s*/g) ?? [text];
  let out = '';
  for (const p of parts) {
    if (out && (out + p).trim().length / TYPE_CPS > seconds) break;
    out += p;
  }
  return out.trim();
};

/**
 * Standard staging: phone frame, Clark, dialogue box (positions from the layout).
 * Full-bleed staging (the 'full' layout) is about the gameplay: the capture fills the
 * canvas at native scale and never moves between beats; Clark stands behind the box and
 * glitches out whenever the file comes up, and his box moves to the top of the screen so
 * the card and the AVOID button stay clear while the line still reads.
 */
export const FeaturePanel: React.FC<{ p: PanelTL; veo: VeoMap; clarkWasOn?: boolean }> = ({ p, veo, clarkWasOn = true }) => {
  const L = useLayout();
  const { fps } = useVideoConfig();
  const clip = CLIPS[p.key];
  const cfg = (L.stage === 'full' ? clip?.full : undefined) ?? {};
  const startFrom = cfg.startFrom ?? 0;
  const shake = useShake(clip?.shakeAt != null ? sec(Math.max(0, clip.shakeAt - startFrom)) : null, 2);
  if (L.stage === 'full') {
    // Size from the clip's REAL pixels (src/data/clipDims.json): fit the width, keep the
    // aspect. Only what overhangs the canvas is cropped, from the edge the beat can spare;
    // a clip shorter than the canvas sits at the top and the box covers the rest.
    const dims = (clip ? (clipDims as Record<string, { w: number; h: number }>)[clip.file] : undefined) ?? CAPTURE;
    const h = Math.round((L.w * dims.h) / dims.w);
    const excess = Math.max(0, h - L.h);
    const align = cfg.align ?? 'top';
    const top = align === 'top' ? 0 : align === 'bottom' ? -excess : -Math.round(excess / 2);
    const clarkOn = (cfg.clarkOpacity ?? 1) > 0;
    const reportF = cfg.reportAt != null ? sec(cfg.reportAt) : null;
    // combined beats: only the sentences that finish before the file comes up are shown
    const early: Box[] =
      reportF != null
        ? p.boxes.slice(0, 1).map((b) => {
            const text = sentencesThatFit(b.text, (cfg.reportAt ?? 0) - 0.2);
            return { ...b, text, horns: false, typingFrames: typingFrames(text) };
          })
        : p.boxes;
    // …and the rest of the line types in the top box once the file is up
    const late: Box[] =
      reportF != null
        ? p.boxes.slice(0, 1).flatMap((b, i) => {
            const text = b.text.slice(early[i].text.length).trim();
            return text ? [{ ...b, id: `${b.id}-late`, text, from: 0, duration: Math.max(1, p.duration - reportF), typingFrames: typingFrames(text) }] : [];
          })
        : [];
    return (
      <AbsoluteFill style={{ background: T.void }}>
        <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}>
          {clip ? (
            <OffthreadVideo
              src={clipSrc(clip.file)}
              muted
              startFrom={Math.round(startFrom * fps)}
              style={{ position: 'absolute', left: 0, top, width: L.w, height: h }}
            />
          ) : null}
          {clip?.notificationAt != null ? (
            <div style={{ position: 'absolute', top: 24, left: 24, width: L.w - 48 }}>
              <Notification width={L.w - 48} scale={1} startFrame={Math.round(p.duration * clip.notificationAt)} />
            </div>
          ) : null}
          {cfg.report ? (
            // the file is up for the whole beat: Clark leaves once, and stays gone
            <>
              {clarkWasOn ? (
                <GlitchOut frames={REPORT_GLITCH_FRAMES} seed={p.key}>
                  <ClarkLayer boxes={p.boxes} veo={veo} />
                </GlitchOut>
              ) : null}
              <Boxes boxes={p.boxes} rect={L.reportBox} />
            </>
          ) : reportF != null ? (
            <>
              <Sequence durationInFrames={reportF} name="before the file">
                <AbsoluteFill style={{ background: `linear-gradient(to bottom, rgba(7,11,18,0) ${L.h - 700}px, rgba(7,11,18,0.35) ${L.h - 320}px, rgba(7,11,18,0.6) ${L.h}px)`, pointerEvents: 'none' }} />
                {clarkOn ? <ClarkLayer boxes={early} veo={veo} /> : null}
                <Boxes boxes={early} />
              </Sequence>
              {clarkOn ? (
                <Sequence from={reportF} durationInFrames={REPORT_GLITCH_FRAMES} name="clark out">
                  <GlitchOut frames={REPORT_GLITCH_FRAMES} seed={p.key}>
                    <ClarkLayer boxes={early} veo={veo} />
                  </GlitchOut>
                </Sequence>
              ) : null}
              <Sequence from={reportF} name="file is up">
                <Boxes boxes={late} rect={L.reportBox} />
              </Sequence>
            </>
          ) : (
            <>
              <AbsoluteFill style={{ background: `linear-gradient(to bottom, rgba(7,11,18,0) ${L.h - 700}px, rgba(7,11,18,0.35) ${L.h - 320}px, rgba(7,11,18,0.6) ${L.h}px)`, pointerEvents: 'none' }} />
              {clarkOn ? <ClarkLayer boxes={p.boxes} veo={veo} /> : null}
              <Boxes boxes={p.boxes} />
            </>
          )}
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: T.void }}>
      <Starfield />
      <AbsoluteFill style={{ transform: `translate(${shake.x}px, ${shake.y}px)` }}>
        <PhoneFrame>
          {clip ? <OffthreadVideo src={clipSrc(clip.file)} muted style={coverTop} /> : null}
          {clip?.notificationAt != null ? (
            <Notification
              width={L.phone.width - PHONE.border * 2}
              scale={L.phone.width / PHONE.width}
              startFrame={Math.round(p.duration * clip.notificationAt)}
            />
          ) : null}
        </PhoneFrame>
        <ClarkLayer boxes={p.boxes} veo={veo} />
        <Boxes boxes={p.boxes} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
