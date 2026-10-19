import type { Entity } from '../../../core/models';
import type { StorageAdapter } from '../../../core/data';
import type { Platform } from '../../Platforms/types';
import type { ScorecardViewData } from '../types';
import { aggregateScorecard } from './aggregateScorecard';
import { computePowerTier } from './computePowerTier';

/**
 * Loads one Sat-Fri week as display data: avoids grouped by public figure,
 * the week's grand total, and its power-meter tier. Shared by the Scorecard
 * screen and the app-shell capture runner so both see the same card data.
 */
export async function loadScorecardViewData(
  adapter: StorageAdapter,
  entities: Entity[],
  platforms: Platform[],
  weekOf: string,
): Promise<ScorecardViewData> {
  const persons = await aggregateScorecard(adapter, entities, platforms, weekOf);
  const grandTotal = persons.reduce((sum, person) => sum + person.totalCount, 0);
  return { weekOf, persons, grandTotal, powerTier: computePowerTier(grandTotal) };
}
