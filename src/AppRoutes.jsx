import { Navigate, Route, Routes } from 'react-router-dom';
import AuthRoutesLayout from '@/components/auth/AuthRoutesLayout';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/routing/RouteGuards';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import DashboardPage from '@/pages/DashboardPage';
import MovementsPage from '@/pages/MovementsPage';
import TransferPage from '@/pages/TransferPage';
import TopUpPage from '@/pages/TopUpPage';
import PayPage from '@/pages/PayPage';
import CardPage from '@/pages/CardPage';
import SandboxPage from '@/pages/SandboxPage';
import { routes } from '@/lib/routes';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthRoutesLayout />}>
          <Route path={routes.login} element={<LoginPage />} />
          <Route path={routes.register} element={<RegisterPage />} />
          <Route path={routes.forgotPassword} element={<ForgotPasswordPage />} />
        </Route>
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path={routes.home} element={<DashboardPage />} />
        <Route path={routes.movements} element={<MovementsPage />} />
        <Route path={routes.transfer} element={<TransferPage />} />
        <Route path={routes.topUp} element={<TopUpPage />} />
        <Route path={routes.pay} element={<PayPage />} />
        <Route path={routes.card} element={<CardPage />} />
        <Route path={routes.sandbox} element={<SandboxPage />} />
        <Route path={routes.paymentReturn} element={<Navigate to={routes.sandbox} replace />} />
      </Route>
      <Route path="*" element={<Navigate to={routes.home} replace />} />
    </Routes>
  );
}
