import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import type { HistoricSite } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useSite, useVisits } from '../../hooks/useData';
import { ContentNotFoundError } from '../../services/content';
import { useMemberModal } from '../../hooks/useMemberModal';
import { GEO_ERROR_MESSAGES } from '../../hooks/useGeolocation';
import { useNearby } from '../../hooks/useNearby';
import { useSettings } from '../../hooks/useSettings';
import { useToast } from '../../hooks/useToast';
import { REGIONS } from '../../data/categories';
import { SITE_TYPE_LABEL, SITE_TYPE_LABEL_EN } from '../../data/labels';
import { formatDistance, googleMapsDirectionsUrl } from '../../lib/geo';
import { Button, ErrorRetry, LinkButton, PageSpinner, SmartImage, Tabs } from '../ui';
import { CloseIcon, LockIcon, PlayIcon } from '../ui/Icons';
import { AudioPlayer } from './AudioPlayer';
import { SpotOverview } from './SpotOverview';
import { chaptersFor, estimateMinutes } from './chapters';
import styles from './spot.module.css';

type TabKey = 'audioGuide' | 'overview';

export function SpotDetail({
  siteId,
  onClose,
  onToggleSnap,
  onOpenChapter,
}: {
  siteId: string;
  onClose: () => void;
  onToggleSnap: () => void;
  onOpenChapter: () => void;
}) {
  const { data: site, isLoading, isError, error, refetch } = useSite(siteId);
  if (error instanceof ContentNotFoundError) {
    return (
      <div className={styles.detail}>
        <div className={styles.detailHeader}>
          <h2 className="t-heading4">スポットが見つかりませんでした</h2>
          <button type="button" className={styles.closeButton} aria-label="閉じる" onClick={onClose}>
            <CloseIcon size={16} />
          </button>
        </div>
        <p className="t-body-sub c-medium">URL が間違っているか、掲載が終了した可能性があります。</p>
      </div>
    );
  }
  if (isError) return <ErrorRetry onRetry={() => void refetch()} />;
  if (isLoading || !site) return <PageSpinner />;
  return <SpotDetailBody key={site.id} site={site} onClose={onClose} onToggleSnap={onToggleSnap} onOpenChapter={onOpenChapter} />;
}

