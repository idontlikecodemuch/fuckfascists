import React from 'react';
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { useLayout } from '../LayoutContext';
import { FONT, T } from '../tokens';

export const FOLDER_LEAD = 12; // frames before the panel boundary the folder starts sliding
export const FOLDER_TOTAL = 26; // total overlay length (lead + wipe-off)

type Props = { title: string; from?: { x: number; y: number }; to?: { x: number; y: number } };

/**
 * Folder-handoff wipe: a manila folder slides from Clark's shoulder to the phone
 * (0.35 s), the next feature's title stamps on it, then it wipes off upward.
 */
export const FolderWipe: React.FC<Props> = ({ title, from, to }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const start = from ?? L.folder.from;
  const end = to ?? L.folder.to;
  const k = L.mode === 'wide' ? 0.8 : 1;
  const slide = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const x = start.x + (end.x - start.x) * slide;
  const y = start.y + (end.y - start.y) * slide;
  const scale = 0.3 + 0.7 * slide;
  const stamp = spring({ frame: frame - 7, fps, config: { damping: 12, stiffness: 260, mass: 0.6 } });
  const off = interpolate(frame, [FOLDER_LEAD + 1, FOLDER_TOTAL], [0, -1700], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.in(Easing.cubic),
  });
  const w = 660 * k;
  const h = 470 * k;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute',
          left: x - w / 2,
          top: y - h / 2 + off,
          width: w,
          height: h,
          transform: `scale(${scale})`,
          transformOrigin: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: -40,
            width: 230,
            height: 48,
            background: T.manila,
            border: `6px solid ${T.manilaBorder}`,
            borderBottom: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: T.manila,
            border: `6px solid ${T.manilaBorder}`,
            boxSizing: 'border-box',
            boxShadow: '0 18px 0 rgba(0,0,0,0.45), inset 0 -10px 0 rgba(139,107,46,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontFamily: FONT.display,
              fontSize: 104 * k,
              color: T.void,
              letterSpacing: 4,
              transform: `scale(${1.6 - 0.6 * stamp})`,
              opacity: frame >= 7 ? Math.min(1, stamp * 1.4) : 0,
              textShadow: '4px 4px 0 rgba(139,107,46,0.6)',
            }}
          >
            {title}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
