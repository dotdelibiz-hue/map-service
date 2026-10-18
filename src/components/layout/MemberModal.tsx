import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { APP_NAME } from '../../config';
import { Button } from '../ui';
import { BrushIcon, CloseIcon } from '../ui/Icons';
import styles from './layout.module.css';

export function MemberModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="member-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className={`${styles.headerButton} ${styles.modalClose}`} aria-label="閉じる" onClick={onClose}>
          <CloseIcon size={28} color="#555" />
        </button>
        <h2 id="member-title" className={styles.modalTitle}>
          {APP_NAME}のメンバーになりませんか？
        </h2>
        <p className={styles.modalLead}>こんなことができるようになります！</p>
        <ul className={styles.modalList}>
          {['史跡の口コミを投稿', 'マイページ作成', '訪問した史跡の記録'].map((t) => (
            <li key={t}>
              <BrushIcon size={22} />
              {t}
            </li>
          ))}
        </ul>
        <Button size="large" fullWidth className={styles.modalCta} onClick={() => go('/sign-up')}>
          メンバーになる
        </Button>
        <button type="button" className={styles.modalLogin} onClick={() => go('/sign-in')}>
          メンバーの方はこちらからログイン
        </button>
      </div>
    </div>
  );
}
