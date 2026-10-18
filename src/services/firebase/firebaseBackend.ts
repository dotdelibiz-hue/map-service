import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  Timestamp,
  collection,
  connectFirestoreEmulator,
  doc,
  documentId,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { connectStorageEmulator, getDownloadURL, getStorage, ref, uploadBytes, type FirebaseStorage } from 'firebase/storage';
import type { AuthUser, Moment, NewMomentInput, ProfilePatch, SignUpInput, UserProfile, Visit } from '../../types';
import { BackendError, type Backend, type BackendErrorCode } from '../backend';
import { randomId } from '../../lib/format';

export interface FirebaseEnv {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId?: string;
  appId?: string;
  useEmulator?: boolean;
}

const ERROR_MAP: Record<string, BackendErrorCode> = {
  'auth/invalid-credential': 'invalid-credential',
  'auth/wrong-password': 'invalid-credential',
  'auth/user-not-found': 'user-not-found',
  'auth/invalid-email': 'invalid-email',
  'auth/email-already-in-use': 'email-already-in-use',
  'auth/weak-password': 'weak-password',
  'auth/too-many-requests': 'too-many-requests',
  'auth/user-disabled': 'user-disabled',
  'permission-denied': 'permission-denied',
  'not-found': 'not-found',
};

function wrap(e: unknown): BackendError {
  if (e instanceof BackendError) return e;
  const code = (e as { code?: string })?.code ?? '';
  return new BackendError(ERROR_MAP[code] ?? 'unknown', (e as Error)?.message);
}

function toAuthUser(u: User): AuthUser {
  return { uid: u.uid, email: u.email ?? '', emailVerified: u.emailVerified };
}

function iso(v: unknown): string {
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === 'string') return v;
  return new Date().toISOString();
}

function toMoment(id: string, d: DocumentData): Moment {
  return {
    id,
    userId: d.userId,
    title: d.title ?? '',
    text: d.text ?? '',
    thumbnailURL: d.thumbnailURL || undefined,
    photoURLs: d.photoURLs ?? [],
    eraTags: d.eraTags ?? [],
    siteId: d.siteId || undefined,
    createdAt: iso(d.createdAt),
    updatedAt: iso(d.updatedAt),
  };
}

function toProfile(uid: string, d: DocumentData): UserProfile {
  return {
    uid,
    name: d.name ?? '',
    userName: d.userName ?? '',
    bio: d.bio ?? '',
    photoURL: d.photoURL || undefined,
    createdAt: iso(d.createdAt),
  };
}

/** Firebase（Auth / Firestore / Storage）を使う本番用バックエンド */
export class FirebaseBackend implements Backend {
  readonly mode = 'firebase' as const;
  private app: FirebaseApp;
  private auth: Auth;
  private db: Firestore;
  private storage: FirebaseStorage;

