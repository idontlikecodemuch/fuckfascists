import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../design/tokens';

interface InfoSectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Titled section block for the Info screen.
 * Header renders as a standalone label (Bungee / highlightBlue) above children.
 * Children provide their own panel styling — section is a layout wrapper only.
 */
export function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.title} accessibilityRole="header" allowFontScaling>
        {title}
      </Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginHorizontal: theme.space.lg, marginTop: theme.space.lg },
  title: {
    ...theme.type.displayS,
    fontSize: 12,
    fontFamily: theme.fonts.headline,
    color: theme.colors.highlightBlue,
    letterSpacing: 3,
    marginBottom: theme.space.sm,
  },
  body: {},
});
