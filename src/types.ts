export type SiteType = 'castle' | 'temple' | 'shrine' | 'kofun' | 'ruins' | 'garden' | 'modern' | 'school' | 'other';

export type Region = 'hokkaido-tohoku' | 'kanto' | 'chubu' | 'kinki' | 'chugoku-shikoku' | 'kyushu-okinawa';

export interface Chapter {
  id: string;
  title: string;
  text: string;
  titleEn?: string;
  textEn?: string;
  /** 録音音声がある場合の URL。無い場合は読み上げ（音声合成）で再生する */
  soundURL?: string;
  englishSoundURL?: string;
  /** true の章は現地（スポットの近く）でのみ再生できる */
  localOnly?: boolean;
  /** こども向けの章 */
  forKids?: boolean;
}

export interface PhotoCredit {
  author: string;
  license: string;
  licenseUrl?: string;
  sourceUrl?: string;
}

export interface HistoricSite {
  id: string;
  title: string;
  titleEn: string;
  kana: string;
  type: SiteType;
  eras: string[];
  summary: string;
  description: string;
  descriptionEn: string;
  kidsDescription: string;
  highlights: string[];
  prefecture: string;
  city: string;
  region: Region;
  lat: number;
  lng: number;
  /** 特別史跡かどうか */
  special: boolean;
  photoURL: string;
  /** 地図のマーカーなどに使う小さい画像 */
  thumbURL: string;
  photoCredit?: PhotoCredit;
  chapters: Chapter[];
  wikidataId?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  photoURL: string;
  /** サブカテゴリを持つかどうか（持たない場合はスポット一覧に直接遷移） */
  hasSubCategories: boolean;
  order: number;
}

export interface SubCategory {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  photoURL: string;
  order: number;
}

export type Gender = 'male' | 'female' | 'other';

export interface AuthUser {
  uid: string;
  email: string;
  emailVerified: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  userName: string;
  bio: string;
  photoURL?: string;
  gender?: Gender;
  birthDate?: string;
  prefecture?: string;
  createdAt: string;
  /** デモ用のサンプルユーザー */
  sample?: boolean;
}

export interface Visit {
  siteId: string;
  visitedAt: string;
}

export interface Moment {
  id: string;
  userId: string;
  title: string;
  text: string;
  thumbnailURL?: string;
  photoURLs: string[];
  eraTags: string[];
  siteId?: string;
  createdAt: string;
  updatedAt: string;
  sample?: boolean;
}

export interface NewMomentInput {
  title: string;
  text: string;
  eraTags: string[];
  siteId?: string;
  thumbnail?: Blob;
  photos: Blob[];
}

export interface SignUpInput {
  email: string;
  password: string;
  gender: Gender;
  birthDate: string;
  prefecture?: string;
}

export interface ProfilePatch {
  name?: string;
  userName?: string;
  bio?: string;
  photo?: Blob;
}
