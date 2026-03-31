/**
 * Harness renderers for Map screen states.
 * Renders map sub-components on a static background (no real MapView).
 * DEV ONLY — never imported outside features/Dev/.
 */
import React from 'react';
import { View, Image, SafeAreaView, StyleSheet, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BusinessCard } from '../../Map/components/BusinessCard';
import { MatchChooser } from '../../Map/components/MatchChooser';
import { NoMatchToast } from '../../Map/components/NoMatchToast';
import { MapSearchBar } from '../../Map/components/MapSearchBar';
import { MapControls } from '../../Map/components/MapControls';
import { sharedCopy } from '../../../copy/shared';
import { theme } from '../../../design/tokens';
import { headerBar as HEADER_BAR_ASSET } from '../../../core/ui/uiAssets';
import {
  harnessHighConfResult,
  harnessChooserResults,
  harnessEntities,
} from '../harnessFixtures';

const noop = () => {};
const noopAsync = async () => {};

const HEADER_BAR_ASPECT = 1242 / 153;

function MapShell({ children }: { children?: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const headerBarHeight = Math.round(screenWidth / HEADER_BAR_ASPECT);
  const searchTop = insets.top + headerBarHeight + theme.space.md;

  return (
    <SafeAreaView style={styles.container}>
      {/* Static map placeholder */}
      <View style={styles.mapPlaceholder} />

      {/* Header bar */}
      <View style={[styles.headerBar, { height: insets.top + headerBarHeight }]} pointerEvents="none">
        <Image
          source={HEADER_BAR_ASSET}
          style={[styles.headerBarImg, { top: insets.top, width: screenWidth, height: headerBarHeight }]}
          resizeMode="stretch"
        />
        <Image
          source={require('../../../assets/pixel/brand/FF_logo_horizontal.png')}
          style={[styles.headerLogo, { marginTop: insets.top + Math.round(headerBarHeight * 0.1) }]}
          resizeMode="contain"
          accessibilityLabel={sharedCopy.appName}
        />
      </View>

      {/* Search bar */}
      <MapSearchBar value="" onChangeText={noop} onSubmit={noop} isScanning={false} topOffset={searchTop} />

      {/* Map controls */}
      <MapControls onZoomIn={noop} onZoomOut={noop} onLocation={noop} locationLoading={false} />

      {children}
    </SafeAreaView>
  );
}

export function renderMapDefault(): React.ReactElement {
  return <MapShell />;
}

export function renderMapCardPreAvoid(): React.ReactElement {
  return (
    <MapShell>
      <View style={styles.backdrop} />
      <View style={styles.cardContainer}>
        <BusinessCard
          result={harnessHighConfResult}
          onAvoid={noopAsync}
          avoided={false}
          onDismiss={noop}
          allEntities={harnessEntities}
        />
      </View>
    </MapShell>
  );
}

export function renderMapCardPostAvoid(): React.ReactElement {
  return (
    <MapShell>
      <View style={styles.backdrop} />
      <View style={styles.cardContainer}>
        <BusinessCard
          result={harnessHighConfResult}
          onAvoid={noopAsync}
          avoided={true}
          onDismiss={noop}
          allEntities={harnessEntities}
        />
      </View>
    </MapShell>
  );
}

export function renderMapMatchChooser(): React.ReactElement {
  return (
    <MapShell>
      <MatchChooser
        results={harnessChooserResults}
        onSelect={noop}
        onDismiss={noop}
      />
    </MapShell>
  );
}

export function renderMapNoMatch(): React.ReactElement {
  return (
    <MapShell>
      <NoMatchToast />
    </MapShell>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgVoid },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#1a2744',
  },
  headerBar: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    zIndex: 2,
    alignItems: 'center',
    overflow: 'visible',
    backgroundColor: theme.colors.bgVoid,
  },
  headerBarImg: { position: 'absolute', left: 0 },
  headerLogo: { height: 28, aspectRatio: 1536 / 322, zIndex: 3 },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  cardContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    overflow: 'visible',
    maxHeight: '65%',
  },
});
