import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { PageSpinner } from './components/ui';
import { useAuth } from './hooks/useAuth';
import { MapPage } from './pages/MapPage';

const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const SubCategoryPage = lazy(() => import('./pages/SubCategoryPage'));
const SpotListPage = lazy(() => import('./pages/SpotListPage'));
const MomentListPage = lazy(() => import('./pages/MomentListPage'));
const MomentDetailPage = lazy(() => import('./pages/MomentDetailPage'));
const PostMomentPage = lazy(() => import('./pages/PostMomentPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const GuideLanguagePage = lazy(() => import('./pages/GuideLanguagePage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));
const SignUpPage = lazy(() => import('./pages/SignUpPage'));
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const UserPage = lazy(() => import('./pages/UserPage'));
const UserEditPage = lazy(() => import('./pages/UserEditPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

/** ログイン（メール認証済み）が必要なページ */
function RequireMember({ children, redirectPath = '/' }: { children: ReactNode; redirectPath?: string }) {
  const { initialized, user, isMember } = useAuth();
  if (!initialized) return <PageSpinner />;
  if (!user) return <Navigate to="/sign-in" replace />;
  if (!isMember) return <Navigate to={redirectPath === '/' ? '/sign-up/email-verification' : redirectPath} replace />;
  return <>{children}</>;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!pathname.startsWith('/historic-site') && pathname !== '/') window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <>
      <Header />
      <ScrollToTop />
      <Suspense fallback={<PageSpinner />}>
        <Routes>
          <Route path="/" element={<MapPage />} />
          <Route path="/historic-site/*" element={<MapPage />} />
          <Route path="/category" element={<CategoryPage />} />
          <Route path="/sub-category/:id" element={<SubCategoryPage />} />
          <Route path="/spot-list/:categoryId/:subCategoryId" element={<SpotListPage />} />
          <Route path="/moment-list" element={<MomentListPage />} />
          <Route path="/show-moment/:momentId" element={<MomentDetailPage />} />
          <Route
            path="/post-moment"
            element={
              <RequireMember>
                <PostMomentPage />
              </RequireMember>
            }
          />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/guide-language" element={<GuideLanguagePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsPage />} />
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/sign-up" element={<SignUpPage />} />
          <Route path="/sign-up/email-verification" element={<EmailVerificationPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/user/:userId" element={<UserPage />} />
          <Route
            path="/user/:userId/edit"
            element={
              <RequireMember>
                <UserEditPage />
              </RequireMember>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
