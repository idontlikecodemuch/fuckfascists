import React from 'react';
import { OffthreadVideo } from 'remotion';
import { useLayout } from '../LayoutContext';
import { coverBottom, coverTop } from './PhoneFrame';

type Props = {
  src: string;
  anchor?: 'top' | 'bottom';
  centerX?: number;
  fullHeight?: boolean;
  /** extra transform on the pillar (wide) or the cover (vertical): the hook slam */
  transform?: string;
  opacity?: number;
  backdropOpacity?: number;
};

/**
 * Full-bleed vertical footage. Vertical canvas: object-fit cover. Wide canvas:
 * a centred full-height pillar over a blurred, darkened copy of itself.
 */
export const FullBleed: React.FC<Props> = ({ src, anchor = 'top', centerX, fullHeight = false, transform, opacity = 1, backdropOpacity = 1 }) => {
  const L = useLayout();
  const cover = anchor === 'top' ? coverTop : coverBottom;
  if (L.fullBleed === 'cover') {
    return <OffthreadVideo src={src} muted style={{ ...cover, transform, transformOrigin: 'center', opacity }} />;
  }
  const cx = centerX ?? L.pillarCenterX ?? L.w / 2;
  return (
    <>
      <OffthreadVideo src={src} muted style={{ ...cover, filter: 'blur(36px) brightness(0.45)', transform: 'scale(1.15)', opacity: backdropOpacity }} />
      <div style={{ position: 'absolute', top: fullHeight ? 0 : L.phone.top, left: cx, height: fullHeight ? '100%' : L.phone.height, transform: `translateX(-50%) ${transform ?? ''}`, transformOrigin: 'center', opacity }}>
        <OffthreadVideo
          src={src}
          muted
          style={{ height: '100%', width: 'auto', borderRadius: fullHeight ? 0 : 40, boxShadow: '0 0 80px rgba(0,0,0,0.7)', display: 'block' }}
        />
      </div>
    </>
  );
};
