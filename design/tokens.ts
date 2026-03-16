export const theme = {
  colors: {
    bgVoid: '#070B12',
    bgNav: '#0D1424',
    surface1: '#15284B',
    surface2: '#1A2742',
    textPrimary: '#DCE7F6',
    textSecondary: '#A8B4C8',  // lightened from #8F9DB3 for WCAG AA on surface1
    frameBlue: '#2F63FF',
    highlightBlue: '#5FAEFF',
    glowCyan: '#7AF2FF',
    rewardYellow: '#FFC93C',
    dangerRed: '#FF3B30',
    successGreen: '#2CCB63',
  },

  fonts: {
    headline: 'Bungee-Regular',
    body: 'IBMPlexSans-Regular',
    bodySemiBold: 'IBMPlexSans-SemiBold',
    bodyMedium: 'IBMPlexSans-Medium',
  },

  type: {
    displayL: { fontFamily: 'Bungee-Regular', fontSize: 28, lineHeight: 32 },
    displayM: { fontFamily: 'Bungee-Regular', fontSize: 22, lineHeight: 24 },
    displayS: { fontFamily: 'Bungee-Regular', fontSize: 18, lineHeight: 20 },
    uiLabel: { fontFamily: 'IBMPlexSans-SemiBold', fontSize: 16, lineHeight: 20 },
    bodyM: { fontFamily: 'IBMPlexSans-Regular', fontSize: 14, lineHeight: 20 },
    bodyS: { fontFamily: 'IBMPlexSans-Regular', fontSize: 12, lineHeight: 16 },
    caption: { fontFamily: 'IBMPlexSans-Medium', fontSize: 11, lineHeight: 14 },
  },

  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
    '4xl': 40,
  },

  borders: {
    standard: { width: 2, style: 'solid' as const },
    hero: { width: 4, style: 'solid' as const },
    dashed: { width: 2, style: 'dashed' as const },
  },

  effects: {
    pixelShadow: { x: 2, y: 2 },
    highlightWidth: 2,
  },

  a11y: {
    minTapTarget: 44,
    focusRing: { width: 2, color: '#7AF2FF', offset: 2 },
  },
} as const;

export type Theme = typeof theme;
