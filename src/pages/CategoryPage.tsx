import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '../components/layout/AppFrame';
import { ErrorRetry, SmartImage } from '../components/ui';
import { SearchIcon } from '../components/ui/Icons';
import { CATEGORIES, coverPhoto, sitesInCategory } from '../data/categories';
import { useVisibleSites } from '../hooks/useData';
import { useGeolocation } from '../hooks/useGeolocation';
import { distanceMeters, formatDistance } from '../lib/geo';
import styles from './pages.module.css';

function normalize(s: string) {
  return s.toLowerCase().normalize('NFKC');
}

export default function CategoryPage() {
  const { data: sites, isError, refetch, isLoading } = useVisibleSites();
  const geo = useGeolocation();
  const [q, setQ] = useState('');

  const nearby = useMemo(() => {
    if (!sites || !geo.position) return [];
    return sites
      .map((s) => ({ s, d: distanceMeters(geo.position!, s) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 8);
  }, [sites, geo.position]);

  const results = useMemo(() => {
    const query = normalize(q.trim());
    if (!query || !sites) return [];
    return sites
      .filter((s) => [s.title, s.titleEn, s.kana, s.prefecture, s.city, ...s.eras].some((t) => normalize(t).includes(query)))
      .slice(0, 30);
  }, [q, sites]);

  if (isError) {
    return (
      <Page>
        <ErrorRetry onRetry={() => void refetch()} />
      </Page>
    );
  }

  return (
    <Page>
      <div className={styles.head}>
        <div className={styles.verticalBar} />
        <h1 className="t-heading2">
          <span className={styles.bigChar}>聞</span>いて知る
        </h1>
      </div>

      <div className={styles.search}>
        <SearchIcon size={22} />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="史跡名・都道府県・時代で探す"
          aria-label="史跡を検索"
        />
      </div>

      {q.trim() ? (
        <ul className={styles.searchResults}>
          {results.length === 0 && <li className={styles.empty}>見つかりませんでした</li>}
          {results.map((s) => (
            <li key={s.id}>
              <Link to={`/historic-site/${s.id}`}>
                <SmartImage src={s.thumbURL} className={styles.searchThumb} />
                <div>
                  <div className={styles.searchTitle}>{s.title}</div>
                  <div className={styles.searchSub}>
                    {s.prefecture}
                    {s.city}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <>
          {nearby.length > 0 && (
            <>
              <div className={styles.sectionHead}>
                <h2>近くの史跡</h2>
                <Link to="/">地図で見る</Link>
              </div>
              <div className={styles.carousel}>
                {nearby.map(({ s, d }) => (
                  <Link key={s.id} to={`/historic-site/${s.id}`} className={styles.carouselItem}>
                    <SmartImage src={s.thumbURL} className={styles.carouselImg} />
                    <div className={styles.carouselTitle}>{s.title}</div>
                    <div className={styles.carouselSub}>ここから{formatDistance(d)}</div>
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className={styles.sectionHead}>
            <h2>テーマから探す</h2>
          </div>
          <div className={styles.categoryList}>
            {isLoading &&
              Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton" style={{ height: 150, borderRadius: 10 }} />)}
            {sites &&
              CATEGORIES.map((c) => {
                const inCat = c.subCategories ? sites : sitesInCategory(sites, c);
                if (!c.subCategories && inCat.length === 0) return null;
                const to = c.subCategories ? `/sub-category/${c.id}` : `/spot-list/${c.id}/none`;
                return (
                  <Link key={c.id} to={to} className={styles.categoryItem}>
                    <SmartImage src={coverPhoto(sites, c.coverSiteId, inCat)} className={styles.categoryImg} />
                    <div className={styles.categoryOverlay}>
                      <div className={styles.categoryName}>{c.name}</div>
                      <div className={styles.categoryDesc}>{c.description}</div>
                    </div>
                    {!c.subCategories && <span className={styles.categoryCount}>{inCat.length}件</span>}
                  </Link>
                );
              })}
          </div>
        </>
      )}
    </Page>
  );
}
