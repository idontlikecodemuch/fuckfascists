/**
 * Harness renderers for Scorecard, Info, and Scan screen states.
 * DEV ONLY — never imported outside features/Dev/.
 */
import React from 'react';
import { View, Text, Pressable, SafeAreaView, ScrollView, StyleSheet } from 'react-native';
import { ScorecardView } from '../../Scorecard/components/ScorecardView';
import { InfoSection } from '../../Info/components/InfoSection';
import { FaqItem } from '../../Info/components/FaqItem';
import { LinkRow } from '../../Info/components/LinkRow';
import { BusinessCard } from '../../Map/components/BusinessCard';
import { BarcodeLookupBanner } from '../../Map/components/BarcodeLookupBanner';
import { infoCopy } from '../../../copy/info';
import { scanCopy } from '../../../copy/scan';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import {
  harnessScorecardPopulated,
  harnessScorecardEmpty,
  harnessAbout,
  harnessTransparency,
  harnessFaqs,
  harnessLinks,
  harnessBarcodeScanResult,
  harnessHighConfResult,
  harnessEntities,
  harnessNoMatchNotice,
} from '../harnessFixtures';

const noop = () => {};
const noopAsync = async () => {};

// ── Scorecard ───────────────────────────────────────────────────────────────

export function renderScorecardPopulated(): React.ReactElement {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle} accessibilityRole="header" allowFontScaling>
            {scorecardCopy.title}
          </Text>
        </View>
        <View style={styles.cardWrapper}>
          <ScorecardView data={harnessScorecardPopulated} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function renderScorecardEmpty(): React.ReactElement {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle} accessibilityRole="header" allowFontScaling>
            {scorecardCopy.title}
          </Text>
        </View>
        <View style={styles.cardWrapper}>
          <ScorecardView data={harnessScorecardEmpty} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Info ────────────────────────────────────────────────────────────────────

export function renderInfoDefault(): React.ReactElement {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle} allowFontScaling>{infoCopy.title}</Text>
        </View>
        <InfoSection title={infoCopy.about}>
          <View style={styles.pad}>
            <Text style={styles.tagline} allowFontScaling>{harnessAbout.tagline}</Text>
            <Text style={styles.body} allowFontScaling>{harnessAbout.description}</Text>
          </View>
        </InfoSection>
        <InfoSection title={infoCopy.data}>
          <View style={styles.collapseToggle}>
            <Text style={styles.collapseText}>+</Text>
          </View>
        </InfoSection>
        <InfoSection title={infoCopy.faq}>
          {harnessFaqs.map((e) => <FaqItem key={e.id} entry={e} />)}
        </InfoSection>
        <InfoSection title={infoCopy.links}>
          {harnessLinks.map((e) => <LinkRow key={e.id} entry={e} />)}
        </InfoSection>
      </ScrollView>
    </SafeAreaView>
  );
}

export function renderInfoTransparency(): React.ReactElement {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle} allowFontScaling>{infoCopy.title}</Text>
        </View>
        <InfoSection title={infoCopy.about}>
          <View style={styles.pad}>
            <Text style={styles.tagline} allowFontScaling>{harnessAbout.tagline}</Text>
            <Text style={styles.body} allowFontScaling>{harnessAbout.description}</Text>
          </View>
        </InfoSection>
        <InfoSection title={infoCopy.data}>
          <View style={styles.collapseToggle}>
            <Text style={styles.collapseText}>{'\u2212'}</Text>
          </View>
          {harnessTransparency.map((p) => (
            <View key={p.id} style={styles.tPoint}>
              <Text style={styles.tTitle} allowFontScaling>{p.title}</Text>
              <Text style={styles.tBody} allowFontScaling>{p.body}</Text>
            </View>
          ))}
        </InfoSection>
      </ScrollView>
    </SafeAreaView>
  );
}

export function renderInfoFaq(): React.ReactElement {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle} allowFontScaling>{infoCopy.title}</Text>
        </View>
        <InfoSection title={infoCopy.faq}>
          {harnessFaqs.map((e) => <FaqItem key={e.id} entry={e} />)}
        </InfoSection>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Scan ────────────────────────────────────────────────────────────────────

