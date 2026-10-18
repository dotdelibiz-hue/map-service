import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { LocalBackend } from './localBackend';
import { BackendError } from '../backend';

let n = 0;
let backend: LocalBackend;

beforeEach(() => {
  localStorage.clear();
  backend = new LocalBackend(`test-db-${++n}`);
});

const signUp = (email = 'taro@example.com') => backend.signUp({ email, password: 'password123', gender: 'other', birthDate: '1990-01-01' });

describe('LocalBackend', () => {
  it('新規登録するとログイン状態になり、プロフィールが作られる', async () => {
    const user = await signUp();
    expect(user.email).toBe('taro@example.com');
    const profile = await backend.getProfile(user.uid);
    expect(profile?.bio).toBe('よろしくお願いします。');
  });

  it('同じメールアドレスでは登録できない', async () => {
    await signUp();
    await expect(signUp()).rejects.toMatchObject({ code: 'email-already-in-use' });
  });

  it('パスワードが違うとログインできない', async () => {
    await signUp();
    await backend.signOut();
    await expect(backend.signIn('taro@example.com', 'wrongpass1')).rejects.toBeInstanceOf(BackendError);
    const user = await backend.signIn('TARO@example.com', 'password123');
    expect(user.email).toBe('taro@example.com');
  });

  it('訪問記録は 1 史跡につき 1 回', async () => {
    const { uid } = await signUp();
    expect(await backend.addVisit(uid, 'himeji-castle')).toEqual({ alreadyVisited: false });
    expect(await backend.addVisit(uid, 'himeji-castle')).toEqual({ alreadyVisited: true });
    expect((await backend.listVisits(uid)).map((v) => v.siteId)).toEqual(['himeji-castle']);
  });

  it('探訪記の投稿・絞り込み・削除', async () => {
    const { uid } = await signUp();
    const m = await backend.addMoment(uid, {
      title: 'テスト',
      text: '本文',
      eraTags: ['江戸時代'],
      siteId: 'himeji-castle',
      photos: [new Blob(['x'], { type: 'image/jpeg' })],
    });
    expect(m.photoURLs[0]).toMatch(/^data:image\/jpeg;base64,/);
    expect((await backend.listMoments({ userId: uid })).map((x) => x.id)).toEqual([m.id]);
    expect((await backend.listMoments({ siteId: 'himeji-castle' })).map((x) => x.id)).toContain(m.id);
    await backend.deleteMoment(uid, m.id);
    expect(await backend.getMoment(m.id)).toBeNull();
  });

  it('他人の探訪記は削除できない', async () => {
    const { uid } = await signUp();
    const m = await backend.addMoment(uid, { title: 't', text: 'b', eraTags: [], photos: [] });
    await backend.signOut();
    const other = await signUp('hanako@example.com');
    await expect(backend.deleteMoment(other.uid, m.id)).rejects.toMatchObject({ code: 'permission-denied' });
  });

  it('最初からサンプル投稿が入っている', async () => {
    const list = await backend.listMoments();
    expect(list.length).toBeGreaterThan(0);
    expect(list.every((m) => m.sample)).toBe(true);
  });
});
