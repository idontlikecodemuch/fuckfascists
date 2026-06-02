import type { DonationSummary, PoliticalPerson } from '../../../core/models';
import { formatCycleLabel } from '../../../core/models';

type PartyTotals = { r: number; d: number; o: number };

/** Render-ready donation totals derived from a PAC summary + linked people. */
export interface DataZoneSummary {
  /** People with a non-null donationSummary — the set that contributed to the totals. */
  people: PoliticalPerson[];
  totalR: number;
  totalD: number;
  totalO: number;
  recentR: number;
  recentD: number;
  /** Formatted label like "2025–26"; null when no source has any cycle activity. */
  recentCycleLabel: string | null;
  /** Union of PAC + people activeCycles, ascending. */
  activeCycles: number[];
  rIsLarger: boolean;
  recentRIsLarger: boolean;
  /** True when any sum across R/D/O (total or recent) is non-zero. */
  hasRealDonations: boolean;
}

/**
 * Pure derivation of everything DataZone renders from a PAC donationSummary
 * and a list of associated people. The card's unified data view — totals
 * combine PAC + people, the visible cycle prefers the latest completed major
 * FEC cycle when per-cycle totals are available, and activeCycles is the union
 * of PAC + people history.
 *
 * Safe to call with null/undefined PAC summary (for people-only entities)
 * or an empty/undefined people list (for PAC-only entities).
 */
export function deriveDonationSummary(
  donationSummary: DonationSummary | null | undefined,
  associatedPeople: PoliticalPerson[] | undefined,
  referenceDate = new Date(),
): DataZoneSummary {
  const people = (associatedPeople ?? []).filter((p) => p.donationSummary != null);

  // Active cycles: union of PAC + people history.
  const activeCyclesSet = new Set<number>();
  for (const y of donationSummary?.activeCycles ?? []) activeCyclesSet.add(y);
  for (const p of people) {
    for (const y of p.donationSummary?.activeCycles ?? []) activeCyclesSet.add(y);
  }
  const activeCycles = Array.from(activeCyclesSet).sort((a, b) => a - b);

  // Legacy fallback: max numeric cycle across all sources. Person.recentCycle is
  // a formatted string label ("2017-18"), so activeCycles remains the source of
  // truth for numeric comparisons.
  const pacRecentCycle = donationSummary?.recentCycle ?? 0;
  const peopleMaxCycle = Math.max(
    0,
    ...people.map((p) => {
      const cycles = p.donationSummary?.activeCycles ?? [];
      return cycles.length ? Math.max(...cycles) : 0;
    }),
  );
  const latestActiveCycle = Math.max(pacRecentCycle, peopleMaxCycle, activeCycles[activeCycles.length - 1] ?? 0);
  const recentCycleNum = pickDisplayCycle(activeCycles, latestActiveCycle, referenceDate);
  const recentCycleLabel = recentCycleNum > 0 ? formatCycleLabel(recentCycleNum) : null;

  // Totals: always sum every source, regardless of cycle alignment.
  const pacR = donationSummary?.totalRepubs ?? 0;
  const pacD = donationSummary?.totalDems ?? 0;
  const pacO = donationSummary?.totalO ?? 0;

  // Recent-cycle amounts: read the selected FEC cycle from compact cycleTotals
  // when present. Fallback to the legacy recentCycle fields for summaries not
  // yet rehydrated with per-cycle totals.
  let personR = 0, personD = 0, personO = 0, recentPersonR = 0, recentPersonD = 0;
  for (const p of people) {
    const ds = p.donationSummary!;
    personR += ds.totalR;
    personD += ds.totalD;
    personO += ds.totalO ?? 0;
    const pRecent = ds.activeCycles.length ? Math.max(...ds.activeCycles) : 0;
    const recent = findCycleTotals(ds.cycleTotals, recentCycleNum) ??
      (pRecent === recentCycleNum ? { r: ds.recentCycleR, d: ds.recentCycleD, o: ds.recentCycleO ?? 0 } : null);
    recentPersonR += recent?.r ?? 0;
    recentPersonD += recent?.d ?? 0;
  }
  const recentPac = findCycleTotals(donationSummary?.cycleTotals, recentCycleNum) ??
    (pacRecentCycle === recentCycleNum
      ? { r: donationSummary?.recentRepubs ?? 0, d: donationSummary?.recentDems ?? 0, o: donationSummary?.recentO ?? 0 }
      : null);
  const recentPacR = recentPac?.r ?? 0;
  const recentPacD = recentPac?.d ?? 0;

  const totalR = pacR + personR;
  const totalD = pacD + personD;
  const totalO = pacO + personO;
  const recentR = recentPacR + recentPersonR;
  const recentD = recentPacD + recentPersonD;

  return {
    people,
    totalR, totalD, totalO,
    recentR, recentD,
    recentCycleLabel,
    activeCycles,
    rIsLarger: totalR >= totalD,
    recentRIsLarger: recentR >= recentD,
    hasRealDonations: totalR !== 0 || totalD !== 0 || totalO !== 0 || recentR !== 0 || recentD !== 0,
  };
}

export function getLatestCompletedMajorCycle(referenceDate = new Date()): number {
  const year = referenceDate.getFullYear();
  return year % 2 === 0 ? year - 2 : year - 1;
}

function pickDisplayCycle(activeCycles: number[], fallbackCycle: number, referenceDate: Date): number {
  const latestCompleted = getLatestCompletedMajorCycle(referenceDate);
  const completed = activeCycles.filter((cycle) => cycle <= latestCompleted);
  if (completed.length > 0) return completed[completed.length - 1]!;
  return fallbackCycle;
}

function findCycleTotals(
  cycleTotals: ReadonlyArray<readonly [number, number, number, number]> | undefined,
  cycle: number,
): PartyTotals | null {
  if (!cycleTotals || cycle <= 0) return null;
  const match = cycleTotals.find(([entryCycle]) => entryCycle === cycle);
  if (!match) return null;
  return {
    r: match[1] ?? 0,
    d: match[2] ?? 0,
    o: match[3] ?? 0,
  };
}
