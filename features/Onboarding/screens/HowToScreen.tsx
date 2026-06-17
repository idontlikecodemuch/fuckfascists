import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';
import { theme } from '../../../design/tokens';
import { sealEagleSmall } from '../../../core/ui/uiAssets';

interface HowToScreenProps {
  stepIndex: number;
  onNext: () => void;
}

const CLARK_ASPECT = 497 / 1191;

const MEMO_SECTIONS = [
  { title: onboardCopy.howToMapTitle, body: onboardCopy.howToMapBody, icon: 'map-outline' },
  { title: onboardCopy.howToTrackTitle, body: onboardCopy.howToTrackBody, icon: 'checkbox-outline' },
  { title: onboardCopy.howToScanTitle, body: onboardCopy.howToScanBody, icon: 'barcode-outline' },
  { title: onboardCopy.howToScorecardTitle, body: onboardCopy.howToScorecardBody, icon: 'stats-chart-outline' },
] as const;

/**
 * Screen 2 — Clark memo.
 * Replaces the old privacy-only slide with an explicit how-to file that keeps
 * the privacy promise inside Clark's neutral, public-records voice.
 */
export function HowToScreen({ stepIndex, onNext }: HowToScreenProps) {
  const { height, width } = useWindowDimensions();
  const compact = height < 880 || width < 430;
  const avatarHeight = compact ? 246 : 300;
  const avatarWidth = Math.round(avatarHeight * CLARK_ASPECT);

  return (
    <OnboardingSlide stepIndex={stepIndex} title={onboardCopy.howToTitle} onNext={onNext}>
      <View style={styles.container}>
        <View style={styles.file}>
          <View style={styles.folderTop}>
            <View style={styles.folderGradTop} />
            <View style={styles.folderGradBot} />
            <View style={styles.folderTab}>
              <View style={styles.folderTabOverlay} pointerEvents="none" />
              <Text style={styles.tabLabel} allowFontScaling={false}>MEMO</Text>
            </View>
            <Image source={sealEagleSmall} style={styles.folderSeal} accessibilityElementsHidden />
          </View>

          <View style={styles.documentShadow}>
            <View style={[styles.documentPanel, compact && styles.documentPanelCompact]}>
              <View style={styles.docHeader}>
                <Image source={sealEagleSmall} style={styles.headerSeal} />
                <Text style={styles.headerText} allowFontScaling={false}>PUBLIC RECORDS CLERK</Text>
              </View>
              <View style={styles.separator} />

              <Text style={styles.lead} allowFontScaling>
                {onboardCopy.clarkIntro}
              </Text>
              <Text style={styles.body} allowFontScaling>
                {onboardCopy.clarkData}
              </Text>

              <View style={styles.onFileStamp}>
                <Text style={styles.onFileText} allowFontScaling={false}>ON FILE</Text>
              </View>

              <View style={styles.separator} />

              <View style={styles.memoBody}>
                <Image
                  source={require('../../../assets/pixel/guide/clark-portrait.png')}
                  style={[styles.clark, { width: avatarWidth, height: avatarHeight }]}
                  resizeMode="contain"
                  accessibilityLabel="Clark the Clerk"
                />
                <View style={styles.sections}>
                  {MEMO_SECTIONS.map(({ title, body, icon }, index) => (
                    <React.Fragment key={title}>
                      {index > 0 && <View style={styles.rowLine} />}
                      <View style={styles.memoSection}>
                        <View style={styles.iconStamp}>
                          <Ionicons
                            name={icon as keyof typeof Ionicons.glyphMap}
                            size={compact ? 13 : 15}
                            color={c.sealRed}
                          />
                        </View>
                        <View style={styles.sectionCopy}>
                          <Text style={styles.sectionTitle} allowFontScaling={false}>{title}</Text>
                          <Text style={styles.sectionBody} allowFontScaling>{body}</Text>
                        </View>
                      </View>
                    </React.Fragment>
                  ))}
                </View>
              </View>

              <View style={styles.separator} />
              <Text style={styles.privacy} allowFontScaling>
                {onboardCopy.howToPrivacy}
              </Text>
              <Text style={styles.signature} allowFontScaling>
                {onboardCopy.howToSignature}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </OnboardingSlide>
  );
}

