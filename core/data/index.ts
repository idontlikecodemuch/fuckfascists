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
  MIGRATE_ADD_SURFACE_COLUMN,
} from './schema';

export { fetchEntityList, parseEntityList, preferFresherEntityList } from './entityList';
export { fetchPeopleList, parsePeopleList } from './personList';
export {
  fetchProductList,
  parseProductList,
  preferFresherProductList,
  serializeProductList,
} from './productList';
export type { ProductList, ProductEntry, ProductProducerEntry, PrefixSpace } from './productList';

export {
  recordEntityAvoid,
  getEntityAvoidsForDate,
  recordAvoidPin,
  getTodayAvoidPins,
  purgeOldAvoidPins,
  purgeScoredWeekAvoidEvents,
  recordPlatformAvoid,
  recordPlatformAvoidForDate,
  removePlatformAvoidForDate,
  getAllEntityAvoids,
  getPlatformWeeklyTotal,
  getAllPlatformWeeklyTotals,
  getPlatformAvoidsForWeek,
  toDateString,
  getMondayOf,
} from './eventStore';

export { getCache, setCache, isCacheExpired, makeCacheDeps } from './cacheStore';
