/**
 * Dev-only font scale context for the Dynamic Type screenshot pass.
 * Wraps content and provides a scale multiplier that can be read by
 * the harness to label screenshots.
 *
 * For a true Dynamic Type test, the device should be set to the largest
 * text size in Settings. This context records the current PixelRatio
 * font scale so filenames include the actual scale value.
 *
 * DEV ONLY — never imported outside features/Dev/.
 */
import React, { createContext, useContext, useMemo } from 'react';
import { PixelRatio } from 'react-native';

interface FontScaleContextValue {
  /** Current device font scale (1.0 = default, 3.5+ = xxxLarge). */
  fontScale: number;
  /** Whether the harness is currently running in a11y mode. */
  isA11yMode: boolean;
}

const FontScaleCtx = createContext<FontScaleContextValue>({
  fontScale: 1.0,
  isA11yMode: false,
});

export function useFontScale(): FontScaleContextValue {
  return useContext(FontScaleCtx);
}

interface HarnessFontScaleProviderProps {
  isA11yMode: boolean;
  children: React.ReactNode;
}

/**
 * Provider that reads and exposes the current device font scale.
 * Does not modify the font scale — that must be set in device Settings.
 */
export function HarnessFontScaleProvider({
  isA11yMode,
  children,
}: HarnessFontScaleProviderProps) {
  const value = useMemo<FontScaleContextValue>(() => ({
    fontScale: PixelRatio.getFontScale(),
    isA11yMode,
  }), [isA11yMode]);

  return (
    <FontScaleCtx.Provider value={value}>
      {children}
    </FontScaleCtx.Provider>
  );
}
