import type { Chapter, HistoricSite } from '../../types';
import type { GuideLanguage } from '../../hooks/useSettings';

export interface DisplayChapter {
  id: string;
  title: string;
  text: string;
  soundURL?: string;
  localOnly: boolean;
  lang: 'ja-JP' | 'en-US';
}

/** 設定（こども向け・言語）に合わせて表示する章を選ぶ */
export function chaptersFor(site: HistoricSite, opts: { kidsMode: boolean; language: GuideLanguage }): DisplayChapter[] {
  const source: Chapter[] = opts.kidsMode ? site.chapters.filter((c) => c.forKids) : site.chapters.filter((c) => !c.forKids);
  return source.map((c) => {
    const useEn = opts.language === 'en' && Boolean(c.titleEn && c.textEn);
    return {
      id: c.id,
      title: useEn ? c.titleEn! : c.title,
      text: useEn ? c.textEn! : c.text,
      soundURL: useEn ? c.englishSoundURL : c.soundURL,
      localOnly: Boolean(c.localOnly),
      lang: useEn ? 'en-US' : 'ja-JP',
    };
  });
}

/** 読み上げ時間の目安（分） */
export function estimateMinutes(text: string, lang: 'ja-JP' | 'en-US'): number {
  const cps = lang === 'ja-JP' ? 7.5 : 14;
  return Math.max(1, Math.round(text.length / cps / 60));
}
