export type LayerId = 'pale' | 'std' | 'photo';

export interface MapLayerDef {
  id: LayerId;
  name: string;
  url: string;
  maxNativeZoom: number;
  attribution: string;
}

const GSI_ATTRIBUTION = '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noopener">地理院タイル</a>';

/** 国土地理院の地理院タイル（申請不要・出典表示で利用可） */
export const MAP_LAYERS: MapLayerDef[] = [
  {
    id: 'pale',
    name: '淡色地図',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png',
    maxNativeZoom: 18,
    attribution: GSI_ATTRIBUTION,
  },
  {
    id: 'std',
    name: '標準地図',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png',
    maxNativeZoom: 18,
    attribution: GSI_ATTRIBUTION,
  },
  {
    id: 'photo',
    name: '航空写真',
    url: 'https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg',
    maxNativeZoom: 18,
    attribution: GSI_ATTRIBUTION,
  },
];
