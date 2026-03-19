import React from 'react';
import { View } from 'react-native';

// TODO: DetailSheet — bottom sheet for expanded data view.
// Future intent: full-screen or half-screen bottom sheet showing:
//   - Complete donation breakdown by cycle
//   - Raw FEC line items (Schedule A / Schedule B)
//   - Committee history (active + dissolved records)
//   - Direct FEC.gov deep links per cycle
//   - Share/export card image
// For V1: no-op placeholder. BusinessCard's onDetailPress wires to FEC link directly.

/**
 * Placeholder — expanded data sheet for future use.
 * Currently renders nothing. Exported so imports compile.
 */
export function DetailSheet() {
  return <View />;
}
