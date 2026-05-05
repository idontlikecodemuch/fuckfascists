import type { ViewStyle } from 'react-native';

/**
 * Small layout style atoms for controls that must paint at their final width
 * on first render, including inside animated or late-measured parents.
 */
export const fillSelf: ViewStyle = {
  alignSelf: 'stretch',
  minWidth: 0,
};

export const fixedFillSelf: ViewStyle = {
  ...fillSelf,
  flexShrink: 0,
};

export const flexChild: ViewStyle = {
  minWidth: 0,
};

export const noShrink: ViewStyle = {
  flexShrink: 0,
};
