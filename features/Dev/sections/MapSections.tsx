/**
 * Map component catalog sections. DEV ONLY.
 */
import React, { forwardRef } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { CatalogSection } from '../CatalogSection';
import { BusinessCard, BusinessBanner } from '../../Map/components/BusinessCard';
import { UnmatchedBanner } from '../../Map/components/UnmatchedBanner';
import { AvoidButton } from '../../Map/components/AvoidButton';
import { MapSearchBar } from '../../Map/components/MapSearchBar';
import { MapControls } from '../../Map/components/MapControls';
import { mapCopy } from '../../../copy/map';
import type { ScanResult } from '../../Map/types';
import {
  highConfResult,
  medConfResult,
  noDonationResult,
  chooser3Results,
  chooser2Results,
} from '../catalogMocks';

const noop = async () => {};
const noopSync = () => {};

// ── BusinessCard variants ──────────────────────────────────────────────────

export const BusinessCardHigh = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="BusinessCard — High Confidence">
    <BusinessCard result={highConfResult} onAvoid={noop} onDismiss={noopSync} />
  </CatalogSection>
));
BusinessCardHigh.displayName = 'BusinessCardHigh';

export const BusinessCardMedium = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="BusinessCard — Medium Confidence">
    <BusinessCard result={medConfResult} onAvoid={noop} onDismiss={noopSync} />
  </CatalogSection>
));
BusinessCardMedium.displayName = 'BusinessCardMedium';

export const BusinessCardNoDonation = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="BusinessCard — Donation Unavailable">
    <BusinessCard result={noDonationResult} onAvoid={noop} onDismiss={noopSync} />
  </CatalogSection>
));
BusinessCardNoDonation.displayName = 'BusinessCardNoDonation';

// ── BusinessBanner variants ──────────────────────────────────────────────────

export const BannerNoMatch = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="BusinessBanner — No Match">
    <BusinessBanner displayName="Joe's Pizza" variant="no_match" onDismiss={noopSync} />
  </CatalogSection>
));
BannerNoMatch.displayName = 'BannerNoMatch';

export const BannerNoPac = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="BusinessBanner — No PAC">
    <BusinessBanner displayName="Tesla" variant="no_pac" onDismiss={noopSync} />
  </CatalogSection>
));
BannerNoPac.displayName = 'BannerNoPac';

export const BannerDissolved = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="BusinessBanner — Dissolved">
    <BusinessBanner displayName="Apple Inc." variant="dissolved" onDismiss={noopSync} />
  </CatalogSection>
));
BannerDissolved.displayName = 'BannerDissolved';

// ── MatchChooser — static mock (avoids FlatList-in-ScrollView warning) ─────

const TAB_HEIGHT = 14;

