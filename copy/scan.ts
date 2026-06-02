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
  footnoteLine2: 'Back up until the bars are sharp.',
  prefixMatchSource: 'MATCHED BY UPC',
  // Active scan state
  scanTitle: 'SCAN BARCODE',
  // #103/#144/#182 — expo-camera SDK 52 does not expose a macro/near-focus
  // knob. CameraView uses continuous AF via `autofocus="off"`, but UPCs
  // held too close can still sit inside the lens' minimum focus distance.
  scanHelper: 'Back up until bars are sharp. Hold 6\u201310 inches away.',
} as const;
