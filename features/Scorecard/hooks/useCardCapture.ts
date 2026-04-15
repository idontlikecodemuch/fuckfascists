import { useCallback, useRef, useState } from 'react';
import { PixelRatio } from 'react-native';
import type { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { SCORECARD_IMAGE_WIDTH, SCORECARD_IMAGE_HEIGHT } from '../../../config/constants';

const pr = PixelRatio.get();

export interface CardCaptureResult {
  uri: string;
  weekOf: string;
}

/**
 * Manages the capture of ScorecardImage to PNG via react-native-view-shot.
 *
 * Usage:
 *   const { captureCard, capturing } = useCardCapture();
 *   const imageRef = useRef<View>(null);
 *   // Mount <ScorecardImage ref={imageRef} ... /> off-screen
 *   const result = await captureCard(imageRef, weekOf);
 */
export function useCardCapture() {
  const [capturing, setCapturing] = useState(false);

  const captureCard = useCallback(
    async (viewRef: React.RefObject<View | null>, weekOf: string): Promise<CardCaptureResult | null> => {
      if (!viewRef.current) return null;
      setCapturing(true);

      try {
        const uri = await captureRef(viewRef, {
          width: SCORECARD_IMAGE_WIDTH / pr,
          height: SCORECARD_IMAGE_HEIGHT / pr,
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });

        // Save to persistent scorecard directory
        const dir = `${FileSystem.documentDirectory}scorecards/`;
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
        const destUri = `${dir}${weekOf}.png`;
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