function ScanHero({ children }: { children?: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scanContent}>
        <View style={styles.scanHero}>
          <Text style={styles.scanHeading} allowFontScaling>{scanCopy.heading}</Text>
          <Text style={styles.scanBody}>{scanCopy.body}</Text>
          <Pressable style={styles.scanCta} accessibilityRole="button">
            <Text style={styles.scanCtaLabel}>{scanCopy.primaryAction}</Text>
          </Pressable>
          <Text style={styles.scanFootnote}>{scanCopy.footnote}</Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function renderScanDefault(): React.ReactElement {
  return <ScanHero />;
}

export function renderScanScannerOpen(): React.ReactElement {
  // Scanner is a native camera sheet — render the hero with a "scanner open" overlay
  return (
    <ScanHero>
      <View style={styles.scannerPlaceholder}>
        <Text style={styles.scannerText}>SCANNER ACTIVE</Text>
      </View>
    </ScanHero>
  );
}

export function renderScanResultPreAvoid(): React.ReactElement {
  return (
    <ScanHero>
      <BusinessCard
        result={harnessBarcodeScanResult}
        onAvoid={noopAsync}
        avoided={false}
        onDismiss={noop}
        allEntities={harnessEntities}
        modal={false}
      />
    </ScanHero>
  );
}

export function renderScanResultPostAvoid(): React.ReactElement {
  return (
    <ScanHero>
      <BusinessCard
        result={harnessBarcodeScanResult}
        onAvoid={noopAsync}
        avoided={true}
        onDismiss={noop}
        allEntities={harnessEntities}
        modal={false}
      />
    </ScanHero>
  );
}

export function renderScanNoMatch(): React.ReactElement {
  return (
    <ScanHero>
      <BarcodeLookupBanner notice={harnessNoMatchNotice} onDismiss={noop} />
    </ScanHero>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgVoid },
  scroll: { paddingBottom: theme.space['4xl'] },
  topBar: { backgroundColor: theme.colors.bgNav, padding: theme.space.lg, borderBottomWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue },
  topBarTitle: { ...theme.type.displayM, color: theme.colors.textPrimary, letterSpacing: 3 },
  cardWrapper: { margin: theme.space.lg },
  // Info
  infoHeader: { backgroundColor: theme.colors.bgNav, padding: theme.space.lg, borderBottomWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue },
  infoTitle: { ...theme.type.displayM, color: theme.colors.textPrimary, letterSpacing: 3 },
  pad: { padding: theme.space.lg },
  tagline: { ...theme.type.uiLabel, color: theme.colors.rewardYellow, marginBottom: theme.space.md, lineHeight: 22, textAlign: 'center' },
  body: { ...theme.type.bodyS, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 21 },
  collapseToggle: { minHeight: theme.a11y.minTapTarget, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface1 },
  collapseText: { ...theme.type.caption, color: theme.colors.highlightBlue },
  tPoint: { padding: theme.space.lg, borderBottomWidth: theme.borders.hero.width, borderColor: theme.colors.surface2 },
  tTitle: { ...theme.type.bodyS, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 6, letterSpacing: 1 },
  tBody: { ...theme.type.bodyS, color: theme.colors.textSecondary, lineHeight: 20 },
  // Scan
  scanContent: { paddingHorizontal: theme.space.lg, paddingBottom: theme.space['4xl'] * 3 },
  scanHero: { marginTop: theme.space['3xl'], marginBottom: theme.space.xl, padding: theme.space.lg, borderWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, backgroundColor: theme.colors.surface1 },
  scanHeading: { ...theme.type.displayL, color: theme.colors.textPrimary, marginBottom: theme.space.sm },
  scanBody: { ...theme.type.bodyM, color: theme.colors.textSecondary },
  scanCta: { marginTop: theme.space.xl, minHeight: theme.a11y.minTapTarget, alignItems: 'center', justifyContent: 'center', borderWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue, backgroundColor: theme.colors.bgNav },
  scanCtaLabel: { ...theme.type.displayS, color: theme.colors.rewardYellow },
  scanFootnote: { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: theme.space.md },
  scannerPlaceholder: { marginTop: theme.space.lg, height: 200, backgroundColor: theme.colors.surface1, borderWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue, alignItems: 'center', justifyContent: 'center' },
  scannerText: { ...theme.type.displayS, color: theme.colors.textSecondary, letterSpacing: 3 },
});
