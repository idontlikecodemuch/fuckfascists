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
    successGreenBright: '#2D8A4E',
    successGreenDeep: '#1A3A1A',
    successGreenText: '#5AB55A',
    trackFocusTint: 'rgba(40, 120, 200, 0.08)',

    // Panel bevel system — cool grey at rest
    bevelLight: '#3A3E42',
    bevelDark: '#141618',
    bevelInsetLight: '#222528',
    bevelInsetDark: '#0A0B0C',
    panelOuter: '#0A0B0C',
    panelInner: '#0E1012',
    panelBorder: '#2A2D30',

    // Focus system — blue, panels shift from grey to blue on focus
    focusAccent: '#2878C8',
    focusBevelLight: '#4A9AE8',
    focusBevelDark: '#1A4A7A',
    focusTint: 'rgba(40, 120, 200, 0.08)',
    focusText: '#C0DAF0',

    // Amber action — AVOID button
    amberAction: '#A07810',
    amberActionLight: '#D4A017',
    amberActionDark: '#7A5A08',
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
    bodyM: { fontFamily: 'IBMPlexSans-Regular', fontSize: 15, lineHeight: 22 },
    bodyS: { fontFamily: 'IBMPlexSans-Regular', fontSize: 13, lineHeight: 18 },
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
    bevel: { width: 2, style: 'solid' as const },
    accent: { width: 3, style: 'solid' as const },
  },

  radii: {
    sharp: 2,
    button: 3,
    token: 8,
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
