import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { useInfoContent } from './hooks/useInfoContent';
import { InfoSection } from './components/InfoSection';
import { FaqItem } from './components/FaqItem';
import { LinkRow } from './components/LinkRow';
import { infoCopy } from '../../copy/info';
import { theme } from '../../design/tokens';

/**
 * Info screen — transparency, about, FAQ, and links.
 *
 * Content is fetched from the CDN on mount and silently replaces the bundled
 * version if available. No spinner — bundled content renders immediately so
 * the screen is always usable offline. To update copy, FAQ entries, or links
 * without an app release, edit info.json in the fuckfascists-data repo.
 */
interface InfoScreenProps {
  onVersionTap?: () => void;
}

export function InfoScreen({ onVersionTap }: InfoScreenProps) {
  const content = useInfoContent();
  const { about, transparency, faq, links } = content;
  const [showTransparency, setShowTransparency] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Page header ── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle} accessibilityRole="header" allowFontScaling={false}>
            {infoCopy.title}
          </Text>
          <Pressable onPress={onVersionTap} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={styles.pageVersion} allowFontScaling>v{content.version}</Text>
          </Pressable>
        </View>

        {/* ── About ── */}
        <InfoSection title={infoCopy.about}>
          <View style={styles.pad}>
            <Text style={styles.tagline} allowFontScaling>{about.tagline}</Text>
            <Text style={styles.body} allowFontScaling>{about.description}</Text>
            <Text style={styles.org} allowFontScaling>{about.organization}</Text>
          </View>
        </InfoSection>

        {/* ── Transparency (collapsible) ── */}
        <InfoSection title={infoCopy.data}>
          <Pressable
            onPress={() => setShowTransparency((v) => !v)}
            style={styles.collapseToggle}
            accessibilityRole="button"
            accessibilityState={{ expanded: showTransparency }}
            accessibilityHint={showTransparency ? infoCopy.faqCollapse : infoCopy.faqExpand}
          >
            <Text style={styles.collapseText} allowFontScaling>
              {showTransparency ? infoCopy.chevronOpen : infoCopy.chevronClosed}
            </Text>
          </Pressable>
          {showTransparency && transparency.map((point) => (
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

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: theme.colors.bgVoid },
  scroll:      { paddingBottom: theme.space['4xl'] },
  pageHeader:  { backgroundColor: theme.colors.bgNav, padding: theme.space.lg, borderBottomWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  pageTitle:   { ...theme.type.displayM, color: theme.colors.textPrimary, letterSpacing: 3 },
  pageVersion: { ...theme.type.caption, color: theme.colors.textSecondary },
  pad:         { padding: theme.space.lg },
  tagline:     { ...theme.type.uiLabel, color: theme.colors.rewardYellow, marginBottom: theme.space.md, lineHeight: 22 },
  body:        { ...theme.type.bodyS, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 21, marginBottom: 10 },
  org:         { ...theme.type.caption, color: theme.colors.textSecondary, fontStyle: 'italic' },
  collapseToggle: { minHeight: theme.a11y.minTapTarget, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surface1, borderBottomWidth: theme.borders.standard.width, borderColor: theme.colors.surface2 },
  collapseText:   { ...theme.type.caption, color: theme.colors.highlightBlue },
  tPoint:      { padding: theme.space.lg, borderBottomWidth: theme.borders.hero.width, borderColor: theme.colors.surface2 },
  tTitle:      { ...theme.type.bodyS, fontWeight: 'bold', color: theme.colors.textPrimary, marginBottom: 6, letterSpacing: 1 },
  tBody:       { ...theme.type.bodyS, color: theme.colors.textSecondary, lineHeight: 20 },
});
