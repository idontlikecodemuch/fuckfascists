import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface InfoSectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Titled section block used to group content on the Info screen.
 * Black header strip with the section title in red, body below.
 */
export function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header" allowFontScaling>
          {title}
        </Text>
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const RED   = '#CC0000';
const MONO  = 'monospace' as const;

const styles = StyleSheet.create({
  section: { marginBottom: 4 },
  header:  { backgroundColor: BLACK, paddingHorizontal: 16, paddingVertical: 10, borderLeftWidth: 4, borderColor: RED },
  title:   { fontFamily: MONO, fontSize: 11, fontWeight: 'bold', color: WHITE, letterSpacing: 3 },
  body:    { borderLeftWidth: 4, borderColor: '#EEE' },
});
