/**
 * Scorecard component catalog sections. DEV ONLY.
 */
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CatalogSection } from '../CatalogSection';
import { ScorecardImage } from '../../Scorecard/components/ScorecardImage';
import { LivePreview } from '../../Scorecard/components/LivePreview';
import { scorecardCopy } from '../../../copy/scorecard';
import { scorecardWithData, scorecardEmpty, scorecardPreview } from '../catalogMocks';

// ── Scorecard variants ─────────────────────────────────────────────────────

export const ScorecardWithData = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="LivePreview — With Data">
    <LivePreview data={scorecardWithData} />
  </CatalogSection>
));
ScorecardWithData.displayName = 'ScorecardWithData';

export const ScorecardEmptyState = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="LivePreview — Empty State">
    <LivePreview data={scorecardEmpty} />
  </CatalogSection>
));
ScorecardEmptyState.displayName = 'ScorecardEmptyState';

export const ScorecardWithPreview = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="LivePreview — Preview">
    <LivePreview data={scorecardPreview} />
  </CatalogSection>
));
ScorecardWithPreview.displayName = 'ScorecardWithPreview';

export const ScorecardRenderedCard = forwardRef<View>((_, ref) => (
  <CatalogSection ref={ref} label="ScorecardImage — Rendered Card">
    <View style={styles.imageWrapper}>
      <ScorecardImage data={scorecardWithData} />
    </View>
  </CatalogSection>
));
ScorecardRenderedCard.displayName = 'ScorecardRenderedCard';

const styles = StyleSheet.create({
  imageWrapper: {
    alignSelf: 'center',
    transform: [{ scale: 0.3 }],
    overflow: 'hidden',
  },
});
