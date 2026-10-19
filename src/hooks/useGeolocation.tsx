import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

export type GeoStatus = 'idle' | 'locating' | 'ok' | 'denied' | 'unavailable' | 'unsupported';

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

interface GeoState {
  status: GeoStatus;
  position: GeoPosition | null;
  /** 位置情報の取得を開始する（許可ダイアログはこのタイミングで出ます） */
  start: () => void;
}

const GeoContext = createContext<GeoState | null>(null);

export function GeoProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<GeoStatus>('idle');
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const watchId = useRef<number | null>(null);

  const start = useCallback(() => {
    if (watchId.current !== null) return;
    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }
    setStatus((s) => (s === 'ok' ? s : 'locating'));
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        setPosition({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy });
        setStatus('ok');
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
          if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
          watchId.current = null;
        } else {
          setStatus((s) => (s === 'ok' ? s : 'unavailable'));
        }
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 },
    );
  }, []);

  useEffect(
    () => () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    },
    [],
  );

  // すでに許可済みなら自動で開始（初回の許可ダイアログは操作をきっかけに出す）
  useEffect(() => {
    const perms = navigator.permissions;
    if (!perms?.query) return;
    perms
      .query({ name: 'geolocation' as PermissionName })
      .then((r) => {
        if (r.state === 'granted') start();
        if (r.state === 'denied') setStatus('denied');
      })
      .catch(() => undefined);
  }, [start]);

  const value = useMemo(() => ({ status, position, start }), [status, position, start]);
  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>;
}

export function useGeolocation(): GeoState {
  const ctx = useContext(GeoContext);
  if (!ctx) throw new Error('useGeolocation must be used inside GeoProvider');
  return ctx;
}

export const GEO_ERROR_MESSAGES: Record<GeoStatus, string> = {
  idle: '位置情報を取得しています。少し待ってからもう一度お試しください',
  locating: '位置情報を取得しています。少し待ってからもう一度お試しください',
  ok: '',
  denied: '位置情報の使用が許可されていません',
  unavailable: '位置情報を取得できませんでした',
  unsupported: 'このブラウザは位置情報をサポートしていません',
};
