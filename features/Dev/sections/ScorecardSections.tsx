/**
 * Scorecard component catalog sections. DEV ONLY.
 */
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CatalogSection } from '../CatalogSection';
import { ScorecardView } from '../../Scorecard/components/ScorecardView';
import { scorecardCopy } from '../../../copy/scorecard';
import { scorecardWithData, scorecardEmpty, scorecardPreview } from '../catalogMocks';

// ── Scorecard variants ─────────────────────────────────────────────────────

export const ScorecardWithData = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="ScorecardView — With Data">
    <ScorecardView data={scorecardWithData} />
  </CatalogSection>
));
ScorecardWithData.displayName = 'ScorecardWithData';

export const ScorecardEmptyState = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="ScorecardView — Empty State">
    <ScorecardView data={scorecardEmpty} />
  </CatalogSection>
));
ScorecardEmptyState.displayName = 'ScorecardEmptyState';

export const ScorecardWithPreview = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="ScorecardView — Preview Stamp">
    <ScorecardView data={scorecardPreview} />
  </CatalogSection>
));
ScorecardWithPreview.displayName = 'ScorecardWithPreview';

export const ScorecardDropCountdown = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Scorecard — Drop Countdown">
    <View style={styles.countdownMock}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>{scorecardCopy.title}</Text>
        <Text style={styles.dropTime}>{scorecardCopy.dropTime('FRIDAY, MAR 14 AT 6:00 PM')}</Text>
      </View>
      <View style={styles.previewRow}>
        <View style={styles.previewBtn}>
          <Text style={styles.previewBtnText}>{scorecardCopy.previewBtn}</Text>
        </View>
      </View>
    </View>
  </CatalogSection>
));
ScorecardDropCountdown.displayName = 'ScorecardDropCountdown';

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const RED = '#CC0000';
const MONO = 'monospace' as const;

const styles = StyleSheet.create({
  countdownMock: { backgroundColor: WHITE },
  topBar: { backgroundColor: BLACK, padding: 16, borderBottomWidth: 4, borderColor: RED },
  topBarTitle: { fontFamily: MONO, fontSize: 20, fontWeight: 'bold', color: WHITE, letterSpacing: 3 },
  dropTime: { fontFamily: MONO, fontSize: 11, color: '#AAA', marginTop: 4 },
  previewRow: { padding: 16 },
  previewBtn: { backgroundColor: WHITE, borderWidth: 3, borderColor: BLACK, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  previewBtnText: { fontFamily: MONO, fontSize: 15, fontWeight: 'bold', color: BLACK, letterSpacing: 2 },
});