const c = theme.colors;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'stretch',
    justifyContent: 'center',
    marginHorizontal: -theme.space['2xl'],
  },
  file: {
    paddingTop: theme.space.xl,
  },
  folderTop: {
    backgroundColor: c.folderBg,
    height: 40,
    overflow: 'visible',
  },
  folderGradTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: c.folderBgLight,
    opacity: 0.5,
  },
  folderGradBot: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: c.folderBgDark,
    opacity: 0.4,
  },
  folderTab: {
    position: 'absolute',
    top: -22,
    left: theme.space['2xl'],
    minHeight: 42,
    minWidth: 112,
    paddingHorizontal: theme.space.lg,
    justifyContent: 'center',
    backgroundColor: c.folderBg,
    borderTopLeftRadius: theme.radii.folderTab,
    borderTopRightRadius: theme.radii.folderTab,
    overflow: 'hidden',
    zIndex: 3,
  },
  folderTabOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: c.folderBgLight,
    opacity: 0.5,
  },
  tabLabel: {
    fontFamily: theme.fonts.headline,
    fontSize: 12,
    color: c.documentText,
    letterSpacing: 2,
  },
  folderSeal: {
    position: 'absolute',
    right: theme.space.xl,
    top: theme.space.sm,
    width: 24,
    height: 24,
    tintColor: c.sealRed,
    opacity: 0.38,
  },
  documentShadow: {
    marginHorizontal: theme.space.sm,
    marginTop: -2,
    shadowColor: c.documentShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 2,
  },
  documentPanel: {
    backgroundColor: c.documentBg,
    paddingVertical: theme.space.sm,
    paddingHorizontal: theme.space.lg,
    borderRadius: theme.radii.sharp,
    overflow: 'hidden',
  },
  documentPanelCompact: {
    paddingVertical: theme.space.sm,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: theme.space.xs,
  },
  headerSeal: {
    width: 18,
    height: 18,
    tintColor: c.documentText,
    opacity: 0.7,
    marginRight: theme.space.sm,
  },
  headerText: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: c.documentText,
    textTransform: 'uppercase',
  },
  separator: {
    height: 1,
    backgroundColor: c.documentBorder,
    marginVertical: 6,
    marginHorizontal: theme.space.xs,
  },
  lead: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: c.documentText,
    marginBottom: theme.space.xs,
  },
  body: {
    ...theme.type.bodyS,
    fontSize: 12,
    color: c.documentText,
    lineHeight: 16,
  },
  onFileStamp: {
    alignSelf: 'flex-end',
    borderWidth: 2,
    borderColor: c.stampRed,
    borderRadius: theme.radii.button,
    paddingHorizontal: theme.space.sm,
    paddingVertical: 2,
    marginTop: 1,
    marginRight: theme.space.xs,
    opacity: 0.78,
    transform: [{ rotate: '-5deg' }],
  },
  onFileText: {
    fontFamily: theme.fonts.headline,
    fontSize: 9,
    lineHeight: 13,
    letterSpacing: 1.5,
    color: c.stampRed,
  },
  memoBody: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.space.sm,
  },
  clark: {
    marginLeft: -theme.space.sm,
    marginTop: theme.space.xs,
  },
  sections: {
    flex: 1,
  },
  memoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 3,
  },
  rowLine: {
    height: 1,
    backgroundColor: c.documentBorder,
    marginLeft: 30,
    marginVertical: 2,
  },
  iconStamp: {
    width: 22,
    height: 22,
    borderWidth: 1,
    borderColor: c.sealRed,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    opacity: 0.9,
  },
  sectionCopy: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: theme.fonts.headline,
    fontSize: 8,
    lineHeight: 11,
    letterSpacing: 1,
    color: c.sealRed,
    marginBottom: 1,
  },
  sectionBody: {
    ...theme.type.bodyS,
    fontSize: 11,
    color: c.documentText,
    lineHeight: 14,
  },
  privacy: {
    fontFamily: theme.fonts.bodyMedium,
    fontSize: 11.5,
    lineHeight: 15,
    color: c.documentText,
  },
  signature: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 11.5,
    lineHeight: 15,
    color: c.documentText,
    marginTop: theme.space.xs,
  },
});
