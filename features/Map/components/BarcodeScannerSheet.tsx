import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { scanCopy } from '../../../copy/scan';
import { theme } from '../../../design/tokens';
import { bevelFocusRaised } from '../../../design/bevel';
import { fillSelf, fixedFillSelf } from '../../../design/layout';
import { CornerReticle, SweepLine } from '../../../features/Scan/ScanDecorations';
import { StarField } from '../../../features/Info/components/InfoDecorations';
import {
  BARCODE_SCAN_GUIDE_HEIGHT,
  BARCODE_SCAN_GUIDE_SIDE_INSET_PERCENT,
  SCAN_CAMERA_MARGIN,
} from '../../../config/constants';

interface BarcodeScannerSheetProps {
  visible: boolean;
  busy: boolean;
  onClose: () => void;
  onScanned: (result: Pick<BarcodeScanningResult, 'data' | 'type'>) => Promise<void>;
}

const PRODUCT_BARCODE_TYPES = ['upc_a', 'ean13'] as const;

export function BarcodeScannerSheet({
  visible,
  busy,
  onClose,
  onScanned,
}: BarcodeScannerSheetProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [mountError, setMountError] = useState(false);
  const scanLock = useRef(false);

  useEffect(() => {
    if (!visible) {
      scanLock.current = false;
      setMountError(false);
    }
  }, [visible]);

  const handleBarcodeScanned = useCallback(
    async (result: BarcodeScanningResult) => {
      if (scanLock.current || busy) return;
      scanLock.current = true;
      try {
        await onScanned({ data: result.data, type: result.type });
      } catch {
        scanLock.current = false;
      }
    },
    [busy, onScanned]
  );

  const renderBody = () => {
    if (!permission) {
      return <Text style={styles.helpText}>{mapCopy.barcodePreparing}</Text>;
    }

    if (!permission.granted) {
      return (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>{mapCopy.barcodePermissionTitle}</Text>
          <Text style={styles.helpText}>
            {permission.canAskAgain
              ? mapCopy.barcodePermissionBody
              : mapCopy.barcodePermissionDeniedBody}
          </Text>
          {permission.canAskAgain ? (
            <Pressable
              onPress={() => requestPermission().catch(() => undefined)}
              style={styles.primaryButton}
              accessibilityRole="button"
              accessibilityLabel={mapCopy.barcodePermissionActionLabel}
            >
              <Text style={styles.primaryButtonText}>{mapCopy.barcodePermissionAction}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => Linking.openSettings().catch(() => undefined)}
              style={styles.primaryButton}
              accessibilityRole="button"
              accessibilityLabel={mapCopy.barcodeSettingsActionLabel}
            >
              <Text style={styles.primaryButtonText}>{mapCopy.barcodeSettingsAction}</Text>
            </Pressable>
          )}
        </View>
      );
    }

    if (mountError) {
      return (
        <View style={styles.permissionCard}>
          <Text style={styles.permissionTitle}>{mapCopy.barcodeUnavailableTitle}</Text>
          <Text style={styles.helpText}>{mapCopy.barcodeUnavailableBody}</Text>
        </View>
      );
    }

    return (
      <View style={styles.cameraShell}>
        <View style={styles.cameraFrame}>
          {/* #103/#144 — expo-camera's `autofocus` prop is counter-named:
                `on`  = focus once and LOCK (verified in Camera.types.d.ts)
                `off` = automatically focus when needed (continuous AF)
              We were locked at `on` since launch, which is why close-up
              barcode scans never refocused. Switching to `off` enables
              continuous AF on every supported device. */}
          <CameraView
            style={styles.camera}
            facing="back"
            autofocus="off"
            onBarcodeScanned={busy ? undefined : handleBarcodeScanned}
            onMountError={() => setMountError(true)}
            barcodeScannerSettings={{ barcodeTypes: [...PRODUCT_BARCODE_TYPES] }}
            accessibilityLabel={mapCopy.barcodeCameraLabel}
          />
          {/* Flex parent centers the reticle guide both axes (#101).
              The guide itself keeps its fixed height + percent side inset. */}
          <View style={styles.scanGuideContainer} pointerEvents="none" accessible={false}>
            <View style={styles.scanGuide}>
              <CornerReticle />
              <SweepLine />
            </View>
          </View>
          {/* Camera-edge corner brackets (#101). Small L-shaped brackets in
              each corner of the camera frame — visual anchor echoing the
              reticle's corners, reinforces "this is a scanner." */}
          <View style={styles.edgeDeco} pointerEvents="none" accessible={false}>
            <View style={[styles.edgeCorner, styles.edgeCornerTL]} />
            <View style={[styles.edgeCorner, styles.edgeCornerTR]} />
            <View style={[styles.edgeCorner, styles.edgeCornerBL]} />
            <View style={[styles.edgeCorner, styles.edgeCornerBR]} />
          </View>
        </View>
        <Text style={styles.helpText}>{scanCopy.scanHelper}</Text>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <StarField seed="barcode-scanner" />
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">{scanCopy.scanTitle}</Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={sharedCopy.dismissLabel}
          style={styles.closeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.closeText} allowFontScaling={false}>{sharedCopy.dismissIcon}</Text>
        </Pressable>
      </View>
      {renderBody()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.bgVoid,
    paddingTop: theme.space['3xl'],
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space.xl,
    zIndex: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.space.lg,
  },
  title: {
    ...theme.type.displayS,
    color: theme.colors.focusText,
    flex: 1,
    marginRight: theme.space.md,
  },
  closeButton: {
    minHeight: theme.a11y.minTapTarget,
    minWidth: theme.a11y.minTapTarget,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  closeText: {
    color: theme.colors.focusAccent,
    fontSize: 22,
    fontWeight: 'bold',
  },
  cameraShell: {
    flex: 1,
    justifyContent: 'center',
  },
  cameraFrame: {
    flex: 1,
    maxHeight: 280,
    marginHorizontal: SCAN_CAMERA_MARGIN,
    ...bevelFocusRaised,
    overflow: 'hidden' as const,
    shadowColor: theme.colors.focusAccent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  camera: {
    flex: 1,
  },
  // #101 — flex container centers the reticle both axes over the camera.
  scanGuideContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanGuide: {
    width: `${100 - BARCODE_SCAN_GUIDE_SIDE_INSET_PERCENT * 2}%`,
    height: BARCODE_SCAN_GUIDE_HEIGHT,
  },
  // #101 — camera-edge corner brackets
  edgeDeco: {
    ...StyleSheet.absoluteFillObject,
  },
  edgeCorner: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderColor: theme.colors.glowCyan,
  },
  edgeCornerTL: { top: 6, left: 6, borderTopWidth: 2, borderLeftWidth: 2 },
  edgeCornerTR: { top: 6, right: 6, borderTopWidth: 2, borderRightWidth: 2 },
  edgeCornerBL: { bottom: 6, left: 6, borderBottomWidth: 2, borderLeftWidth: 2 },
  edgeCornerBR: { bottom: 6, right: 6, borderBottomWidth: 2, borderRightWidth: 2 },
  permissionCard: {
    ...fillSelf,
    ...bevelFocusRaised,
    backgroundColor: theme.colors.panelInner,
    padding: theme.space.lg,
  },
  permissionTitle: {
    ...theme.type.displayS,
    color: theme.colors.focusText,
    marginBottom: theme.space.sm,
  },
  helpText: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
    marginTop: theme.space.md,
    textAlign: 'center',
  },
  primaryButton: {
    ...fixedFillSelf,
    marginTop: theme.space.lg,
    minHeight: theme.a11y.minTapTarget,
    backgroundColor: theme.colors.focusAccent,
    ...bevelFocusRaised,
    borderRadius: theme.radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...theme.type.bodyS,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
});
