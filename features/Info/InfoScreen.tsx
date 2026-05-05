import React from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView, Linking } from 'react-native';
import Animated, { useSharedValue, useAnimatedScrollHandler } from 'react-native-reanimated';
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
import type { ReferenceCategory } from './types';

const CATEGORY_LABELS: Record<ReferenceCategory, string> = {
  data: infoCopy.categoryData,
  privacy: infoCopy.categoryPrivacy,
  app: infoCopy.categoryApp,
};

interface InfoScreenProps {
  onVersionTap?: () => void;
}

export function InfoScreen({ onVersionTap }: InfoScreenProps) {
  const content = useInfoContent();
  const { about, reference, links } = content;
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => { scrollY.value = event.contentOffset.y; },
  });

  // Track which categories we've already rendered a label for
  let lastCategory: ReferenceCategory | null = null;

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView contentContainerStyle={styles.scroll} onScroll={scrollHandler} scrollEventThrottle={16}>
        <StarField seed="info" scrollY={scrollY} />

        {/* ── Page header ──
             Bonus: no background fill so the title sits directly on the
             star field. #128: bottom strip mirrors the TabBar's brand-yellow
             glow strip (2px line + three-stop boxShadow halo). */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle} accessibilityRole="header" allowFontScaling>
            {infoCopy.title}
          </Text>
          <View style={styles.headerBottomGlow} pointerEvents="none" />
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

        {/* ── Reference accordion (merged THE DATA + PRIVACY + THE APP) ── */}
        <View style={styles.referenceSection}>
          {reference.map((entry) => {
            const showLabel = entry.category !== lastCategory;
            lastCategory = entry.category;
            return (
              <React.Fragment key={entry.id}>
                {showLabel && (
                  <Text style={styles.categoryLabel} accessibilityRole="header" allowFontScaling>
                    {CATEGORY_LABELS[entry.category]}
                  </Text>
                )}
                <FaqItem entry={entry} defaultOpen={entry.id === 'data-source'} />
              </React.Fragment>
            );
          })}
        </View>

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

      </Animated.ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const ABOUT_BG = '#050810';
const ETHOS_BG = '#080a0e';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bgVoid },
  scroll: { paddingBottom: theme.space['4xl'] },

  pageHeader: {
    padding: theme.space.lg,
    alignItems: 'center',
  },
  pageTitle: { ...theme.type.displayM, color: theme.colors.textPrimary, letterSpacing: 3 },
  // Mirrors `topGlow` on app/navigation/TabBar.tsx — same brand-yellow line +
  // three-stop boxShadow halo, anchored at the bottom of the Info header so
  // the top + bottom bars read as the same treatment (#128).
  headerBottomGlow: {
    backgroundColor: theme.colors.rewardYellow,
    height: 2,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    boxShadow: [
      { offsetX: 0, offsetY: 0, blurRadius: 12, color: 'rgba(255, 201, 60, 1)' },
      { offsetX: 0, offsetY: 0, blurRadius: 24, color: 'rgba(255, 201, 60, 0.7)' },
      { offsetX: 0, offsetY: 4, blurRadius: 36, color: 'rgba(255, 201, 60, 0.4)' },
    ],
    elevation: 12,
  },

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

  referenceSection: {
    marginHorizontal: theme.space.lg,
    marginTop: theme.space.lg,
  },
  categoryLabel: {
    fontFamily: theme.fonts.headline,
    fontSize: theme.type.caption.fontSize,
    lineHeight: theme.type.caption.lineHeight,
    color: theme.colors.textSecondary,
    letterSpacing: 2,
    marginTop: theme.space.lg,
    marginBottom: theme.space.sm,
  },

  versionRow: { alignItems: 'center', marginTop: theme.space.xl },
  versionText: { ...theme.type.caption, color: theme.colors.textSecondary },
});
