import { buildGeohashQueries } from '@/lib/geohash';

describe('geohash utilities', () => {
  it('returns query bounds for a given center and radius', () => {
    const queries = buildGeohashQueries({ lat: -37.8136, lng: 144.9631 }, 20);
    expect(queries.length).toBeGreaterThanOrEqual(1);
    expect(queries.length).toBeLessThanOrEqual(9);
    queries.forEach(([lower, upper]) => {
      expect(typeof lower).toBe('string');
      expect(typeof upper).toBe('string');
      expect(upper >= lower).toBe(true);
    });
  });
});
