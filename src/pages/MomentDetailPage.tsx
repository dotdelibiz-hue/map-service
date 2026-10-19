import { useState, type UIEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { momentImage } from '../components/moment/MomentCard';
import { Avatar, Badge, Button, Chip, ErrorRetry, PageSpinner, SmartImage } from '../components/ui';
import { DeleteIcon, LinkIcon } from '../components/ui/Icons';
import { useAuth } from '../hooks/useAuth';
import { useMoment, useProfile, useSiteMap } from '../hooks/useData';
import { useToast } from '../hooks/useToast';
import { formatDateJa } from '../lib/format';
import styles from '../components/moment/moment.module.css';

export default function MomentDetailPage() {
  const { momentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user, backend } = useAuth();
  const moment = useMoment(momentId);
  const author = useProfile(moment.data?.userId);
  const siteMap = useSiteMap();
  const [photoIndex, setPhotoIndex] = useState(0);
  const [deleting, setDeleting] = useState(false);

  if (moment.isError) return <ErrorRetry title="探訪記を表示できませんでした" onRetry={() => void moment.refetch()} />;
  if (moment.isLoading) return <PageSpinner />;
  const m = moment.data;
  if (!m) {
    return (
      <main style={{ padding: '48px 16px', textAlign: 'center' }}>
        <p className="t-subtitle-bold">探訪記が見つかりませんでした</p>
        <div style={{ marginTop: 20 }}>
          <Button variant="outlined" onClick={() => navigate('/moment-list')}>
            みんなの探訪記一覧へ
          </Button>
        </div>
      </main>
    );
  }

  const site = m.siteId ? siteMap.get(m.siteId) : undefined;
  const photos = [m.thumbnailURL, ...m.photoURLs].filter((p): p is string => Boolean(p));
  const gallery = photos.length > 0 ? photos : [momentImage(m, site)].filter((p): p is string => Boolean(p));

  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setPhotoIndex(Math.round(el.scrollLeft / el.clientWidth));
  };

  const share = async () => {
    const url = location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: m.title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast('リンクがコピーされました', 'success');
    } catch {
      // 共有をキャンセルした場合など
    }
  };

  const remove = async () => {
    if (!user || !backend || !confirm('この探訪記を削除しますか？')) return;
    setDeleting(true);
    try {
      await backend.deleteMoment(user.uid, m.id);
      await queryClient.invalidateQueries({ queryKey: ['moments'] });
      toast('削除しました');
      navigate('/moment-list', { replace: true });
    } catch {
      toast('削除できませんでした。時間をおいてもう一度お試しください', 'error');
      setDeleting(false);
    }
  };

  return (
    <main style={{ padding: '0 16px' }}>
      {gallery.length > 0 && (
        <div className={styles.gallery}>
          <div className={styles.slides} onScroll={onScroll}>
            {gallery.map((src, i) => (
              <SmartImage key={i} src={src} className={styles.slide} alt={`写真 ${i + 1}`} />
            ))}
          </div>
          {gallery.length > 1 && (
            <span className={styles.photoIndex}>
              写真: {photoIndex + 1}/{gallery.length}
            </span>
          )}
        </div>
      )}
      <article className={styles.detailBody}>
        {m.sample && <Badge>サンプル投稿</Badge>}
        <h1 className={styles.detailTitle}>{m.title}</h1>
        <Link to={`/user/${m.userId}`} className={styles.detailAuthor}>
          <Avatar src={author.data?.photoURL} size={36} />
          <div>
            <div className="t-subtitle-bold" style={{ fontSize: 14 }}>
              {author.data?.name || '名前未設定'}
            </div>
            <div className="t-caption c-medium">{formatDateJa(m.createdAt)}</div>
          </div>
        </Link>

        <p className={styles.text}>{m.text}</p>

        {site && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>訪れた史跡</h2>
            <Link to={`/historic-site/${site.id}`} className={styles.siteCard}>
              <SmartImage src={site.thumbURL} className={styles.siteThumb} alt="訪れたスポットの画像" />
              <div>
                <div className={styles.siteName}>{site.title}</div>
                <div className={styles.siteSub}>
                  {site.prefecture}
                  {site.city}
                </div>
              </div>
              <span className={styles.siteLink}>マップで確認</span>
            </Link>
          </section>
        )}

        {m.eraTags.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>関連タグ</h2>
            <div className={styles.tags}>
              {m.eraTags.map((t) => (
                <Chip key={t}>#{t}</Chip>
              ))}
            </div>
          </section>
        )}

        <div className={styles.detailActions}>
          <Button variant="outlined" onClick={share}>
            <LinkIcon size={20} />
            リンクを共有
          </Button>
          {user?.uid === m.userId && (
            <Button variant="text" loading={deleting} onClick={remove} style={{ color: 'var(--color-red)' }}>
              <DeleteIcon size={18} />
              削除
            </Button>
          )}
        </div>
      </article>
    </main>
  );
}
