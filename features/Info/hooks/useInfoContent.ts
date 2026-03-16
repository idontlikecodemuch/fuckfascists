import { useState, useEffect } from 'react';
import type { InfoContent } from '../types';
import { BUNDLED_CONTENT } from '../data/content';
import { fetchInfoContent } from '../data/fetchContent';

/**
 * Returns Info content, starting with the bundled version immediately
 * (no loading spinner) then silently upgrading to the CDN version if available.
 *
 * This means the screen is always usable offline from first launch.
 * Uses the cancelled-flag pattern for useEffect cleanup.
 */
export function useInfoContent(): InfoContent {
  const [content, setContent] = useState<InfoContent>(BUNDLED_CONTENT);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const fetched = await fetchInfoContent(BUNDLED_CONTENT);
      if (!cancelled) setContent(fetched);
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return content;
}
