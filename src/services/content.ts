import type { HistoricSite, Region, SiteType } from '../types';

/** 地図表示や一覧で使う軽量なスポット情報（全件まとめて読み込む） */
export interface SiteSummary {
  id: string;
  title: string;
  titleEn: string;
  kana: string;
  type: SiteType;
  eras: string[];
  summary: string;
  prefecture: string;
  city: string;
  region: Region;
  lat: number;
  lng: number;
  special: boolean;
  photoURL: string;
  thumbURL: string;
  hasLocalOnly: boolean;
  hasKids: boolean;
  hasEnglish: boolean;
}

const base = import.meta.env.BASE_URL;

/** データが存在しない（URL の ID が間違っているなど） */
export class ContentNotFoundError extends Error {}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${base}${path}`);
  // 存在しないパスはホスティングの設定でトップページ（HTML）が返ることがある
  const isJson = (res.headers.get('content-type') ?? '').includes('json');
  if (res.status === 404 || (res.ok && !isJson)) throw new ContentNotFoundError(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return (await res.json()) as T;
}

export function fetchSiteIndex(): Promise<SiteSummary[]> {
  return getJson<SiteSummary[]>('data/sites-index.json');
}

export function fetchSite(id: string): Promise<HistoricSite> {
  if (!/^[a-z0-9-]+$/.test(id)) return Promise.reject(new ContentNotFoundError(id));
  return getJson<HistoricSite>(`data/sites/${id}.json`);
}
