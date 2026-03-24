import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import type { Entity } from '../../core/models';
import type { MatchingDeps } from '../../core/matching';
import type { StorageAdapter } from '../../core/data';
import { makeCacheDeps, recordEntityAvoid } from '../../core/data';
import { useEntityScan } from '../Map/hooks/useEntityScan';
import { useBarcodeSearch } from '../Map/hooks/useBarcodeSearch';
import { BusinessCard, BusinessBanner, resolveCardMode } from '../Map/components/BusinessCard';
import { BarcodeScannerSheet } from '../Map/components/BarcodeScannerSheet';
import { BarcodeLookupBanner } from '../Map/components/BarcodeLookupBanner';
import type { ScanResult } from '../Map/types';
import { scanCopy } from '../../copy/scan';
import { theme } from '../../design/tokens';

interface ScanScreenProps {
  entities: Entity[];
  adapter: StorageAdapter;
  fetchOrgs: MatchingDeps['fetchOrgs'];
  fetchOrgSummary: MatchingDeps['fetchOrgSummary'];
}

export function ScanScreen({ entities, adapter, fetchOrgs, fetchOrgSummary }: ScanScreenProps) {
  const deps = useMemo<MatchingDeps>(
    () => ({ entities, fetchOrgs, fetchOrgSummary, ...makeCacheDeps(adapter) }),
    [adapter, entities, fetchOrgs, fetchOrgSummary]
  );

  const { status, result, scan, reset } = useEntityScan(deps, '');
  const { isResolving, notice, resolveBarcode, clearNotice } = useBarcodeSearch(entities);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [activeResult, setActiveResult] = useState<ScanResult | null>(null);
  const [lastLookupLabel, setLastLookupLabel] = useState('');
  const [avoidedIds, setAvoidedIds] = useState<string[]>([]);

  useEffect(() => {
    if (status === 'matched' && result) setActiveResult(result);
  }, [result, status]);

  const handleOpenScanner = useCallback(() => {
    clearNotice();
    setLastLookupLabel('');
    setActiveResult(null);
    reset();
    setScannerOpen(true);
  }, [clearNotice, reset]);

  const handleBarcodeScanned = useCallback(
    async (scanResult: { data: string; type: string }) => {
      setScannerOpen(false);
      setActiveResult(null);
      clearNotice();
      reset();

      const target = await resolveBarcode(scanResult);
      if (!target) return;

      setLastLookupLabel(
        target.context.productName ?? target.context.brandName ?? target.context.barcode
      );
      await scan(target.searchTerm, target.context);
    },
    [clearNotice, reset, resolveBarcode, scan]
  );

  const handleAvoid = useCallback(async () => {
    if (!activeResult?.entity) return;
    const entityId = activeResult.entityId ?? activeResult.fecCommitteeId;
    await recordEntityAvoid(adapter, entityId);
    setAvoidedIds((prev) => (prev.includes(entityId) ? prev : [...prev, entityId]));
  }, [activeResult, adapter]);

  const handleDismiss = useCallback(() => {
    setActiveResult(null);
    setLastLookupLabel('');
    clearNotice();
    reset();
  }, [clearNotice, reset]);

  const handleDismissNotice = useCallback(() => {
    setLastLookupLabel('');
    clearNotice();
    reset();
  }, [clearNotice, reset]);

  const derivedNotice = useMemo(() => {
    if (notice) return notice;
    if (status === 'unmatched' && lastLookupLabel) {
      return { kind: 'no_match' as const, label: lastLookupLabel };
    }
    if (status === 'lookup_unavailable' && lastLookupLabel) {
      return { kind: 'lookup_unavailable' as const, label: lastLookupLabel };
    }
    return null;
  }, [lastLookupLabel, notice, status]);

  const cardMode = activeResult ? resolveCardMode(activeResult) : null;
  const bannerVariant = cardMode && typeof cardMode === 'object' ? cardMode.banner : null;
  const activeEntityId = activeResult ? activeResult.entityId ?? activeResult.fecCommitteeId : null;
  const isAvoided = !!activeEntityId && avoidedIds.includes(activeEntityId);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heading} accessibilityRole="header" allowFontScaling>{scanCopy.heading}</Text>
          <Text style={styles.body}>{scanCopy.body}</Text>
          <Pressable
            onPress={handleOpenScanner}
            disabled={isResolving || status === 'scanning'}
            style={[styles.cta, (isResolving || status === 'scanning') && styles.ctaBusy]}
            accessibilityRole="button"
            accessibilityLabel={
              isResolving || status === 'scanning'
                ? scanCopy.busyActionLabel
                : scanCopy.primaryActionLabel
            }
            accessibilityState={{ disabled: isResolving || status === 'scanning' }}
          >
            <Text style={styles.ctaLabel}>
              {isResolving || status === 'scanning' ? scanCopy.busyAction : scanCopy.primaryAction}
            </Text>
          </Pressable>
          <Text style={styles.footnote}>{scanCopy.footnote}</Text>
        </View>

        {activeResult && cardMode === 'card' && (
          <BusinessCard
            result={activeResult}
            onAvoid={handleAvoid}
            avoidDisabled={!activeResult.entity}
            avoided={isAvoided}
            onDismiss={handleDismiss}
            allEntities={entities}
            modal={false}
          />
        )}

        {activeResult && bannerVariant && (
          <View style={styles.bannerWrap}>
            <BusinessBanner
              displayName={activeResult.matchedAlias || activeResult.canonicalName}
              variant={bannerVariant}
              onDismiss={handleDismiss}
            />
          </View>
        )}
      </ScrollView>

      {derivedNotice && !activeResult && (
        <BarcodeLookupBanner notice={derivedNotice} onDismiss={handleDismissNotice} />
      )}

      {scannerOpen && (
        <BarcodeScannerSheet
          visible={scannerOpen}
          busy={isResolving || status === 'scanning'}
          onClose={() => setScannerOpen(false)}
          onScanned={handleBarcodeScanned}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgVoid,
  },
  content: {
    paddingHorizontal: theme.space.lg,
    paddingBottom: theme.space['4xl'] * 3,
  },
  hero: {
    marginTop: theme.space['3xl'],
    marginBottom: theme.space.xl,
    padding: theme.space.lg,
    borderWidth: theme.borders.standard.width,
    borderColor: theme.colors.frameBlue,
    backgroundColor: theme.colors.surface1,
  },
  heading: {
    ...theme.type.displayL,
    color: theme.colors.textPrimary,
    marginBottom: theme.space.sm,
  },
  body: {
    ...theme.type.bodyM,
    color: theme.colors.textSecondary,
  },
  cta: {
    marginTop: theme.space.xl,
    minHeight: theme.a11y.minTapTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: theme.borders.hero.width,
    borderColor: theme.colors.frameBlue,
    backgroundColor: theme.colors.bgNav,
  },
  ctaBusy: {
    backgroundColor: theme.colors.surface2,
  },
  ctaLabel: {
    ...theme.type.displayS,
    color: theme.colors.rewardYellow,
  },
  footnote: {
    ...theme.type.bodyS,
    color: theme.colors.textSecondary,
    marginTop: theme.space.md,
  },
  bannerWrap: {
    marginTop: theme.space.lg,
  },
});
