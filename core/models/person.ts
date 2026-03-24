export interface PoliticalRoleRecord {
  role: string;
  startYear: number | null;
  endYear: number | null;
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
  totalGOP: number;
  totalDEM: number;
  recentCycleGOP: number;
  recentCycleDEM: number;
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
