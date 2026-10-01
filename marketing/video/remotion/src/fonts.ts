import { useEffect, useState } from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';

const FACES: Array<[family: string, file: string, weight: string]> = [
  ['Bungee', 'fonts/Bungee-Regular.ttf', '400'],
  ['IBM Plex Sans', 'fonts/IBMPlexSans-Regular.ttf', '400'],
  ['IBM Plex Sans', 'fonts/IBMPlexSans-Medium.ttf', '500'],
  ['IBM Plex Sans', 'fonts/IBMPlexSans-SemiBold.ttf', '600'],
  ['Ionicons', 'fonts/Ionicons.ttf', '400'],
];

let loaded: Promise<void> | null = null;

const loadFonts = (): Promise<void> => {
  if (!loaded) {
    loaded = Promise.all(
      FACES.map(async ([family, file, weight]) => {
        const face = new FontFace(family, `url(${staticFile(file)})`, { weight });
        await face.load();
        document.fonts.add(face);
      }),
    ).then(() => undefined);
  }
  return loaded;
};

/** Blocks rendering until Bungee + IBM Plex Sans are available. */
export const useFonts = (): void => {
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => {
    loadFonts()
      .catch((err: unknown) => console.error('font load failed', err))
      .finally(() => continueRender(handle));
  }, [handle]);
};
