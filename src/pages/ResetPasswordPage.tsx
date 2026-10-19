import { useState, type FormEvent } from 'react';
import { Button } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { BackendError } from '../services/backend';
import { EmailField } from './AuthFields';
import { validateEmail } from './authErrors';
import styles from './auth.module.css';

export default function ResetPasswordPage() {
  const { backend } = useAuth();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [result, setResult] = useState<{ text: string; error: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    setEmailError(err);
    if (err || !backend) return;
    setLoading(true);
    setResult(null);
    try {
      await backend.sendPasswordReset(email);
      setResult({
        text:
          backend.mode === 'local'
            ? 'デモモードのためメールは送信されません。'
            : 'ご登録のメールアドレスに再設定のリンクを送付いたしました。',
        error: false,
      });
    } catch (e2) {
      const notFound = e2 instanceof BackendError && (e2.code === 'user-not-found' || e2.code === 'invalid-email');
      setResult({
        text: notFound
          ? 'ご登録のメールアドレスがございません。再度メールアドレスのご確認をお願いします。'
          : '送信できませんでした。時間をおいて再度お試しください。',
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.wrapper}>
      <h1 className={styles.titleDark}>パスワードの再設定</h1>
      <p className={styles.lead}>再設定用のメールアドレスを入力してください。</p>
      <form className={styles.form} onSubmit={submit} noValidate>
        {result && (
          <p className={result.error ? styles.formError : styles.success} role={result.error ? 'alert' : 'status'}>
            {result.text}
          </p>
        )}
        <EmailField value={email} onChange={setEmail} error={emailError} />
        <Button type="submit" size="large" fullWidth loading={loading} disabled={!backend}>
          送信
        </Button>
      </form>
    </main>
  );
}
