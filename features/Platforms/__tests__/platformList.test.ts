import { parsePlatformFile, flattenPlatforms, TRACKED_PLATFORMS } from '../data/platformList';
import bundledPlatformsRaw from '../../../assets/data/platforms.json';

// ── parsePlatformFile ─────────────────────────────────────────────────────────

describe('parsePlatformFile', () => {
  it('parses the bundled platforms.json', () => {
    const result = parsePlatformFile(bundledPlatformsRaw);
    expect(result).not.toBeNull();
    expect(result?.version).toBe(1);
    expect(Array.isArray(result?.platforms)).toBe(true);
    expect(result!.platforms.length).toBeGreaterThan(0);
  });

  it('returns null for null', () => {
    expect(parsePlatformFile(null)).toBeNull();
  });

  it('returns null for a non-object', () => {
    expect(parsePlatformFile('string')).toBeNull();
    expect(parsePlatformFile(42)).toBeNull();
    expect(parsePlatformFile([])).toBeNull();
  });

  it('returns null when version is missing or wrong type', () => {
    expect(parsePlatformFile({ platforms: [] })).toBeNull();
    expect(parsePlatformFile({ version: 'one', platforms: [] })).toBeNull();
  });

  it('returns null when platforms array is missing', () => {
    expect(parsePlatformFile({ version: 1 })).toBeNull();
    expect(parsePlatformFile({ version: 1, platforms: 'not-an-array' })).toBeNull();
  });
});

// ── flattenPlatforms ──────────────────────────────────────────────────────────

