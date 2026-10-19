import { useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { PREFECTURES } from '../config';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import type { Gender } from '../types';
import { EmailField, PasswordField } from './AuthFields';
import { signUpErrorMessage, validateEmail, validatePassword } from './authErrors';
import styles from './auth.module.css';

export default function SignUpPage() {
  const { backend } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [year, setYear] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const thisYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 100 }, (_, i) => String(thisYear - i)), [thisYear]);
  const daysInMonth = year && month ? new Date(Number(year), Number(month), 0).getDate() : 31;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const next = {
      email: validateEmail(email),
      password: validatePassword(password),
      gender: gender ? undefined : '性別は必須です',
      birth: year && month && day ? undefined : '生年月日は必須です',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean) || !backend || !gender) return;
    setLoading(true);
    setFormError('');
    try {
      const birthDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      const user = await backend.signUp({ email, password, gender, birthDate, prefecture: prefecture || undefined });
      if (backend.mode === 'firebase') {
        navigate('/sign-up/email-verification', { replace: true });
      } else {
        toast('登録が完了しました。プロフィールを設定しましょう', 'success');
        navigate(`/user/${user.uid}/edit`, { replace: true });
      }
    } catch (err) {
      setFormError(signUpErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.wrapper}>
      <h1 className={styles.titleDark}>アカウント作成</h1>
      <form className={styles.form} onSubmit={submit} noValidate>
        {formError && (
          <p className={styles.formError} role="alert">
            {formError}
          </p>
        )}
        <EmailField label="登録用メールアドレス" value={email} onChange={setEmail} error={errors.email} />
        <PasswordField value={password} onChange={setPassword} error={errors.password} autoComplete="new-password" />

        <fieldset className={styles.field} style={{ border: 'none', padding: 0, margin: 0 }}>
          <legend className={styles.label}>性別</legend>
          <div className={styles.radioGroup}>
            {(
              [
                ['male', '男性'],
                ['female', '女性'],
                ['other', 'その他'],
              ] as const
            ).map(([v, label]) => (
              <label key={v} className={styles.radioItem}>
                <input type="radio" name="gender" value={v} checked={gender === v} onChange={() => setGender(v)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {errors.gender && <p className={styles.error}>{errors.gender}</p>}
        </fieldset>

        <div className={styles.field}>
          <span className={styles.label} id="birth-label">
            生年月日
          </span>
          <div className={styles.selectRow} role="group" aria-labelledby="birth-label">
            <select className={styles.select} value={year} onChange={(e) => setYear(e.target.value)} aria-label="年">
              <option value="">選択</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <span>年</span>
            <select className={styles.select} value={month} onChange={(e) => setMonth(e.target.value)} aria-label="月">
              <option value="">選択</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {i + 1}
                </option>
              ))}
            </select>
            <span>月</span>
            <select className={styles.select} value={day} onChange={(e) => setDay(e.target.value)} aria-label="日">
              <option value="">選択</option>
              {Array.from({ length: daysInMonth }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {i + 1}
                </option>
              ))}
            </select>
            <span>日</span>
          </div>
          {errors.birth && <p className={styles.error}>{errors.birth}</p>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="prefecture">
            居住地（任意）
          </label>
          <div className={styles.selectRow}>
            <select id="prefecture" className={styles.select} value={prefecture} onChange={(e) => setPrefecture(e.target.value)}>
              <option value="">選択</option>
              {PREFECTURES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className={styles.consent}>
          <Link to="/terms-of-service" target="_blank">
            利用規約
          </Link>
          および
          <Link to="/privacy-policy" target="_blank">
            プライバシーポリシー
          </Link>
          をご確認ください
        </p>
        <Button type="submit" size="large" fullWidth loading={loading} disabled={!backend}>
          {loading ? '登録中...' : '同意して新規登録する'}
        </Button>
      </form>
      {backend?.mode === 'local' && (
        <p className={styles.demoNote}>現在はデモモードです。登録した内容はこの端末のブラウザ内にだけ保存され、メールは送信されません。</p>
      )}
      <div className={styles.or}>または</div>
      <p className={styles.sub}>すでにアカウントをお持ちの方</p>
      <Button variant="outlined" size="large" fullWidth onClick={() => navigate('/sign-in')}>
        ログイン
      </Button>
    </main>
  );
}
