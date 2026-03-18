import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../../../design/tokens';

interface InfoSectionProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Titled section block used to group content on the Info screen.
 * Dark header strip with the section title, body below.
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

const styles = StyleSheet.create({
  section: { marginBottom: theme.space.xs, borderTopWidth: theme.borders.standard.width, borderTopColor: theme.colors.highlightBlue },
  header:  { backgroundColor: theme.colors.surface1, paddingHorizontal: theme.space.lg, paddingVertical: 10, borderLeftWidth: theme.borders.hero.width, borderColor: theme.colors.frameBlue },
  title:   { ...theme.type.displayS, fontSize: 12, color: theme.colors.rewardYellow, letterSpacing: 3 },
  body:    { borderLeftWidth: theme.borders.hero.width, borderColor: theme.colors.surface2, borderBottomWidth: theme.borders.hero.width, borderBottomColor: theme.colors.bgVoid },
});