describe('flattenPlatforms', () => {
  const file = parsePlatformFile(bundledPlatformsRaw)!;

  it('produces a non-empty Platform array', () => {
    const platforms = flattenPlatforms(file, []);
    expect(platforms.length).toBeGreaterThan(0);
  });

  it('expands groups into children — group parent IDs are absent from output', () => {
    const platforms = flattenPlatforms(file, []);
    const groupIds = file.platforms
      .filter((e) => 'children' in e)
      .map((e) => e.id);
    const resultIds = new Set(platforms.map((p) => p.id));
    for (const groupId of groupIds) {
      expect(resultIds.has(groupId)).toBe(false);
    }
  });

  it('includes all children of each group', () => {
    const platforms = flattenPlatforms(file, []);
    const resultIds = new Set(platforms.map((p) => p.id));
    for (const entry of file.platforms) {
      if ('children' in entry) {
        for (const child of entry.children) {
          expect(resultIds.has(child.id)).toBe(true);
        }
      }
    }
  });

  it('children inherit their parent group entityId', () => {
    const platforms = flattenPlatforms(file, []);
    // Facebook is a child of the 'meta' group (entityId: 'meta')
    const facebook = platforms.find((p) => p.id === 'facebook');
    expect(facebook?.entityId).toBe('meta');
    // YouTube is a child of the 'alphabet' group (entityId: 'google-alphabet')
    const youtube = platforms.find((p) => p.id === 'youtube');
    expect(youtube?.entityId).toBe('google-alphabet');
  });

  it('singletons use their own entityId', () => {
    const platforms = flattenPlatforms(file, []);
    const tiktok = platforms.find((p) => p.id === 'tiktok');
    expect(tiktok?.entityId).toBe('tiktok');
    const xTwitter = platforms.find((p) => p.id === 'x-twitter');
    expect(xTwitter?.entityId).toBe('x-twitter');
  });

  it('is sorted by sortOrder ascending', () => {
    const platforms = flattenPlatforms(file, []);
    for (let i = 1; i < platforms.length; i++) {
      expect(platforms[i]!.sortOrder).toBeGreaterThanOrEqual(platforms[i - 1]!.sortOrder);
    }
  });

  it('all platform ids are unique', () => {
    const platforms = flattenPlatforms(file, []);
    const ids = platforms.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('falls back gracefully when entity is not found', () => {
    // match-group has no entity in entities.json — should not throw
    const platforms = flattenPlatforms(file, []);
    const tinder = platforms.find((p) => p.id === 'tinder');
    expect(tinder).toBeDefined();
    // parentCompany falls back to the entityId string
    expect(tinder?.parentCompany).toBe('match-group');
    expect(tinder?.ceoName).toBe('');
    expect(tinder?.categoryTags).toEqual([]);
  });

  it('enriches parentCompany and ceoName from entities when found', () => {
    const mockEntities = [
      {
        id: 'meta',
        canonicalName: 'Meta Platforms Inc',
        ceoName: 'Mark Zuckerberg',
        aliases: [],
        domains: [],
        categoryTags: ['tech', 'social'],
        lastVerifiedDate: '2025-01-01',
        verificationStatus: 'manual' as const,
      },
    ];
    const platforms = flattenPlatforms(file, mockEntities);
    const facebook = platforms.find((p) => p.id === 'facebook');
    expect(facebook?.parentCompany).toBe('Meta Platforms Inc');
    expect(facebook?.ceoName).toBe('Mark Zuckerberg');
    expect(facebook?.categoryTags).toEqual(['tech', 'social']);
  });

  it('all platforms with a known entity have non-empty parentCompany', () => {
    const platforms = flattenPlatforms(file, []);
    // Even without entities, parentCompany falls back to entityId (non-empty)
    platforms.forEach((p) => {
      expect(p.parentCompany.length).toBeGreaterThan(0);
    });
  });
});

// ── TRACKED_PLATFORMS (module singleton) ──────────────────────────────────────

describe('TRACKED_PLATFORMS', () => {
  it('is non-empty', () => {
    expect(TRACKED_PLATFORMS.length).toBeGreaterThan(0);
  });

  it('every platform has a non-empty id', () => {
    TRACKED_PLATFORMS.forEach((p) => {
      expect(typeof p.id).toBe('string');
      expect(p.id.length).toBeGreaterThan(0);
    });
  });

  it('every platform has a non-empty name', () => {
    TRACKED_PLATFORMS.forEach((p) => expect(p.name.length).toBeGreaterThan(0));
  });

  it('every platform has a non-empty entityId', () => {
    TRACKED_PLATFORMS.forEach((p) => {
      expect(typeof p.entityId).toBe('string');
      expect(p.entityId.length).toBeGreaterThan(0);
    });
  });

  it('all platform ids are unique', () => {
    const ids = TRACKED_PLATFORMS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is sorted by sortOrder', () => {
    for (let i = 1; i < TRACKED_PLATFORMS.length; i++) {
      expect(TRACKED_PLATFORMS[i]!.sortOrder).toBeGreaterThanOrEqual(
        TRACKED_PLATFORMS[i - 1]!.sortOrder,
      );
    }
  });

  it('includes expected platforms from the JSON', () => {
    const ids = new Set(TRACKED_PLATFORMS.map((p) => p.id));
    // Singletons
    expect(ids.has('tiktok')).toBe(true);
    expect(ids.has('x-twitter')).toBe(true);
    expect(ids.has('netflix')).toBe(true);
    expect(ids.has('grindr')).toBe(true);
    // Group children
    expect(ids.has('facebook')).toBe(true);
    expect(ids.has('instagram')).toBe(true);
    expect(ids.has('youtube')).toBe(true);
    expect(ids.has('amazon')).toBe(true);
  });

  it('does not include group parent IDs', () => {
    const ids = new Set(TRACKED_PLATFORMS.map((p) => p.id));
    expect(ids.has('meta')).toBe(false);
    expect(ids.has('alphabet')).toBe(false);
    expect(ids.has('amazon-group')).toBe(false);
    expect(ids.has('match-group')).toBe(false);
    expect(ids.has('microsoft')).toBe(false);
  });

  it('does not include the old hardcoded twitter id', () => {
    const ids = new Set(TRACKED_PLATFORMS.map((p) => p.id));
    // 'twitter' was renamed to 'x-twitter' in platforms.json v1
    expect(ids.has('twitter')).toBe(false);
    expect(ids.has('x-twitter')).toBe(true);
  });

  it('does not include the removed amazon-prime id', () => {
    const ids = new Set(TRACKED_PLATFORMS.map((p) => p.id));
    expect(ids.has('amazon-prime')).toBe(false);
  });

  it('platforms enriched from entities have non-empty ceoName (except known missing: match-group)', () => {
    const noEntity = new Set(['tinder', 'hinge', 'okcupid']); // match-group children
    const withEntity = TRACKED_PLATFORMS.filter((p) => !noEntity.has(p.id));
    withEntity.forEach((p) => {
      expect(p.ceoName.length).toBeGreaterThan(0);
    });
  });
});
