import { useState } from 'react';
import { EyeIcon, EyeOffIcon, LockIcon, MailIcon } from '../components/ui/Icons';
import styles from './auth.module.css';

export function EmailField({
  label = 'メールアドレス',
  value,
  onChange,
  error,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor="email">
        {label}
      </label>
      <div className={styles.inputWrap}>
        <MailIcon size={26} className={styles.inputIcon} />
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          placeholder="メールアドレス"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}

export function PasswordField({
  value,
  onChange,
  error,
  autoComplete = 'current-password',
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor="password">
        パスワード
      </label>
      <p className={styles.note}>※8文字以上の半角英数字を組み合わせる</p>
      <div className={styles.inputWrap}>
        <LockIcon size={26} className={styles.inputIcon} />
        <input
          id="password"
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          placeholder="パスワード"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
        />
        <button
          type="button"
          className={styles.eye}
          aria-label={visible ? 'パスワードを隠す' : 'パスワードを表示'}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeIcon size={22} /> : <EyeOffIcon size={22} />}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
