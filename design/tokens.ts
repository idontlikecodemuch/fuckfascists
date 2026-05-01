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
    // Brighter than the general focusTint (0.08) — focused Track rows need to
    // read clearly against the panelInner row bg, and the today cell that
    // sits inside this band is bumped further (TRACK_TODAY_BAND_OPACITY).
    trackFocusTint: 'rgba(40, 120, 200, 0.18)',
    // Solid equivalent of trackFocusTint over panelInner — used by every piece
    // inside a focused Track panel (caps, sides, rows, group header) so the
    // dimensional cyan bevel reads as one filled cell with no dark gaps.
    trackFocusBg: '#15243A',
    // Distinctly darker variant for sub-rows inside a focused multi-row
    // panel. Sits visually recessed behind the gradient-lit parent header.
    trackFocusBgDeep: '#0B1422',

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

    // Tooltip — clean speech bubble (intentionally non-game aesthetic)
    tooltipFace: '#FFFFFF',
    tooltipShadow: '#C8C4B8',

    // Folder / document system — manila folder reskin for business card
    folderBg: '#AF7E5A',
    folderBgLight: '#B88867',
    folderBgDark: '#9A6D4C',
    documentBg: '#F5F0E8',
    documentText: '#2A2420',
    documentBorder: '#D4C8B8',
    documentLabel: '#8A7E72',
    documentShadow: 'rgba(30,20,10,0.25)',
    sealRed: '#8B3A3A',
    stampRed: '#CC2222',
    amberPulse: 'rgba(255,180,40,0.25)',

    // Scorecard share-image (1080×1920) — warmer palette than the in-app
    // textPrimary (which is cooler / blue-tinted). The share card reads as a
    // standalone artifact; cream + dim slate match the gold + cyan accents.
    scorecardCream: '#E8E0D0',
    scorecardDim: '#667788',
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
    folderTab: 8,
    token: 8,
    tooltip: 14,
  },

  effects: {
    pixelShadow: { x: 2, y: 2 },
    highlightWidth: 2,
  },

  /** Unified glow treatment — used for both box shadows and divider lines. */
  glow: {
    color: 'rgba(90, 180, 255, 0.35)',
    colorDefeated: 'rgba(44, 203, 99, 0.30)',
    /** Secondary cyan rim used on top of the primary diffuse blue glow.
     *  Drives the arena edge highlight (#127). Tighter blur than color,
     *  less spread — reads as an inner rim accent, not a replacement. */
    colorHighlight: 'rgba(122, 242, 255, 0.22)',
    highlightBlurRadius: 8,
    highlightSpreadDistance: -1,
    blurRadius: 16,
    spreadDistance: -2,
    /** Divider line height + glow shadow radius. */
    dividerHeight: 3,
    dividerShadowRadius: 10,
    dividerShadowOpacity: 0.6,
  },

  a11y: {
    minTapTarget: 44,
    focusRing: { width: 2, color: '#7AF2FF', offset: 2 },
  },

  accordion: {
    expandedIndicator: '\u2212',   // − (U+2212 MINUS SIGN)
    collapsedIndicator: '+',
  },
} as const;

export type Theme = typeof theme;
