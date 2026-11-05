# REKITABI（歴旅）— 全国の史跡を地図と音声ガイドでめぐる Web サービス

全国 47 都道府県・143 か所の国指定史跡／特別史跡を、地図・音声ガイド・訪問スタンプ・探訪記（口コミ）で楽しめるスマートフォン向け Web サービスです。

![画面イメージ](docs/screenshots.jpg)

## 主な機能

| 機能 | 内容 |
| --- | --- |
| 地図 | 国土地理院の地図に史跡を写真つきマーカーで表示。近い史跡はまとめて「◯◯ 他 n 件」と表示し、タップで拡大。淡色地図／標準地図／航空写真の切り替え、現在地表示 |
| スポット詳細 | 下から出るシート（半分 ⇔ 全画面）。経路（Google マップ）、訪問済みにする、探訪記を書く、音声ガイド／史跡情報タブ |
| 音声ガイド | 各史跡 3 章。最後の章は **現地でのみ再生できる「現地限定」**。録音音声が無い章はブラウザの読み上げで再生（シーク・前後の章・テキスト表示に対応） |
| 訪問スタンプ | 史跡の近く（初期値 500m 以内）でだけ「訪問済み」にできる。マイページに訪問履歴と訪れた都道府県数を表示 |
| みんなの探訪記 | 写真（最大 5 枚）・時代タグ・訪れた史跡つきの口コミ投稿、一覧、詳細、共有、削除 |
| さがす | テーマ（城・寺社・古墳・庭園・学び舎・近代化遺産・特別史跡）、エリア、時代、キーワード検索、近くの史跡 |
| アカウント | 新規登録（メール認証）、ログイン、パスワード再設定、プロフィール編集 |
| 設定 | ガイドの言語（日本語 / English）、こども向けガイド（やさしい説明と専用の章） |
| PC 表示 | スマートフォン幅で中央に表示し、横に QR コードを表示 |

## 2 つの動作モード

| モード | 使う場面 | データの保存先 |
| --- | --- | --- |
| **デモモード**（初期設定） | 設定なしですぐ試す・GitHub Pages で見せる | ブラウザ内（IndexedDB）。その端末だけに保存され、他の人とは共有されません |
| **本番モード（Firebase）** | 実際にサービスとして公開する | Firebase Authentication / Cloud Firestore / Cloud Storage |

`.env` に Firebase の設定があれば自動で本番モードになります。

## すぐに試す（デモモード）

```bash
npm install
npm run dev
```

ブラウザで http://localhost:5173 を開きます。デモモードでは「設定 → 現地判定をスキップ（デモ用）」をオンにすると、史跡から離れていても訪問スタンプや現地限定の音声を試せます。

## 本番として公開する（Firebase）

