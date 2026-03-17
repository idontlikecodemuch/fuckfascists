/**
 * Dev-only visual catalog. Renders every UI component in every meaningful state.
 * "CAPTURE ALL" saves each section as a PNG; "SAVE ALL" exports to camera roll.
 * Never imported in production — guarded by __DEV__ in App.tsx.
 */
import React, { useRef, useCallback, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { captureRef } from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';

// Map sections
import {
  BusinessCardHigh, BusinessCardMedium, BusinessCardNoDonation,
  MatchChooser3, MatchChooser2,
  UnmatchedNoMatch, UnmatchedLookupFailed,
  AvoidButtonDefault,
  SearchBarIdle, SearchBarScanning,
  MapControlsSection,
} from './sections/MapSections';

// Platform sections
import {
  PlatformsPartial, PlatformsFull, PlatformsEmpty,
  PlatformRowAvoided, PlatformRowNotAvoided,
} from './sections/PlatformsSections';

// Scorecard sections
import {
  ScorecardWithData, ScorecardEmptyState, ScorecardWithPreview, ScorecardDropCountdown,
} from './sections/ScorecardSections';

// Onboarding sections
import {
  OnboardWelcome, OnboardPermissions, OnboardPrivacy,
} from './sections/OnboardingSections';

// Info sections
import {
  InfoFullScreen, FaqCollapsed, FaqExpanded, LinkRowSection,
} from './sections/InfoSections';

// ── Section registry ───────────────────────────────────────────────────────

interface SectionDef {
  slug: string;
  Component: React.ForwardRefExoticComponent<React.RefAttributes<View>>;
}

const SECTIONS: SectionDef[] = [
  // Map
  { slug: '01-businesscard-high', Component: BusinessCardHigh },
  { slug: '02-businesscard-medium', Component: BusinessCardMedium },
  { slug: '03-businesscard-no-donation', Component: BusinessCardNoDonation },
  { slug: '04-matchchooser-3', Component: MatchChooser3 },
  { slug: '05-matchchooser-2', Component: MatchChooser2 },
  { slug: '06-unmatched-no-match', Component: UnmatchedNoMatch },
  { slug: '07-unmatched-lookup-failed', Component: UnmatchedLookupFailed },
  { slug: '08-avoidbutton-default', Component: AvoidButtonDefault },
  { slug: '09-searchbar-idle', Component: SearchBarIdle },
  { slug: '10-searchbar-scanning', Component: SearchBarScanning },
  { slug: '11-mapcontrols', Component: MapControlsSection },
  // Platforms
  { slug: '12-platforms-partial', Component: PlatformsPartial },
  { slug: '13-platforms-full', Component: PlatformsFull },
  { slug: '14-platforms-empty', Component: PlatformsEmpty },
  { slug: '15-platformrow-avoided', Component: PlatformRowAvoided },
  { slug: '16-platformrow-not-avoided', Component: PlatformRowNotAvoided },
  // Scorecard
  { slug: '17-scorecard-with-data', Component: ScorecardWithData },
  { slug: '18-scorecard-empty', Component: ScorecardEmptyState },
  { slug: '19-scorecard-preview', Component: ScorecardWithPreview },
  { slug: '20-scorecard-countdown', Component: ScorecardDropCountdown },
  // Onboarding
  { slug: '21-onboard-welcome', Component: OnboardWelcome },
  { slug: '22-onboard-permissions', Component: OnboardPermissions },
  { slug: '23-onboard-privacy', Component: OnboardPrivacy },
  // Info
  { slug: '24-info-full', Component: InfoFullScreen },
  { slug: '25-faqitem-collapsed', Component: FaqCollapsed },
  { slug: '26-faqitem-expanded', Component: FaqExpanded },
  { slug: '27-linkrow', Component: LinkRowSection },
];

// ── Screen ─────────────────────────────────────────────────────────────────

export function CatalogScreen() {
  const insets = useSafeAreaInsets();
  const refs = useRef<(View | null)[]>(Array(SECTIONS.length).fill(null));
  const [capturing, setCapturing] = useState(false);
  const [captured, setCaptured] = useState<string[]>([]);

  const captureAll = useCallback(async () => {
    setCapturing(true);
    const uris: string[] = [];
    for (let i = 0; i < SECTIONS.length; i++) {
      const viewRef = refs.current[i];
      if (!viewRef) continue;
      try {
        const uri = await captureRef(viewRef, {
          format: 'png',
          quality: 1,
          fileName: SECTIONS[i].slug,
        });
        uris.push(uri);
      } catch (e) {
        console.warn(`[Catalog] Failed to capture ${SECTIONS[i].slug}:`, e);
      }
    }
    setCaptured(uris);
    setCapturing(false);
    Alert.alert('Captured', `${uris.length} / ${SECTIONS.length} sections saved.\n\nTap SAVE ALL to export to Photos.`);
  }, []);

  const saveToPhotos = useCallback(async () => {
    if (captured.length === 0) {
      Alert.alert('Nothing captured', 'Tap CAPTURE ALL first.');
      return;
    }
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Photos access is required to save catalog images.');
      return;
    }
    let saved = 0;
    for (const uri of captured) {
      try {
        await MediaLibrary.saveToLibraryAsync(uri);
        saved++;
      } catch (e) {
        console.warn('[Catalog] Failed to save:', e);
      }
    }
    Alert.alert('Saved to Photos', `${saved} images saved to your camera roll.`);
  }, [captured]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed action bar */}
      <View style={[styles.actionBar, { paddingTop: insets.top > 0 ? 0 : 8 }]}>
        <Text style={styles.headerTitle}>DEV CATALOG</Text>
        <View style={styles.buttons}>
          <Pressable style={styles.captureBtn} onPress={captureAll} disabled={capturing}>
            <Text style={styles.btnText}>{capturing ? 'CAPTURING...' : 'CAPTURE ALL'}</Text>
          </Pressable>
          <Pressable style={styles.shareBtn} onPress={saveToPhotos}>
            <Text style={styles.btnText}>SAVE ALL</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Spacer for the sections header */}
        <Text style={styles.groupHeader}>MAP COMPONENTS</Text>
        {SECTIONS.slice(0, 11).map((s, i) => (
          <s.Component key={s.slug} ref={(el) => { refs.current[i] = el; }} />
        ))}

        <Text style={styles.groupHeader}>PLATFORM COMPONENTS</Text>
        {SECTIONS.slice(11, 16).map((s, i) => (
          <s.Component key={s.slug} ref={(el) => { refs.current[11 + i] = el; }} />
        ))}

        <Text style={styles.groupHeader}>SCORECARD COMPONENTS</Text>
        {SECTIONS.slice(16, 20).map((s, i) => (
          <s.Component key={s.slug} ref={(el) => { refs.current[16 + i] = el; }} />
        ))}

        <Text style={styles.groupHeader}>ONBOARDING SCREENS</Text>
        {SECTIONS.slice(20, 23).map((s, i) => (
          <s.Component key={s.slug} ref={(el) => { refs.current[20 + i] = el; }} />
        ))}

        <Text style={styles.groupHeader}>INFO COMPONENTS</Text>
        {SECTIONS.slice(23).map((s, i) => (
          <s.Component key={s.slug} ref={(el) => { refs.current[23 + i] = el; }} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const RED = '#CC0000';
const MONO = 'monospace' as const;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E0E0E0' },
  actionBar: { backgroundColor: BLACK, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 3, borderColor: RED },
  headerTitle: { fontFamily: MONO, fontSize: 16, fontWeight: 'bold', color: RED, letterSpacing: 3 },
  buttons: { flexDirection: 'row', gap: 8 },
  captureBtn: { backgroundColor: RED, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2, borderColor: WHITE },
  shareBtn: { backgroundColor: '#0044AA', paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2, borderColor: WHITE },
  btnText: { fontFamily: MONO, fontSize: 11, fontWeight: 'bold', color: WHITE },
  scroll: { padding: 16, paddingBottom: 60 },
  groupHeader: { fontFamily: MONO, fontSize: 13, fontWeight: 'bold', color: RED, letterSpacing: 2, marginTop: 16, marginBottom: 8 },
});
