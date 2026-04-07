import React from 'react';
import { View, Text, Pressable, ImageBackground, StyleSheet, type ViewStyle, type TextStyle, type ImageStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../design/tokens';
import { mapCopy } from '../../copy/map';
import { platformsCopy } from '../../copy/platforms';
import { scorecardCopy } from '../../copy/scorecard';
import { infoCopy } from '../../copy/info';
import { scanCopy } from '../../copy/scan';

const BG_TEXTURE = require('../../assets/pixel/bg_tile_dark_stone.png');

export type Tab = 'scan' | 'map' | 'platforms' | 'report' | 'info' | 'dev';

export const TABS: { id: Tab; label: string }[] = [
  { id: 'map',       label: mapCopy.tabLabel       },
  { id: 'platforms', label: platformsCopy.tabLabel  },
  { id: 'report',    label: scorecardCopy.tabLabel  },
  { id: 'info',      label: infoCopy.tabLabel       },
  ...(__DEV__ ? [{ id: 'dev' as const, label: 'DEV' }] : []),
  { id: 'scan',      label: scanCopy.tabLabel },
];

const TAB_ICON_NAMES: Record<Tab, keyof typeof Ionicons.glyphMap> = {
  scan:      'barcode-outline',
  map:       'map-outline',
  platforms: 'checkmark-done-outline',
  report:    'trophy-outline',
  info:      'information-circle-outline',
  dev:       'code-slash-outline',
};

export function TabBar({ activeTab, onSelect }: { activeTab: Tab; onSelect: (t: Tab) => void }) {
  const insets = useSafeAreaInsets();
  return (
    <ImageBackground source={BG_TEXTURE} resizeMode="repeat" style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 8) }]} imageStyle={styles.bgTexture}>
      {TABS.map(({ id, label }) => {
        const active = id === activeTab;
        return (
          <Pressable
            key={id}
            style={[styles.tabItem, active && styles.tabItemActive]}
            onPress={() => onSelect(id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={label}
          >
            <Ionicons
              name={TAB_ICON_NAMES[id]}
              size={26}
              color={active ? theme.colors.rewardYellow : theme.colors.textSecondary}
              style={styles.tabIconSpacing}
            />
            <Text style={[styles.tabLabel, active && styles.tabLabelActive]} allowFontScaling={false}>
              {label}
            </Text>
            {id === 'scan' && (
              <Text style={[styles.tabQualifier, active && styles.tabQualifierActive]} allowFontScaling={false}>
                {scanCopy.tabBetaQualifier}
              </Text>
            )}
          </Pressable>
        );
      })}
    </ImageBackground>
  );
}

const styles = StyleSheet.create<{
  tabBar:             ViewStyle;
  bgTexture:          ImageStyle;
  tabItem:            ViewStyle;
  tabItemActive:      ViewStyle;
  tabIconSpacing:     ViewStyle;
  tabLabel:           TextStyle;
  tabLabelActive:     TextStyle;
  tabQualifier:       TextStyle;
  tabQualifierActive: TextStyle;
}>({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bgNav,
    borderTopWidth: theme.borders.standard.width,
    borderTopColor: theme.colors.frameBlue,
    paddingTop: theme.space.xs,
    overflow: 'hidden',
  },
  bgTexture: {
    opacity: 0.3,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.space.sm,
    minHeight: theme.a11y.minTapTarget,
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: theme.colors.surface1,
  },
  tabIconSpacing: {
    marginBottom: 2,
  },
  tabLabel: {
    ...theme.type.displayS,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1,
    color: theme.colors.textSecondary,
  },
  tabLabelActive: {
    color: theme.colors.rewardYellow,
  },
  tabQualifier: {
    fontFamily: theme.fonts.body,
    fontSize: 7,
    lineHeight: 9,
    color: theme.colors.textSecondary,
    opacity: 0.7,
  },
  tabQualifierActive: {
    color: theme.colors.rewardYellow,
    opacity: 0.7,
  },
});
