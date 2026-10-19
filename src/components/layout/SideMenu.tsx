import { useEffect, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CONTACT_URL, HELP_URL } from '../../config';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../hooks/useToast';
import { Avatar, Button, Switch } from '../ui';
import {
  BookIcon,
  CloseIcon,
  DocumentIcon,
  ExternalIcon,
  HelpIcon,
  HomeIcon,
  KidsIcon,
  MailIcon,
  MapIcon,
  SettingsIcon,
  ShieldIcon,
} from '../ui/Icons';
import styles from './layout.module.css';

interface Item {
  label: string;
  icon: ReactNode;
  to: string;
  external?: boolean;
}

const MAIN: Item[] = [
  { label: 'トップページ', icon: <HomeIcon size={26} />, to: '/category' },
  { label: '地図', icon: <MapIcon size={26} />, to: '/' },
  { label: 'みんなの探訪記', icon: <BookIcon size={26} />, to: '/moment-list' },
  { label: '設定', icon: <SettingsIcon size={26} />, to: '/settings' },
];

const SUB: Item[] = [
  ...(HELP_URL ? [{ label: 'ヘルプセンター', icon: <HelpIcon size={26} />, to: HELP_URL, external: true }] : []),
  { label: 'お問い合わせ', icon: <MailIcon size={26} />, to: CONTACT_URL, external: true },
  { label: 'プライバシーポリシー', icon: <ShieldIcon size={26} />, to: '/privacy-policy' },
  { label: 'ユーザーの利用規約', icon: <DocumentIcon size={26} />, to: '/terms-of-service' },
];

export function SideMenu({ onClose }: { onClose: () => void }) {
  const { user, profile, backend } = useAuth();
  const { kidsMode, setKidsMode } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  const logout = async () => {
    await backend?.signOut();
    queryClient.removeQueries({ queryKey: ['visits'] });
    onClose();
    toast('ログアウトしました');
    navigate('/');
  };

  const renderItem = (item: Item) => {
    const active = !item.external && location.pathname === item.to;
    const content = (
      <>
        {item.icon}
        <span>{item.label}</span>
        {item.external && item.to.startsWith('http') && <ExternalIcon size={20} />}
      </>
    );
    return (
      <li key={item.label}>
        {item.external ? (
          <a className={styles.menuItem} href={item.to} target="_blank" rel="noopener noreferrer" onClick={onClose}>
            {content}
          </a>
        ) : (
          <Link className={`${styles.menuItem} ${active ? styles.menuItemActive : ''}`} to={item.to} onClick={onClose}>
            {content}
          </Link>
        )}
      </li>
    );
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <nav className={styles.drawer} aria-label="メニュー">
        <div className={styles.drawerHeader}>
          <button type="button" className={styles.headerButton} aria-label="メニューを閉じる" onClick={onClose}>
            <CloseIcon size={30} color="#555" />
          </button>
        </div>
        <div className={styles.drawerBody}>
          {user ? (
            <Link to={`/user/${user.uid}`} className={styles.me} onClick={onClose}>
              <Avatar src={profile?.photoURL} size={52} />
              <div>
                <div className={styles.meName}>{profile?.name || '名前未設定'}</div>
                <div className={styles.meLink}>マイページを表示 &gt;</div>
              </div>
            </Link>
          ) : (
            <>
              <div className={styles.authButtons}>
                <Button size="large" onClick={() => go('/sign-up')}>
                  新規登録
                </Button>
                <Button size="large" variant="outlined" onClick={() => go('/sign-in')}>
                  ログイン
                </Button>
              </div>
              <p className={styles.authLead}>ログインすると、史跡の口コミ投稿や、マイページから訪問履歴を閲覧することができます。</p>
            </>
          )}
          <ul className={styles.menuList}>{MAIN.map(renderItem)}</ul>
          <div className={styles.divider} />
          <ul className={styles.menuList} style={{ marginTop: 0 }}>
            {SUB.map(renderItem)}
            {user && (
              <li>
                <button type="button" className={styles.menuItem} onClick={logout}>
                  <CloseIcon size={26} />
                  <span>ログアウト</span>
                </button>
              </li>
            )}
          </ul>
        </div>
        <div className={styles.drawerFooter}>
          <KidsIcon size={30} />
          <span>こども向けガイド</span>
          <Switch
            checked={kidsMode}
            label="こども向けガイド"
            onChange={(v) => {
              setKidsMode(v);
              toast(v ? 'こども向けガイドモードになりました' : 'こども向けガイドモードを終了しました');
            }}
          />
        </div>
      </nav>
    </>
  );
}
