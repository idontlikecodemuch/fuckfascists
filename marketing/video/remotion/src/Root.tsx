import React from 'react';
import { CalculateMetadataFunction, Composition } from 'remotion';
import { Explainer, type ExplainerProps } from './Explainer';
import type { LayoutMode } from './LayoutContext';
import { FPS, buildTimeline, lineIds, type Cut, type HookStyle } from './timing';
import { probeScene, probeVeo, probeVo } from './vo';

const calculateMetadata: CalculateMetadataFunction<ExplainerProps> = async ({ props }) => {
  const ids = lineIds(props.cut);
  const [vo, veo, scene] = await Promise.all([probeVo(ids, props.layout === 'wide' ? 'wide' : 'vertical'), probeVeo(ids), probeScene(ids)]);
  // a line with an 'in context' scene plays that take's own audio on every layout (lip sync)
  const sceneIds = Object.keys(scene);
  if (props.layout !== 'wide' && sceneIds.length > 0) Object.assign(vo, await probeVo(sceneIds, 'wide'));
  const timeline = buildTimeline(props.cut, vo, { hook: props.hook, stage: props.layout === 'full' ? 'full' : 'phone' });
  return { durationInFrames: timeline.totalFrames, props: { ...props, timeline, veo, scene } };
};

const CUTS: Array<{ id: string; cut: Cut; layout: LayoutMode; width: number; height: number; hook?: HookStyle }> = [
  // Sep 29: every vertical cut is full-bleed; every cut with a hook opens on the slam.
  { id: 'Master60', cut: '60', layout: 'full', width: 1080, height: 1920, hook: 'slam' },
  { id: 'Cut30', cut: '30', layout: 'full', width: 1080, height: 1920, hook: 'slam' },
  { id: 'Cut15', cut: '15', layout: 'full', width: 1080, height: 1920, hook: 'slam' },
  { id: 'Wide60', cut: '60', layout: 'wide', width: 1920, height: 1080, hook: 'slam' },
  // one tab each
  { id: 'ShortMap', cut: 'map', layout: 'full', width: 1080, height: 1920 },
  { id: 'ShortTrack', cut: 'track', layout: 'full', width: 1080, height: 1920 },
  { id: 'ShortScan', cut: 'scan', layout: 'full', width: 1080, height: 1920 },
  { id: 'ShortCard', cut: 'card', layout: 'full', width: 1080, height: 1920 },
  // legacy: the device-frame vertical with the rain open (reference only, not in render.sh)
  { id: 'Phone60', cut: '60', layout: 'vertical', width: 1080, height: 1920, hook: 'rain' },
];

export const RemotionRoot: React.FC = () => (
  <>
    {CUTS.map(({ id, cut, layout, width, height, hook }) => (
      <Composition
        key={id}
        id={id}
        component={Explainer}
        width={width}
        height={height}
        fps={FPS}
        durationInFrames={60 * FPS}
        defaultProps={{ cut, layout, timeline: null, veo: {}, scene: {}, hook: hook ?? 'rain' }}
        calculateMetadata={calculateMetadata}
      />
    ))}
  </>
);
