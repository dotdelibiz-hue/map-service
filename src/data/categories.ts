import type { SiteSummary } from '../services/content';
import type { Region } from '../types';

export interface CategoryDef {
  id: string;
  name: string;
  description: string;
  /** カテゴリ画像に使うスポットの ID（無ければ先頭のスポット） */
  coverSiteId?: string;
  subCategories?: SubCategoryDef[];
  filter?: (site: SiteSummary) => boolean;
}

export interface SubCategoryDef {
  id: string;
  name: string;
  description: string;
  coverSiteId?: string;
  filter: (site: SiteSummary) => boolean;
}

export const REGIONS: { id: Region; name: string; prefectures: string[] }[] = [
  { id: 'hokkaido-tohoku', name: '北海道・東北', prefectures: ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'] },
  { id: 'kanto', name: '関東', prefectures: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'] },
  {
    id: 'chubu',
    name: '中部',
    prefectures: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'],
  },
  { id: 'kinki', name: '近畿', prefectures: ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'] },
  {
    id: 'chugoku-shikoku',
    name: '中国・四国',
    prefectures: ['鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県'],
  },
  {
    id: 'kyushu-okinawa',
    name: '九州・沖縄',
    prefectures: ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'],
  },
];

const ERA_GROUPS: { id: string; name: string; eras: string[]; description: string }[] = [
  {
    id: 'ancient',
    name: '旧石器〜古墳時代',
    eras: ['旧石器時代', '縄文時代', '弥生時代', '古墳時代'],
    description: 'ムラやクニができるまでの、はるかな昔をたどる',
  },
  { id: 'asuka-nara', name: '飛鳥・奈良時代', eras: ['飛鳥時代', '奈良時代'], description: '律令国家と仏教文化のはじまり' },
  { id: 'heian', name: '平安時代', eras: ['平安時代'], description: '貴族の都と地方の豪族たち' },
  {
    id: 'kamakura-muromachi',
    name: '鎌倉・室町時代',
    eras: ['鎌倉時代', '南北朝時代', '室町時代'],
    description: '武士の世のはじまりと禅の文化',
  },
  { id: 'sengoku', name: '戦国・安土桃山時代', eras: ['戦国時代', '安土桃山時代'], description: '天下統一をめざした武将たちの舞台' },
  { id: 'edo', name: '江戸時代', eras: ['江戸時代'], description: '城下町と街道、学問が花開いた時代' },
  { id: 'modern', name: '明治〜昭和', eras: ['明治時代', '大正時代', '昭和時代'], description: '近代化と、平和への祈り' },
];

export const CATEGORIES: CategoryDef[] = [
  {
    id: 'special',
    name: '特別史跡',
    description: '史跡のなかでも、とくに学術上の価値が高いと国が認めたもの',
    coverSiteId: 'himeji-castle',
    filter: (s) => s.special,
  },
  {
    id: 'area',
    name: 'エリアから探す',
    description: '全国 6 つのエリアから史跡を探す',
    coverSiteId: 'goryokaku',
    subCategories: REGIONS.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.prefectures.join('・'),
      filter: (s: SiteSummary) => s.region === r.id,
    })),
  },
  {
    id: 'era',
    name: '時代から探す',
    description: '縄文から昭和まで、時代ごとに史跡をめぐる',
    coverSiteId: 'sannai-maruyama-site',
    subCategories: ERA_GROUPS.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      filter: (s: SiteSummary) => s.eras.some((e) => g.eras.includes(e)),
    })),
  },
  {
    id: 'castle',
    name: '城・城跡',
    description: '天守、石垣、堀。武士たちの拠点をたずねる',
    coverSiteId: 'matsumoto-castle',
    filter: (s) => s.type === 'castle',
  },
  {
    id: 'temple-shrine',
    name: '寺院・神社',
    description: '祈りの場に刻まれた千年の歴史',
    coverSiteId: 'horyu-ji-temple',
    filter: (s) => s.type === 'temple' || s.type === 'shrine',
  },
  {
    id: 'kofun-ruins',
    name: '古墳・遺跡',
    description: '土の下から見えてくる古代のくらし',
    coverSiteId: 'yoshinogari-site',
    filter: (s) => s.type === 'kofun' || s.type === 'ruins',
  },
  {
    id: 'garden',
    name: '庭園・景勝地',
    description: '時代の美意識をうつす庭と風景',
    coverSiteId: 'kairaku-en',
    filter: (s) => s.type === 'garden',
  },
  {
    id: 'school',
    name: '学び舎',
    description: '藩校や私塾。人を育てた場所',
    coverSiteId: 'shizutani-school',
    filter: (s) => s.type === 'school',
  },
  {
    id: 'modern',
    name: '近代化遺産',
    description: '日本の近代化を支えた産業と建物',
    coverSiteId: 'tomioka-silk-mill',
    filter: (s) => s.type === 'modern',
  },
];

export function findCategory(id: string | undefined): CategoryDef | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function findSubCategory(category: CategoryDef | undefined, subId: string | undefined): SubCategoryDef | undefined {
  return category?.subCategories?.find((s) => s.id === subId);
}

/** カテゴリ（とサブカテゴリ）に含まれるスポット */
export function sitesInCategory(sites: SiteSummary[], category: CategoryDef, sub?: SubCategoryDef): SiteSummary[] {
  if (sub) return sites.filter(sub.filter);
  if (category.filter) return sites.filter(category.filter);
  return [];
}

/** カテゴリを含むスポット（スポット詳細の「◯◯」収録 表示用） */
export function primaryCategoryOf(site: SiteSummary): { category: CategoryDef; sub?: SubCategoryDef } {
  const area = CATEGORIES.find((c) => c.id === 'area')!;
  const sub = area.subCategories!.find((s) => s.filter(site));
  return { category: area, sub };
}

export function coverPhoto(sites: SiteSummary[], coverSiteId: string | undefined, fallback: SiteSummary[]): string {
  const cover = sites.find((s) => s.id === coverSiteId) ?? fallback[0];
  return cover?.photoURL ?? '';
}
