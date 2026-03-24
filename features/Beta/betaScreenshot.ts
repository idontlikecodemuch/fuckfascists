import { captureScreen } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import { betaCopy } from '../../copy/beta';
import type { Tab } from '../../app/navigation/TabBar';

/** Filename prefix for all beta screenshots. */
const FILE_PREFIX = 'ff';

/**
 * Build an ISO-8601-ish timestamp safe for filenames.
 * e.g. "2026-03-23T14-32"
 */
function fileTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

/**
 * Capture the current screen and save to the camera roll with a
 * surface-identifying filename.
 *
 * Filename format: `ff_{surface}_{timestamp}.png`
 * e.g. `ff_track_2026-03-23T14-32.png`
 *
 * Returns the human-readable surface label for use in alert copy.
 */
export async function captureBetaScreenshot(activeTab: Tab): Promise<string> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('permission-denied');
  }

  const surface = betaCopy.surfaceLabel(activeTab);
  const filename = `${FILE_PREFIX}_${surface}_${fileTimestamp()}.png`;

  // 1. Capture to a temp file
  const tempUri = await captureScreen({ format: 'png', quality: 1 });

  // 2. Copy to a properly named file in the cache directory
  const namedUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.copyAsync({ from: tempUri, to: namedUri });

  // 3. Save the named file to the camera roll
  await MediaLibrary.createAssetAsync(namedUri);

  // 4. Clean up the named copy (temp file is managed by view-shot)
  await FileSystem.deleteAsync(namedUri, { idempotent: true });

  return filename;
}
