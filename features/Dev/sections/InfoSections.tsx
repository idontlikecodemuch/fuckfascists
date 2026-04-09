/**
 * Info component catalog sections. DEV ONLY.
 */
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CatalogSection } from '../CatalogSection';
import { InfoSection } from '../../Info/components/InfoSection';
import { FaqItem } from '../../Info/components/FaqItem';
import { LinkRow } from '../../Info/components/LinkRow';
import { infoCopy } from '../../../copy/info';
import { mockAbout, mockReference, mockLinks } from '../catalogMocks';

const MONO = 'monospace' as const;

// ── Full Info screen mock ──────────────────────────────────────────────────

export const InfoFullScreen = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="InfoScreen — Full">
    <View style={styles.infoContainer}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>{infoCopy.title}</Text>
        <Text style={styles.pageVersion}>v0.1.0</Text>
      </View>

      <InfoSection title={infoCopy.about}>
        <View style={styles.pad}>
          <Text style={styles.tagline}>{mockAbout.tagline}</Text>
          <Text style={styles.body}>{mockAbout.description}</Text>
          <Text style={styles.org}>{mockAbout.organization}</Text>
        </View>
      </InfoSection>

      <View style={styles.pad}>
        {mockReference.map((entry) => (
          <FaqItem key={entry.id} entry={entry} />
        ))}
      </View>

      <InfoSection title={infoCopy.links}>
        {mockLinks.map((entry) => (
          <LinkRow key={entry.id} entry={entry} />
        ))}
      </InfoSection>
    </View>
  </CatalogSection>
));
InfoFullScreen.displayName = 'InfoFullScreen';

// ── Individual Info components ─────────────────────────────────────────────

export const FaqCollapsed = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="FaqItem — Collapsed">
    <FaqItem entry={mockReference[0]} />
  </CatalogSection>
));
FaqCollapsed.displayName = 'FaqCollapsed';

export const FaqExpanded = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="FaqItem — Expanded (tap to see)">
    <FaqItem entry={mockReference[0]} />
  </CatalogSection>
));
FaqExpanded.displayName = 'FaqExpanded';

export const LinkRowSection = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="LinkRow">
    {mockLinks.map((entry) => (
      <LinkRow key={entry.id} entry={entry} />
    ))}
  </CatalogSection>
));
LinkRowSection.displayName = 'LinkRowSection';

// ── Styles ─────────────────────────────────────────────────────────────────

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const RED = '#CC0000';

const styles = StyleSheet.create({
  infoContainer: { backgroundColor: WHITE },
  pageHeader: { backgroundColor: BLACK, padding: 16, borderBottomWidth: 4, borderColor: RED, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  pageTitle: { fontFamily: MONO, fontSize: 20, fontWeight: 'bold', color: WHITE, letterSpacing: 3 },
  pageVersion: { fontFamily: MONO, fontSize: 11, color: '#888' },
  pad: { padding: 16 },
  tagline: { fontFamily: MONO, fontSize: 16, fontWeight: 'bold', color: RED, marginBottom: 12, lineHeight: 22 },
  body: { fontFamily: MONO, fontSize: 13, color: '#333', lineHeight: 21, marginBottom: 10 },
  org: { fontFamily: MONO, fontSize: 11, color: '#888', fontStyle: 'italic' },
  tPoint: { padding: 16, borderBottomWidth: 1, borderColor: '#DDD' },
  tTitle: { fontFamily: MONO, fontSize: 12, fontWeight: 'bold', color: BLACK, marginBottom: 6, letterSpacing: 1 },
  tBody: { fontFamily: MONO, fontSize: 12, color: '#444', lineHeight: 20 },
});