  constructor(env: FirebaseEnv) {
    this.app = initializeApp(env);
    this.auth = getAuth(this.app);
    this.db = getFirestore(this.app);
    this.storage = getStorage(this.app);
    if (env.useEmulator) {
      connectAuthEmulator(this.auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(this.db, '127.0.0.1', 8080);
      connectStorageEmulator(this.storage, '127.0.0.1', 9199);
    }
  }

  onAuthChange(callback: (user: AuthUser | null) => void): () => void {
    return onAuthStateChanged(this.auth, (u) => callback(u ? toAuthUser(u) : null));
  }

  async signUp(input: SignUpInput): Promise<AuthUser> {
    try {
      const cred = await createUserWithEmailAndPassword(this.auth, input.email.trim(), input.password);
      const uid = cred.user.uid;
      await setDoc(doc(this.db, 'users', uid), {
        name: '',
        userName: '',
        bio: 'よろしくお願いします。',
        photoURL: '',
        createdAt: serverTimestamp(),
      });
      // 性別・生年月日・居住地は本人だけが読める場所に保存
      await setDoc(doc(this.db, 'users', uid, 'private', 'profile'), {
        email: cred.user.email,
        gender: input.gender,
        birthDate: input.birthDate,
        prefecture: input.prefecture ?? '',
        createdAt: serverTimestamp(),
      });
      await sendEmailVerification(cred.user, { url: `${location.origin}${import.meta.env.BASE_URL}` });
      return toAuthUser(cred.user);
    } catch (e) {
      throw wrap(e);
    }
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const cred = await signInWithEmailAndPassword(this.auth, email.trim(), password);
      return toAuthUser(cred.user);
    } catch (e) {
      throw wrap(e);
    }
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email.trim(), { url: `${location.origin}${import.meta.env.BASE_URL}sign-in` });
    } catch (e) {
      throw wrap(e);
    }
  }

  async resendVerification(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) throw new BackendError('not-signed-in');
    try {
      await sendEmailVerification(user, { url: `${location.origin}${import.meta.env.BASE_URL}` });
    } catch (e) {
      throw wrap(e);
    }
  }

  async reloadUser(): Promise<AuthUser | null> {
    const user = this.auth.currentUser;
    if (!user) return null;
    await reload(user);
    // メール認証後はトークンを更新してセキュリティルールに反映させる
    await user.getIdToken(true);
    return toAuthUser(user);
  }

  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const snap = await getDoc(doc(this.db, 'users', uid));
      return snap.exists() ? toProfile(uid, snap.data()) : null;
    } catch (e) {
      throw wrap(e);
    }
  }

  async getProfiles(uids: string[]): Promise<Map<string, UserProfile>> {
    const out = new Map<string, UserProfile>();
    const unique = [...new Set(uids)];
    for (let i = 0; i < unique.length; i += 30) {
      const chunk = unique.slice(i, i + 30);
      const snap = await getDocs(query(collection(this.db, 'users'), where(documentId(), 'in', chunk)));
      snap.forEach((d) => out.set(d.id, toProfile(d.id, d.data())));
    }
    return out;
  }

  async updateProfile(uid: string, patch: ProfilePatch): Promise<UserProfile> {
    try {
      const data: Record<string, unknown> = {};
      if (patch.name !== undefined) data.name = patch.name;
      if (patch.userName !== undefined) data.userName = patch.userName;
      if (patch.bio !== undefined) data.bio = patch.bio;
      if (patch.photo) data.photoURL = await this.upload(`users/${uid}/profile/${randomId(12)}.jpg`, patch.photo);
      await updateDoc(doc(this.db, 'users', uid), data);
      const next = await this.getProfile(uid);
      if (!next) throw new BackendError('not-found');
      return next;
    } catch (e) {
      throw wrap(e);
    }
  }

  async listVisits(uid: string): Promise<Visit[]> {
    try {
      const snap = await getDocs(query(collection(this.db, 'users', uid, 'visits'), orderBy('visitedAt', 'desc')));
      return snap.docs.map((d) => ({ siteId: d.id, visitedAt: iso(d.data().visitedAt) }));
    } catch (e) {
      throw wrap(e);
    }
  }

  async addVisit(uid: string, siteId: string): Promise<{ alreadyVisited: boolean }> {
    try {
      const visitRef = doc(this.db, 'users', uid, 'visits', siteId);
      return await runTransaction(this.db, async (tx) => {
        const snap = await tx.get(visitRef);
        if (snap.exists()) return { alreadyVisited: true };
        tx.set(visitRef, { visitedAt: serverTimestamp() });
        return { alreadyVisited: false };
      });
    } catch (e) {
      throw wrap(e);
    }
  }

  async listMoments(filter?: { userId?: string; siteId?: string }): Promise<Moment[]> {
    try {
      const constraints = [where('logicalDeleteFlag', '==', false)];
      if (filter?.userId) constraints.push(where('userId', '==', filter.userId));
      if (filter?.siteId) constraints.push(where('siteId', '==', filter.siteId));
      const snap = await getDocs(query(collection(this.db, 'moments'), ...constraints, orderBy('createdAt', 'desc'), limit(100)));
      return snap.docs.map((d) => toMoment(d.id, d.data()));
    } catch (e) {
      throw wrap(e);
    }
  }

  async getMoment(id: string): Promise<Moment | null> {
    try {
      const snap = await getDoc(doc(this.db, 'moments', id));
      if (!snap.exists() || snap.data().logicalDeleteFlag) return null;
      return toMoment(snap.id, snap.data());
    } catch (e) {
      // 削除済みの探訪記はルールで読めないため「見つからない」として扱う
      if ((e as { code?: string })?.code === 'permission-denied') return null;
      throw wrap(e);
    }
  }

  async addMoment(uid: string, input: NewMomentInput): Promise<Moment> {
    try {
      const momentRef = doc(collection(this.db, 'moments'));
      const dir = `moments/${uid}/${momentRef.id}`;
      const thumbnailURL = input.thumbnail ? await this.upload(`${dir}/thumbnail.jpg`, input.thumbnail) : '';
      const photoURLs = await Promise.all(input.photos.map((p, i) => this.upload(`${dir}/photo-${i + 1}.jpg`, p)));
      await setDoc(momentRef, {
        userId: uid,
        title: input.title,
        text: input.text,
        eraTags: input.eraTags,
        siteId: input.siteId ?? '',
        thumbnailURL,
        photoURLs,
        logicalDeleteFlag: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      const now = new Date().toISOString();
      return {
        id: momentRef.id,
        userId: uid,
        title: input.title,
        text: input.text,
        eraTags: input.eraTags,
        siteId: input.siteId,
        thumbnailURL: thumbnailURL || undefined,
        photoURLs,
        createdAt: now,
        updatedAt: now,
      };
    } catch (e) {
      throw wrap(e);
    }
  }

  async deleteMoment(uid: string, id: string): Promise<void> {
    try {
      const momentRef = doc(this.db, 'moments', id);
      const snap = await getDoc(momentRef);
      if (!snap.exists()) throw new BackendError('not-found');
      if (snap.data().userId !== uid) throw new BackendError('permission-denied');
      await updateDoc(momentRef, { logicalDeleteFlag: true, updatedAt: serverTimestamp() });
    } catch (e) {
      throw wrap(e);
    }
  }

  private async upload(path: string, blob: Blob): Promise<string> {
    const r = ref(this.storage, path);
    await uploadBytes(r, blob, { contentType: blob.type || 'image/jpeg' });
    return getDownloadURL(r);
  }
}
