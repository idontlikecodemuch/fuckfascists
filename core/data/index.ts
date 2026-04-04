export type { StorageAdapter } from './adapters';

export {
  TABLE_ENTITY_AVOIDS,
  TABLE_PLATFORM_AVOIDS,
  TABLE_CACHE,
  TABLE_AVOID_PINS,
  DDL_ENTITY_AVOIDS,
  DDL_PLATFORM_AVOIDS,
  DDL_CACHE,
  DDL_AVOID_PINS,
  ALL_DDL,
} from './schema';

export { fetchEntityList, parseEntityList } from './entityList';
export { fetchPeopleList, parsePeopleList } from './personList';

export {
  recordEntityAvoid,
  getEntityAvoidsForDate,
  recordAvoidPin,
  getTodayAvoidPins,
  purgeOldAvoidPins,
  recordPlatformAvoid,
  recordPlatformAvoidForDate,
  getAllEntityAvoids,
  getPlatformWeeklyTotal,
  getAllPlatformWeeklyTotals,
  getPlatformAvoidsForWeek,
  toDateString,
  getMondayOf,
} from './eventStore';

export { getCache, setCache, isCacheExpired, makeCacheDeps } from './cacheStore';
