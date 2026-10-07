import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MobileFrame } from './components/MobileFrame';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

import { HomePage } from './pages/HomePage';
import { SymposiumPage } from './pages/SymposiumPage';

export default function App() {
  return (
    <BrowserRouter>
      <MobileFrame>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/symposium" element={<SymposiumPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </MobileFrame>
    </BrowserRouter>
  );
}
