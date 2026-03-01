export { matchEntity } from './pipeline';
export { normalize } from './normalize';
export { jaro, jaroWinkler } from './jaroWinkler';
export { findByAlias } from './aliasMatch';
export { scoreAll, pickBestMatch } from './scorer';
export type {
  OpenSecretsOrg,
  MatchResult,
  MatchSuccess,
  MatchFailure,
  MatchingDeps,
} from './types';
export type { ScoredCandidate, BestMatch } from './scorer';
