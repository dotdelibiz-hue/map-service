import { Link, useParams } from 'react-router-dom';
import { Page } from '../components/layout/AppFrame';
import { ErrorRetry, PageSpinner, SmartImage } from '../components/ui';
import { coverPhoto, findCategory } from '../data/categories';
import { useVisibleSites } from '../hooks/useData';
import styles from './pages.module.css';

export default function SubCategoryPage() {
  const { id } = useParams();
  const category = findCategory(id);
  const { data: sites, isError, refetch, isLoading } = useVisibleSites();

  if (!category || !category.subCategories) {
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

  return (
    <Page>
      <div className={styles.listHeader}>
        <nav className={styles.breadcrumb} aria-label="パンくず">
          <Link to="/category">トップ</Link>
          <span>›</span>
          <span>{category.name}</span>
        </nav>
        <h1 className={`t-heading1 ${styles.listTitle}`}>{category.name}</h1>
        <p className={styles.listLead}>{category.description}</p>
      </div>
      <div className={styles.categoryList}>
        {category.subCategories.map((sub) => {
          const inSub = sites.filter(sub.filter);
          if (inSub.length === 0) return null;
          return (
            <Link key={sub.id} to={`/spot-list/${category.id}/${sub.id}`} className={styles.categoryItem}>
              <SmartImage src={coverPhoto(sites, sub.coverSiteId, inSub)} className={styles.categoryImg} />
              <div className={styles.categoryOverlay}>
                <div className={styles.categoryName}>{sub.name}</div>
                <div className={styles.categoryDesc}>{sub.description}</div>
              </div>
              <span className={styles.categoryCount}>{inSub.length}件</span>
            </Link>
          );
        })}
      </div>
    </Page>
  );
}
