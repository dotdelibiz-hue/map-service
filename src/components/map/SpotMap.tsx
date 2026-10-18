import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import L from 'leaflet';
import Supercluster from 'supercluster';
import 'leaflet/dist/leaflet.css';
import './markers.css';
import type { SiteSummary } from '../../services/content';
import type { GeoPosition } from '../../hooks/useGeolocation';
import { MAP_LAYERS, type LayerId } from './layers';
import { markerSize, spotMarkerHtml } from './markerHtml';

export interface SpotMapHandle {
  /** 指定位置へ移動。offsetY を指定すると、その分だけ画面の上側に寄せて表示します */
  flyTo(lat: number, lng: number, zoom?: number, offsetY?: number): void;
  getZoom(): number;
}

interface Props {
  sites: SiteSummary[];
  selectedId?: string;
  visitedIds?: Set<string>;
  userPosition: GeoPosition | null;
  layer: LayerId;
  initialCenter: [number, number];
  initialZoom: number;
  onSelect: (site: SiteSummary) => void;
  onUserInteract?: () => void;
}

type PointProps = { site: SiteSummary };

// 日本周辺から大きく外れないようにする
const JAPAN_BOUNDS = L.latLngBounds([18, 118], [50, 158]);

export const SpotMap = forwardRef<SpotMapHandle, Props>(function SpotMap(
  { sites, selectedId, visitedIds, userPosition, layer, initialCenter, initialZoom, onSelect, onUserInteract },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const renderRef = useRef<() => void>(() => undefined);
  const onSelectRef = useRef(onSelect);
  const onInteractRef = useRef(onUserInteract);
  onSelectRef.current = onSelect;
  onInteractRef.current = onUserInteract;

  const index = useMemo(() => {
    const sc = new Supercluster<PointProps>({ radius: 110, maxZoom: 14, minPoints: 2 });
    sc.load(
      sites.map((site) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [site.lng, site.lat] },
        properties: { site },
      })),
    );
    return sc;
  }, [sites]);

  // 地図の初期化（1 回だけ）
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: false,
      minZoom: 5,
      maxZoom: 18,
      maxBounds: JAPAN_BOUNDS,
      maxBoundsViscosity: 0.8,
      zoomSnap: 0.5,
    }).setView(initialCenter, initialZoom);
    map.attributionControl.setPrefix(false);
    markersRef.current = L.layerGroup().addTo(map);
    map.on('moveend zoomend', () => renderRef.current());
    map.on('dragstart zoomstart', (e) => {
      // プログラムによる移動は除外したいので、ユーザー操作の印（originalEvent）があるものだけ通知
      if ((e as L.LeafletEvent & { originalEvent?: Event }).originalEvent || e.type === 'dragstart') onInteractRef.current?.();
    });
    mapRef.current = map;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // initialCenter / initialZoom は初回のみ使う
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // タイル（地図の種類）
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const def = MAP_LAYERS.find((l) => l.id === layer) ?? MAP_LAYERS[0];
    tileRef.current?.remove();
    tileRef.current = L.tileLayer(def.url, {
      attribution: def.attribution,
      maxNativeZoom: def.maxNativeZoom,
      maxZoom: 18,
      crossOrigin: false,
    }).addTo(map);
  }, [layer]);

  // マーカー描画（クラスタリング）
  useEffect(() => {
    renderRef.current = () => {
      const map = mapRef.current;
      const group = markersRef.current;
      if (!map || !group) return;
      const b = map.getBounds().pad(0.3);
      const zoom = map.getZoom();
      const clusters = index.getClusters([b.getWest(), b.getSouth(), b.getEast(), b.getNorth()], Math.floor(zoom));
      const size = markerSize(zoom);
      const showTitle = zoom >= 7;
      group.clearLayers();
      for (const c of clusters) {
        const [lng, lat] = c.geometry.coordinates;
        const props = c.properties as Supercluster.ClusterProperties & Partial<PointProps>;
        if (props.cluster) {
          const leaves = index.getLeaves(props.cluster_id, 1, 0);
          const first = (leaves[0]?.properties as PointProps).site;
          const html = spotMarkerHtml({
            photoURL: first.thumbURL,
            title: `${first.title} 他${props.point_count - 1}件`,
            size,
            count: props.point_count,
            showTitle,
          });
          const m = L.marker([lat, lng], {
            icon: L.divIcon({ className: 'spot-marker', html, iconSize: [0, 0], iconAnchor: [0, 0] }),
            keyboard: true,
            title: `${first.title} 他${props.point_count - 1}件`,
          });
          m.on('click', () => {
            const z = Math.min(index.getClusterExpansionZoom(props.cluster_id), 16);
            map.flyTo([lat, lng], Math.max(z, zoom + 1), { duration: 0.6 });
          });
          group.addLayer(m);
        } else if (props.site) {
          const site = props.site;
          const selected = site.id === selectedId;
          const html = spotMarkerHtml({
            photoURL: site.thumbURL,
            title: site.title,
            size: selected ? Math.round(size * 1.15) : size,
            selected,
            visited: visitedIds?.has(site.id),
            showTitle: showTitle || selected,
          });
          const m = L.marker([lat, lng], {
            icon: L.divIcon({ className: 'spot-marker', html, iconSize: [0, 0], iconAnchor: [0, 0] }),
            zIndexOffset: selected ? 1000 : 0,
            keyboard: true,
            title: site.title,
          });
          m.on('click', () => onSelectRef.current(site));
          group.addLayer(m);
        }
      }
    };
    renderRef.current();
  }, [index, selectedId, visitedIds]);

  // 現在地マーカー
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (!userPosition) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }
    const latlng: L.LatLngExpression = [userPosition.lat, userPosition.lng];
    if (!userMarkerRef.current) {
      userMarkerRef.current = L.marker(latlng, {
        icon: L.divIcon({ className: 'user-marker', html: '<div class="user-dot"></div>', iconSize: [0, 0], iconAnchor: [0, 0] }),
        interactive: false,
        keyboard: false,
        zIndexOffset: 2000,
      }).addTo(map);
    } else {
      userMarkerRef.current.setLatLng(latlng);
    }
  }, [userPosition]);

  useImperativeHandle(
    ref,
    () => ({
      flyTo(lat, lng, zoom, offsetY = 0) {
        const map = mapRef.current;
        if (!map) return;
        const z = zoom ?? map.getZoom();
        const point = map.project([lat, lng], z).add([0, offsetY]);
        const target = map.unproject(point, z);
        const far = map.getCenter().distanceTo(target) > 300000;
        if (far) map.setView(target, z, { animate: false });
        else map.flyTo(target, z, { duration: 0.6 });
      },
      getZoom: () => mapRef.current?.getZoom() ?? initialZoom,
    }),
    [initialZoom],
  );

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} aria-label="史跡の地図" role="region" />;
});
