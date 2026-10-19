import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import styles from './ui.module.css';
import { PersonIcon } from './Icons';

type Variant = 'contained' | 'outlined' | 'done' | 'yellow' | 'sky' | 'text';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'medium' | 'large';
  fullWidth?: boolean;
  /** 横並びのとき均等幅にする */
  grow?: boolean;
  loading?: boolean;
}

export function Button({
  variant = 'contained',
  size = 'medium',
  fullWidth,
  grow,
  loading,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  const cls = [styles.button, styles[variant], size === 'large' && styles.large, fullWidth && styles.full, grow && styles.flex1, className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} disabled={disabled || loading} {...rest}>
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
}

interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  grow?: boolean;
  fullWidth?: boolean;
}

export function LinkButton({ variant = 'contained', grow, fullWidth, className, children, ...rest }: LinkButtonProps) {
  const cls = [styles.button, styles[variant], grow && styles.flex1, fullWidth && styles.full, className].filter(Boolean).join(' ');
  return (
    <a className={cls} {...rest}>
      {children}
    </a>
  );
}

export function Spinner({ size = 24 }: { size?: number }) {
  return <span className={styles.spinner} style={{ width: size, height: size }} role="progressbar" aria-label="読み込み中" />;
}

export function PageSpinner() {
  return (
    <div className={styles.centerBox}>
      <Spinner size={32} />
    </div>
  );
}

export function ErrorRetry({ onRetry, title = '読み込めませんでした' }: { onRetry?: () => void; title?: string }) {
  return (
    <div className={styles.error} role="alert">
      <p className={styles.errorTitle}>{title}</p>
      <p className={styles.errorText}>通信状況を確かめて、もう一度お試しください</p>
      {onRetry && (
        <Button variant="yellow" className={styles.errorButton} onClick={onRetry}>
          再試行
        </Button>
      )}
    </div>
  );
}

export interface TabDef<K extends string> {
  key: K;
  label: ReactNode;
  count?: number;
}

export function Tabs<K extends string>({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: TabDef<K>[];
  active: K;
  onChange: (k: K) => void;
  label: string;
}) {
  return (
    <div className={styles.tabs} role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={active === t.key}
          className={`${styles.tab} ${active === t.key ? styles.tabActive : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
          {t.count !== undefined && <span className={styles.tabCount}>{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`${styles.switch} ${checked ? styles.switchOn : ''}`}
      onClick={() => onChange(!checked)}
    />
  );
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  const cls = `${styles.chip} ${active ? styles.chipActive : ''}`;
  if (!onClick) return <span className={cls}>{children}</span>;
  return (
    <button type="button" className={cls} aria-pressed={active} onClick={onClick}>
      {children}
    </button>
  );
}

export function Badge({ children }: { children: ReactNode }) {
  return <span className={styles.badge}>{children}</span>;
}

export function Avatar({ src, size = 40, alt = '' }: { src?: string; size?: number; alt?: string }) {
  return (
    <span className={styles.avatar} style={{ width: size, height: size }}>
      {src ? <img src={src} alt={alt} /> : <PersonIcon size={size * 0.7} style={{ marginTop: size * 0.12 }} />}
    </span>
  );
}

/** 読み込み中はスケルトンを表示する画像 */
export function SmartImage({
  src,
  alt = '',
  className,
  style,
}: {
  src: string | undefined;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`${styles.imgWrap} ${className ?? ''}`} style={style}>
      {!loaded && <div className={`${styles.imgSkeleton} skeleton`} />}
      {src && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          referrerPolicy="no-referrer"
          className={loaded ? '' : styles.imgHidden}
          onLoad={() => setLoaded(true)}
          onError={() => setLoaded(true)}
        />
      )}
    </div>
  );
}
