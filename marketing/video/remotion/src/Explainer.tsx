import React from 'react';
import { AbsoluteFill, Audio, Sequence } from 'remotion';
import { FULL, type LayoutMode, LayoutProvider, VERTICAL, WIDE } from './LayoutContext';
import { CLIPS } from './clips';
import { CrtBlink } from './components/CrtBlink';
import { TitleCard } from './components/TitleCard';
import { Music } from './components/Music';
import { useFonts } from './fonts';
import { ClarkIntroPanel } from './panels/ClarkIntroPanel';
import { DropPanel } from './panels/DropPanel';
import { FeaturePanel } from './panels/FeaturePanel';
import { HookPanel } from './panels/HookPanel';
import { OutroPanel } from './panels/OutroPanel';
import { SharePanel } from './panels/SharePanel';
import { type Cut, type HookStyle, type PanelTL, type Timeline, voRanges } from './timing';
import { T } from './tokens';
import { Brand } from './components/Brand';
import type { SceneMap, VeoMap } from './vo';

export type ExplainerProps = { cut: Cut; layout: LayoutMode; timeline: Timeline | null; veo: VeoMap; scene: SceneMap; hook?: HookStyle };

/** Was Clark visible at the end of this panel (full layout)? Decides whether the next report beat glitches him out. */
const clarkOnAtEnd = (p: PanelTL | undefined): boolean => {
  if (!p) return false;
  if (p.panel.kind === 'title' || p.panel.kind === 'hook' || p.panel.kind === 'drop') return false;
  if (p.panel.kind !== 'feature') return true;
  const f = CLIPS[p.key]?.full ?? {};
  return !f.report && f.reportAt == null && (f.clarkOpacity ?? 1) > 0;
};

const renderPanel = (p: PanelTL, cut: Cut, veo: VeoMap, scene: SceneMap, hook: HookStyle, prev?: PanelTL): React.ReactNode => {
  switch (p.panel.kind) {
    case 'hook':
      return <HookPanel caption={cut !== '15'} variant={hook} />;
    case 'clark':
      return <ClarkIntroPanel p={p} veo={veo} scene={scene} />;
    case 'title':
      return <TitleCard feature={p.panel.feature ?? 'MAP'} />;
    case 'feature':
      return <FeaturePanel p={p} veo={veo} clarkWasOn={clarkOnAtEnd(prev)} />;
    case 'drop':
      return <DropPanel p={p} veo={veo} />;
    case 'share':
      return <SharePanel p={p} veo={veo} />;
    case 'outro':
      return <OutroPanel p={p} cut={cut} veo={veo} />;
    default:
      return null;
  }
};

/** Vertical 1080x1920 master; the 30 and 15 are the same build on their own script cut. */
export const Explainer: React.FC<ExplainerProps> = ({ cut, layout, timeline, veo, scene, hook = 'rain' }) => {
  useFonts();
  if (!timeline) return <AbsoluteFill style={{ background: T.void }} />;
  return (
    <LayoutProvider layout={layout === 'wide' ? WIDE : layout === 'full' ? FULL : VERTICAL}>
    <AbsoluteFill style={{ background: T.void }}>
      {timeline.panels.map((p, i) => (
        <Sequence key={p.key} from={p.from} durationInFrames={p.duration} name={`${p.panel.panel} ${p.panel.title}`}>
          {renderPanel(p, cut, veo, scene, hook, timeline.panels[i - 1])}
        </Sequence>
      ))}
      {timeline.panels.map((p) => {
        if (p.transitionIn === 'crt') {
          return (
            <Sequence key={`crt-${p.key}`} from={p.from - 1} durationInFrames={3} name="CRT blink">
              <CrtBlink />
            </Sequence>
          );
        }
        return null;
      })}
      {timeline.panels.flatMap((p) =>
        p.boxes
          .filter((b) => b.vo && b.voSrc)
          .map((b) => (
            <Sequence key={`vo-${b.id}`} from={p.from + b.from} durationInFrames={b.duration} name={`VO ${b.id}`}>
              <Audio src={b.voSrc as string} />
            </Sequence>
          )),
      )}
      {layout === 'wide'
        ? timeline.panels
            .filter((p) => p.panel.kind !== 'hook' && p.panel.kind !== 'outro' && p.panel.kind !== 'title')
            .map((p) => (
              <Sequence key={`brand-${p.key}`} from={p.from} durationInFrames={p.duration} name="brand">
                <Brand />
              </Sequence>
            ))
        : null}
      <Music cut={cut} totalFrames={timeline.totalFrames} duck={voRanges(timeline)} />
    </AbsoluteFill>
    </LayoutProvider>
  );
};
