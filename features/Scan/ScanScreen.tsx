import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import type { Entity, PoliticalPerson } from '../../core/models';
import { getAssociatedPeople } from '../../core/models';
import type { MatchingDeps } from '../../core/matching';
import type { StorageAdapter } from '../../core/data';
import { makeCacheDeps, recordEntityAvoid } from '../../core/data';
import { SURFACE_SCAN } from '../../config/constants';
import { useEntityScan } from '../Map/hooks/useEntityScan';
import { useBarcodeSearch } from '../Map/hooks/useBarcodeSearch';
import { BusinessCard, BusinessBanner, resolveCardMode } from '../Map/components/BusinessCard';
import { BarcodeScannerSheet } from '../Map/components/BarcodeScannerSheet';
import { BarcodeLookupBanner } from '../Map/components/BarcodeLookupBanner';
import { StarField } from '../Info/components/InfoDecorations';
import type { ScanResult } from '../Map/types';
import { theme } from '../../design/tokens';
import { ScanStandbyPanel } from './ScanDecorations';

interface ScanScreenProps {
  entities: Entity[];
  people: PoliticalPerson[];
  adapter: StorageAdapter;
  fetchOrgs: MatchingDeps['fetchOrgs'];
  fetchOrgSummary: MatchingDeps['fetchOrgSummary'];
}

export function ScanScreen({ entities, people, adapter, fetchOrgs, fetchOrgSummary }: ScanScreenProps) {
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
    await recordEntityAvoid(adapter, entityId, SURFACE_SCAN);
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

  const activeAssociatedPeople = activeResult?.entity
    ? getAssociatedPeople(activeResult.entity, people, entities)
    : [];
  const cardMode = activeResult ? resolveCardMode(activeResult, activeAssociatedPeople) : null;
  const bannerVariant = cardMode && typeof cardMode === 'object' ? cardMode.banner : null;
  const activeEntityId = activeResult ? activeResult.entityId ?? activeResult.fecCommitteeId : null;
  const isAvoided = !!activeEntityId && avoidedIds.includes(activeEntityId);
  const isBusy = isResolving || status === 'scanning';

  return (
    <SafeAreaView style={styles.container}>
      <StarField seed="scan" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ScanStandbyPanel busy={isBusy} onOpenScanner={handleOpenScanner} />

        {activeResult && cardMode === 'card' && (
          <View style={styles.resultWrap}>
            <BusinessCard
              result={activeResult}
              onAvoid={handleAvoid}
              avoidDisabled={!activeResult.entity}
              avoided={isAvoided}
              onDismiss={handleDismiss}
              allEntities={entities}
              people={people}
              modal={false}
            />
          </View>
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
          busy={isBusy}
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
    paddingBottom: theme.space['4xl'] * 2,
  },
  resultWrap: {
    marginTop: theme.space.xl,
    paddingHorizontal: theme.space.lg,
  },
  bannerWrap: {
    marginTop: theme.space.lg,
    paddingHorizontal: theme.space.lg,
  },
});
