import { Link } from 'react-router-dom';
import type { HistoricSite } from '../../types';
import { useMoments } from '../../hooks/useData';
import { useSettings } from '../../hooks/useSettings';
import { SITE_TYPE_LABEL } from '../../data/labels';
import { Badge, Chip, SmartImage } from '../ui';
import { CheckIcon } from '../ui/Icons';
import styles from './spot.module.css';

export function SpotOverview({ site }: { site: HistoricSite }) {
  const { kidsMode, guideLanguage } = useSettings();
  const moments = useMoments({ siteId: site.id });
  const en = guideLanguage === 'en';

  return (
    <div className={styles.overview}>
      <div>
        {site.special && (
          <div style={{ marginBottom: 8 }}>
            <Badge>特別史跡</Badge>
          </div>
        )}
        <p className={styles.summary}>{site.summary}</p>
      </div>
      <p className={styles.description}>{kidsMode ? site.kidsDescription : en ? site.descriptionEn : site.description}</p>

      {site.highlights.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>見どころ</h3>
          <ul className={styles.highlights}>
            {site.highlights.map((h) => (
              <li key={h}>
                <CheckIcon size={18} />
                {h}
              </li>
            ))}
          </ul>
        </section>
      )}

      {site.eras.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>時代</h3>
          <div className={styles.tags}>
            {site.eras.map((e) => (
              <Chip key={e}>{e}</Chip>
            ))}
          </div>
        </section>
      )}

      <section>
        <h3 className={styles.sectionTitle}>基本情報</h3>
        <dl className={styles.infoTable}>
          <dt>名称</dt>
          <dd>
            {site.title}
            {site.kana && <span className="c-light">（{site.kana}）</span>}
          </dd>
          <dt>英語名</dt>
          <dd>{site.titleEn}</dd>
          <dt>所在地</dt>
          <dd>
            {site.prefecture}
            {site.city}
          </dd>
          <dt>種別</dt>
          <dd>
            {SITE_TYPE_LABEL[site.type]}（{site.special ? '国指定特別史跡' : '国指定史跡'}）
          </dd>
        </dl>
      </section>

      {moments.data && moments.data.length > 0 && (
        <section>
          <h3 className={styles.sectionTitle}>この史跡の探訪記</h3>
          <div className={styles.relatedMoments}>
            {moments.data.slice(0, 10).map((m) => (
              <Link key={m.id} to={`/show-moment/${m.id}`} className={styles.relatedMoment}>
                <SmartImage src={m.thumbnailURL || m.photoURLs[0] || site.photoURL} className={styles.relatedMomentImg} />
                <p className={styles.relatedMomentTitle}>{m.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className={styles.credit}>
        {site.photoCredit && (
          <p>
            写真:{' '}
            {site.photoCredit.sourceUrl ? (
              <a href={site.photoCredit.sourceUrl} target="_blank" rel="noopener noreferrer">
                {site.photoCredit.author || 'Wikimedia Commons'}
              </a>
            ) : (
              site.photoCredit.author
            )}
            {' / '}
            {site.photoCredit.licenseUrl ? (
              <a href={site.photoCredit.licenseUrl} target="_blank" rel="noopener noreferrer">
                {site.photoCredit.license}
              </a>
            ) : (
              site.photoCredit.license
            )}
            {' / Wikimedia Commons'}
          </p>
        )}
        {site.wikidataId && (
          <p>
            位置情報・名称:{' '}
            <a href={`https://www.wikidata.org/wiki/${site.wikidataId}`} target="_blank" rel="noopener noreferrer">
              Wikidata ({site.wikidataId})
            </a>
          </p>
        )}
        <p>音声ガイドはブラウザの音声読み上げ機能で再生しています。</p>
      </section>
    </div>
  );
}
