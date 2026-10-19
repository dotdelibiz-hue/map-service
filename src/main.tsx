import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles/global.css';
import { App } from './App';
import { AppFrame } from './components/layout/AppFrame';
import { AuthProvider } from './hooks/useAuth';
import { GeoProvider } from './hooks/useGeolocation';
import { MemberModalProvider } from './hooks/useMemberModal';
import { SettingsProvider } from './hooks/useSettings';
import { ToastProvider } from './hooks/useToast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 30_000 },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
        <SettingsProvider>
          <GeoProvider>
            <AuthProvider>
              <ToastProvider>
                <MemberModalProvider>
                  <AppFrame>
                    <App />
                  </AppFrame>
                </MemberModalProvider>
              </ToastProvider>
            </AuthProvider>
          </GeoProvider>
        </SettingsProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
