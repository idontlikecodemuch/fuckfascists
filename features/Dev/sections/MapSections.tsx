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
import { CONFIDENCE_THRESHOLD_HIGH } from '../../../config/constants';
import { sharedCopy } from '../../../copy/shared';
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

// ── MatchChooser — static mock (avoids FlatList nesting) ───────────────────

function StaticMatchChooser({ results }: { results: ScanResult[] }) {
  return (
    <View style={mc.card}>
      <Text style={mc.heading}>{mapCopy.chooserHeading(results.length)}</Text>
      {results.map((item) => {
        const isVerified = item.confidence === 1.0;
        const tagLabel = isVerified ? sharedCopy.verified : sharedCopy.matched;
        return (
          <View key={item.entityId ?? item.fecCommitteeId} style={mc.row}>
            <Text style={mc.rowName} numberOfLines={1}>{item.canonicalName}</Text>
            <View style={[mc.tag, isVerified ? mc.tagVerified : mc.tagMatched]}>
              <Text style={mc.tagText}>{tagLabel}</Text>
            </View>
            {item.confidence < CONFIDENCE_THRESHOLD_HIGH && (
              <Text style={mc.rowWarning}>{sharedCopy.warningIcon}</Text>
            )}
          </View>
        );
      })}
      <View style={mc.dismissButton}>
        <Text style={mc.dismissLabel}>{sharedCopy.dismiss}</Text>
      </View>
    </View>
  );
}

const mc = StyleSheet.create({
  card: { backgroundColor: '#F5F5F0', borderColor: '#1A1A1A', borderWidth: 4, padding: 16, margin: 8 },
  heading: { fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', color: '#1A1A1A', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 2, borderColor: '#1A1A1A', minHeight: 44 },
  rowName: { flex: 1, fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold', color: '#1A1A1A', marginRight: 8 },
  rowWarning: { fontSize: 14, marginLeft: 4 },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderWidth: 2 },
  tagVerified: { backgroundColor: '#2E7D32', borderColor: '#1B5E20' },
  tagMatched: { backgroundColor: '#CC7A00', borderColor: '#7A4800' },
  tagText: { fontFamily: 'monospace', fontSize: 10, color: '#F5F5F0', fontWeight: 'bold' },
  dismissButton: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 3, borderColor: '#1A1A1A', backgroundColor: '#F5F5F0', alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  dismissLabel: { fontFamily: 'monospace', fontSize: 13, color: '#1A1A1A', fontWeight: 'bold' },
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
