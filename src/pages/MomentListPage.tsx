import { useNavigate } from 'react-router-dom';
import { MomentCard } from '../components/moment/MomentCard';
import { ErrorRetry, PageSpinner } from '../components/ui';
import { EditIcon } from '../components/ui/Icons';
import { useAuth } from '../hooks/useAuth';
import { useMoments, useProfiles, useSiteMap } from '../hooks/useData';
import { useMemberModal } from '../hooks/useMemberModal';
import styles from '../components/moment/moment.module.css';

export default function MomentListPage() {
  const navigate = useNavigate();
  const { isMember } = useAuth();
  const memberModal = useMemberModal();
  const moments = useMoments();
  const profiles = useProfiles((moments.data ?? []).map((m) => m.userId));
  const siteMap = useSiteMap();

  return (
    <main className={styles.list} style={{ padding: '0 16px' }}>
      <h1 className={`t-heading1 ${styles.title}`}>みんなの探訪記一覧</h1>
      {moments.isError ? (
        <ErrorRetry onRetry={() => void moments.refetch()} />
      ) : moments.isLoading || !moments.data ? (
        <PageSpinner />
      ) : moments.data.length === 0 ? (
        <div className={styles.empty}>
          <p className={styles.emptyTitle}>探訪記がありません</p>
          <p className={styles.emptyText}>史跡を訪れたら、最初の探訪記を書いてみましょう。</p>
        </div>
      ) : (
        moments.data.map((m) => (
          <MomentCard key={m.id} moment={m} author={profiles.data?.get(m.userId)} site={m.siteId ? siteMap.get(m.siteId) : undefined} />
        ))
      )}
      <button type="button" className={styles.fab} onClick={() => (isMember ? navigate('/post-moment') : memberModal.open())}>
        探訪記を書く
        <EditIcon size={24} />
      </button>
    </main>
  );
}
