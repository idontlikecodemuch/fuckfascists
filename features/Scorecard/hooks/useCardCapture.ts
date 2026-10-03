import { useCallback, useState } from 'react';
import { Image } from 'react-native';
import type { ImageSourcePropType, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { SCORECARD_CAPTURE_TIMEOUT_MS } from '../../../config/constants';
import {
  powerMeterAssets,
  scorecardBeam,
  scorecardBg,
  scorecardFrame,
  scorecardLogo,
  scorecardNoSpriteMark,
  scorecardScanlines,
} from '../../../core/scorecard/scorecardAssets';
import { getSpriteFrame, nameToSpriteId } from '../../../core/sprites/spriteLoader';
import type { ScorecardViewData } from '../types';
import { buildCardFilename } from '../utils/formatters';

const SCORECARD_ASSET_PRELOAD_TIMEOUT_MS = 2500;
const SCORECARD_VISIBLE_PERSON_LIMIT = 3;

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

/** Wait up to `ms` for `ref.current` to populate. Polls every frame. */
async function waitForRef<T>(
  ref: React.RefObject<T | null>,
  ms: number,
): Promise<T | null> {
  const deadline = Date.now() + ms;
  while (!ref.current) {
    if (Date.now() > deadline) return null;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }
  return ref.current;
}

function waitForAnimationFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    const step = (remaining: number) => {
      if (remaining <= 0) {
        resolve();
        return;
      }
      requestAnimationFrame(() => step(remaining - 1));
    };
    step(count);
  });
}

async function loadImageSource(source: ImageSourcePropType): Promise<void> {
  if (typeof source === 'number') {
    await Asset.fromModule(source).downloadAsync();
    return;
  }

  const resolved = Image.resolveAssetSource(source);
  if (resolved?.uri) await Image.prefetch(resolved.uri);
}

async function preloadScorecardImageAssets(data: ScorecardViewData): Promise<void> {
  const sources: ImageSourcePropType[] = [
    scorecardBg,
    scorecardLogo,
    scorecardFrame,
    scorecardScanlines,
    scorecardBeam,
  ];

  if (data.powerTier) {
    const powerSource = powerMeterAssets[data.powerTier.index];
    if (powerSource) sources.push(powerSource);
  }

  let needsNoSpriteMark = false;
  for (const person of data.persons.slice(0, SCORECARD_VISIBLE_PERSON_LIMIT)) {
    const frame = getSpriteFrame(nameToSpriteId(person.figureName), 'defeated');
    if (frame) sources.push(frame.source);
    else needsNoSpriteMark = true;
  }
  // Rows without a sprite show the pixel X; load it before capture too.
  if (needsNoSpriteMark) sources.push(scorecardNoSpriteMark);

  await Promise.all(sources.map(loadImageSource));
}

/**
 * Manages the capture of ScorecardImage via react-native-view-shot.
 *
 * Format: JPEG at q=0.88. Pixel-art sprites mask compression artifacts
 * almost completely (we A/B'd q=0.88 vs q=0.98 — indistinguishable on the
 * card content), and JPEG is ~6× smaller than PNG. At 52 cards/year and a
 * 104-card archive cap, that's ~30 MB/year vs. ~180 MB/year on PNG.
 *
 * Usage:
 *   const { captureCard, capturing } = useCardCapture();
 *   const imageRef = useRef<View>(null);
 *   // Mount <ScorecardImage ref={imageRef} ... /> off-screen
 *   const result = await captureCard(imageRef, weekOf, scorecardData);
 *
 * Failure semantics: any error (including a capture timeout) returns null
 * and leaves the raw avoid events intact. The ScorecardScreen post-drop
 * effect treats null as "try again next visit" — never runs the scoped
 * purge when capture hasn't succeeded.
 *
 * Capture size: native size — no `width`/`height` options on captureRef.
 * The ScorecardImage canvas is styled at SCORECARD_IMAGE_WIDTH/PixelRatio
 * points so it renders at exactly 1080 physical pixels on any device;
 * omitting the width/height options lets view-shot capture at that native
 * pixel size. Passing explicit width/height in points was producing
 * under-sized output (e.g. a 360-px-wide capture on pr=3 devices).
 */
export function useCardCapture() {
  const [capturing, setCapturing] = useState(false);

  const captureCard = useCallback(
    async (
      viewRef: React.RefObject<View | null>,
      weekOf: string,
      data: ScorecardViewData,
    ): Promise<CardCaptureResult | null> => {
      setCapturing(true);

      try {
        // The ref may briefly be null right after the ScorecardImage mounts.
        // Wait up to 1s for it; any longer than that and the post-drop
        // effect treats it as a capture failure and retries next visit.
        const node = await waitForRef(viewRef, 1000);
        if (!node) {
          setCapturing(false);
          return null;
        }

        // view-shot can capture text before native <Image> assets have
        // decoded, producing a malformed card with the logo/sprites missing.
        // Preload the exact static/dynamic image sources, then give Fabric
        // two paint frames before taking the bitmap.
        await withTimeout(
          preloadScorecardImageAssets(data),
          SCORECARD_ASSET_PRELOAD_TIMEOUT_MS,
        ).catch(() => undefined);
        await waitForAnimationFrames(2);

        // Ensure destination dir exists BEFORE the capture so the
        // post-capture move can't be the thing that fails first.
        const dir = `${FileSystem.documentDirectory}scorecards/`;
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

        // Race the capture against a timeout so a hung view-shot call
        // can't freeze the user on the loader indefinitely. On timeout
        // we fall through to the catch block → null → retain-on-failure.
        const tmpUri = await withTimeout(
          captureRef(node, {
            format: 'jpg',
            quality: 0.88,
            result: 'tmpfile',
          }),
          SCORECARD_CAPTURE_TIMEOUT_MS,
        );

        // captureRef on iOS sometimes returns a path without the file://
        // prefix; expo-file-system needs the scheme. Normalize.
        const from = tmpUri.startsWith('file://') ? tmpUri : `file://${tmpUri}`;

        // Save to persistent scorecard directory under the inscription-style
        // filename ("Those-I-FCKd-April-11-26.jpg"). Archive is ordered by
        // file mtime, so filename just has to be unique-per-week.
        const destUri = `${dir}${buildCardFilename(weekOf)}`;
        try {
          await FileSystem.moveAsync({ from, to: destUri });
        } catch {
          // On some platforms/paths moveAsync across dirs can fail even when
          // copy works. Fall back to copy + best-effort delete of the tmp.
          await FileSystem.copyAsync({ from, to: destUri });
          await FileSystem.deleteAsync(from, { idempotent: true }).catch(() => {});
        }

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
