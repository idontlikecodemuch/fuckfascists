import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { type BoxGeo, useLayout } from '../LayoutContext';
import { FONT, T } from '../tokens';
import { HORNS_DELAY_S, TYPE_CPS } from '../timing';

export const HORNS = ' 🤘🏽'; // NBSP so the horns never orphan onto their own line

type Props = {
  text: string;
  horns?: boolean;
  gold?: boolean;
  /** extra transform applied to the whole box (slide-off, lift) */
  translateX?: number;
  translateY?: number;
  /** 1 = full height, 0 = collapsed (share slide-off) */
  collapse?: number;
  /** override geometry (intro close-up, outro) */
  rect?: BoxGeo;
  /** kept for call-site compatibility; the stepped tail was retired */
  tail?: boolean;
  /** frames the text takes to type (VO lines type with the voice); default = TYPE_CPS */
  typingFrames?: number;
};

/**
 * RPG dialogue box. Sizes itself to the text (never below minHeight) and anchors
 * to the top or bottom edge the layout gives it. Text types on letter by letter;
 * frame 0 = box appears.
 */
export const DialogueBox: React.FC<Props> = ({ text, horns = false, gold = false, translateX = 0, translateY = 0, collapse = 1, rect, typingFrames }) => {
  const L = useLayout();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const typingEnd = typingFrames ?? Math.ceil((text.length / TYPE_CPS) * fps);
  const typed = Math.min(text.length, Math.floor((text.length * frame) / Math.max(1, typingEnd)));
  const done = typed >= text.length;
  const showHorns = horns && frame >= typingEnd + Math.round(HORNS_DELAY_S * fps);
  const cursorOn = done && frame % 16 < 9;
  const pop = interpolate(frame, [0, 4], [0.96, 1], { extrapolateRight: 'clamp' });
  const fade = interpolate(frame, [0, 3], [0, 1], { extrapolateRight: 'clamp' });
  const geo = rect ?? L.box;
  const fontSize = geo.fontSize ?? L.box.fontSize;
  const border = gold ? T.gold : T.cream;
  const fill = gold ? T.goldBoxFill : T.panel;
  const k = fontSize / 44; // paddings, plate and cursor scale with the text size
  const anchoredBottom = geo.bottom != null;
  const padLeft = geo.padLeft ?? 0; // clears a character standing in front of the box

  return (
    <div
      style={{
        position: 'absolute',
        left: geo.left,
        width: geo.width,
        ...(anchoredBottom ? { bottom: geo.bottom } : { top: geo.top }),
        minHeight: geo.minHeight ?? 0,
        boxSizing: 'border-box',
        background: fill,
        border: `4px solid ${border}`,
        boxShadow: [
          'inset 3px 3px 0 rgba(255,255,255,0.14)',
          'inset -3px -3px 0 rgba(0,0,0,0.55)',
          gold ? '0 0 28px rgba(255,201,60,0.45), 0 0 60px rgba(255,201,60,0.2)' : '0 8px 0 rgba(0,0,0,0.5)',
        ].join(', '),
        padding: `${40 * k}px ${44 * k}px ${30 * k}px ${40 * k + padLeft}px`,
        transform: `translate(${translateX}px, ${translateY}px) scale(${pop}) scaleY(${collapse})`,
        transformOrigin: anchoredBottom ? 'bottom left' : 'top left',
        opacity: fade,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -30 * k,
          left: 24 * k + padLeft,
          background: T.gold,
          color: T.void,
          fontFamily: FONT.display,
          fontSize: 34 * k,
          letterSpacing: 3,
          padding: `${8 * k}px ${20 * k}px ${5 * k}px`,
          boxShadow: '3px 3px 0 rgba(0,0,0,0.6)',
          lineHeight: 1.1,
        }}
      >
        CLARK
      </div>
      <div
        style={{
          fontFamily: FONT.body,
          fontWeight: 500,
          fontSize,
          lineHeight: 1.28,
          color: gold ? T.goldBoxText : T.text,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          paddingRight: 30 * k,
        }}
      >
        {Array.from(text).map((ch, i) => (
          <span key={i} style={{ opacity: i < typed ? 1 : 0 }}>
            {ch}
          </span>
        ))}
        {horns ? <span style={{ opacity: showHorns ? 1 : 0 }}>{HORNS}</span> : null}
      </div>
      <div
        style={{
          position: 'absolute',
          right: 18 * k,
          bottom: 8 * k,
          color: T.cyan,
          fontSize: 32 * k,
          lineHeight: 1,
          opacity: cursorOn ? 1 : 0,
          textShadow: `0 0 10px ${T.cyan}`,
        }}
      >
        ▼
      </div>
    </div>
  );
};
