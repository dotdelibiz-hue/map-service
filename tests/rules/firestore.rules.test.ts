/**
 * Firestore / Storage のセキュリティルールのテスト。
 * Firebase エミュレーターが必要です: `npm run test:rules`
 */
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';

let env: RulesTestEnvironment;

const verified = { email: 'a@example.com', email_verified: true };
const unverified = { email: 'b@example.com', email_verified: false };

const validMoment = (userId: string) => ({
  userId,
  title: 'タイトル',
  text: '本文',
  eraTags: ['江戸時代'],
  photoURLs: [],
  thumbnailURL: '',
  siteId: 'himeji-castle',
  logicalDeleteFlag: false,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
});

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-rekitabi-rules',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
    storage: { rules: readFileSync('storage.rules', 'utf8'), host: '127.0.0.1', port: 9199 },
  });
});

afterAll(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
});

describe('users', () => {
  it('本人はプロフィールを作成できる', async () => {
    const db = env.authenticatedContext('alice', unverified).firestore();
    await assertSucceeds(
      setDoc(doc(db, 'users/alice'), { name: '', userName: '', bio: 'よろしく', photoURL: '', createdAt: serverTimestamp() }),
    );
  });

  it('他人のプロフィールは作成・更新できない', async () => {
    const db = env.authenticatedContext('mallory', verified).firestore();
    await assertFails(setDoc(doc(db, 'users/alice'), { name: 'x', userName: '', bio: '', photoURL: '', createdAt: serverTimestamp() }));
  });

  it('自己紹介は 30 文字まで', async () => {
    const db = env.authenticatedContext('alice', verified).firestore();
    await assertFails(
      setDoc(doc(db, 'users/alice'), { name: '', userName: '', bio: 'あ'.repeat(31), photoURL: '', createdAt: serverTimestamp() }),
    );
  });

  it('非公開情報は本人しか読めない', async () => {
    await env.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'users/alice/private/profile'), { gender: 'other' });
    });
    await assertSucceeds(getDoc(doc(env.authenticatedContext('alice').firestore(), 'users/alice/private/profile')));
    await assertFails(getDoc(doc(env.authenticatedContext('bob').firestore(), 'users/alice/private/profile')));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'users/alice/private/profile')));
  });
});

describe('visits', () => {
  it('メール認証済みの本人だけが訪問記録をつけられる', async () => {
    const ok = env.authenticatedContext('alice', verified).firestore();
    await assertSucceeds(setDoc(doc(ok, 'users/alice/visits/himeji-castle'), { visitedAt: serverTimestamp() }));

    const notVerified = env.authenticatedContext('bob', unverified).firestore();
    await assertFails(setDoc(doc(notVerified, 'users/bob/visits/himeji-castle'), { visitedAt: serverTimestamp() }));

    const other = env.authenticatedContext('mallory', verified).firestore();
    await assertFails(setDoc(doc(other, 'users/alice/visits/goryokaku'), { visitedAt: serverTimestamp() }));
  });

  it('訪問記録は誰でも読めるが、書き換え・削除はできない', async () => {
    const db = env.authenticatedContext('alice', verified).firestore();
    await setDoc(doc(db, 'users/alice/visits/himeji-castle'), { visitedAt: serverTimestamp() });
    await assertSucceeds(getDoc(doc(env.unauthenticatedContext().firestore(), 'users/alice/visits/himeji-castle')));
    await assertFails(updateDoc(doc(db, 'users/alice/visits/himeji-castle'), { visitedAt: serverTimestamp() }));
    await assertFails(deleteDoc(doc(db, 'users/alice/visits/himeji-castle')));
  });
});

describe('moments', () => {
  it('メール認証済みのユーザーは自分の探訪記を投稿できる', async () => {
    const db = env.authenticatedContext('alice', verified).firestore();
    await assertSucceeds(setDoc(doc(db, 'moments/m1'), validMoment('alice')));
  });

  it('未認証・未ログイン・なりすましの投稿はできない', async () => {
    await assertFails(setDoc(doc(env.authenticatedContext('bob', unverified).firestore(), 'moments/m1'), validMoment('bob')));
    await assertFails(setDoc(doc(env.unauthenticatedContext().firestore(), 'moments/m1'), validMoment('bob')));
    await assertFails(setDoc(doc(env.authenticatedContext('mallory', verified).firestore(), 'moments/m1'), validMoment('alice')));
  });

  it('タイトルは 45 文字まで、写真は 5 枚まで', async () => {
    const db = env.authenticatedContext('alice', verified).firestore();
    await assertFails(setDoc(doc(db, 'moments/m1'), { ...validMoment('alice'), title: 'あ'.repeat(46) }));
    await assertFails(setDoc(doc(db, 'moments/m2'), { ...validMoment('alice'), photoURLs: ['1', '2', '3', '4', '5', '6'] }));
  });

  it('論理削除は本人だけができ、削除後は他人から読めない', async () => {
    const alice = env.authenticatedContext('alice', verified).firestore();
    await setDoc(doc(alice, 'moments/m1'), validMoment('alice'));
    const bob = env.authenticatedContext('bob', verified).firestore();
    await assertFails(updateDoc(doc(bob, 'moments/m1'), { logicalDeleteFlag: true, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(doc(alice, 'moments/m1'), { title: '書き換え', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(doc(alice, 'moments/m1'), { logicalDeleteFlag: true, updatedAt: serverTimestamp() }));
    await assertFails(getDoc(doc(bob, 'moments/m1')));
    await assertFails(deleteDoc(doc(alice, 'moments/m1')));
  });

  it('一覧は「削除されていないもの」に絞った検索だけ許可', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertSucceeds(getDocs(query(collection(db, 'moments'), where('logicalDeleteFlag', '==', false))));
    await assertFails(getDocs(collection(db, 'moments')));
  });
});

describe('storage', () => {
  const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  it('本人は自分のフォルダに画像をアップロードできる', async () => {
    const storage = env.authenticatedContext('alice', verified).storage();
    await assertSucceeds(uploadBytes(ref(storage, 'users/alice/profile/a.png'), png, { contentType: 'image/png' }));
    await assertSucceeds(uploadBytes(ref(storage, 'moments/alice/m1/photo-1.png'), png, { contentType: 'image/png' }));
  });

  it('他人のフォルダや画像以外はアップロードできない', async () => {
    const storage = env.authenticatedContext('mallory', verified).storage();
    await assertFails(uploadBytes(ref(storage, 'users/alice/profile/a.png'), png, { contentType: 'image/png' }));
    await assertFails(uploadBytes(ref(storage, 'users/mallory/profile/a.txt'), png, { contentType: 'text/plain' }));
    const notVerified = env.authenticatedContext('bob', unverified).storage();
    await assertFails(uploadBytes(ref(notVerified, 'moments/bob/m1/photo-1.png'), png, { contentType: 'image/png' }));
  });
});
