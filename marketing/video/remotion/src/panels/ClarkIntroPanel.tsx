import React from 'react';
import { AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { type Placement, useLayout } from '../LayoutContext';
import { INTRO_BG, MAP_STILL, clarkSceneFrame, clipSrc } from '../clips';
import { CrtBlink } from '../components/CrtBlink';
import { DialogueBox } from '../components/DialogueBox';
import { PhoneFrame, coverTop } from '../components/PhoneFrame';
import { Starfield } from '../components/Starfield';
import { sec, type Box, type PanelTL } from '../timing';
import { T } from '../tokens';
import type { SceneMap, VeoMap } from '../vo';
import { Boxes, ClarkLayer } from './shared';

type Props = { p: PanelTL; veo: VeoMap; scene?: SceneMap };

/** Full-bleed background for one intro line: the app's opening screens (or the card). */
const IntroBg: React.FC<{ id: string }> = ({ id }) => {
  const bg = INTRO_BG[id];
  return (
    <>
      {bg ? (
        <OffthreadVideo src={clipSrc(bg.file)} muted style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 0%' }} />
      ) : (
        <Img src={MAP_STILL} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 0%' }} />
      )}
      <AbsoluteFill style={{ background: 'linear-gradient(to bottom, rgba(7,11,18,0) 1200px, rgba(7,11,18,0.4) 1600px, rgba(7,11,18,0.65) 1920px)', pointerEvents: 'none' }} />
    </>
  );
};

/** One sequence per line on the full layout: its own background, Clark only where the footage doesn't already show him. */
const FullLines: React.FC<{ boxes: Box[]; veo: VeoMap; placement?: Placement }> = ({ boxes, veo, placement }) => (
  <>
    {boxes.map((b) => (
      <Sequence key={b.id} from={b.from} durationInFrames={b.duration} name={`intro ${b.id}`}>
        <IntroBg id={b.id} />
        {(INTRO_BG[b.id]?.clark ?? true) ? <ClarkLayer boxes={[{ ...b, from: 0 }]} veo={veo} placement={placement} /> : null}
      </Sequence>
    ))}
    <Boxes boxes={boxes} />
  </>
);

/** Full-frame JPEG sequence (Remotion's video frame extraction tiled this 1080p clip). */
const SceneFrames: React.FC<{ id: string; frames: number }> = ({ id, frames }) => {
  const f = useCurrentFrame();
  const idx = Math.max(0, Math.min(frames - 1, f));
  return <Img src={clarkSceneFrame(id, idx)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />;
};

/**
 * Meet Clark. With an "in context" 16:9 scene clip for the first line (both layouts):
 * the scene plays full-frame (centre-cropped to 9:16 on the vertical, its own audio)
 * under the intro box, then a CRT blink cuts to the counter for the remaining lines.
 * Without one: tight on his face → pull back to the counter as the phone slides in.
 */
export const ClarkIntroPanel: React.FC<Props> = ({ p, veo, scene = {} }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const box1 = p.boxes[0];
  const sceneFrames = scene[box1.id] ?? 0;
  const useScene = sceneFrames > 0; // the office take, full-frame on the wide and centre-cropped on the vertical

  const pullStart = sec(0.5);
  const pullFrames = Math.max(sec(1.6), Math.round(box1.duration * 0.72));
  const progress = interpolate(frame, [pullStart, pullStart + pullFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  });
  const { faceX, faceY } = L.clark.assetSize;
  const faceOf = (pl: Placement) => ({ x: pl.left + faceX * pl.scale, y: pl.top + faceY * pl.scale });
  const start = faceOf(L.clark.closeup);
  const end = faceOf(L.clark.placement);
  const face = { x: start.x + (end.x - start.x) * progress, y: start.y + (end.y - start.y) * progress };
  const s0 = L.clark.closeup.scale;
  const s1 = L.clark.placement.scale;
  // One Clark, scale eased continuously (geometric interpolation keeps the pull-back even).
  const scale = s0 * Math.pow(s1 / s0, progress);
  const placement = useScene ? L.clark.placement : { left: face.x - faceX * scale, top: face.y - faceY * scale, scale };

  const phoneIn = spring({
    frame: frame - (pullStart + Math.round(pullFrames * 0.35)),
    fps,
    config: { damping: 20, stiffness: 90, mass: 1.1 },
  });
  const phoneX = useScene ? 0 : L.phoneSlideIn * (1 - phoneIn);
  const restBoxes = p.boxes.slice(1);
  const sceneEnd = box1.from + box1.duration;
  const shifted = restBoxes.map((b) => ({ ...b, from: b.from - sceneEnd }));

  if (useScene) {
    return (
      <AbsoluteFill style={{ background: T.void }}>
        <Sequence from={sceneEnd} durationInFrames={Math.max(1, p.duration - sceneEnd)} name="counter">
          {L.stage === 'full' ? (
            <FullLines boxes={shifted} veo={veo} />
          ) : (
            <>
              <Starfield />
              <PhoneFrame translateX={0}>
                <Img src={MAP_STILL} style={coverTop} />
              </PhoneFrame>
              <ClarkLayer boxes={shifted} veo={veo} placement={placement} />
              <Boxes boxes={shifted} />
            </>
          )}
        </Sequence>
        <Sequence from={box1.from} durationInFrames={box1.duration} name={`scene ${box1.id}`}>
          <SceneFrames id={box1.id} frames={sceneFrames} />
          <AbsoluteFill style={{ background: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0.08) 0 1px, transparent 1px 4px)', pointerEvents: 'none' }} />
          <DialogueBox text={box1.text} horns={box1.horns} rect={L.introBox ?? L.box} tail={false} />
        </Sequence>
        <Sequence from={sceneEnd - 1} durationInFrames={3} name="CRT blink">
          <CrtBlink />
        </Sequence>
      </AbsoluteFill>
    );
  }

  if (L.stage === 'full') {
    // no scene clip (the 30): the opening screen behind Clark's pull-back
    return (
      <AbsoluteFill style={{ background: T.void }}>
        <IntroBg id={box1.id} />
        <ClarkLayer boxes={p.boxes} veo={veo} placement={placement} />
        <Boxes boxes={p.boxes} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ background: T.void }}>
      <Starfield />
      <PhoneFrame translateX={phoneX}>
        <Img src={MAP_STILL} style={coverTop} />
      </PhoneFrame>
      <ClarkLayer boxes={p.boxes} veo={veo} placement={placement} />
      {L.introBox ? (
        <>
          <Sequence from={box1.from} durationInFrames={box1.duration} name={`box ${box1.id}`}>
            <DialogueBox text={box1.text} horns={box1.horns} rect={L.introBox} tail={false} />
          </Sequence>
          <Boxes boxes={restBoxes} />
        </>
      ) : (
        <Boxes boxes={p.boxes} />
      )}
    </AbsoluteFill>
  );
};
