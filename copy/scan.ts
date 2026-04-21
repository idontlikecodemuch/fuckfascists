export const scanCopy = {
  tabLabel: 'SCAN',
  tabBetaQualifier: '(BETA)',
  heading: 'SCAN A PRODUCT',
  bodyLine1: 'Scan it. Trace it.',
  bodyLine2: 'Here\u2019s the funding record.',
  primaryAction: 'OPEN SCANNER',
  primaryActionLabel: 'Open the barcode scanner camera',
  busyAction: 'LOOKING UP...',
  busyActionLabel: 'Looking up scanned barcode',
  footnoteLine1: 'Works with UPC and EAN barcodes.',
  footnoteLine2: 'Fill the frame and hold steady.',
  prefixMatchSource: 'MATCHED BY UPC',
  // Active scan state
  scanTitle: 'SCAN BARCODE',
  // #103 — expo-camera SDK 52 doesn't expose a close-focus tuning knob;
  // `autofocus="on"` is the only switch, and on most phones it can't
  // resolve UPC codes closer than ~4 inches. Giving users a concrete
  // distance range helps the lens land on the code.
  scanHelper: 'Hold 4\u20138 inches away. Center the code, hold steady.',
} as const;
