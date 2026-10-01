import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { LOGO_H, clipSrc } from '../clips';

/** 'appstore/<name>' → media/appstore/clips (cut by scripts/appstore.sh); anything else → the explainer's clips */
const previewClip = (name: string): string => (name.startsWith('appstore/') ? staticFile(`media/appstore/clips/${name.slice(9)}.mp4`) : clipSrc(name));
import { Starfield } from '../components/Starfield';
import { useFonts } from '../fonts';
import { FPS } from '../timing';
import { FONT, T } from '../tokens';

/**
 * App Store app preview (886×1920, 15–30 s): app footage only — the phone-crop
 * clips the explainer uses (no status bar, no tab bar) under a caption band.
 * No Clark, no device frame, no price: Apple wants the app itself.
 */
export const PREVIEW_W = 886;
export const PREVIEW_H = 1920;
const CLIP_W = 886; // 1080×1926 phone clips scaled to the canvas width
const CLIP_H = Math.round((1926 * CLIP_W) / 1080); // 1580
const BAND_H = 236;
const CLIP_TOP = BAND_H;
const CAPTION_FADE = 6;
const MUSIC_GAIN = 0.42;
const MUSIC_FADE_S = 1.5;

type Beat = { clip: string; seconds: number; captions: Array<{ at: number; text: string }> };

/** clip → source: prepped by scripts/appstore.sh (the two scorecard clips) and prep-map.sh / prep-clips.sh */
const BEATS: Beat[] = [
  { clip: '30_03_map', seconds: 5.0, captions: [{ at: 0, text: 'TAP A BUSINESS.\nHERE’S THE FILE.' }, { at: 2.5, text: 'DON’T WANT TO\nSUPPORT THEM? TAP AVOID.' }] },
  { clip: '60_08_track_defeat', seconds: 3.0, captions: [{ at: 0, text: 'SKIP A PLATFORM.\nLOG THE DAY.' }] },
  { clip: '30_05_scan', seconds: 4.1, captions: [{ at: 0, text: 'AT THE STORE?\nSCAN A BARCODE.' }] },
  { clip: 'appstore/drop_phone', seconds: 4.45, captions: [{ at: 0, text: 'EVERY AVOID COUNTS.' }, { at: 1.0, text: 'RANDOM DROP BETWEEN\nFRIDAY AND SATURDAY.' }] },
  { clip: 'appstore/share_phone', seconds: 3.0, captions: [{ at: 0, text: 'SHARE IT.\nNO ACCOUNTS. NO TRACKING.' }] },
];

const sec = (s: number): number => Math.round(s * FPS);
export const PREVIEW_FRAMES = BEATS.reduce((n, b) => n + sec(b.seconds), 0);

const Caption: React.FC<{ text: string; frames: number }> = ({ text, frames }) => {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, CAPTION_FADE, frames - CAPTION_FADE, frames], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: PREVIEW_W,
        height: BAND_H,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 48px 12px',
        boxSizing: 'border-box',
        textAlign: 'center',
        fontFamily: FONT.display,
        fontSize: 52,
        lineHeight: 1.1,
        color: T.gold,
        letterSpacing: 0.5,
        whiteSpace: 'pre-line',
        textShadow: '0 0 20px rgba(255,201,60,0.35), 4px 4px 0 rgba(0,0,0,0.8)',
        opacity,
      }}
    >
      {text}
    </div>
  );
};

export const Preview: React.FC = () => {
  useFonts();
  const { durationInFrames } = useVideoConfig();
  let cursor = 0;
  const fade = sec(MUSIC_FADE_S);
  return (
    <AbsoluteFill style={{ backgroundColor: T.void }}>
      <Starfield />
      {BEATS.map((b) => {
        const from = cursor;
        const len = sec(b.seconds);
        cursor += len;
        return (
          <React.Fragment key={b.clip}>
            <Sequence from={from} durationInFrames={len} name={b.clip}>
              <OffthreadVideo
                src={previewClip(b.clip)}
                muted
                style={{ position: 'absolute', left: 0, top: CLIP_TOP, width: CLIP_W, height: CLIP_H, borderRadius: 28, objectFit: 'cover' }}
              />
            </Sequence>
            {b.captions.map((c, i) => {
              const start = from + sec(c.at);
              const end = i + 1 < b.captions.length ? from + sec(b.captions[i + 1].at) : from + len;
              return (
                <Sequence key={c.text} from={start} durationInFrames={end - start} name={c.text}>
                  <Caption text={c.text} frames={end - start} />
                </Sequence>
              );
            })}
          </React.Fragment>
        );
      })}
      {/* bottom strip: the horizontal logo */}
      <Img
        src={LOGO_H}
        style={{ position: 'absolute', left: PREVIEW_W / 2 - 135, top: CLIP_TOP + CLIP_H + 11, width: 270, height: 'auto' }}
      />
      <Audio
        src={staticFile('media/music/fck_bed_punk_30s.mp3')}
        volume={(f) => (f > durationInFrames - fade ? MUSIC_GAIN * Math.max(0, (durationInFrames - f) / fade) : MUSIC_GAIN)}
      />
    </AbsoluteFill>
  );
};
