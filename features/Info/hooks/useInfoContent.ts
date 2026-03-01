import { useState, useEffect } from 'react';
import type { InfoContent } from '../types';
import { BUNDLED_CONTENT } from '../data/content';
import { fetchInfoContent } from '../data/fetchContent';

/**
 * Returns Info content, starting with the bundled version immediately
 * (no loading spinner) then silently upgrading to the CDN version if available.
 *
 * This means the screen is always usable offline from first launch.
 */
export function useInfoContent(): InfoContent {
  const [content, setContent] = useState<InfoContent>(BUNDLED_CONTENT);

  useEffect(() => {
    let cancelled = false;
    fetchInfoContent(BUNDLED_CONTENT).then((fetched) => {
      if (!cancelled) setContent(fetched);
    });
    return () => { cancelled = true; };
  }, []);

  return content;
}
