import { createStore, get, set, update, type UseStore } from 'idb-keyval';
import type { AuthUser, Moment, NewMomentInput, ProfilePatch, SignUpInput, UserProfile, Visit } from '../../types';
import { BackendError, type Backend } from '../backend';
import { blobToDataURL } from '../../lib/image';
import { randomId } from '../../lib/format';
import { createSampleData } from './sampleData';

interface StoredAccount {
  uid: string;
  email: string;
  salt: string;
  hash: string;
  emailVerified: boolean;
}

const SESSION_KEY = 'rekitabi.session';
const SEED_KEY = 'seed:v1';

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

function toAuthUser(a: StoredAccount): AuthUser {
  return { uid: a.uid, email: a.email, emailVerified: a.emailVerified };
}

function readSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function writeSession(uid: string | null) {
  try {
    if (uid) localStorage.setItem(SESSION_KEY, uid);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // プライベートブラウズなどで保存できない場合はセッションを保持しない
  }
}

/**
 * ブラウザ内（IndexedDB）にデータを保存するデモ用バックエンド。
 * データはこの端末・このブラウザにだけ保存され、他の人とは共有されません。
 */
export class LocalBackend implements Backend {
  readonly mode = 'local' as const;
  private store: UseStore;
  private listeners = new Set<(user: AuthUser | null) => void>();
  private current: AuthUser | null = null;
  private ready: Promise<void>;

  constructor(dbName = 'rekitabi-demo') {
    this.store = createStore(dbName, 'kv');
    this.ready = this.init();
  }

  private async init() {
    if (!(await get(SEED_KEY, this.store))) {
      const sample = createSampleData();
      const profiles = (await get<Record<string, UserProfile>>('profiles', this.store)) ?? {};
      for (const p of sample.profiles) profiles[p.uid] = p;
      await set('profiles', profiles, this.store);
      const moments = (await get<Moment[]>('moments', this.store)) ?? [];
      await set('moments', [...moments, ...sample.moments], this.store);
      await set(SEED_KEY, true, this.store);
    }
    const uid = readSession();
    if (uid) {
      const accounts = await this.accounts();
      const account = Object.values(accounts).find((a) => a.uid === uid);
      this.current = account ? toAuthUser(account) : null;
      if (!account) writeSession(null);
    }
  }

  private async accounts(): Promise<Record<string, StoredAccount>> {
    return (await get<Record<string, StoredAccount>>('accounts', this.store)) ?? {};
  }

  private emit() {
    for (const l of this.listeners) l(this.current);
  }

  onAuthChange(callback: (user: AuthUser | null) => void): () => void {
    this.listeners.add(callback);
    void this.ready.then(() => callback(this.current));
    return () => this.listeners.delete(callback);
  }

  async signUp(input: SignUpInput): Promise<AuthUser> {
    await this.ready;
    const email = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BackendError('invalid-email');
    if (input.password.length < 8) throw new BackendError('weak-password');
    const accounts = await this.accounts();
    if (accounts[email]) throw new BackendError('email-already-in-use');
    const salt = randomId(16);
    const account: StoredAccount = {
      uid: randomId(28),
      email,
      salt,
      hash: await hashPassword(input.password, salt),
      // デモモードではメール認証を省略します
      emailVerified: true,
    };
    accounts[email] = account;
    await set('accounts', accounts, this.store);
    const profile: UserProfile = {
      uid: account.uid,
      name: '',
      userName: '',
      bio: 'よろしくお願いします。',
      gender: input.gender,
      birthDate: input.birthDate,
      prefecture: input.prefecture,
      createdAt: new Date().toISOString(),
    };
    await update<Record<string, UserProfile>>('profiles', (p) => ({ ...(p ?? {}), [account.uid]: profile }), this.store);
    this.current = toAuthUser(account);
    writeSession(account.uid);
    this.emit();
    return this.current;
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    await this.ready;
    const accounts = await this.accounts();
    const account = accounts[email.trim().toLowerCase()];
    if (!account) throw new BackendError('invalid-credential');
    if ((await hashPassword(password, account.salt)) !== account.hash) throw new BackendError('invalid-credential');
    this.current = toAuthUser(account);
    writeSession(account.uid);
    this.emit();
    return this.current;
  }

  async signOut(): Promise<void> {
    this.current = null;
    writeSession(null);
    this.emit();
  }

