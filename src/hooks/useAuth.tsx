import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthUser, UserProfile } from '../types';
import { getBackend } from '../services';
import type { Backend } from '../services/backend';

interface AuthState {
  backend: Backend | null;
  user: AuthUser | null;
  profile: UserProfile | null | undefined;
  /** 初回の認証状態の確認が終わったか */
  initialized: boolean;
  /** ログイン済みかつ（本番モードでは）メール認証済み */
  isMember: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [backend, setBackend] = useState<Backend | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initialized, setInitialized] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;
    void getBackend().then((b) => {
      if (cancelled) return;
      setBackend(b);
      unsub = b.onAuthChange((u) => {
        setUser(u);
        setInitialized(true);
      });
    });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  const profileQuery = useQuery({
    queryKey: ['profile', user?.uid],
    queryFn: () => backend!.getProfile(user!.uid),
    enabled: Boolean(backend && user),
  });

  const refreshUser = useCallback(async () => {
    if (!backend) return;
    const next = await backend.reloadUser();
    setUser(next);
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
  }, [backend, queryClient]);

  const value = useMemo<AuthState>(
    () => ({
      backend,
      user,
      profile: user ? profileQuery.data : null,
      initialized,
      isMember: Boolean(user && (user.emailVerified || backend?.mode === 'local')),
      refreshUser,
    }),
    [backend, user, profileQuery.data, initialized, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

/** バックエンドの準備ができるまで待って返す */
export function useBackend(): Backend | null {
  return useAuth().backend;
}
