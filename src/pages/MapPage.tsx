import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { JAPAN_CENTER, JAPAN_ZOOM, NEARBY_ZOOM, SPOT_ZOOM } from '../config';
import { useAuth } from '../hooks/useAuth';
import { useVisibleSites, useVisits } from '../hooks/useData';
import { GEO_ERROR_MESSAGES, useGeolocation } from '../hooks/useGeolocation';
import { useToast } from '../hooks/useToast';
import type { SiteSummary } from '../services/content';
import { SpotMap, type SpotMapHandle } from '../components/map/SpotMap';
import { FilterTags, MapControls, StatusPill, type FilterTag } from '../components/map/MapOverlays';
import type { LayerId } from '../components/map/layers';
import { BottomSheet, type SheetSnap } from '../components/spot/BottomSheet';
import { SpotDetail } from '../components/spot/SpotDetail';
import styles from '../components/map/map.module.css';

const LAYER_KEY = 'rekitabi.mapLayer';

/** /historic-site/:id, /historic-site/:sub/:id, /historic-site/:cat/:sub/:id のどれでも最後の部分がスポット ID */
function selectedIdFrom(pathname: string): string | undefined {
  const m = pathname.match(/^\/historic-site\/(?:[^/]+\/){0,2}([^/]+)\/?$/);
  return m ? decodeURIComponent(m[1]) : undefined;
}

function loadLayer(): LayerId {
  try {
    const v = localStorage.getItem(LAYER_KEY);
    if (v === 'pale' || v === 'std' || v === 'photo') return v;
  } catch {
    // 保存できない環境では初期値
  }
  return 'pale';
}

function sheetOffset() {
  // シート（画面下 52%）に隠れない位置にスポットが来るようにずらす量
  return Math.round(window.innerHeight * 0.26);
}

export function MapPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const selectedId = selectedIdFrom(location.pathname);
  const sitesQuery = useVisibleSites();
  const geo = useGeolocation();
  const { user } = useAuth();
  const visits = useVisits(user?.uid);
  const mapRef = useRef<SpotMapHandle>(null);
  const [layer, setLayer] = useState<LayerId>(loadLayer);
  const [snap, setSnap] = useState<SheetSnap>('half');
  const [filters, setFilters] = useState<FilterTag[]>([
    { id: 'special', label: '特別史跡', checked: false },
    { id: 'localOnly', label: '現地限定ガイド', checked: false },
  ]);
  const interacted = useRef(false);
  const focusedId = useRef<string | undefined>(undefined);
  const pendingLocate = useRef(false);

  const sites = useMemo(() => {
    const all = sitesQuery.data ?? [];
    const special = filters.find((f) => f.id === 'special')?.checked;
    const localOnly = filters.find((f) => f.id === 'localOnly')?.checked;
    return all.filter((s) => ((!special || s.special) && (!localOnly || s.hasLocalOnly)) || s.id === selectedId);
  }, [sitesQuery.data, filters, selectedId]);

  const visitedIds = useMemo(() => new Set((visits.data ?? []).map((v) => v.siteId)), [visits.data]);

  // 位置情報の取得を開始（すでに許可されていればダイアログは出ません）
  const startGeo = geo.start;
  useEffect(() => {
    startGeo();
  }, [startGeo]);

  // URL で指定されたスポットへ移動
  useEffect(() => {
    if (!selectedId || focusedId.current === selectedId || !sitesQuery.data) return;
    const site = sitesQuery.data.find((s) => s.id === selectedId);
    if (!site) return;
    focusedId.current = selectedId;
    interacted.current = true;
    setSnap('half');
    mapRef.current?.flyTo(site.lat, site.lng, Math.max(SPOT_ZOOM - 1, mapRef.current.getZoom()), sheetOffset());
  }, [selectedId, sitesQuery.data]);

  useEffect(() => {
    if (!selectedId) focusedId.current = undefined;
  }, [selectedId]);

  // 現在地が取れたら、まだ操作していなければ現在地の周辺を表示
  useEffect(() => {
    if (!geo.position) return;
    if (pendingLocate.current) {
      pendingLocate.current = false;
      mapRef.current?.flyTo(geo.position.lat, geo.position.lng, Math.max(14, mapRef.current.getZoom()));
      return;
    }
    if (!interacted.current && !selectedId) {
      interacted.current = true;
      mapRef.current?.flyTo(geo.position.lat, geo.position.lng, NEARBY_ZOOM);
    }
  }, [geo.position, selectedId]);

  useEffect(() => {
    if (pendingLocate.current && (geo.status === 'denied' || geo.status === 'unsupported' || geo.status === 'unavailable')) {
      pendingLocate.current = false;
      toast(GEO_ERROR_MESSAGES[geo.status], 'error');
    }
  }, [geo.status, toast]);

  const handleSelect = useCallback(
    (site: SiteSummary) => {
      interacted.current = true;
      navigate(`/historic-site/${site.id}`);
    },
    [navigate],
  );

  const handleLocate = () => {
    if (geo.position) {
      mapRef.current?.flyTo(geo.position.lat, geo.position.lng, Math.max(14, mapRef.current.getZoom()));
      return;
    }
    if (geo.status === 'denied' || geo.status === 'unsupported') {
      toast(GEO_ERROR_MESSAGES[geo.status], 'error');
      return;
    }
    pendingLocate.current = true;
    geo.start();
  };

  const changeLayer = (l: LayerId) => {
    setLayer(l);
    try {
      localStorage.setItem(LAYER_KEY, l);
    } catch {
      // 保存できなくても表示は切り替わる
    }
  };

  return (
    <div className={styles.mapWrap}>
      <SpotMap
        ref={mapRef}
        sites={sites}
        selectedId={selectedId}
        visitedIds={visitedIds}
        userPosition={geo.position}
        layer={layer}
        initialCenter={JAPAN_CENTER}
        initialZoom={JAPAN_ZOOM}
        onSelect={handleSelect}
        onUserInteract={() => (interacted.current = true)}
      />
      <FilterTags tags={filters} onToggle={(id) => setFilters((fs) => fs.map((f) => (f.id === id ? { ...f, checked: !f.checked } : f)))} />
      <MapControls
        layer={layer}
        onLayerChange={changeLayer}
        onLocate={handleLocate}
        locating={pendingLocate.current && geo.status === 'locating'}
      />
      {!selectedId && <StatusPill loading={sitesQuery.isLoading} error={sitesQuery.isError} onRetry={() => void sitesQuery.refetch()} />}
      {selectedId && (
        <BottomSheet snap={snap} onSnapChange={setSnap} label="スポット詳細">
          <SpotDetail
            siteId={selectedId}
            onClose={() => navigate('/')}
            onToggleSnap={() => setSnap((s) => (s === 'half' ? 'full' : 'half'))}
            onOpenChapter={() => setSnap('full')}
          />
        </BottomSheet>
      )}
    </div>
  );
}
