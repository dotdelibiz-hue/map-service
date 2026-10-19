import { useQuery } from '@tanstack/react-query';
import { ContentNotFoundError, fetchSite, fetchSiteIndex, type SiteSummary } from '../services/content';
import { useAuth } from './useAuth';
import { useSettings } from './useSettings';

export function useSiteIndex() {
  return useQuery({ queryKey: ['siteIndex'], queryFn: fetchSiteIndex, staleTime: Infinity });
}

/** こども向けモード・英語モードに合わせて絞り込んだスポット一覧 */
export function useVisibleSites() {
  const q = useSiteIndex();
  const { kidsMode, guideLanguage } = useSettings();
  const data = q.data?.filter((s) => (!kidsMode || s.hasKids) && (guideLanguage !== 'en' || s.hasEnglish));
  return { ...q, data };
}

export function useSite(id: string | undefined) {
  return useQuery({
    queryKey: ['site', id],
    queryFn: () => fetchSite(id!),
    enabled: Boolean(id),
    staleTime: Infinity,
    retry: (count, err) => !(err instanceof ContentNotFoundError) && count < 1,
  });
}

export function useSiteMap(): Map<string, SiteSummary> {
  const { data } = useSiteIndex();
  return new Map((data ?? []).map((s) => [s.id, s]));
}

export function useVisits(uid: string | undefined) {
  const { backend } = useAuth();
  return useQuery({
    queryKey: ['visits', uid],
    queryFn: () => backend!.listVisits(uid!),
    enabled: Boolean(backend && uid),
  });
}

export function useMoments(filter?: { userId?: string; siteId?: string }) {
  const { backend } = useAuth();
  return useQuery({
    queryKey: ['moments', filter?.userId ?? null, filter?.siteId ?? null],
    queryFn: () => backend!.listMoments(filter),
    enabled: Boolean(backend),
  });
}

export function useMoment(id: string | undefined) {
  const { backend } = useAuth();
  return useQuery({
    queryKey: ['moment', id],
    queryFn: () => backend!.getMoment(id!),
    enabled: Boolean(backend && id),
  });
}

export function useProfile(uid: string | undefined) {
  const { backend } = useAuth();
  return useQuery({
    queryKey: ['profile', uid],
    queryFn: () => backend!.getProfile(uid!),
    enabled: Boolean(backend && uid),
  });
}

export function useProfiles(uids: string[]) {
  const { backend } = useAuth();
  const key = [...new Set(uids)].sort();
  return useQuery({
    queryKey: ['profiles', key],
    queryFn: () => backend!.getProfiles(key),
    enabled: Boolean(backend && key.length > 0),
  });
}
