import { Link } from 'react-router-dom';
import type { Moment, UserProfile } from '../../types';
import type { SiteSummary } from '../../services/content';
import { formatDate } from '../../lib/format';
import { Avatar, Badge, SmartImage } from '../ui';
import styles from './moment.module.css';

export function momentImage(m: Moment, site?: SiteSummary): string | undefined {
  return m.thumbnailURL || m.photoURLs[0] || site?.photoURL;
}

export function MomentCard({ moment, author, site }: { moment: Moment; author?: UserProfile; site?: SiteSummary }) {
  return (
    <Link to={`/show-moment/${moment.id}`} className={styles.card}>
      <SmartImage src={momentImage(moment, site)} className={styles.thumb} alt="探訪記サムネイル" />
      <h2 className={styles.cardTitle}>
        {moment.title}
        {moment.sample && (
          <span className={styles.sample}>
            <Badge>サンプル</Badge>
          </span>
        )}
      </h2>
      <div className={styles.author}>
        <Avatar src={author?.photoURL} size={24} />
        <span className={styles.authorName}>{author?.name || '名前未設定'}</span>
        <span className={styles.dot}>・</span>
        <span>{formatDate(moment.createdAt)}</span>
        {site && (
          <>
            <span className={styles.dot}>・</span>
            <span>{site.title}</span>
          </>
        )}
      </div>
    </Link>
  );
}
