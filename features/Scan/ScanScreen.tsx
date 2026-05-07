import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, SafeAreaView, StyleSheet } from 'react-native';
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
import { useCardOverlayAnimation } from '../../core/ui/useCardOverlayAnimation';
import { sharedCopy } from '../../copy/shared';
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
  const showFullCard = cardMode === 'card';
  const bannerVariant = cardMode && typeof cardMode === 'object' ? cardMode.banner : null;
  const activeEntityId = activeResult ? activeResult.entityId ?? activeResult.fecCommitteeId : null;
  const isAvoided = !!activeEntityId && avoidedIds.includes(activeEntityId);
  const isBusy = isResolving || status === 'scanning';

  // Persistent-mount + slide-up overlay pattern, mirroring MapScreen + Track.
  // Keeps the card subtree mounted across open/close cycles so the
  // SpriteView crop region survives Fabric native-view recycling
  // (see Apr 27 sprite-clip fix in CLAUDE.md).
  const lastFullCardResultRef = useRef<ScanResult | null>(null);
  if (activeResult && showFullCard) {
    lastFullCardResultRef.current = activeResult;
  }
  const persistentCardResult = activeResult && showFullCard
    ? activeResult
    : lastFullCardResultRef.current;
  const cardVisible = activeResult !== null && showFullCard;
  const { slideY, dimOpacity } = useCardOverlayAnimation(cardVisible);

  return (
    <SafeAreaView style={styles.container}>
      <StarField seed="scan" />

      <ScanStandbyPanel busy={isBusy} onOpenScanner={handleOpenScanner} />

      {/* SEE FILE business-card overlay, mirroring Track. Persistent mount
          after first open so Fabric doesn't recycle the sprite's clipped
          native view between shows. Single fragment under one guard so the
          dim layer and card transform animate as a unit. */}
      {persistentCardResult && (
        <>
          <Animated.View
            style={[styles.dimBackdrop, { opacity: dimOpacity }]}
            pointerEvents={cardVisible ? 'auto' : 'none'}
          >
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={handleDismiss}
              accessibilityRole="button"
              accessibilityLabel={sharedCopy.dismissLabel}
            />
          </Animated.View>
          <Animated.View
            style={[styles.cardContainer, { transform: [{ translateY: slideY }] }]}
            pointerEvents={cardVisible ? 'auto' : 'none'}
            accessibilityElementsHidden={!cardVisible}
            importantForAccessibility={cardVisible ? 'auto' : 'no-hide-descendants'}
          >
            <BusinessCard
              result={persistentCardResult}
              onAvoid={handleAvoid}
              avoidDisabled={!persistentCardResult.entity}
              avoided={isAvoided}
              onDismiss={handleDismiss}
              allEntities={entities}
              people={people}
              visible={cardVisible}
            />
          </Animated.View>
        </>
      )}

      {activeResult && bannerVariant && (
        <BusinessBanner
          displayName={activeResult.matchedAlias || activeResult.canonicalName}
          variant={bannerVariant}
          onDismiss={handleDismiss}
        />
      )}

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
  dimBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000',
  },
  cardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'visible' as const,
    maxHeight: '65%',
    paddingTop: theme.space['3xl'],
  },
});
