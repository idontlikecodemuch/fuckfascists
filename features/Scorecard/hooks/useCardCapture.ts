import { useCallback, useState } from 'react';
import { PixelRatio } from 'react-native';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import {
  SCORECARD_IMAGE_WIDTH,
  SCORECARD_IMAGE_HEIGHT,
  SCORECARD_CAPTURE_TIMEOUT_MS,
} from '../../../config/constants';
import { buildCardFilename } from '../utils/formatters';

const pr = PixelRatio.get();

export interface CardCaptureResult {
  uri: string;
  weekOf: string;
}

/**
 * Races a promise against a timeout. On timeout, rejects with a
 * `capture-timeout` error which the caller translates into the
 * retain-on-failure code path (raw events preserved, next visit retries).
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('capture-timeout')), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

/**
 * Manages the capture of ScorecardImage to PNG via react-native-view-shot.
 *
 * Usage:
 *   const { captureCard, capturing } = useCardCapture();
 *   const imageRef = useRef<View>(null);
 *   // Mount <ScorecardImage ref={imageRef} ... /> off-screen
 *   const result = await captureCard(imageRef, weekOf);
 *
 * Failure semantics: any error (including a capture timeout) returns null
 * and leaves the raw avoid events intact. The ScorecardScreen post-drop
 * effect treats null as "try again next visit" — never runs the scoped
 * purge when capture hasn't succeeded.
 */
export function useCardCapture() {
  const [capturing, setCapturing] = useState(false);

  const captureCard = useCallback(
    async (viewRef: React.RefObject<View | null>, weekOf: string): Promise<CardCaptureResult | null> => {
      if (!viewRef.current) return null;
      setCapturing(true);

      try {
        // Race the capture against a timeout so a hung view-shot call
        // can't freeze the user on the loader indefinitely. On timeout
        // we fall through to the catch block → null → retain-on-failure.
        const uri = await withTimeout(
          captureRef(viewRef, {
            width: SCORECARD_IMAGE_WIDTH / pr,
            height: SCORECARD_IMAGE_HEIGHT / pr,
            format: 'png',
            quality: 1,
            result: 'tmpfile',
          }),
          SCORECARD_CAPTURE_TIMEOUT_MS,
        );

        // Save to persistent scorecard directory.
        // Filename is the inscription-style "Those-I-FCKd-April-11-26.png"
        // — fun for the share receiver, archive-ordered by file mtime.
        const dir = `${FileSystem.documentDirectory}scorecards/`;
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        const destUri = `${dir}${buildCardFilename(weekOf)}`;
        await FileSystem.moveAsync({ from: uri, to: destUri });

        setCapturing(false);
        return { uri: destUri, weekOf };
      } catch {
        setCapturing(false);
        return null;
      }
    },
    [],
  );

  return { captureCard, capturing };
}
