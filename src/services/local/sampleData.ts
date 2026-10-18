import type { Moment, UserProfile } from '../../types';

/**
 * デモモードで最初から表示するサンプル投稿。
 * 画面の雰囲気を確認するためのもので、実在の利用者の投稿ではありません（画面にも「サンプル」と表示します）。
 */
export function createSampleData(): { profiles: UserProfile[]; moments: Moment[] } {
  const createdAt = '2026-01-01T00:00:00.000Z';
  const editor: UserProfile = {
    uid: 'sample-editor',
    name: '歴旅編集部',
    userName: 'rekitabi_editor',
    bio: 'サンプル投稿を担当しています。',
    createdAt,
    sample: true,
  };
  const day = (d: number) => new Date(Date.UTC(2026, 8, d, 3)).toISOString();
  const moments: Moment[] = [
    {
      id: 'sample-himeji',
      userId: editor.uid,
      title: '白い天守を見上げて、城の守りのしくみを歩いて確かめる',
      text: '門をくぐるたびに道が折れ曲がり、天守がなかなか近づかない。迷路のような通路は、攻めてきた敵を迷わせるための工夫だと音声ガイドで知り、歩きながら納得しました。\n\n天守の最上階から見る城下の景色もおすすめです。',
      eraTags: ['安土桃山時代', '江戸時代'],
      siteId: 'himeji-castle',
      photoURLs: [],
      createdAt: day(20),
      updatedAt: day(20),
      sample: true,
    },
    {
      id: 'sample-goryokaku',
      userId: editor.uid,
      title: '星形の堀を、タワーの上から',
      text: '地上を歩いていると形がわかりにくい五稜郭も、展望台から見下ろすと見事な星形。幕末の終わりの戦いの舞台になった場所だと思うと、静かな堀の水面にも見え方が変わります。',
      eraTags: ['江戸時代', '明治時代'],
      siteId: 'goryokaku',
      photoURLs: [],
      createdAt: day(14),
      updatedAt: day(14),
      sample: true,
    },
    {
      id: 'sample-yoshinogari',
      userId: editor.uid,
      title: '弥生のムラにタイムスリップ',
      text: '環濠に囲まれた集落と、高くそびえる物見やぐら。復元された建物の中に入ると、弥生時代の人たちのくらしが想像しやすくなります。こどもと一緒に一日中楽しめました。',
      eraTags: ['弥生時代'],
      siteId: 'yoshinogari-site',
      photoURLs: [],
      createdAt: day(8),
      updatedAt: day(8),
      sample: true,
    },
    {
      id: 'sample-matsumoto',
      userId: editor.uid,
      title: '黒い天守と北アルプス',
      text: '晴れた日の松本城は、堀に映る黒い天守と山並みの組み合わせが見事でした。急な階段を登るときは足元に気をつけて。',
      eraTags: ['安土桃山時代', '江戸時代'],
      siteId: 'matsumoto-castle',
      photoURLs: [],
      createdAt: day(2),
      updatedAt: day(2),
      sample: true,
    },
  ];
  return { profiles: [editor], moments };
}
