import { BackendError } from '../services/backend';

export function signInErrorMessage(e: unknown): string {
  const code = e instanceof BackendError ? e.code : 'unknown';
  switch (code) {
    case 'invalid-credential':
    case 'user-not-found':
      return 'メールアドレスまたはパスワードが違います';
    case 'invalid-email':
      return 'メールアドレスの形式が正しくありません';
    case 'too-many-requests':
      return 'このアカウントへのアクセスはログインに多数失敗したため、一時的に無効になっています。';
    case 'user-disabled':
      return 'このアカウントは現在ご利用いただけません。お手数ですが、お問い合わせください。';
    default:
      return 'ログインに失敗しました。時間をおいて再度お試しください。';
  }
}

export function signUpErrorMessage(e: unknown): string {
  const code = e instanceof BackendError ? e.code : 'unknown';
  switch (code) {
    case 'email-already-in-use':
      return 'このメールアドレスは既に登録されています。ログイン画面からサインインしてください。パスワードをお忘れの場合は、パスワードの再設定を行ってください。';
    case 'invalid-email':
      return '無効のメールアドレスです';
    case 'weak-password':
      return '8文字以上でパスワードを設定してください';
    case 'too-many-requests':
      return 'ログインの試行回数が上限に達したため、一時的にアクセスが制限されています。しばらく時間をおいてからお試しください。';
    default:
      return '登録に失敗しました。時間をおいて再度お試しください。';
  }
}

export function validateEmail(v: string): string | undefined {
  if (!v.trim()) return 'メールアドレスは必須です';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'メールアドレスの形式が正しくありません';
  return undefined;
}

export function validatePassword(v: string): string | undefined {
  if (!v) return 'パスワードは必須です';
  if (v.length < 8) return '8文字以上入力してください';
  if (!/^[A-Za-z0-9]+$/.test(v)) return '半角英数字のみ利用してください';
  return undefined;
}
