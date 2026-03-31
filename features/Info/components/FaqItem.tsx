import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { FaqEntry } from '../types';
import { infoCopy } from '../../../copy/info';
import { theme } from '../../../design/tokens';
import { bevelRaised } from '../../../design/bevel';
import { SparkleDecoration } from '../../../core/fx/SparkleDecoration';

interface FaqItemProps {
  entry: FaqEntry;
}

/**
 * Expandable FAQ row with beveled panel.
 * Collapsed: grey bevel, chevron ▼. Expanded: blue focus tint, left accent bar,
 * chevron ▲, sparkles top-right.
 */
export function FaqItem({ entry }: FaqItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <View style={[styles.wrapper, open ? styles.wrapperOpen : null]}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[styles.question, open ? styles.questionOpen : null]}
        accessibilityRole="button"
        accessibilityLabel={entry.q}
        accessibilityState={{ expanded: open }}
        accessibilityHint={open ? infoCopy.faqCollapse : infoCopy.faqExpand}
      >
        {open ? <View style={styles.accentBar} /> : null}
        <Text
          style={[styles.questionText, open ? styles.questionTextOpen : null]}
          allowFontScaling
        >
          {entry.q}
        </Text>
        <Text
          style={[styles.chevron, open ? styles.chevronOpen : null]}
          accessible={false}
        >
          {open ? infoCopy.chevronOpen : infoCopy.chevronClosed}
        </Text>
      </Pressable>

      {open && (
        <View style={styles.answer}>
          <Text style={styles.answerText} allowFontScaling>{entry.a}</Text>
        </View>
      )}
      {open ? <SparkleDecoration /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: theme.space.xs,
    ...bevelRaised,
    borderRadius: theme.radii.sharp,
    backgroundColor: theme.colors.panelOuter,
    overflow: 'visible',
  },
  wrapperOpen: {},
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: theme.a11y.minTapTarget,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
    backgroundColor: theme.colors.panelInner,
    borderRadius: theme.radii.sharp,
  },
  questionOpen: {
    backgroundColor: theme.colors.focusTint,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: theme.colors.focusAccent,
    borderTopLeftRadius: theme.radii.sharp,
    borderBottomLeftRadius: theme.radii.sharp,
  },
  questionText: {
    flex: 1,
    ...theme.type.uiLabel,
    fontSize: 13,
    color: theme.colors.textPrimary,
    lineHeight: 18,
  },
  questionTextOpen: {
    color: theme.colors.focusText,
  },
  chevron: {
    ...theme.type.caption,
    color: theme.colors.textSecondary,
    marginLeft: theme.space.sm,
  },
  chevronOpen: {
    color: theme.colors.highlightBlue,
  },
  answer: {
    backgroundColor: theme.colors.focusTint,
    paddingHorizontal: theme.space.lg,
    paddingVertical: theme.space.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.focusAccent,
  },
  answerText: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
