import { NEARBY_RADIUS_M } from '../config';
import { distanceMeters } from '../lib/geo';
import { useGeolocation } from './useGeolocation';
import { useSettings } from './useSettings';
import { isFirebaseConfigured } from '../services';

export type NearbyBlock = 'locationDenied' | 'locating' | 'outOfRange';

export const NEARBY_MESSAGES: Record<NearbyBlock, string> = {
  locationDenied: '📍 位置情報を許可してください',
  locating: '📍 現在地を取得中です',
  outOfRange: '📍 スポットに近づいてください',
};

/** スポットの近く（現地）にいるかどうか */
export function useNearby(target: { lat: number; lng: number } | undefined) {
  const geo = useGeolocation();
  const { skipLocationCheck } = useSettings();
  const distance = target && geo.position ? distanceMeters(geo.position, target) : undefined;
  // GPS の誤差ぶんは許容する
  const tolerance = Math.min(geo.position?.accuracy ?? 0, 200);
  // 「現地判定をスキップ」はデモモード専用。本番モードでは常に位置で判定する
  const skip = skipLocationCheck && !isFirebaseConfigured();
  const isNear = skip || (distance !== undefined && distance <= NEARBY_RADIUS_M + tolerance);

  let block: NearbyBlock | undefined;
  if (!isNear) {
    if (geo.status === 'denied' || geo.status === 'unsupported') block = 'locationDenied';
    else if (geo.status !== 'ok') block = 'locating';
    else block = 'outOfRange';
  }
  return { isNear, distance, block, geo };
}