function SpotDetailBody({
  site,
  onClose,
  onToggleSnap,
  onOpenChapter,
}: {
  site: HistoricSite;
  onClose: () => void;
  onToggleSnap: () => void;
  onOpenChapter: () => void;
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const memberModal = useMemberModal();
  const { user, isMember, backend } = useAuth();
  const { kidsMode, guideLanguage } = useSettings();
  const visits = useVisits(user?.uid);
  const nearby = useNearby(site);
  const [tab, setTab] = useState<TabKey>('audioGuide');
  const [chapterIndex, setChapterIndex] = useState<number | undefined>(undefined);
  const [recording, setRecording] = useState(false);

  const chapters = useMemo(() => chaptersFor(site, { kidsMode, language: guideLanguage }), [site, kidsMode, guideLanguage]);
  const isVisited = Boolean(visits.data?.some((v) => v.siteId === site.id));
  const region = REGIONS.find((r) => r.id === site.region);
  const en = guideLanguage === 'en';

  const handleVisit = async () => {
    if (!user || !isMember || !backend) {
      memberModal.open();
      return;
    }
    if (!nearby.isNear) {
      nearby.geo.start();
      if (nearby.block === 'outOfRange') toast('スポットに近づいてください');
      else toast(GEO_ERROR_MESSAGES[nearby.geo.status] || '位置情報を取得しています。少し待ってからもう一度お試しください');
      return;
    }
    setRecording(true);
    try {
      const res = await backend.addVisit(user.uid, site.id);
      toast(res.alreadyVisited ? 'すでに訪問記録があります' : '訪問しました', 'success');
      await queryClient.invalidateQueries({ queryKey: ['visits', user.uid] });
    } catch {
      toast('訪問を記録できませんでした。時間をおいてもう一度お試しください', 'error');
    } finally {
      setRecording(false);
    }
  };

  const handlePostMoment = () => {
    if (isMember) navigate(`/post-moment?site=${site.id}`);
    else memberModal.open();
  };

  if (chapterIndex !== undefined && chapters[chapterIndex]) {
    return (
      <AudioPlayer
        site={site}
        chapters={chapters}
        index={chapterIndex}
        onIndexChange={setChapterIndex}
        onBack={() => setChapterIndex(undefined)}
      />
    );
  }

  return (
    <div className={styles.detail}>
      <div className={styles.detailHeader}>
        <div className={styles.titleBox} onClick={onToggleSnap} role="button" tabIndex={0}>
          <h2 className="t-heading2">{site.title}</h2>
          {en && <p className={styles.titleEn}>{site.titleEn}</p>}
        </div>
        <button type="button" className={styles.closeButton} aria-label="閉じる" onClick={onClose}>
          <CloseIcon size={16} />
        </button>
      </div>

      <div className={styles.scroll}>
        <div className={styles.locationAndCategory}>
          <div className={styles.locationInfo}>
            <span className={styles.locationText}>
              {site.prefecture}
              {site.city}
            </span>
            <span className={styles.bullet}>・</span>
            <span className={styles.locationSub}>{en ? SITE_TYPE_LABEL_EN[site.type] : SITE_TYPE_LABEL[site.type]}</span>
            {nearby.distance !== undefined && (
              <>
                <span className={styles.bullet}>・</span>
                <span className={styles.distance}>ここから{formatDistance(nearby.distance)}</span>
              </>
            )}
          </div>
          {region && (
            <button type="button" className={styles.categoryName} onClick={() => navigate(`/spot-list/area/${region.id}`)}>
              「{region.name}エリア」収録
            </button>
          )}
        </div>

        <div className={styles.actions}>
          <LinkButton grow href={googleMapsDirectionsUrl(site.lat, site.lng)} target="_blank" rel="noopener noreferrer">
            経路
          </LinkButton>
          <Button grow variant={isVisited ? 'done' : 'outlined'} disabled={isVisited} loading={recording} onClick={handleVisit}>
            {isVisited ? '訪問済み' : '訪問済みにする'}
          </Button>
          <Button grow variant="outlined" onClick={handlePostMoment}>
            探訪記を書く
          </Button>
        </div>

        <SmartImage src={site.photoURL} alt={site.title} className={styles.heroImage} />

        <div>
          <Tabs<TabKey>
            label="スポット情報"
            tabs={[
              { key: 'audioGuide', label: en ? 'Audio guide' : '音声ガイド' },
              { key: 'overview', label: en ? 'About' : '史跡情報' },
            ]}
            active={tab}
            onChange={setTab}
          />
          <div className={styles.tabPanel} role="tabpanel">
            {tab === 'audioGuide' ? (
              <div className={styles.chapters}>
                {chapters.length === 0 && <p className="t-body-sub c-medium">音声がありません</p>}
                {chapters.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    className={styles.chapter}
                    onClick={() => {
                      setChapterIndex(i);
                      onOpenChapter();
                    }}
                  >
                    <div className={styles.chapterThumb}>
                      <SmartImage src={site.thumbURL} style={{ width: '100%', height: '100%' }} />
                      <span className={styles.chapterNum}>{String(i + 1).padStart(2, '0')}</span>
                    </div>
                    <div className={styles.chapterBody}>
                      <div className={styles.chapterTitle}>{c.title}</div>
                      <div className={styles.chapterMeta}>
                        {c.localOnly && (
                          <span className={styles.localBadge}>
                            <LockIcon size={11} />
                            現地限定
                          </span>
                        )}
                        <span>約{estimateMinutes(c.text, c.lang)}分</span>
                      </div>
                    </div>
                    <span className={styles.playMini}>
                      <PlayIcon size={20} />
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <SpotOverview site={site} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
