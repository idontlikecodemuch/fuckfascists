import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BarcodeNotice } from '../hooks/useBarcodeSearch';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import { haptics } from '../../../core/fx/haptics';
import { getBarcodeToastPresentation } from './barcodeToastPresentation';

interface BarcodeLookupBannerProps {
  notice: BarcodeNotice;
  onDismiss: () => void;
}

/**
 * Compact, non-blocking Scan toast for OFF lookup failures, unsupported codes,
 * and products whose parent company is not in the curated FEC graph yet.
 */
export function BarcodeLookupBanner({ notice, onDismiss }: BarcodeLookupBannerProps) {
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    const timer = setTimeout(() => onDismissRef.current(), 6000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = useCallback(() => {
    haptics.tap();
    onDismiss();
  }, [onDismiss]);

  const presentation = getBarcodeToastPresentation(notice);
  const accessibilityLabel = `${presentation.title}. ${presentation.body}`;

  return (
    <View style={styles.outer} pointerEvents="box-none">
      <View style={styles.banner} accessibilityRole="alert" accessibilityLabel={accessibilityLabel}>
        <View style={[styles.iconBadge, { borderColor: presentation.color }]}>
          <Ionicons
            name={presentation.icon}
            size={22}
            color={presentation.color}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>
        <View style={styles.copy}>
          <Text
            style={styles.title}
            allowFontScaling
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {presentation.titleSubject ? (
              <>
                <Text style={styles.titleSubject}>{presentation.titleSubject}</Text>
                <Text>{presentation.titleStatus}</Text>
              </>
            ) : presentation.title}
          </Text>
          <Text style={styles.text} allowFontScaling>{presentation.body}</Text>
          {__DEV__ && notice.kind === 'lookup_unavailable' && notice.reason && (
            <Text
              style={styles.devReason}
              allowFontScaling={false}
              selectable
            >
              [DEV] {notice.reason}
            </Text>
          )}
        </View>
        <Pressable
          onPress={handleDismiss}
          style={styles.dismissHit}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={mapCopy.bannerDismissLabel}
        >
          <Text style={styles.dismissIcon} allowFontScaling={false}>{sharedCopy.dismissIcon}</Text>
        </Pressable>
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
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  banner: {
    backgroundColor: theme.colors.panelInner,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.frameBlue,
    paddingVertical: theme.space.md,
    paddingLeft: theme.space.md,
    paddingRight: theme.a11y.minTapTarget + theme.space.sm,
    minHeight: theme.a11y.minTapTarget,
    maxWidth: '92%',
    width: '92%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderWidth: 2,
    backgroundColor: theme.colors.bgNav,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.space.md,
  },
  copy: {
    flex: 1,
  },
  title: {
    ...theme.type.displayS,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 1,
    color: theme.colors.rewardYellow,
    marginBottom: 2,
  },
  titleSubject: {
    color: theme.colors.glowCyan,
  },
  text: {
    ...theme.type.bodyS,
    color: theme.colors.textPrimary,
  },
  devReason: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11,
    color: theme.colors.dangerRed,
    marginTop: theme.space.xs,
    letterSpacing: 0.5,
  },
  dismissHit: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: theme.a11y.minTapTarget,
    minHeight: theme.a11y.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissIcon: {
    ...theme.type.bodyM,
    color: theme.colors.textSecondary,
    fontSize: 20,
  },
});
