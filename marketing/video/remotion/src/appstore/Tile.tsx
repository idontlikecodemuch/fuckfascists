import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { Starfield } from '../components/Starfield';
import { useFonts } from '../fonts';
import { FONT, T } from '../tokens';
import { CUT_Y, SOURCE_W, TILE_H, TILE_W, frameSrc, type Tile as TileSpec } from './tiles';

const SCREEN_W = 1130;
const SCALE = SCREEN_W / SOURCE_W;
const BEZEL = 26;
const RADIUS = 176;
/** the visible part of the screen ends exactly at the canvas bottom */
const SCREEN_TOP = TILE_H - Math.round(CUT_Y * SCALE);
const BAND_H = SCREEN_TOP - BEZEL;

export const Tile: React.FC<TileSpec> = ({ frame, headline, sub }) => {
  useFonts();
  return (
    <AbsoluteFill style={{ width: TILE_W, height: TILE_H, backgroundColor: T.void }}>
      <Starfield />
      {/* caption band */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: TILE_W,
          height: BAND_H,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 90px 24px',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontFamily: FONT.display,
            fontSize: 86,
            lineHeight: 1.06,
            color: T.gold,
            letterSpacing: 1,
            whiteSpace: 'pre-line',
            textShadow: '0 0 28px rgba(255,201,60,0.35), 5px 5px 0 rgba(0,0,0,0.8)',
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: 28,
            fontFamily: FONT.body,
            fontWeight: 500,
            fontSize: 42,
            lineHeight: 1.32,
            color: T.cream,
            whiteSpace: 'pre-line',
            textShadow: '2px 2px 0 rgba(0,0,0,0.8)',
          }}
        >
          {sub}
        </div>
      </div>
      {/* phone: bezel + screen, bleeding off the bottom */}
      <div
        style={{
          position: 'absolute',
          left: (TILE_W - SCREEN_W) / 2 - BEZEL,
          top: SCREEN_TOP - BEZEL,
          width: SCREEN_W + BEZEL * 2,
          height: TILE_H,
          borderRadius: RADIUS,
          background: '#0B0D12',
          boxShadow: '0 0 0 3px #2A2D30, 0 0 0 4px rgba(0,0,0,0.6), 0 -10px 90px rgba(0,0,0,0.75), 0 0 140px rgba(122,242,255,0.10)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: BEZEL,
            top: BEZEL,
            width: SCREEN_W,
            height: TILE_H,
            borderRadius: RADIUS - BEZEL,
            overflow: 'hidden',
            background: T.void,
          }}
        >
          <Img src={frameSrc(frame)} style={{ display: 'block', width: SCREEN_W, height: 'auto' }} />
        </div>
      </div>
    </AbsoluteFill>
  );
};
