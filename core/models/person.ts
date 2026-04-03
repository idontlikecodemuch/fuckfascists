export type PersonEntityBenefitBasis =
  | 'control_owner'
  | 'executive'
  | 'founder_stake'
  | 'family_control'
  | 'major_shareholder'
  | 'board_material'
  | 'board_routine'
  | 'weak';

export type PersonEntityLinkConfidence = 'high' | 'medium' | 'manual-review';

export interface PoliticalRoleRecord {
  role: string;
  startYear: number | null;
  endYear: number | null;
  /**
   * Why this person is economically linked to the entity.
   * Pipeline target: populate for every accepted link. Optional only for legacy data.
   */
  benefitBasis?: PersonEntityBenefitBasis;
  /**
   * Whether the relationship is current. Pipeline target: always populate.
   * Consumers should treat undefined as true for legacy records until backfilled.
   */
  isCurrent?: boolean;
  /**
   * Verified ownership percentage when public evidence supports a numeric figure.
   */
  ownershipPct?: number | null;
  /**
   * Confidence in the link itself, not in the donor totals.
   */
  confidence?: PersonEntityLinkConfidence;
  /**
   * Freeform audit note for borderline or manually reviewed links.
   */
  notes?: string;
}

export interface PoliticalPersonContribution {
  committeeName: string;
  committeeId: string;
  committeeParty: string | null;
  committeeType: string | null;
  amount: number;
  cycle: number;
  contributionDate: string;
}

export interface PoliticalPersonDonationSummary {
  totalR: number;
  totalD: number;
  recentCycleR: number;
  recentCycleD: number;
  recentCycle: string;
  activeCycles: number[];
  raw: PoliticalPersonContribution[];
  lastUpdated: string;
}

export interface PoliticalPerson {
  id: string;
  canonicalName: string;
  displayName: string;
  commonName?: string;
  aliases: string[];
  fecContributorId?: string | null;
  fecSearchNames?: string[];
  primaryState?: string;
  primaryEmployer?: string;
  primaryOccupation?: string;
  donorRank?: number;
  tier?: number;
  associatedEntityIds: string[];
  rolesByEntity: { [entityId: string]: PoliticalRoleRecord };
  donationSummary?: PoliticalPersonDonationSummary;
  verificationStatus: 'manual' | 'pipeline' | 'unverified';
  lastVerifiedDate: string;
  notes?: string;
}

export function getPersonDisplayName(person: PoliticalPerson): string {
  if (person.displayName.trim().length > 0) {
    return person.displayName;
  }
  if (person.aliases.length > 0 && person.aliases[0]!.trim().length > 0) {
    return person.aliases[0]!;
  }

  const [last, rawRest = ''] = person.canonicalName.split(',', 2);
  const rest = rawRest.trim();
  return [rest, last.trim()].filter(Boolean).join(' ').trim() || person.canonicalName;
}
