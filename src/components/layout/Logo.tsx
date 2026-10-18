import { APP_NAME } from '../../config';
import styles from './layout.module.css';

export function Logo({ size = 25 }: { size?: number }) {
  // 末尾 4 文字をアクセントカラーに（例: REKI + TABI）
  const head = APP_NAME.slice(0, -4);
  const tail = APP_NAME.slice(-4);
  return (
    <span className={styles.logoText} style={{ fontSize: size }} aria-label={APP_NAME}>
      {head}
      <span className={styles.logoAccent}>{tail}</span>
    </span>
  );
}
