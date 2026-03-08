// Data source: OpenFEC API via FECClient (core/api/FECClient.ts)
export { matchEntity } from './pipeline';
export { normalize } from './normalize';
export { jaro, jaroWinkler } from './jaroWinkler';
export { findByAlias } from './aliasMatch';
export { scoreAll, pickBestMatch } from './scorer';
export type {
  FECCommittee,
  MatchResult,
  MatchSuccess,
  MatchFailure,
  MatchingDeps,
} from './types';
export type { ScoredCandidate, BestMatch } from './scorer';
