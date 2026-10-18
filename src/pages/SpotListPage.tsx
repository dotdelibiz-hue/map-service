import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Page } from '../components/layout/AppFrame';
import { Badge, Chip, ErrorRetry, PageSpinner, SmartImage } from '../components/ui';
import { findCategory, findSubCategory, sitesInCategory } from '../data/categories';
import { SITE_TYPE_LABEL } from '../data/labels';
import { PREFECTURES } from '../config';
import { useVisibleSites } from '../hooks/useData';
import { useGeolocation } from '../hooks/useGeolocation';
import { distanceMeters, formatDistance } from '../lib/geo';
import styles from './pages.module.css';

type Sort = 'area' | 'distance';

export default function SpotListPage() {
  const { categoryId, subCategoryId } = useParams();
  const category = findCategory(categoryId);
  const sub = findSubCategory(category, subCategoryId);
  const { data: sites, isError, refetch, isLoading } = useVisibleSites();
  const geo = useGeolocation();
  const [sort, setSort] = useState<Sort>('area');

  const list = useMemo(() => {
    if (!sites || !category) return [];
    const items = sitesInCategory(sites, category, sub).map((s) => ({
      s,
      d: geo.position ? distanceMeters(geo.position, s) : undefined,
    }));
    if (sort === 'distance' && geo.position) items.sort((a, b) => (a.d ?? 0) - (b.d ?? 0));
    else items.sort((a, b) => PREFECTURES.indexOf(a.s.prefecture as never) - PREFECTURES.indexOf(b.s.prefecture as never));
    return items;
  }, [sites, category, sub, sort, geo.position]);

  if (!category || (category.subCategories && !sub)) {
    return (
      <Page>
        <p className={styles.empty}>カテゴリが見つかりませんでした</p>
      </Page>
    );
  }
  if (isError) {
    return (
      <Page>
        <ErrorRetry onRetry={() => void refetch()} />
      </Page>
    );
  }
  if (isLoading || !sites) return <PageSpinner />;

  const title = sub ? sub.name : category.name;
  const lead = sub ? sub.description : category.description;

  return (
    <Page>
      <div className={styles.listHeader}>
        <nav className={styles.breadcrumb} aria-label="パンくず">
          <Link to="/category">トップ</Link>
          <span>›</span>
          {sub ? (
            <>
              <Link to={`/sub-category/${category.id}`}>{category.name}</Link>
              <span>›</span>
              <span>{sub.name}</span>
            </>
          ) : (
            <span>{category.name}</span>
          )}
        </nav>
        <h1 className={`t-heading1 ${styles.listTitle}`}>{title}</h1>
        <p className={styles.listLead}>
          {lead}（{list.length}件）
        </p>
      </div>

      <div className={styles.sortRow}>
        <Chip active={sort === 'area'} onClick={() => setSort('area')}>
          エリア順
        </Chip>
        <Chip
          active={sort === 'distance'}
          onClick={() => {
            geo.start();
            setSort('distance');
          }}
        >
          近い順
        </Chip>
      </div>

      {list.length === 0 && <p className={styles.empty}>スポットがありません</p>}
      {list.map(({ s, d }) => (
        <Link key={s.id} to={`/historic-site/${category.id}/${sub?.id ?? 'none'}/${s.id}`} className={styles.siteItem}>
          <SmartImage src={s.photoURL} className={styles.siteImg} />
          <div className={styles.siteBody}>
            <div className={styles.siteMeta}>
              <span>
                {s.prefecture}
                {s.city}
              </span>
              <span>・</span>
              <span>{SITE_TYPE_LABEL[s.type]}</span>
              {d !== undefined && <span className="c-primary">・ここから{formatDistance(d)}</span>}
            </div>
            <div className="t-heading4">{s.title}</div>
            {s.special && (
              <div style={{ marginTop: 4 }}>
                <Badge>特別史跡</Badge>
              </div>
            )}
            <p className={`t-body-sub ${styles.siteSummary}`}>{s.summary}</p>
            <div className={styles.siteButton}>
              <span className="t-button-medium c-primary">マップで確認 ›</span>
            </div>
          </div>
        </Link>
      ))}
    </Page>
  );
}
