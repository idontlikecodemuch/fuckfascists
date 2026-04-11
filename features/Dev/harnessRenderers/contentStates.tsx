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
import { platformsCopy } from '../../../copy/platforms';
import { infoCopy } from '../../../copy/info';
import { scanCopy } from '../../../copy/scan';
import { scorecardCopy } from '../../../copy/scorecard';
import { theme } from '../../../design/tokens';
import {
  harnessScorecardPopulated,
  harnessScorecardEmpty,
  harnessAbout,
  harnessReference,
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
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.topBar}>
          <Text style={s.topBarTitle} accessibilityRole="header" allowFontScaling>
            {scorecardCopy.title}
          </Text>
        </View>
        <View style={s.cardWrapper}>
          <ScorecardView data={harnessScorecardPopulated} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function renderScorecardEmpty(): React.ReactElement {
  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.topBar}>
          <Text style={s.topBarTitle} accessibilityRole="header" allowFontScaling>
            {scorecardCopy.title}
          </Text>
        </View>
        <View style={s.cardWrapper}>
          <ScorecardView data={harnessScorecardEmpty} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Info ────────────────────────────────────────────────────────────────────

function InfoShell({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.infoHeader}><Text style={s.infoTitle} allowFontScaling>{infoCopy.title}</Text></View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

function AboutSection() {
  return (
    <InfoSection title={infoCopy.about}>
      <View style={s.pad}>
        <Text style={s.tagline} allowFontScaling>{harnessAbout.tagline}</Text>
        <Text style={s.body} allowFontScaling>{harnessAbout.description}</Text>
      </View>
    </InfoSection>
  );
}

export function renderInfoDefault(): React.ReactElement {
  return (<InfoShell><AboutSection />{harnessReference.map((e) => <FaqItem key={e.id} entry={e} />)}<InfoSection title={infoCopy.links}>{harnessLinks.map((e) => <LinkRow key={e.id} entry={e} />)}</InfoSection></InfoShell>);
}

export function renderInfoTransparency(): React.ReactElement {
  return (<InfoShell><AboutSection />{harnessReference.filter((e) => e.category === 'data').map((e) => <FaqItem key={e.id} entry={e} defaultOpen />)}</InfoShell>);
}

export function renderInfoFaq(): React.ReactElement {
  return (<InfoShell>{harnessReference.map((e) => <FaqItem key={e.id} entry={e} />)}</InfoShell>);
}

// ── Scan ────────────────────────────────────────────────────────────────────

function ScanHero({ children }: { children?: React.ReactNode }) {
  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scanContent}>
        <View style={s.scanHero}>
          <Text style={s.scanHeading} allowFontScaling>{scanCopy.heading}</Text>
          <Text style={s.scanBody}>{scanCopy.bodyLine1}{'\n'}{scanCopy.bodyLine2}</Text>
          <Pressable style={s.scanCta} accessibilityRole="button">
            <Text style={s.scanCtaLabel}>{scanCopy.primaryAction}</Text>
          </Pressable>
          <Text style={s.scanFootnote}>{scanCopy.footnoteLine1}{'\n'}{scanCopy.footnoteLine2}</Text>
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
      <View style={s.scannerPlaceholder}>
        <Text style={s.scannerText}>SCANNER ACTIVE</Text>
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

// ── Notification ────────────────────────────────────────────────────────────

/**
 * Force-render the NudgeBanner regardless of day-of-week.
 * Reproduces the banner layout from NudgeBanner.tsx without the Thursday guard.
 */
export function renderNotificationThursday(): React.ReactElement {
  return (
    <SafeAreaView style={s.container}>
      {/* Forced nudge banner — always visible */}
      <View style={s.nudgeBanner}>
        <View style={s.nudgeBody}>
          <Text style={s.nudgeText} numberOfLines={1} allowFontScaling>
            {platformsCopy.nudgeBanner}
          </Text>
        </View>
        <View style={s.nudgeDismissBtn}>
          <Text style={s.nudgeDismissText}>{platformsCopy.nudgeDismiss}</Text>
        </View>
      </View>
      {/* Map placeholder below the banner */}
      <View style={s.notifMapPlaceholder} />
    </SafeAreaView>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const { lg, sm, md, xl } = theme.space;
const fb = theme.colors.frameBlue;
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgVoid },
  scroll: { paddingBottom: theme.space['4xl'] },
  topBar: { backgroundColor: theme.colors.bgNav, padding: lg, borderBottomWidth: 4, borderColor: fb },
  topBarTitle: { ...theme.type.displayM, color: theme.colors.textPrimary, letterSpacing: 3 },
  cardWrapper: { margin: lg },
  infoHeader: { backgroundColor: theme.colors.bgNav, padding: lg, borderBottomWidth: 4, borderColor: fb },
  infoTitle: { ...theme.type.displayM, color: theme.colors.textPrimary, letterSpacing: 3 },
  pad: { padding: lg },
  tagline: { ...theme.type.uiLabel, color: theme.colors.rewardYellow, marginBottom: md, lineHeight: 22, textAlign: 'center' }, body: { ...theme.type.bodyS, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 21 },
  collapseToggle: { minHeight: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface1 },
  collapseText: { ...theme.type.caption, color: theme.colors.highlightBlue },
  tPoint: { padding: lg, borderBottomWidth: 4, borderColor: theme.colors.surface2 },
  tTitle: { ...theme.type.bodyS, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 6, letterSpacing: 1 },
  tBody: { ...theme.type.bodyS, color: theme.colors.textSecondary, lineHeight: 20 },
  scanContent: { paddingHorizontal: lg, paddingBottom: theme.space['4xl'] * 3 },
  scanHero: { marginTop: theme.space['3xl'], marginBottom: xl, padding: lg, borderWidth: 2, borderColor: fb, backgroundColor: theme.colors.surface1 },
  scanHeading: { ...theme.type.displayL, color: theme.colors.textPrimary, marginBottom: sm },
  scanBody: { ...theme.type.bodyM, color: theme.colors.textSecondary },
  scanCta: { marginTop: xl, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: fb, backgroundColor: theme.colors.bgNav },
  scanCtaLabel: { ...theme.type.displayS, color: theme.colors.rewardYellow },
  scanFootnote: { ...theme.type.bodyS, color: theme.colors.textSecondary, marginTop: md },
  scannerPlaceholder: { marginTop: lg, height: 200, backgroundColor: theme.colors.surface1, borderWidth: 2, borderColor: fb, alignItems: 'center', justifyContent: 'center' },
  scannerText: { ...theme.type.displayS, color: theme.colors.textSecondary, letterSpacing: 3 },
  nudgeBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.rewardYellow, paddingHorizontal: lg, paddingVertical: sm, minHeight: 44 },
  nudgeBody: { flex: 1, justifyContent: 'center', minHeight: 44 },
  nudgeText: { ...theme.type.uiLabel, color: theme.colors.bgVoid },
  nudgeDismissBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginLeft: sm },
  nudgeDismissText: { ...theme.type.caption, color: theme.colors.bgVoid, fontWeight: 'bold', letterSpacing: 1 },
  notifMapPlaceholder: { flex: 1, backgroundColor: '#1a2744' },
});
