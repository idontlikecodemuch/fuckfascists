import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { FaqEntry } from '../types';
import { infoCopy } from '../../../copy/info';
import { theme } from '../../../design/tokens';

interface FaqItemProps {
  entry: FaqEntry;
}

/**
 * Expandable FAQ row. Tapping the question toggles the answer.
 * No animation — reduced-motion safe.
 * Minimum tap target on the question row: 44pt.
 */
export function FaqItem({ entry }: FaqItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.question}
        accessibilityRole="button"
        accessibilityLabel={entry.q}
        accessibilityState={{ expanded: open }}
        accessibilityHint={open ? infoCopy.faqCollapse : infoCopy.faqExpand}
      >
        <Text style={styles.questionText} allowFontScaling>{entry.q}</Text>
        <Text style={styles.chevron} accessible={false}>{open ? infoCopy.chevronOpen : infoCopy.chevronClosed}</Text>
      </Pressable>

      {open && (
        <View style={styles.answer}>
          <Text style={styles.answerText} allowFontScaling>{entry.a}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:      { borderBottomWidth: theme.borders.standard.width, borderColor: theme.colors.frameBlue },
  question:     { flexDirection: 'row', alignItems: 'center', minHeight: theme.a11y.minTapTarget, paddingHorizontal: theme.space.lg, paddingVertical: theme.space.md, backgroundColor: theme.colors.surface1 },
  questionText: { flex: 1, ...theme.type.uiLabel, fontSize: 13, color: theme.colors.textPrimary, lineHeight: 18 },
  chevron:      { ...theme.type.caption, color: theme.colors.highlightBlue, marginLeft: theme.space.sm },
  answer:       { backgroundColor: theme.colors.surface2, paddingHorizontal: theme.space.lg, paddingVertical: theme.space.md, borderTopWidth: theme.borders.standard.width, borderColor: theme.colors.highlightBlue },
  answerText:   { ...theme.type.bodyM, fontSize: 12, color: theme.colors.textSecondary, lineHeight: 20 },
});
