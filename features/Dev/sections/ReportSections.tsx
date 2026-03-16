/**
 * Report Card component catalog sections. DEV ONLY.
 */
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CatalogSection } from '../CatalogSection';
import { ReportCardView } from '../../ReportCard/components/ReportCardView';
import { reportCopy } from '../../../copy/report';
import { reportWithData, reportEmpty, reportPreview } from '../catalogMocks';

// ── Report card variants ───────────────────────────────────────────────────

export const ReportWithData = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="ReportCardView — With Data">
    <ReportCardView data={reportWithData} />
  </CatalogSection>
));
ReportWithData.displayName = 'ReportWithData';

export const ReportEmptyState = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="ReportCardView — Empty State">
    <ReportCardView data={reportEmpty} />
  </CatalogSection>
));
ReportEmptyState.displayName = 'ReportEmptyState';

export const ReportWithPreview = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="ReportCardView — Preview Stamp">
    <ReportCardView data={reportPreview} />
  </CatalogSection>
));
ReportWithPreview.displayName = 'ReportWithPreview';

export const ReportDropCountdown = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="Report Card — Drop Countdown">
    <View style={styles.countdownMock}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>{reportCopy.title}</Text>
        <Text style={styles.dropTime}>{reportCopy.dropTime('FRIDAY, MAR 14 AT 6:00 PM')}</Text>
      </View>
      <View style={styles.previewRow}>
        <View style={styles.previewBtn}>
          <Text style={styles.previewBtnText}>{reportCopy.previewBtn}</Text>
        </View>
      </View>
    </View>
  </CatalogSection>
));
ReportDropCountdown.displayName = 'ReportDropCountdown';

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
