import type { SiteType } from '../types';

export const SITE_TYPE_LABEL: Record<SiteType, string> = {
  castle: '城・城跡',
  temple: '寺院',
  shrine: '神社',
  kofun: '古墳',
  ruins: '遺跡',
  garden: '庭園・景勝地',
  modern: '近代化遺産',
  school: '学び舎',
  other: '史跡',
};

export const SITE_TYPE_LABEL_EN: Record<SiteType, string> = {
  castle: 'Castle',
  temple: 'Temple',
  shrine: 'Shrine',
  kofun: 'Burial mound',
  ruins: 'Archaeological site',
  garden: 'Garden / scenic site',
  modern: 'Modern heritage',
  school: 'Historic school',
  other: 'Historic site',
};
