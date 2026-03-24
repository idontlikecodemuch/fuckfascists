import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import {
  BARCODE_SCAN_GUIDE_HEIGHT,
  BARCODE_SCAN_GUIDE_SIDE_INSET_PERCENT,
  SAFE_AREA_TOP_MIN,
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
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [mountError, setMountError] = useState(false);
  const scanLock = useRef(false);

  // Request camera permission immediately when the scanner opens — skip the
  // interstitial and go straight to the native OS dialog (expo-camera best
  // practice: call requestPermission() eagerly, not behind a manual button).
  useEffect(() => {
    if (visible && permission && !permission.granted && permission.canAskAgain) {
      requestPermission().catch(() => undefined);
    }
  }, [visible, permission, requestPermission]);

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
            >
              <Text style={styles.primaryButtonText}>{mapCopy.barcodePermissionAction}</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => Linking.openSettings().catch(() => undefined)}
              style={styles.primaryButton}
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
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={busy ? undefined : handleBarcodeScanned}
          onMountError={() => setMountError(true)}
          barcodeScannerSettings={{ barcodeTypes: [...PRODUCT_BARCODE_TYPES] }}
        />
        <View style={styles.scanGuide} pointerEvents="none" />
        <Text style={styles.helpText}>
          {busy ? mapCopy.barcodeResolving : mapCopy.barcodeGuide}
        </Text>
      </View>
    );
  };

  if (!visible) return null;

  const dynamicTop = Math.max(insets.top, SAFE_AREA_TOP_MIN);

  return (
    <View style={[styles.root, { paddingTop: dynamicTop }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{mapCopy.barcodeScannerTitle}</Text>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={sharedCopy.dismissLabel}>
          <Text style={styles.closeText}>{sharedCopy.dismiss}</Text>
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
    ...theme.type.displayM,
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: theme.space.md,
  },
  closeText: {
    ...theme.type.bodyS,
    color: theme.colors.highlightBlue,
  },
  cameraShell: {
    flex: 1,
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.highlightBlue,
    overflow: 'hidden' as const,
  },
  scanGuide: {
    position: 'absolute',
    left: `${BARCODE_SCAN_GUIDE_SIDE_INSET_PERCENT}%`,
    right: `${BARCODE_SCAN_GUIDE_SIDE_INSET_PERCENT}%`,
    height: BARCODE_SCAN_GUIDE_HEIGHT,
    borderWidth: theme.borders.hero.width,
    borderColor: theme.colors.rewardYellow,
    alignSelf: 'center',
  },
  permissionCard: {
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.highlightBlue,
    backgroundColor: theme.colors.surface1,
    padding: theme.space.lg,
  },
  permissionTitle: {
    ...theme.type.displayS,
    color: theme.colors.textPrimary,
    marginBottom: theme.space.sm,
  },
  helpText: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
    marginTop: theme.space.md,
  },
  primaryButton: {
    marginTop: theme.space.lg,
    minHeight: theme.a11y.minTapTarget,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.frameBlue,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgNav,
  },
  primaryButtonText: {
    ...theme.type.bodyS,
    color: theme.colors.glowCyan,
    fontWeight: 'bold',
  },
});
