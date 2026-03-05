export interface PoliticalPerson {
  id: string;
  name: string;
  fecContributorId?: string;
  // Queryable via FEC API:
  // /schedules/schedule_a/?contributor_name=Last%2C+First
  associatedEntityIds: string[];
  rolesByEntity: { [entityId: string]: string };
  // e.g. { "tesla": "CEO & Founder", "x-twitter": "Owner" }
  totalIndividualRepubs?: number;
  totalIndividualDems?: number;
  activeCycles?: number[];
  lastVerifiedDate: string;
  notes?: string;
  // e.g. "Also donated via America PAC"
}
