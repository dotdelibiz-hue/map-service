import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, PageSpinner } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import styles from './auth.module.css';

export default function EmailVerificationPage() {
  const { backend, user, initialized, refreshUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!initialized) return;
    if (!user) navigate('/sign-up', { replace: true });
    else if (user.emailVerified && backend?.mode === 'firebase') navigate('/', { replace: true });
  }, [initialized, user, backend, navigate]);

  if (!initialized || !user) return <PageSpinner />;

  if (backend?.mode === 'local') {
    return (
      <main className={styles.wrapper}>
        <div className={styles.verifyIcon} aria-hidden="true">
          ✓
        </div>
        <h1 className={styles.titleDark}>登録が完了しました</h1>
        <p className={styles.lead}>デモモードではメールアドレスの認証は不要です。</p>
        <div className={styles.stack}>
          <Button size="large" fullWidth onClick={() => navigate('/')}>
            地図へ
          </Button>
        </div>
      </main>
    );
  }

  const resend = async () => {
    setSending(true);
    setMessage(null);
    try {
      await backend?.resendVerification();
      setMessage({ text: '認証メールをもう一度送信しました。', error: false });
    } catch {
      setMessage({ text: '認証メールを再送できませんでした。時間をおいて再度お試しください。', error: true });
    } finally {
      setSending(false);
    }
  };

  const check = async () => {
    setChecking(true);
    try {
      await refreshUser();
      const next = await backend?.reloadUser();
      if (next?.emailVerified) {
        toast('メールアドレスの認証が完了しました', 'success');
        navigate('/', { replace: true });
      } else {
        setMessage({ text: 'まだ認証が完了していません。メール内のリンクを開いてください。', error: true });
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <main className={styles.wrapper}>
      <div className={styles.verifyIcon} aria-hidden="true">
        ✓
      </div>
      <h1 className={styles.titleDark}>メールをご確認ください</h1>
      <p className={styles.lead}>認証メールを送信しました。メール内のリンクを開くと、アカウント登録が完了します。</p>
      <p className={styles.email}>{user.email}</p>
      <p className={styles.lead}>
        メールが届かない場合は、迷惑メールフォルダをご確認ください。確認しても届いていない場合は、認証メールを再送できます。
      </p>
      {message && (
        <p
          className={message.error ? styles.formError : styles.success}
          role={message.error ? 'alert' : 'status'}
          style={{ marginTop: 16 }}
        >
          {message.text}
        </p>
      )}
      <div className={styles.stack}>
        <Button size="large" fullWidth loading={checking} onClick={check}>
          認証が完了したらこちら
        </Button>
        <Button variant="outlined" size="large" fullWidth loading={sending} onClick={resend}>
          {sending ? '再送中...' : '認証メールをもう一度送る'}
        </Button>
        <Button variant="text" onClick={() => navigate('/sign-in')}>
          ログイン画面へ
        </Button>
      </div>
    </main>
  );
}
