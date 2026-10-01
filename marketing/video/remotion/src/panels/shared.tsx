import React from 'react';
import { Sequence, random, useCurrentFrame } from 'remotion';
import { Clark, ClarkPlacement } from '../components/Clark';
import type { BoxGeo } from '../LayoutContext';
import { DialogueBox } from '../components/DialogueBox';
import type { Box } from '../timing';
import type { VeoMap } from '../vo';

/** Small frame shake (±px, decaying) starting at `atFrame` for `durFrames`. */
export const useShake = (atFrame: number | null, px: number, durFrames = 12): { x: number; y: number } => {
  const frame = useCurrentFrame();
  if (atFrame == null || frame < atFrame || frame > atFrame + durFrames) return { x: 0, y: 0 };
  const k = frame - atFrame;
  const decay = 1 - k / durFrames;
  return {
    x: Math.round((random(`sx-${atFrame}-${k}`) - 0.5) * 2 * px * decay),
    y: Math.round((random(`sy-${atFrame}-${k}`) - 0.5) * 2 * px * decay),
  };
};

type BoxesProps = {
  boxes: Box[];
  gold?: boolean;
  translateX?: number;
  translateY?: number;
  collapse?: number;
  rect?: BoxGeo;
};
/** One <Sequence> per dialogue box, chained back to back inside the panel. */
export const Boxes: React.FC<BoxesProps> = ({ boxes, ...rest }) => (
  <>
    {boxes.map((b) => (
      <Sequence key={b.id} from={b.from} durationInFrames={b.duration} name={`box ${b.id}`}>
        <DialogueBox text={b.text} horns={b.horns} typingFrames={b.typingFrames} {...rest} />
      </Sequence>
    ))}
  </>
);

type ClarkLayerProps = { boxes: Box[]; veo: VeoMap; placement?: ClarkPlacement; translateX?: number; clipBottom?: number; opacity?: number };
/** Static bust for the whole panel, or a per-line keyed Veo clip when one exists. */
export const ClarkLayer: React.FC<ClarkLayerProps> = ({ boxes, veo, placement, translateX, clipBottom, opacity }) => {
  const animated = boxes.filter((b) => veo[b.id] != null);
  if (animated.length === 0) return <Clark placement={placement} translateX={translateX} clipBottom={clipBottom} opacity={opacity} />;
  return (
    <>
      {boxes.map((b) => (
        <Sequence key={b.id} from={b.from} durationInFrames={b.duration} name={`clark ${b.id}`}>
          <Clark placement={placement} translateX={translateX} clipBottom={clipBottom} opacity={opacity} veoLineId={veo[b.id] != null ? b.id : null} veoFrames={veo[b.id] ?? 0} bob={veo[b.id] == null} />
        </Sequence>
      ))}
    </>
  );
};
