import { describe, expect, it } from 'vitest';
import type { HistoricSite } from '../../types';
import { chaptersFor } from './chapters';

const site = {
  chapters: [
    { id: 'a-1', title: 'なりたち', text: '本文1', titleEn: 'History', textEn: 'Text 1' },
    { id: 'a-2', title: '見どころ', text: '本文2', titleEn: 'Highlights', textEn: 'Text 2', localOnly: true },
    { id: 'a-3', title: 'こども', text: 'こどもむけ', forKids: true },
  ],
} as HistoricSite;

describe('chaptersFor', () => {
  it('通常は、こども向け以外の章を日本語で', () => {
    const c = chaptersFor(site, { kidsMode: false, language: 'ja' });
    expect(c.map((x) => x.title)).toEqual(['なりたち', '見どころ']);
    expect(c[1].localOnly).toBe(true);
    expect(c[0].lang).toBe('ja-JP');
  });

  it('こども向けモードでは、こども向けの章だけ', () => {
    const c = chaptersFor(site, { kidsMode: true, language: 'ja' });
    expect(c.map((x) => x.title)).toEqual(['こども']);
  });

  it('英語モードでは英語の章を英語の音声で', () => {
    const c = chaptersFor(site, { kidsMode: false, language: 'en' });
    expect(c.map((x) => x.title)).toEqual(['History', 'Highlights']);
    expect(c[0].lang).toBe('en-US');
  });

  it('英語が無い章は日本語のまま', () => {
    const c = chaptersFor(site, { kidsMode: true, language: 'en' });
    expect(c[0]).toMatchObject({ title: 'こども', lang: 'ja-JP' });
  });
});
