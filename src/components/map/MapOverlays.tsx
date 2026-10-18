import { useState } from 'react';
import { Spinner } from '../ui';
import { LayersIcon, NavigateIcon } from '../ui/Icons';
import { MAP_LAYERS, type LayerId } from './layers';
import styles from './map.module.css';

export interface FilterTag {
  id: string;
  label: string;
  checked: boolean;
}

export function FilterTags({ tags, onToggle }: { tags: FilterTag[]; onToggle: (id: string) => void }) {
  return (
    <div className={styles.filterGroup}>
      {tags.map((t) => (
        <label key={t.id} className={`${styles.filterTag} ${t.checked ? styles.filterTagActive : ''}`}>
          <input type="checkbox" className={styles.filterCheckbox} checked={t.checked} onChange={() => onToggle(t.id)} />
          {t.label}
        </label>
      ))}
    </div>
  );
}

export function MapControls({
  layer,
  onLayerChange,
  onLocate,
  locating,
}: {
  layer: LayerId;
  onLayerChange: (l: LayerId) => void;
  onLocate: () => void;
  locating: boolean;
}) {
  const [layerOpen, setLayerOpen] = useState(false);
  return (
    <div className={styles.mapControl}>
      <div className={styles.controlWrap}>
        <button
          type="button"
          className={styles.controlButton}
          aria-label="地図の種類を切り替え"
          aria-expanded={layerOpen}
          onClick={() => setLayerOpen((v) => !v)}
        >
          <LayersIcon size={26} />
        </button>
        {layerOpen && (
          <div className={styles.layerMenu} role="menu">
            {MAP_LAYERS.map((l) => (
              <button
                key={l.id}
                type="button"
                role="menuitemradio"
                aria-checked={layer === l.id}
                className={`${styles.layerItem} ${layer === l.id ? styles.layerItemActive : ''}`}
                onClick={() => {
                  onLayerChange(l.id);
                  setLayerOpen(false);
                }}
              >
                {l.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <button type="button" className={styles.controlButton} aria-label="現在地を表示" onClick={onLocate}>
        {locating ? <Spinner size={20} /> : <NavigateIcon size={26} />}
      </button>
    </div>
  );
}

export function StatusPill({ loading, error, onRetry }: { loading: boolean; error: boolean; onRetry: () => void }) {
  if (error) {
    return (
      <div className={styles.status} role="alert">
        <span className={`${styles.statusMessage} ${styles.statusError}`}>スポットを読み込めませんでした</span>
        <button type="button" className={styles.retry} onClick={onRetry}>
          再試行
        </button>
      </div>
    );
  }
  if (loading) {
    return (
      <div className={styles.status} role="status">
        <Spinner size={14} />
        <span className={styles.statusMessage}>スポットを読み込んでいます</span>
      </div>
    );
  }
  return null;
}
