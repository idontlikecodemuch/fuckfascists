import React from 'react';
import { View, Text, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { onboardCopy } from '../../../copy/onboard';
import { theme } from '../../../design/tokens';
import { sealEagle, sealEagleSmall } from '../../../core/ui/uiAssets';

interface HowToScreenProps {
  stepIndex: number;
  onNext: () => void;
}

const CLARK_ASPECT = 497 / 1191;

const MEMO_SECTIONS = [
  { title: onboardCopy.howToMapTitle, body: onboardCopy.howToMapBody },
  { title: onboardCopy.howToTrackTitle, body: onboardCopy.howToTrackBody },
  { title: onboardCopy.howToScanTitle, body: onboardCopy.howToScanBody },
  { title: onboardCopy.howToScorecardTitle, body: onboardCopy.howToScorecardBody },
] as const;

const PRIVACY_LEAD = 'No Accounts. No Tracking. No servers.';
const PRIVACY_REST = onboardCopy.howToPrivacy.replace(`${PRIVACY_LEAD} `, '');

/**
 * Screen 2 — Clark memo.
 * Replaces the old privacy-only slide with an explicit how-to file that keeps
 * the privacy promise inside Clark's neutral, public-records voice.
 */
export function HowToScreen({ stepIndex, onNext }: HowToScreenProps) {
  const { height, width } = useWindowDimensions();
  const compact = height < 880 || width < 430;
  const avatarHeight = compact ? 286 : 340;
  const avatarWidth = Math.round(avatarHeight * CLARK_ASPECT);
  const fileMinHeight = compact ? Math.max(570, height - 258) : Math.max(650, height - 294);

  return (
    <OnboardingSlide stepIndex={stepIndex} title={onboardCopy.howToTitle} onNext={onNext}>
      <View style={styles.container}>
        <View style={[styles.file, { minHeight: fileMinHeight }]}>
          <View style={styles.folderTop}>
            <View style={styles.folderGradTop} />
            <View style={styles.folderGradBot} />
            <View style={styles.folderTab}>
              <View style={styles.folderTabOverlay} pointerEvents="none" />
              <Text style={styles.tabLabel} allowFontScaling={false}>MEMO</Text>
            </View>
          </View>
          <Image source={sealEagle} style={styles.folderSeal} accessibilityElementsHidden />

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
              <Text style={styles.introPrivacy} allowFontScaling>
                <Text style={styles.introPrivacyLead}>{PRIVACY_LEAD}</Text>
                <Text> {PRIVACY_REST}</Text>
              </Text>
              <Text style={styles.introSignature} allowFontScaling>
                {onboardCopy.howToSignature}
              </Text>

              <View style={styles.separator} />

              <View style={styles.memoBody}>
                <View style={[styles.clarkSlot, { width: avatarWidth }]}>
                  <Image
                    source={require('../../../assets/pixel/guide/clark-portrait.png')}
                    style={[styles.clark, { width: avatarWidth, height: avatarHeight }]}
                    resizeMode="contain"
                    accessibilityLabel="Clark the Clerk"
                  />
                </View>
                <View style={styles.rightColumn}>
                  <View style={styles.sections}>
                    {MEMO_SECTIONS.map(({ title, body }, index) => (
                      <React.Fragment key={title}>
                        {index > 0 && <View style={styles.rowLine} />}
                        <View style={styles.memoSection}>
                          <View style={styles.sectionCopy}>
                            <Text style={styles.sectionTitle} allowFontScaling={false}>{title}</Text>
                            <Text style={styles.sectionBody} allowFontScaling>{body}</Text>
                          </View>
                        </View>
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              </View>
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
    flexGrow: 1,
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
    top: -28,
    left: theme.space['2xl'],
    minHeight: 52,
    minWidth: 148,
    paddingHorizontal: theme.space.lg,
    alignItems: 'center',
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
    fontSize: 16,
    lineHeight: 20,
    color: c.documentText,
    letterSpacing: 2,
    textAlign: 'center',
  },
  folderSeal: {
    position: 'absolute',
    right: -78,
    top: 14,
    width: 112,
    height: 112,
    tintColor: c.sealRed,
    opacity: 0.22,
    zIndex: 5,
  },
  documentShadow: {
    flex: 1,
    marginHorizontal: 0,
    marginTop: -10,
    shadowColor: c.documentShadow,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 2,
  },
  documentPanel: {
    flex: 1,
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
    fontSize: 18,
    lineHeight: 23,
    color: c.documentText,
    marginBottom: theme.space.sm,
  },
  body: {
    ...theme.type.bodyS,
    fontSize: 14,
    color: c.documentText,
    lineHeight: 18,
  },
  introPrivacy: {
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 18,
    color: c.documentText,
    marginTop: theme.space.sm,
  },
  introPrivacyLead: {
    fontFamily: theme.fonts.bodySemiBold,
    color: c.documentText,
  },
  introSignature: {
    fontFamily: theme.fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 18,
    color: c.documentText,
    marginTop: theme.space.sm,
  },
  memoBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: theme.space.lg,
  },
  clarkSlot: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  clark: {
    alignSelf: 'center',
    transform: [{ translateX: -8 }],
  },
  rightColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  sections: {
    flexShrink: 1,
  },
  memoSection: {
    paddingVertical: 4,
  },
  rowLine: {
    height: 1,
    backgroundColor: c.documentBorder,
    marginVertical: 3,
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
});
