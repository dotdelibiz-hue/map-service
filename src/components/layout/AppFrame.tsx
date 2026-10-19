import type { ReactNode } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { APP_NAME } from '../../config';
import { Logo } from './Logo';
import styles from './layout.module.css';

/** PC で開いたときはスマートフォン幅の枠に表示し、横に QR コードを出します */
export function AppFrame({ children }: { children: ReactNode }) {
  return (
    <div className={styles.frame}>
      <aside className={styles.frameAside} aria-hidden="true">
        <Logo size={36} />
        <p className={styles.asideLead}>
          {APP_NAME}はスマートフォンでのご利用がおすすめです。
          <br />
          QR コードを読み取って、史跡めぐりに出かけましょう。
        </p>
        <div className={styles.qr}>
          <QRCodeSVG
            value={typeof location !== 'undefined' ? location.origin + import.meta.env.BASE_URL : ''}
            size={132}
            fgColor="#1a1a1c"
          />
        </div>
      </aside>
      <div className={styles.frameApp}>{children}</div>
    </div>
  );
}

export function Page({ children, title, center }: { children: ReactNode; title?: string; center?: boolean }) {
  return (
    <main className={styles.page}>
      {title && <h1 className={`t-heading1 ${center ? styles.centerTitle : styles.pageTitle}`}>{title}</h1>}
      {children}
    </main>
  );
}
