import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { bevelFocusRaised } from '../../../design/bevel';
import type { BannerVariant } from './cardMode';
export { resolveCardMode } from './cardMode';
export type { BannerVariant } from './cardMode';

const BANNER_AUTO_DISMISS_MS = 5000;
const GLYPH_SIZE = 14;

export interface BusinessBannerProps {
  /** The search text or entity name that produced this banner. */
  displayName: string;
  variant: BannerVariant;
  onDismiss: () => void;
}

/** Glyph per banner variant — folder for no_pac/no_match, alert for errors. */
function glyphForVariant(variant: BannerVariant): keyof typeof Ionicons.glyphMap {
  switch (variant) {
    case 'lookup_failed': return 'warning-outline';
    case 'dissolved': return 'archive-outline';
    default: return 'folder-outline';
  }
}

/**
 * Bottom-anchored cockpit-cyan HUD pill for non-card scan/tap results.
 * Mirrors `NoMatchToast` styling so all "no actionable signal here"
 * messages share one visual language: thin pill, brief text, auto-dismiss.
 * Card overlays are reserved for entities with real donation data.
 *
 * The pill positions itself (absolute, bottom-center) — parents don't
 * need a wrapper. No avatar, no AVOID button, no tap-outside backdrop;
 * auto-dismisses after BANNER_AUTO_DISMISS_MS via the supplied callback.
 */
export function BusinessBanner({ displayName, variant, onDismiss }: BusinessBannerProps) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const timer = setTimeout(() => onDismissRef.current(), BANNER_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  const message = (() => {
    switch (variant) {
      case 'no_match': return mapCopy.bannerNoMatch(displayName);
      case 'lookup_failed': return mapCopy.bannerLookupFailed(displayName);
      case 'no_pac': return mapCopy.bannerNoPac(displayName);
      case 'dissolved': return mapCopy.bannerDissolved(displayName);
    }
  })();

  return (
    <View style={styles.outer} pointerEvents="none">
      <View
        style={styles.pill}
        accessibilityRole="alert"
        accessibilityLabel={message}
      >
        <Ionicons
          name={glyphForVariant(variant)}
          size={GLYPH_SIZE}
          color={theme.colors.focusAccent}
          style={styles.glyph}
        />
        <Text style={styles.text} allowFontScaling numberOfLines={2}>
          {message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    shadowColor: theme.colors.focusAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  pill: {
    ...bevelFocusRaised,
    backgroundColor: theme.colors.panelInner,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.space.xs,
    paddingHorizontal: theme.space.md,
    maxWidth: '88%',
  },
  glyph: {
    marginRight: theme.space.xs,
  },
  text: {
    ...theme.type.bodyS,
    color: theme.colors.textPrimary,
    flexShrink: 1,
  },
});
