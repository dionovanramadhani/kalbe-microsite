import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MobileFrame } from './components/MobileFrame';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { isRememberMeActive } from './data/dummyUser';
import { ProtectedRoute } from './components/ProtectedRoute';
import { isTokenValid, getToken } from './utils/auth';

import { HomePage } from './pages/HomePage';
import { SymposiumPage } from './pages/SymposiumPage';
import { PostTestPage } from './pages/PostTestPage';
import { ClaimRewardPage } from './pages/ClaimRewardPage';
import { MysteryBoxPage } from './pages/MysteryBoxPage';
import { AdminLayout } from './admin/AdminLayout';

const RootRoute = () => {
  if (isTokenValid(getToken()) || isRememberMeActive()) {
    return <Navigate to="/home" replace />;
  }
  return <LoginPage />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Route - Rendered full screen without MobileFrame */}
        <Route path="/admin/*" element={<AdminLayout />} />

        {/* User Mobile Microsite Routes - Rendered within MobileFrame */}
        <Route
          path="/*"
          element={
            <MobileFrame>
              <Routes>
                <Route path="/" element={<RootRoute />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/symposium" element={<SymposiumPage />} />
                  <Route path="/booth-scan" element={<SymposiumPage scanType="booth" />} />
                  <Route path="/early-life-scan" element={<SymposiumPage scanType="early-life" />} />
                  <Route path="/post-test" element={<PostTestPage />} />
                  <Route path="/claim-reward" element={<ClaimRewardPage />} />
                  <Route path="/mystery-box" element={<MysteryBoxPage />} />
                </Route>

                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </MobileFrame>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
