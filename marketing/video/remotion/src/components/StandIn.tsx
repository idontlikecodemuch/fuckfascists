import React from 'react';
import { FONT } from '../tokens';

/**
 * First-pass marker: this beat plays a stand-in clip until its capture lands (N1–N4 on
 * build 13, marketing/notes/script-1.2-whats-new.md). Remove the `placeholder` on the clip
 * spec when the real footage is cut in and the tag disappears.
 */
export const StandIn: React.FC<{ label: string; top?: number }> = ({ label, top = 560 }) => (
  <div
    style={{
      position: 'absolute',
      top,
      right: 24,
      padding: '10px 18px',
      background: 'rgba(200,30,30,0.88)',
      border: '3px solid #FFFFFF',
      fontFamily: FONT.display,
      fontSize: 30,
      letterSpacing: 1,
      color: '#FFFFFF',
      textShadow: '2px 2px 0 rgba(0,0,0,0.7)',
      boxShadow: '0 6px 24px rgba(0,0,0,0.5)',
    }}
  >
    STAND-IN · {label}
  </div>
);
