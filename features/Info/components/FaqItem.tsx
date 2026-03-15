import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { FaqEntry } from '../types';
import { infoCopy } from '../../../copy/info';

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

const BLACK = '#1A1A1A';
const WHITE = '#F5F5F0';
const MONO  = 'monospace' as const;

const styles = StyleSheet.create({
  wrapper:      { borderBottomWidth: 2, borderColor: BLACK },
  question:     { flexDirection: 'row', alignItems: 'center', minHeight: 44, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: WHITE },
  questionText: { flex: 1, fontFamily: MONO, fontSize: 13, fontWeight: 'bold', color: BLACK, lineHeight: 18 },
  chevron:      { fontFamily: MONO, fontSize: 10, color: '#CC0000', marginLeft: 8 },
  answer:       { backgroundColor: '#F0F0EA', paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 2, borderColor: BLACK },
  answerText:   { fontFamily: MONO, fontSize: 12, color: '#333', lineHeight: 20 },
});
