import type { DonationSummary, PoliticalPerson } from '../../../core/models';
import { formatCycleLabel } from '../../../core/models';

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
 * combine PAC + people, recent-cycle amounts are isolated to sources whose
 * own most-recent cycle matches the displayed recent cycle (so a person
 * whose last activity was 2018 doesn't bleed into a PAC's 2026 row), and
 * activeCycles is the union of PAC + people history.
 *
 * Safe to call with null/undefined PAC summary (for people-only entities)
 * or an empty/undefined people list (for PAC-only entities).
 */
export function deriveDonationSummary(
  donationSummary: DonationSummary | null | undefined,
  associatedPeople: PoliticalPerson[] | undefined,
): DataZoneSummary {
  const people = (associatedPeople ?? []).filter((p) => p.donationSummary != null);

  // Derive the "recent cycle" we'll display — max numeric cycle across all sources.
  // Using activeCycles (number[]) as the source of truth; person.recentCycle is a
  // formatted string label ("2017–18"), whereas entity.donationSummary.recentCycle
  // and activeCycles entries are raw election years (2018).
  const pacRecentCycle = donationSummary?.recentCycle ?? 0;
  const peopleMaxCycle = Math.max(
    0,
    ...people.map((p) => {
      const cycles = p.donationSummary?.activeCycles ?? [];
      return cycles.length ? Math.max(...cycles) : 0;
    }),
  );
  const recentCycleNum = Math.max(pacRecentCycle, peopleMaxCycle);
  const recentCycleLabel = recentCycleNum > 0 ? formatCycleLabel(recentCycleNum) : null;

  // Totals: always sum every source, regardless of cycle alignment.
  const pacR = donationSummary?.totalRepubs ?? 0;
  const pacD = donationSummary?.totalDems ?? 0;
  const pacO = donationSummary?.totalO ?? 0;

  // Recent-cycle amounts: include each source only if its own most-recent cycle
  // equals the displayed recent cycle. Prevents cross-cycle contamination.
  let personR = 0, personD = 0, personO = 0, recentPersonR = 0, recentPersonD = 0;
  for (const p of people) {
    const ds = p.donationSummary!;
    personR += ds.totalR;
    personD += ds.totalD;
    personO += ds.totalO ?? 0;
    const pRecent = ds.activeCycles.length ? Math.max(...ds.activeCycles) : 0;
    if (pRecent === recentCycleNum) {
      recentPersonR += ds.recentCycleR;
      recentPersonD += ds.recentCycleD;
    }
  }
  const recentPacR = pacRecentCycle === recentCycleNum ? (donationSummary?.recentRepubs ?? 0) : 0;
  const recentPacD = pacRecentCycle === recentCycleNum ? (donationSummary?.recentDems ?? 0) : 0;

  const totalR = pacR + personR;
  const totalD = pacD + personD;
  const totalO = pacO + personO;
  const recentR = recentPacR + recentPersonR;
  const recentD = recentPacD + recentPersonD;

  // Active cycles: union of PAC + people history.
  const activeCyclesSet = new Set<number>();
  for (const y of donationSummary?.activeCycles ?? []) activeCyclesSet.add(y);
  for (const p of people) {
    for (const y of p.donationSummary?.activeCycles ?? []) activeCyclesSet.add(y);
  }
  const activeCycles = Array.from(activeCyclesSet).sort((a, b) => a - b);

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
