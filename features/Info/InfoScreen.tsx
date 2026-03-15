import React from 'react';
import { ScrollView, View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useInfoContent } from './hooks/useInfoContent';
import { InfoSection } from './components/InfoSection';
import { FaqItem } from './components/FaqItem';
import { LinkRow } from './components/LinkRow';
import { infoCopy } from '../../copy/info';

/**
 * Info screen — transparency, about, FAQ, and links.
 *
 * Content is fetched from the CDN on mount and silently replaces the bundled
 * version if available. No spinner — bundled content renders immediately so
 * the screen is always usable offline. To update copy, FAQ entries, or links
 * without an app release, edit info.json in the fuckfascists-data repo.
 */
export function InfoScreen() {
  const content = useInfoContent();
  const { about, transparency, faq, links } = content;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Page header ── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle} accessibilityRole="header" allowFontScaling={false}>
            {infoCopy.title}
          </Text>
          <Text style={styles.pageVersion} allowFontScaling>v{content.version}</Text>
        </View>

        {/* ── About ── */}
        <InfoSection title={infoCopy.about}>
          <View style={styles.pad}>
            <Text style={styles.tagline} allowFontScaling>{about.tagline}</Text>
            <Text style={styles.body} allowFontScaling>{about.description}</Text>
            <Text style={styles.org} allowFontScaling>{about.organization}</Text>
          </View>
        </InfoSection>

        {/* ── Transparency ── */}
        <InfoSection title={infoCopy.data}>
          {transparency.map((point) => (
            <View key={point.id} style={styles.tPoint}>
              <Text style={styles.tTitle} allowFontScaling>{point.title}</Text>
              <Text style={styles.tBody} allowFontScaling>{point.body}</Text>
            </View>
          ))}
        </InfoSection>

        {/* ── FAQ ── */}
        <InfoSection title={infoCopy.faq}>
          {faq.map((entry) => (
            <FaqItem key={entry.id} entry={entry} />
          ))}
        </InfoSection>

        {/* ── Links ── */}
        <InfoSection title={infoCopy.links}>
          {links.map((entry) => (
            <LinkRow key={entry.id} entry={entry} />
          ))}
        </InfoSection>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const RED   = '#CC0000';
const MONO  = 'monospace' as const;

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: WHITE },
  scroll:      { paddingBottom: 40 },
  pageHeader:  { backgroundColor: BLACK, padding: 16, borderBottomWidth: 4, borderColor: RED, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  pageTitle:   { fontFamily: MONO, fontSize: 20, fontWeight: 'bold', color: WHITE, letterSpacing: 3 },
  pageVersion: { fontFamily: MONO, fontSize: 11, color: '#888' },
  pad:         { padding: 16 },
  tagline:     { fontFamily: MONO, fontSize: 16, fontWeight: 'bold', color: RED, marginBottom: 12, lineHeight: 22 },
  body:        { fontFamily: MONO, fontSize: 13, color: '#333', lineHeight: 21, marginBottom: 10 },
  org:         { fontFamily: MONO, fontSize: 11, color: '#888', fontStyle: 'italic' },
  tPoint:      { padding: 16, borderBottomWidth: 1, borderColor: '#DDD' },
  tTitle:      { fontFamily: MONO, fontSize: 12, fontWeight: 'bold', color: BLACK, marginBottom: 6, letterSpacing: 1 },
  tBody:       { fontFamily: MONO, fontSize: 12, color: '#444', lineHeight: 20 },
});
