import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, SafeAreaView, Linking } from 'react-native';
import { useInfoContent } from './hooks/useInfoContent';
import { InfoSection } from './components/InfoSection';
import { FaqItem } from './components/FaqItem';
import { LinkRow } from './components/LinkRow';
import { StarField, CornerBrackets, NeonRule } from './components/InfoDecorations';
import { infoCopy } from '../../copy/info';
import { sharedCopy } from '../../copy/shared';
import { theme } from '../../design/tokens';
import { bevelAmberPlaque, bevelInset } from '../../design/bevel';
import { SparkleDecoration } from '../../core/fx/SparkleDecoration';

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
        <StarField seed="info" />

        {/* ── Page header (placeholder for future asset) ── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle} accessibilityRole="header" allowFontScaling>
            {infoCopy.title}
          </Text>
        </View>

        {/* ── About — amber plaque ── */}
        <View style={styles.aboutOuter} accessibilityLabel="About">
          <View style={styles.aboutInner}>
            <CornerBrackets />
            <Text style={styles.aboutTagline} allowFontScaling>{about.tagline}</Text>
            <NeonRule />
            <Text style={styles.aboutDescription} allowFontScaling>{about.description}</Text>
            <Text style={styles.aboutOrg} allowFontScaling>{about.organization}</Text>
          </View>
          <SparkleDecoration variant="info" />
        </View>

        {/* ── Built to Last — etched inscription ── */}
        {about.ethos ? (
          <View style={styles.ethosPanel}>
            <Text style={styles.ethosTitle} accessibilityRole="header" allowFontScaling>
              {about.ethosTitle}
            </Text>
            <Text style={styles.ethosBody} allowFontScaling>{about.ethos}</Text>
            <Pressable
              onPress={() => Linking.openURL(sharedCopy.repoUrl)}
              accessibilityRole="link"
              accessibilityLabel={infoCopy.linkLabel('Source code on GitHub')}
            >
              <Text style={styles.ethosLink} allowFontScaling>
                {sharedCopy.repoUrl} {'\u2197'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* ── THE DATA (transparency accordion) ── */}
        <InfoSection title={infoCopy.data}>
          <Pressable
            onPress={() => setShowTransparency((v) => !v)}
            style={styles.collapseToggle}
            accessibilityRole="button"
            accessibilityLabel={infoCopy.transparencyToggleLabel}
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

        {/* ── Links & Source ── */}
        <InfoSection title={infoCopy.links}>
          {links.map((entry) => (
            <LinkRow key={entry.id} entry={entry} />
          ))}
        </InfoSection>

        {/* ── Version label ── */}
        <View style={styles.versionRow}>
          <Pressable
            onPress={onVersionTap}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={infoCopy.versionLabel}
          >
            <Text style={styles.versionText} allowFontScaling>v{content.version}</Text>
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const ABOUT_BG = '#050810';
const ETHOS_BG = '#080a0e';

const bevelRaisedPanel = {
  borderWidth: theme.borders.bevel.width,
  borderTopColor: theme.colors.bevelLight,
  borderLeftColor: theme.colors.bevelLight,
  borderBottomColor: theme.colors.bevelDark,
  borderRightColor: theme.colors.bevelDark,
  borderRadius: theme.radii.sharp,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgVoid },
  scroll: { paddingBottom: theme.space['4xl'] },

  pageHeader: {
    backgroundColor: theme.colors.bgNav,
    padding: theme.space.lg,
    borderBottomWidth: theme.borders.hero.width,
    borderColor: theme.colors.frameBlue,
    alignItems: 'center',
  },
  pageTitle: { ...theme.type.displayM, color: theme.colors.textPrimary, letterSpacing: 3 },

  aboutOuter: {
    margin: theme.space.lg,
    ...bevelAmberPlaque,
    overflow: 'visible',
  },
  aboutInner: {
    margin: 3,
    borderWidth: 1,
    borderColor: theme.colors.amberActionDark,
    backgroundColor: ABOUT_BG,
    paddingVertical: theme.space.xl,
    paddingHorizontal: theme.space.lg,
    alignItems: 'center',
  },
  aboutTagline: {
    ...theme.type.displayS,
    color: theme.colors.rewardYellow,
    textAlign: 'center',
    marginBottom: theme.space.xs,
  },
  aboutDescription: {
    ...theme.type.bodyM,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.space.sm,
  },
  aboutOrg: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },

  ethosPanel: {
    marginHorizontal: theme.space.lg,
    marginBottom: theme.space.lg,
    ...bevelInset,
    backgroundColor: ETHOS_BG,
    padding: theme.space.lg,
    alignItems: 'center',
  },
  ethosTitle: {
    ...theme.type.caption,
    fontFamily: theme.fonts.headline,
    color: theme.colors.highlightBlue,
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: theme.space.sm,
  },
  ethosBody: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.space.sm,
  },
  ethosLink: {
    ...theme.type.bodyS,
    color: theme.colors.highlightBlue,
    textDecorationLine: 'underline',
    textAlign: 'center',
  },

  collapseToggle: {
    minHeight: theme.a11y.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.panelInner,
    ...bevelRaisedPanel,
    marginHorizontal: theme.space.sm,
    marginBottom: theme.space.xs,
  },
  collapseText: { ...theme.type.caption, color: theme.colors.textSecondary },
  tPoint: {
    marginHorizontal: theme.space.sm,
    marginBottom: theme.space.xs,
    ...bevelRaisedPanel,
    backgroundColor: theme.colors.panelInner,
    padding: theme.space.lg,
  },
  tTitle: {
    ...theme.type.bodyS,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.space.xs,
    letterSpacing: 1,
  },
  tBody: { ...theme.type.bodyS, color: theme.colors.textSecondary, lineHeight: 20 },

  versionRow: { alignItems: 'center', marginTop: theme.space.xl },
  versionText: { ...theme.type.caption, color: theme.colors.textSecondary },
});
