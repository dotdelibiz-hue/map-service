import { describe, expect, it } from 'vitest';
import type { SiteSummary } from '../services/content';
import { CATEGORIES, REGIONS, findCategory, findSubCategory, sitesInCategory } from './categories';
import { PREFECTURES } from '../config';

const make = (p: Partial<SiteSummary>): SiteSummary =>
  ({
    id: 'x',
    title: 'x',
    titleEn: 'x',
    kana: 'x',
    type: 'castle',
    eras: ['江戸時代'],
    summary: '',
    prefecture: '兵庫県',
    city: '',
    region: 'kinki',
    lat: 35,
    lng: 135,
    special: false,
    photoURL: '',
    thumbURL: '',
    hasLocalOnly: false,
    hasKids: false,
    hasEnglish: false,
    ...p,
  }) as SiteSummary;

describe('categories', () => {
  it('全都道府県がどこかのエリアに属している', () => {
    const all = REGIONS.flatMap((r) => r.prefectures);
    expect(new Set(all).size).toBe(47);
    for (const p of PREFECTURES) expect(all).toContain(p);
  });

  it('カテゴリ ID は重複しない', () => {
    expect(new Set(CATEGORIES.map((c) => c.id)).size).toBe(CATEGORIES.length);
  });

  it('テーマ・エリア・時代で絞り込める', () => {
    const sites = [
      make({ id: 'castle', type: 'castle', special: true }),
      make({ id: 'temple', type: 'temple', region: 'kanto', eras: ['奈良時代'] }),
      make({ id: 'kofun', type: 'kofun', eras: ['古墳時代'] }),
    ];
    expect(sitesInCategory(sites, findCategory('special')!).map((s) => s.id)).toEqual(['castle']);
    expect(sitesInCategory(sites, findCategory('temple-shrine')!).map((s) => s.id)).toEqual(['temple']);
    const area = findCategory('area')!;
    expect(sitesInCategory(sites, area, findSubCategory(area, 'kanto')).map((s) => s.id)).toEqual(['temple']);
    const era = findCategory('era')!;
    expect(sitesInCategory(sites, era, findSubCategory(era, 'ancient')).map((s) => s.id)).toEqual(['kofun']);
  });
});
