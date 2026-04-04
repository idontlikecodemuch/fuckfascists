import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Linking } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { sharedCopy } from '../../../copy/shared';
import { mapCopy } from '../../../copy/map';
import { theme } from '../../../design/tokens';
import {
  BARCODE_SCAN_GUIDE_HEIGHT,
  BARCODE_SCAN_GUIDE_SIDE_INSET_PERCENT,
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
        <CameraView
          style={styles.camera}
          facing="back"
          autofocus="on"
          onBarcodeScanned={busy ? undefined : handleBarcodeScanned}
          onMountError={() => setMountError(true)}
          barcodeScannerSettings={{ barcodeTypes: [...PRODUCT_BARCODE_TYPES] }}
          accessibilityLabel={mapCopy.barcodeCameraLabel}
        />
        <View style={styles.scanGuide} pointerEvents="none" accessible={false} />
        <Text style={styles.helpText}>
          {busy ? mapCopy.barcodeResolving : mapCopy.barcodeGuide}
        </Text>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.root} accessibilityViewIsModal>
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">{mapCopy.barcodeScannerTitle}</Text>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={sharedCopy.dismissLabel}
          style={styles.closeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
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
    ...theme.type.displayM,
    color: theme.colors.textPrimary,
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
