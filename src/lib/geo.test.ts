import { describe, expect, it } from 'vitest';
import { distanceMeters, formatDistance } from './geo';

describe('distanceMeters', () => {
  it('同じ地点は 0m', () => {
    expect(distanceMeters({ lat: 35, lng: 135 }, { lat: 35, lng: 135 })).toBe(0);
  });

  it('東京駅〜大阪駅はおよそ 400km', () => {
    const d = distanceMeters({ lat: 35.6812, lng: 139.7671 }, { lat: 34.7025, lng: 135.4959 });
    expect(d).toBeGreaterThan(395_000);
    expect(d).toBeLessThan(410_000);
  });
});

describe('formatDistance', () => {
  it.each([
    [27.4, '27m'],
    [1530, '1.5km'],
    [93700, '94km'],
  ])('%s → %s', (m, label) => {
    expect(formatDistance(m)).toBe(label);
  });
});
