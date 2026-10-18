/**
 * サービス全体の設定。サービス名やリンク先はここを変えるだけで反映されます。
 */
export const APP_NAME = 'REKITABI';
export const APP_NAME_JA = '歴旅';
export const OPERATOR_NAME = import.meta.env.VITE_OPERATOR_NAME || '（運営者名）';
export const CONTACT_URL = import.meta.env.VITE_CONTACT_URL || 'mailto:contact@example.com';
export const HELP_URL = import.meta.env.VITE_HELP_URL || '';

/** 現地判定の距離（メートル）。この距離以内なら「訪問済み」や現地限定音声が使えます */
export const NEARBY_RADIUS_M = Number(import.meta.env.VITE_NEARBY_RADIUS_M || 500);

/** 位置情報が使えないときの初期表示（日本全体） */
export const JAPAN_CENTER: [number, number] = [36.4, 137.8];
export const JAPAN_ZOOM = 5;
export const SPOT_ZOOM = 16;
export const NEARBY_ZOOM = 12;

export const MAX_MOMENT_PHOTOS = 5;
export const MAX_MOMENT_TITLE = 45;
export const MAX_BIO = 30;

export const ERAS = [
  '旧石器時代',
  '縄文時代',
  '弥生時代',
  '古墳時代',
  '飛鳥時代',
  '奈良時代',
  '平安時代',
  '鎌倉時代',
  '南北朝時代',
  '室町時代',
  '戦国時代',
  '安土桃山時代',
  '江戸時代',
  '明治時代',
  '大正時代',
  '昭和時代',
  '平成時代',
] as const;

export const PREFECTURES = [
  '北海道',
  '青森県',
  '岩手県',
  '宮城県',
  '秋田県',
  '山形県',
  '福島県',
  '茨城県',
  '栃木県',
  '群馬県',
  '埼玉県',
  '千葉県',
  '東京都',
  '神奈川県',
  '新潟県',
  '富山県',
  '石川県',
  '福井県',
  '山梨県',
  '長野県',
  '岐阜県',
  '静岡県',
  '愛知県',
  '三重県',
  '滋賀県',
  '京都府',
  '大阪府',
  '兵庫県',
  '奈良県',
  '和歌山県',
  '鳥取県',
  '島根県',
  '岡山県',
  '広島県',
  '山口県',
  '徳島県',
  '香川県',
  '愛媛県',
  '高知県',
  '福岡県',
  '佐賀県',
  '長崎県',
  '熊本県',
  '大分県',
  '宮崎県',
  '鹿児島県',
  '沖縄県',
] as const;
