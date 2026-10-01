import { getAudioDurationInSeconds } from '@remotion/media-utils';
import { staticFile } from 'remotion';

/** Optional per-line voiceover: marketing/video/vo/<lineId>.mp3, or vo/wide/<lineId>.mp3 for the wide layout. */
export const voSrc = (id: string, layout: 'vertical' | 'wide' = 'vertical'): string =>
  staticFile(layout === 'wide' ? `media/vo/wide/${id}.mp3` : `media/vo/${id}.mp3`);

const exists = async (url: string): Promise<boolean> => {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const type = res.headers.get('content-type') ?? '';
    return res.ok && !type.includes('text/html');
  } catch {
    return false;
  }
};

export type VoMap = Record<string, { seconds: number; src: string } | null>;

export const probeVo = async (ids: string[], layout: 'vertical' | 'wide'): Promise<VoMap> => {
  const out: VoMap = {};
  await Promise.all(
    ids.map(async (id) => {
      const candidates = layout === 'wide' ? [voSrc(id, 'wide'), voSrc(id)] : [voSrc(id)];
      out[id] = null;
      for (const src of candidates) {
        if (await exists(src)) {
          try {
            out[id] = { seconds: await getAudioDurationInSeconds(src), src };
          } catch {
            out[id] = null;
          }
          return;
        }
      }
    }),
  );
  return out;
};

export type SceneMap = Record<string, number>; // lineId -> frame count

/** Lines with a 16:9 'in context' scene (JPEG sequence + manifest), played full-frame on the wide intro. */
export const probeScene = async (ids: string[]): Promise<SceneMap> => {
  const found: SceneMap = {};
  await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await fetch(staticFile(`media/clips/clark/scene/${id}/manifest.json`));
        const type = res.headers.get('content-type') ?? '';
        if (!res.ok || type.includes('text/html')) return;
        const m = (await res.json()) as { frames?: number };
        if (m.frames && m.frames > 0) found[id] = m.frames;
      } catch {
        /* absent */
      }
    }),
  );
  return found;
};

export type VeoMap = Record<string, number>; // lineId -> frame count

/** Which lines have a keyed Clark PNG sequence at clips/clark/<id>/NNNN.png (see scripts/prep-clark.sh). */
export const probeVeo = async (ids: string[]): Promise<VeoMap> => {
  const found: VeoMap = {};
  await Promise.all(
    ids.map(async (id) => {
      try {
        const res = await fetch(staticFile(`media/clips/clark/${id}/manifest.json`));
        const type = res.headers.get('content-type') ?? '';
        if (!res.ok || type.includes('text/html')) return;
        const m = (await res.json()) as { frames?: number };
        if (m.frames && m.frames > 0) found[id] = m.frames;
      } catch {
        /* absent */
      }
    }),
  );
  return found;
};
