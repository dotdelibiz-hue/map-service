import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { EmailField, PasswordField } from './AuthFields';
import { signInErrorMessage, validateEmail } from './authErrors';
import styles from './auth.module.css';

export default function SignInPage() {
  const { backend } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ee = validateEmail(email);
    setEmailError(ee);
    if (ee || !password || !backend) return;
    setLoading(true);
    setError('');
    try {
      const user = await backend.signIn(email, password);
      if (backend.mode === 'firebase' && !user.emailVerified) {
        toast('本人確認のため、メールアドレスの認証をお願いいたします。');
        navigate('/sign-up/email-verification', { replace: true });
        return;
      }
      toast('ログインしました', 'success');
      navigate('/', { replace: true });
    } catch (err) {
      setError(signInErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.wrapper}>
      <h1 className={styles.title}>おかえりなさい！</h1>
      <p className={styles.lead}>アカウントにログインして、音声ガイドを楽しみましょう</p>
      <form className={styles.form} onSubmit={submit} noValidate>
        {error && (
          <p className={styles.formError} role="alert">
            {error}
          </p>
        )}
        <EmailField value={email} onChange={setEmail} error={emailError} />
        <PasswordField value={password} onChange={setPassword} />
        <Button type="submit" size="large" fullWidth loading={loading} disabled={!backend}>
          {loading ? 'ログイン中...' : 'ログイン'}
        </Button>
      </form>
      <p className={styles.forgot}>
        パスワードを忘れた方は<Link to="/reset-password">こちら</Link>
      </p>
      <div className={styles.or}>または</div>
      <p className={styles.sub}>アカウントをお持ちでない方</p>
      <Button variant="outlined" size="large" fullWidth onClick={() => navigate('/sign-up')}>
        新規アカウント作成
      </Button>
    </main>
  );
}
