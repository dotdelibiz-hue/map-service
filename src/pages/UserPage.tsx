import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MomentCard } from '../components/moment/MomentCard';
import { Avatar, Badge, Button, ErrorRetry, PageSpinner, SmartImage, Tabs } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useMoments, useProfile, useSiteMap, useVisits } from '../hooks/useData';
import { formatDateJa } from '../lib/format';
import styles from './user.module.css';

type TabKey = 'moments' | 'visits';

export default function UserPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const profile = useProfile(userId);
  const moments = useMoments({ userId });
  const visits = useVisits(userId);
  const siteMap = useSiteMap();
  const [tab, setTab] = useState<TabKey>('moments');
  const isMe = user?.uid === userId;

  if (profile.isError) return <ErrorRetry onRetry={() => void profile.refetch()} />;
  if (profile.isLoading) return <PageSpinner />;
  if (!profile.data) {
    return (
      <main style={{ padding: '48px 16px', textAlign: 'center' }}>
        <p className="t-subtitle-bold">ユーザーが見つかりませんでした</p>
      </main>
    );
  }
  const p = profile.data;
  const visitList = visits.data ?? [];
  const prefectures = new Set(visitList.map((v) => siteMap.get(v.siteId)?.prefecture).filter(Boolean));

  return (
    <main style={{ padding: '0 16px' }}>
      <div className={styles.profile}>
        <Avatar src={p.photoURL} size={80} alt="ユーザープロフィール画像" />
        <div>
          <div className="t-heading4">
            {p.name || '名前未設定'} {p.sample && <Badge>サンプル</Badge>}
          </div>
          {p.userName && <div className={styles.userName}>@{p.userName}</div>}
          {p.bio && <div className={styles.bio}>{p.bio}</div>}
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statNum}>{visitList.length}</div>
          <div className={styles.statLabel}>訪問した史跡</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>
            {prefectures.size}
            <span style={{ fontSize: 14, color: 'var(--text-light)' }}>/47</span>
          </div>
          <div className={styles.statLabel}>都道府県</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statNum}>{moments.data?.length ?? 0}</div>
          <div className={styles.statLabel}>探訪記</div>
        </div>
      </div>

      {isMe && (
        <div className={styles.edit}>
          <Button variant="sky" fullWidth onClick={() => navigate(`/user/${userId}/edit`)}>
            プロフィールを編集する
          </Button>
        </div>
      )}

      <Tabs<TabKey>
        label="ユーザータブ"
        tabs={[
          { key: 'moments', label: '探訪記', count: moments.data?.length ?? 0 },
          { key: 'visits', label: '訪問履歴', count: visitList.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      <div className={styles.panel} role="tabpanel">
        {tab === 'moments' ? (
          moments.isError ? (
            <ErrorRetry onRetry={() => void moments.refetch()} />
          ) : !moments.data ? (
            <PageSpinner />
          ) : moments.data.length === 0 ? (
            <div className={styles.empty}>
              <p className={styles.emptyTitle}>探訪記なし</p>
              {isMe && (
                <>
                  <p className={styles.emptyText}>あなたの歴史旅の記録を綴ってみましょう。</p>
                  <div className={styles.emptyActions}>
                    <Button size="large" onClick={() => navigate('/post-moment')}>
                      探訪記を書きはじめる
                    </Button>
                    <Button variant="outlined" size="large" onClick={() => navigate('/moment-list')}>
                      みんなの探訪記を読んでみる
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            moments.data.map((m) => <MomentCard key={m.id} moment={m} author={p} site={m.siteId ? siteMap.get(m.siteId) : undefined} />)
          )
        ) : visitList.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>訪問記録なし</p>
            <p className={styles.emptyText}>
              {'まだ訪問記録がありません。\nスポットに近づき、マップ画面上の訪問スタンプを\n押すと記録されます。'}
            </p>
            {isMe && (
              <div className={styles.howTo}>
                <h3>訪問記録のつけ方</h3>
                <ol>
                  <li>地図で史跡を選びます</li>
                  <li>史跡の近く（現地）で「訪問済みにする」を押します</li>
                  <li>マイページの訪問履歴に記録されます</li>
                </ol>
              </div>
            )}
          </div>
        ) : (
          visitList.map((v) => {
            const site = siteMap.get(v.siteId);
            return (
              <Link key={v.siteId} to={`/historic-site/${v.siteId}`} className={styles.visit}>
                <SmartImage src={site?.thumbURL} className={styles.visitThumb} alt="訪れたスポットの画像" />
                <div>
                  <div className={styles.visitTitle}>{site?.title ?? v.siteId}</div>
                  <div className={styles.visitDate}>
                    {site ? `${site.prefecture}${site.city}・` : ''}
                    {formatDateJa(v.visitedAt)} に訪問
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
