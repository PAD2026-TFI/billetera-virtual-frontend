import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/auth/AuthLayout';
import RegisterForm from '@/components/auth/RegisterForm';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/store/useAuthStore';

export default function RegisterPage() {
  const signIn = useAuthStore(state => state.signIn);
  const navigate = useNavigate();
  const goToLogin = () => navigate(routes.login);

  return (
    <AuthLayout>
      <RegisterForm onRegistered={(_user, credentials) => signIn(credentials).catch(goToLogin)} onCancel={goToLogin} />
    </AuthLayout>
  );
}
