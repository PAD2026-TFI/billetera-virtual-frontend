import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthLayout from '@/components/auth/AuthLayout.jsx';
import ProtectedRoute from '@/components/auth/ProtectedRoute.jsx';
import PublicRoute from '@/components/auth/PublicRoute.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import RegisterPage from '@/pages/RegisterPage.jsx';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage.jsx';
import WalletPage from '@/pages/WalletPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<WalletPage />} />
          <Route path="/payments/return" element={<WalletPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
