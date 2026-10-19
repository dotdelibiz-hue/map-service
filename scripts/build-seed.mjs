#!/usr/bin/env node
/**
 * content/sites/*.json（編集用の史跡データ）から、アプリが読み込む
 *   public/data/sites-index.json（地図・一覧用の軽いデータ）
 *   public/data/sites/<id>.json（詳細データ）
 * を生成します。`npm run dev` / `npm run build` の前に自動で実行されます。
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = join(root, 'content', 'sites');
const outDir = join(root, 'public', 'data');

const REGION_OF = {
  'hokkaido-tohoku': ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県'],
  kanto: ['茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県'],
  chubu: ['新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県'],
  kinki: ['三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県'],
  'chugoku-shikoku': ['鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県'],
  'kyushu-okinawa': ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'],
};
const TYPES = ['castle', 'temple', 'shrine', 'kofun', 'ruins', 'garden', 'modern', 'school', 'other'];
const ERAS = [
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
];

function regionOf(prefecture) {
  for (const [region, prefs] of Object.entries(REGION_OF)) if (prefs.includes(prefecture)) return region;
  throw new Error(`unknown prefecture: ${prefecture}`);
}

function fail(file, msg) {
  throw new Error(`${file}: ${msg}`);
}

function validate(file, s) {
  for (const k of ['id', 'title', 'titleEn', 'kana', 'type', 'summary', 'description', 'prefecture', 'city']) {
    if (typeof s[k] !== 'string' || !s[k].trim()) fail(file, `"${k}" is required`);
  }
  if (!/^[a-z0-9-]+$/.test(s.id)) fail(file, `"id" must be lowercase letters, digits and hyphens`);
  if (`${s.id}.json` !== file) fail(file, `file name must be "${s.id}.json"`);
  if (!TYPES.includes(s.type)) fail(file, `"type" must be one of ${TYPES.join(', ')}`);
  if (!Array.isArray(s.eras) || s.eras.some((e) => !ERAS.includes(e))) fail(file, `"eras" has an unknown era`);
  if (typeof s.lat !== 'number' || typeof s.lng !== 'number') fail(file, `"lat" / "lng" must be numbers`);
  if (s.lat < 20 || s.lat > 46 || s.lng < 122 || s.lng > 154) fail(file, `coordinates are outside Japan`);
  if (!s.photo?.url) fail(file, `"photo.url" is required`);
  if (!Array.isArray(s.chapters) || s.chapters.length === 0) fail(file, `at least one chapter is required`);
  s.chapters.forEach((c, i) => {
    if (!c.title || !c.text) fail(file, `chapter ${i + 1} needs "title" and "text"`);
  });
}

const files = readdirSync(srcDir)
  .filter((f) => f.endsWith('.json'))
  .sort();
const index = [];
const ids = new Set();

mkdirSync(join(outDir, 'sites'), { recursive: true });

/** 内容が変わったときだけ書き込む（起動中の開発サーバーが古いファイルを見失わないように） */
function writeIfChanged(path, text) {
  if (existsSync(path) && readFileSync(path, 'utf8') === text) return;
  writeFileSync(path, text);
}

for (const file of files) {
  const s = JSON.parse(readFileSync(join(srcDir, file), 'utf8'));
  validate(file, s);
  if (ids.has(s.id)) fail(file, `duplicate id "${s.id}"`);
  ids.add(s.id);

  const region = regionOf(s.prefecture);
  const chapters = s.chapters.map((c, i) => ({ id: `${s.id}-${i + 1}`, ...c }));
  const detail = {
    id: s.id,
    title: s.title,
    titleEn: s.titleEn,
    kana: s.kana,
    type: s.type,
    eras: s.eras,
    summary: s.summary,
    description: s.description,
    descriptionEn: s.descriptionEn ?? '',
    kidsDescription: s.kidsDescription ?? s.description,
    highlights: s.highlights ?? [],
    prefecture: s.prefecture,
    city: s.city,
    region,
    lat: s.lat,
    lng: s.lng,
    special: Boolean(s.special),
    photoURL: s.photo.url,
    thumbURL: s.photo.thumb ?? s.photo.url,
    photoCredit:
      s.photo.author || s.photo.license
        ? { author: s.photo.author ?? '', license: s.photo.license ?? '', licenseUrl: s.photo.licenseUrl, sourceUrl: s.photo.sourceUrl }
        : undefined,
    chapters,
    wikidataId: s.wikidataId,
  };
  writeIfChanged(join(outDir, 'sites', `${s.id}.json`), JSON.stringify(detail));

  index.push({
    id: s.id,
    title: s.title,
    titleEn: s.titleEn,
    kana: s.kana,
    type: s.type,
    eras: s.eras,
    summary: s.summary,
    prefecture: s.prefecture,
    city: s.city,
    region,
    lat: s.lat,
    lng: s.lng,
    special: Boolean(s.special),
    photoURL: detail.photoURL,
    thumbURL: detail.thumbURL,
    hasLocalOnly: chapters.some((c) => c.localOnly),
    hasKids: chapters.some((c) => c.forKids),
    hasEnglish: chapters.some((c) => !c.forKids && c.titleEn && c.textEn),
  });
}

writeIfChanged(join(outDir, 'sites-index.json'), JSON.stringify(index));

// content/sites から消えた史跡のファイルを削除
for (const f of readdirSync(join(outDir, 'sites'))) {
  if (!ids.has(f.replace(/\.json$/, ''))) rmSync(join(outDir, 'sites', f));
}
console.log(`build-seed: ${index.length} sites → public/data`);
