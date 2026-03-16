/**
 * Reusable section wrapper for the visual catalog.
 * Wraps children in a capturable View with a bold label header.
 * DEV ONLY.
 */
import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CatalogSectionProps {
  label: string;
  children: React.ReactNode;
}

export const CatalogSection = forwardRef<View, CatalogSectionProps>(
  ({ label, children }, ref) => (
    <View ref={ref} style={styles.section} collapsable={false}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.body}>{children}</View>
    </View>
  ),
);

CatalogSection.displayName = 'CatalogSection';

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
    backgroundColor: '#F5F5F0',
    borderWidth: 2,
    borderColor: '#CCC',
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#F5F5F0',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    letterSpacing: 1,
  },
  body: {
    padding: 8,
  },
});
