import type { AuthUser, Moment, NewMomentInput, ProfilePatch, SignUpInput, UserProfile, Visit } from '../types';

/** バックエンドで起きたエラー。code で画面側のメッセージを出し分けます */
export class BackendError extends Error {
  readonly code: BackendErrorCode;
  constructor(code: BackendErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
  }
}

export type BackendErrorCode =
  | 'invalid-credential'
  | 'invalid-email'
  | 'email-already-in-use'
  | 'weak-password'
  | 'user-not-found'
  | 'too-many-requests'
  | 'user-disabled'
  | 'not-signed-in'
  | 'permission-denied'
  | 'not-found'
  | 'unknown';

/**
 * ユーザーデータ（アカウント・プロフィール・訪問記録・探訪記）を扱うバックエンド。
 * - local: ブラウザ内（IndexedDB）に保存するデモモード。設定不要で動きます。
 * - firebase: Firebase Auth / Firestore / Storage を使う本番モード。
 */
export interface Backend {
  readonly mode: 'local' | 'firebase';

  onAuthChange(callback: (user: AuthUser | null) => void): () => void;
  signUp(input: SignUpInput): Promise<AuthUser>;
  signIn(email: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  resendVerification(): Promise<void>;
  reloadUser(): Promise<AuthUser | null>;

  getProfile(uid: string): Promise<UserProfile | null>;
  getProfiles(uids: string[]): Promise<Map<string, UserProfile>>;
  updateProfile(uid: string, patch: ProfilePatch): Promise<UserProfile>;

  listVisits(uid: string): Promise<Visit[]>;
  addVisit(uid: string, siteId: string): Promise<{ alreadyVisited: boolean }>;

  listMoments(filter?: { userId?: string; siteId?: string }): Promise<Moment[]>;
  getMoment(id: string): Promise<Moment | null>;
  addMoment(uid: string, input: NewMomentInput): Promise<Moment>;
  deleteMoment(uid: string, id: string): Promise<void>;
}
