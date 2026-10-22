import React from 'react';
import { CalculateMetadataFunction, Composition, Still } from 'remotion';
import { Explainer, type ExplainerProps } from './Explainer';
import { PREVIEW_FRAMES, PREVIEW_H, PREVIEW_W, Preview } from './appstore/Preview';
import { Tile } from './appstore/Tile';
import { FEED_H, FEED_W, FreeStill, STORY_H, STORY_W } from './promo/FreeStill';
import { FREE_FRAMES, Free15 } from './release/Free15';
import { COVER_H, COVER_W, PageCover } from './brand/PageCover';
import { HEADER_H, HEADER_W, StoreHeader } from './appstore/StoreHeader';
import { HeaderVideo, LOOP, SEARCH_H, SEARCH_W, SearchVideo, VIDEO_H, VIDEO_W } from './appstore/HeaderVideo';
import { RELEASE_FRAMES, Release } from './release/Release';
import { TILES, TILE_H, TILE_W } from './appstore/tiles';
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
  // Oct 14: 1.2 "what's new" — a 30 for Reels/Shorts/TikTok and a 15 for Stories and the ad slot
  { id: 'New30', cut: 'new30', layout: 'full', width: 1080, height: 1920 },
  { id: 'New15', cut: 'new15', layout: 'full', width: 1080, height: 1920 },
  // legacy: the device-frame vertical with the rain open (reference only, not in render.sh)
  { id: 'Phone60', cut: '60', layout: 'vertical', width: 1080, height: 1920, hook: 'rain' },
];

export const RemotionRoot: React.FC = () => (
  <>
    {/* App Store 1.1: seven 6.9" screenshot tiles + the app preview (scripts/appstore.sh) */}
    {TILES.map((tile, i) => (
      <Still key={tile.id} id={`Tile-${String(i + 1).padStart(2, '0')}-${tile.id}`} component={Tile} width={TILE_W} height={TILE_H} defaultProps={tile} />
    ))}
    <Composition id="AppPreview" component={Preview} width={PREVIEW_W} height={PREVIEW_H} fps={FPS} durationInFrames={PREVIEW_FRAMES} />
    {/* App Store creative assets (iOS 27 header + search results): universal 16:9, cropped by scripts/appstore.sh header */}
    {(['space', 'screens', 'clark', 'map', 'mix-a', 'mix-b', 'mix-c', 'mix-d', 'mix-b2', 'mix-c2', 'l1', 'l2', 'l3', 'l4', 'f1', 'f1s', 'f2', 'f2s', 'g1', 'g2', 'g1s', 'g1m', 's1', 's2', 's3a', 's3b', 's3c', 's3d'] as const).map((v) => (
      <Still key={v} id={`StoreHeader-${v}`} component={StoreHeader} width={HEADER_W} height={HEADER_H} defaultProps={{ variant: v }} />
    ))}
    {/* round 8: the header video, one 15 s loop per finalist (scripts/appstore.sh headervideo) */}
    {(['f1', 'f1s', 'f2', 'f2s', 'g1', 'g2', 'g1s', 'g1m', 's1', 's2', 's3a', 's3b', 's3c', 's3d'] as const).map((v) => (
      <Composition key={`video-${v}`} id={`HeaderVideo-${v}`} component={HeaderVideo} width={VIDEO_W} height={VIDEO_H} fps={FPS} durationInFrames={LOOP} defaultProps={{ variant: v }} />
    ))}
    {(['g1', 'g2', 'g1s', 'g1m', 's1', 's2', 's3a', 's3b', 's3c', 's3d'] as const).map((v) => (
      <Composition key={`svideo-${v}`} id={`SearchVideo-${v}`} component={SearchVideo} width={SEARCH_W} height={SEARCH_H} fps={FPS} durationInFrames={LOOP} defaultProps={{ variant: v }} />
    ))}
    {/* round 7: the search card gets its own render so the bottom bar sits at the 3:2 bottom */}
    {(['f1', 'f1s', 'f2', 'f2s', 'g1', 'g2', 'g1s', 'g1m', 's1', 's2', 's3a', 's3b', 's3c', 's3d'] as const).map((v) => (
      <Still key={`${v}-search`} id={`StoreHeader-${v}-search`} component={StoreHeader} width={HEADER_W} height={HEADER_H} defaultProps={{ variant: v, target: 'search' as const }} />
    ))}
    {(['mix-b2', 'mix-c2'] as const).flatMap((v) =>
      (['c1', 'c2', 'c3', 'c4'] as const).map((c) => (
        <Still key={`${v}-${c}`} id={`StoreHeader-${v}-${c}`} component={StoreHeader} width={HEADER_W} height={HEADER_H} defaultProps={{ variant: v, copy: c }} />
      )),
    )}
    {/* Facebook Page cover (Meta ads identity), same look as the IG banner */}
    <Still id="PageCover" component={PageCover} width={COVER_W} height={COVER_H} />
    {/* Oct 15: the 1.2 release cut, kinetic type on the drive bed (scripts/render.sh release) */}
    <Composition id="Release30" component={Release} width={1080} height={1920} fps={FPS} durationInFrames={RELEASE_FRAMES} />
    <Composition id="Free15" component={Free15} width={1080} height={1920} fps={FPS} durationInFrames={FREE_FRAMES} />
    {(['free', 'weekend', 'lastdays'] as const).map((v) => (
      <Still key={`freefeed-${v}`} id={`FreeFeed-${v}`} component={FreeStill} width={FEED_W} height={FEED_H} defaultProps={{ variant: v, format: 'feed' as const }} />
    ))}
    {(['free', 'weekend', 'lastdays'] as const).map((v) => (
      <Still key={`freestory-${v}`} id={`FreeStory-${v}`} component={FreeStill} width={STORY_W} height={STORY_H} defaultProps={{ variant: v, format: 'story' as const }} />
    ))}
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
