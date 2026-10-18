import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMemberModal } from '../../hooks/useMemberModal';
import { Avatar } from '../ui';
import { MenuIcon } from '../ui/Icons';
import { Logo } from './Logo';
import { SideMenu } from './SideMenu';
import styles from './layout.module.css';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, profile } = useAuth();
  const memberModal = useMemberModal();
  const navigate = useNavigate();

  return (
    <>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.headerButton}
          aria-label={user ? 'マイページ' : 'メンバー登録・ログイン'}
          onClick={() => (user ? navigate(`/user/${user.uid}`) : memberModal.open())}
        >
          <Avatar src={profile?.photoURL} size={40} />
        </button>
        <Link to="/" className={styles.logo} aria-label="地図へ">
          <Logo />
        </Link>
        <button type="button" className={styles.headerButton} aria-label="メニューを開く" onClick={() => setMenuOpen(true)}>
          <MenuIcon size={34} />
        </button>
      </header>
      {menuOpen && <SideMenu onClose={() => setMenuOpen(false)} />}
    </>
  );
}