  async sendPasswordReset(email: string): Promise<void> {
    await this.ready;
    const accounts = await this.accounts();
    if (!accounts[email.trim().toLowerCase()]) throw new BackendError('user-not-found');
    // デモモードではメールは送信されません
  }

  async resendVerification(): Promise<void> {
    if (!this.current) throw new BackendError('not-signed-in');
  }

  async reloadUser(): Promise<AuthUser | null> {
    await this.ready;
    return this.current;
  }

  async getProfile(uid: string): Promise<UserProfile | null> {
    await this.ready;
    const profiles = (await get<Record<string, UserProfile>>('profiles', this.store)) ?? {};
    return profiles[uid] ?? null;
  }

  async getProfiles(uids: string[]): Promise<Map<string, UserProfile>> {
    await this.ready;
    const profiles = (await get<Record<string, UserProfile>>('profiles', this.store)) ?? {};
    const out = new Map<string, UserProfile>();
    for (const uid of uids) if (profiles[uid]) out.set(uid, profiles[uid]);
    return out;
  }

  async updateProfile(uid: string, patch: ProfilePatch): Promise<UserProfile> {
    await this.ready;
    if (this.current?.uid !== uid) throw new BackendError('permission-denied');
    const photoURL = patch.photo ? await blobToDataURL(patch.photo) : undefined;
    let next: UserProfile | undefined;
    await update<Record<string, UserProfile>>(
      'profiles',
      (profiles) => {
        const all = { ...(profiles ?? {}) };
        const prev = all[uid] ?? { uid, name: '', userName: '', bio: '', createdAt: new Date().toISOString() };
        next = {
          ...prev,
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.userName !== undefined ? { userName: patch.userName } : {}),
          ...(patch.bio !== undefined ? { bio: patch.bio } : {}),
          ...(photoURL ? { photoURL } : {}),
        };
        all[uid] = next;
        return all;
      },
      this.store,
    );
    return next!;
  }

  async listVisits(uid: string): Promise<Visit[]> {
    await this.ready;
    const visits = (await get<Visit[]>(`visits:${uid}`, this.store)) ?? [];
    return [...visits].sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));
  }

  async addVisit(uid: string, siteId: string): Promise<{ alreadyVisited: boolean }> {
    await this.ready;
    if (this.current?.uid !== uid) throw new BackendError('permission-denied');
    let alreadyVisited = false;
    await update<Visit[]>(
      `visits:${uid}`,
      (visits) => {
        const list = visits ?? [];
        if (list.some((v) => v.siteId === siteId)) {
          alreadyVisited = true;
          return list;
        }
        return [...list, { siteId, visitedAt: new Date().toISOString() }];
      },
      this.store,
    );
    return { alreadyVisited };
  }

  async listMoments(filter?: { userId?: string; siteId?: string }): Promise<Moment[]> {
    await this.ready;
    const moments = (await get<Moment[]>('moments', this.store)) ?? [];
    return moments
      .filter((m) => (!filter?.userId || m.userId === filter.userId) && (!filter?.siteId || m.siteId === filter.siteId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getMoment(id: string): Promise<Moment | null> {
    await this.ready;
    const moments = (await get<Moment[]>('moments', this.store)) ?? [];
    return moments.find((m) => m.id === id) ?? null;
  }

  async addMoment(uid: string, input: NewMomentInput): Promise<Moment> {
    await this.ready;
    if (this.current?.uid !== uid) throw new BackendError('not-signed-in');
    const now = new Date().toISOString();
    const moment: Moment = {
      id: randomId(),
      userId: uid,
      title: input.title,
      text: input.text,
      eraTags: input.eraTags,
      siteId: input.siteId,
      thumbnailURL: input.thumbnail ? await blobToDataURL(input.thumbnail) : undefined,
      photoURLs: await Promise.all(input.photos.map(blobToDataURL)),
      createdAt: now,
      updatedAt: now,
    };
    await update<Moment[]>('moments', (m) => [...(m ?? []), moment], this.store);
    return moment;
  }

  async deleteMoment(uid: string, id: string): Promise<void> {
    await this.ready;
    const moments = (await get<Moment[]>('moments', this.store)) ?? [];
    const target = moments.find((m) => m.id === id);
    if (!target) throw new BackendError('not-found');
    if (target.userId !== uid || this.current?.uid !== uid) throw new BackendError('permission-denied');
    await set(
      'moments',
      moments.filter((m) => m.id !== id),
      this.store,
    );
  }
}