1. [Firebase コンソール](https://console.firebase.google.com/) でプロジェクトを作成
2. 次を有効化
   - Authentication → ログイン方法 →「メール / パスワード」
   - Firestore Database
   - Storage
3. プロジェクトの設定 → マイアプリ →「ウェブアプリ」を追加し、表示された設定値を `.env` に書く（`.env.example` をコピー）
4. `.firebaserc.example` を `.firebaserc` にコピーし、プロジェクト ID を書く
5. デプロイ（ビルド → ホスティング・セキュリティルール・インデックスの反映まで行います）

   ```bash
   npx firebase-tools login
   npm run deploy
   ```

プライバシーポリシーと利用規約（`src/pages/PrivacyPolicyPage.tsx` / `TermsPage.tsx`）はひな形です。公開前に運営者の実態に合わせて修正してください。運営者名・お問い合わせ先は `.env` の `VITE_OPERATOR_NAME` / `VITE_CONTACT_URL` で設定できます。サービス名は `src/config.ts` の `APP_NAME` で変更できます。

## GitHub Pages でデモを公開する

`main` ブランチに push すると、`.github/workflows/pages.yml` がデモモードのサイトをビルドして `gh-pages` ブランチに置き、GitHub Pages で公開します。公開先は `https://<ユーザー名>.github.io/<リポジトリ名>/` です（このリポジトリは https://dotdelibiz-hue.github.io/map-service/ ）。

表示されない場合は、リポジトリの **Settings → Pages → Build and deployment** で Source が **Deploy from a branch**、Branch が **gh-pages / (root)** になっているか確認してください。

## 史跡データの追加・編集

史跡は `content/sites/<id>.json` に 1 か所 1 ファイルで入っています。`npm run dev` / `npm run build` のときに `scripts/build-seed.mjs` が内容をチェックし、アプリ用のファイル（`public/data/`）を作ります。

```jsonc
{
  "id": "himeji-castle",          // URL に使う ID（半角英小文字・数字・ハイフン。ファイル名と同じ）
  "title": "姫路城",
  "titleEn": "Himeji Castle",
  "kana": "ひめじじょう",
  "type": "castle",               // castle / temple / shrine / kofun / ruins / garden / modern / school / other
  "eras": ["安土桃山時代", "江戸時代"],
  "summary": "一行の紹介",
  "description": "史跡情報タブの本文",
  "descriptionEn": "English description",
  "kidsDescription": "こども向けの説明",
  "highlights": ["見どころ1", "見どころ2", "見どころ3"],
  "prefecture": "兵庫県",
  "city": "姫路市",
  "lat": 34.8394, "lng": 134.6939,
  "special": true,                // 特別史跡なら true
  "photo": { "url": "...", "thumb": "...", "author": "...", "license": "...", "licenseUrl": "...", "sourceUrl": "..." },
  "chapters": [
    { "title": "章のタイトル", "text": "読み上げる文章", "titleEn": "...", "textEn": "..." },
    { "title": "現地で見てほしいところ", "text": "...", "localOnly": true },
    { "title": "こども向けの章", "text": "...", "forKids": true }
  ]
}
```

録音した音声がある場合は、章に `"soundURL": "https://..."`（英語は `"englishSoundURL"`）を追加すると、読み上げの代わりにその音声を再生します。

## データの出典・ライセンス

- **史跡の名称・位置**: [Wikidata](https://www.wikidata.org/)（CC0）。各史跡の画面に Wikidata の項目へのリンクを表示しています
- **写真**: [Wikimedia Commons](https://commons.wikimedia.org/)。写真ごとに作者・ライセンス（CC BY / CC BY-SA など）を史跡情報タブに表示しています
- **地図**: [国土地理院 地理院タイル](https://maps.gsi.go.jp/development/ichiran.html)（出典を地図右下に表示）
- **解説文・音声ガイドの原稿**: このリポジトリ用に新しく書いたものです。一般に知られている事実をもとにしていますが、公開前に内容の確認をおすすめします

## 開発

```bash
npm run typecheck      # 型チェック
npm test               # 単体テスト（Vitest）
npm run test:rules     # Firestore / Storage セキュリティルールのテスト（Java が必要。エミュレーターを自動起動）
npm run emulators      # Firebase エミュレーターを起動
npm run dev:emulator   # エミュレーターにつないだ本番モードで起動（別のターミナルで）
npm run build          # 本番ビルド（dist/）
```

### ディレクトリ構成

```
content/sites/       史跡データ（編集用）
scripts/             史跡データのビルド
src/
  pages/             各画面（地図、カテゴリ、探訪記、ログイン、マイページなど）
  components/        地図・スポット詳細・音声プレーヤー・共通 UI
  hooks/             ログイン状態、設定、位置情報、読み上げなど
  services/          データの読み書き（local = デモ / firebase = 本番）
firestore.rules      Firestore のセキュリティルール
storage.rules        Storage のセキュリティルール
tests/rules/         セキュリティルールのテスト
```

### 技術スタック

React 19 / TypeScript / Vite / React Router / TanStack Query / Leaflet + supercluster / Firebase（Auth・Firestore・Storage・Hosting）