function StaticMatchChooser({ results }: { results: ScanResult[] }) {
  return (
    <View style={mc.outer}>
      <View style={mc.sheet}>
        <View style={mc.header}>
          <View style={mc.headerText}>
            <Text style={mc.heading}>{mapCopy.chooserHeading}</Text>
            <Text style={mc.subhead}>{mapCopy.chooserSubhead}</Text>
          </View>
          <View style={mc.dismiss}>
            <Text style={mc.dismissIcon}>{'\u00d7'}</Text>
          </View>
        </View>
        <View style={mc.divider} />
        <View style={mc.listContent}>
          {results.map((item, i) => {
            const name = item.matchedAlias || item.canonicalName;
            return (
              <View
                key={item.entityId ?? item.fecCommitteeId}
                style={[mc.row, i > 0 && mc.rowGap]}
              >
                <View style={mc.tab} />
                <View style={mc.folder}>
                  <View style={mc.paperBorder} />
                  <View style={mc.paperShadow} />
                  <View style={mc.folderGradTop} />
                  <View style={mc.folderGradBot} />
                  <View style={mc.folderContent}>
                    <Text style={mc.rowName} numberOfLines={1}>{name}</Text>
                    <Text style={mc.chevron}>{'\u203A'}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const mc = StyleSheet.create({
  outer: {
    margin: 8,
    shadowColor: '#2878C8',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  sheet: {
    borderWidth: 2,
    borderTopColor: '#4A9AE8',
    borderLeftColor: '#4A9AE8',
    borderBottomColor: '#1A4A7A',
    borderRightColor: '#1A4A7A',
    backgroundColor: '#0E1012',
    padding: 12,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 4, paddingBottom: 8 },
  headerText: { flex: 1 },
  heading: { fontFamily: 'Bungee-Regular', fontSize: 18, letterSpacing: 2, color: '#2878C8' },
  subhead: { fontFamily: 'IBMPlexSans-Regular', fontSize: 13, color: '#A8B4C8', marginTop: 2 },
  dismiss: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  dismissIcon: { fontFamily: 'Bungee-Regular', fontSize: 22, color: '#DCE7F6' },
  divider: { height: 1, backgroundColor: '#2878C8', opacity: 0.4, marginBottom: 12 },
  listContent: { paddingTop: TAB_HEIGHT },
  row: { overflow: 'visible', minHeight: 44 + TAB_HEIGHT },
  rowGap: { marginTop: 10 },
  tab: {
    position: 'absolute', top: -TAB_HEIGHT, right: 28, width: 44, height: TAB_HEIGHT,
    backgroundColor: '#8E6844', borderTopLeftRadius: 8, borderTopRightRadius: 8,
    borderTopWidth: 1, borderTopColor: '#2A2420',
  },
  folder: { backgroundColor: '#AF7E5A', minHeight: 44, overflow: 'hidden' },
  folderGradTop: { position: 'absolute', top: 0, left: 0, right: 0, height: '45%', backgroundColor: '#C09570', opacity: 0.5 },
  folderGradBot: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', backgroundColor: '#8E6844', opacity: 0.35 },
  paperBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#F5F0E8' },
  paperShadow: { position: 'absolute', top: 3, left: 0, right: 0, height: 1, backgroundColor: 'rgba(30,20,10,0.25)' },
  folderContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 12, paddingTop: 12 },
  rowName: { flex: 1, fontFamily: 'Bungee-Regular', fontSize: 15, letterSpacing: 1, color: '#2A2420', marginRight: 8 },
  chevron: { fontFamily: 'Bungee-Regular', fontSize: 22, color: '#2A2420', opacity: 0.55 },
});

export const MatchChooser3 = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="MatchChooser — 3 Results">
    <StaticMatchChooser results={chooser3Results} />
  </CatalogSection>
));
MatchChooser3.displayName = 'MatchChooser3';

export const MatchChooser2 = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="MatchChooser — 2 Results">
    <StaticMatchChooser results={chooser2Results} />
  </CatalogSection>
));
MatchChooser2.displayName = 'MatchChooser2';

// ── UnmatchedBanner variants ───────────────────────────────────────────────

export const UnmatchedNoMatch = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="UnmatchedBanner — No Match">
    <View style={{ position: 'relative', minHeight: 60 }}>
      <UnmatchedBanner searchText="Joe's Pizza" onOpenSearch={noopSync} variant="no_match" />
    </View>
  </CatalogSection>
));
UnmatchedNoMatch.displayName = 'UnmatchedNoMatch';

export const UnmatchedLookupFailed = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="UnmatchedBanner — Lookup Unavailable">
    <View style={{ position: 'relative', minHeight: 60 }}>
      <UnmatchedBanner searchText="Joe's Pizza" onOpenSearch={noopSync} variant="lookup_unavailable" />
    </View>
  </CatalogSection>
));
UnmatchedLookupFailed.displayName = 'UnmatchedLookupFailed';

// ── AvoidButton states ─────────────────────────────────────────────────────

export const AvoidButtonDefault = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="AvoidButton — Default">
    <AvoidButton onPress={noop} />
  </CatalogSection>
));
AvoidButtonDefault.displayName = 'AvoidButtonDefault';

// ── MapSearchBar states ────────────────────────────────────────────────────

export const SearchBarIdle = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="MapSearchBar — Idle">
    <View style={{ position: 'relative', height: 60 }}>
      <MapSearchBar value="" onChangeText={noopSync} onSubmit={noopSync} isScanning={false} topOffset={8} />
    </View>
  </CatalogSection>
));
SearchBarIdle.displayName = 'SearchBarIdle';

export const SearchBarScanning = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="MapSearchBar — Scanning">
    <View style={{ position: 'relative', height: 60 }}>
      <MapSearchBar value="Walmart" onChangeText={noopSync} onSubmit={noopSync} isScanning={true} topOffset={8} />
    </View>
  </CatalogSection>
));
SearchBarScanning.displayName = 'SearchBarScanning';

// ── MapControls ────────────────────────────────────────────────────────────

export const MapControlsSection = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="MapControls">
    <View style={{ position: 'relative', height: 160 }}>
      <MapControls onZoomIn={noopSync} onZoomOut={noopSync} onLocation={noopSync} locationLoading={false} />
    </View>
  </CatalogSection>
));
MapControlsSection.displayName = 'MapControlsSection';
