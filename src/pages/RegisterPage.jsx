import { useNavigate } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/store/useAuthStore';

export default function RegisterPage() {
  const signIn = useAuthStore(state => state.signIn);
  const navigate = useNavigate();
  const goToLogin = () => navigate(routes.login);

  return <RegisterForm onRegistered={(_user, credentials) => signIn(credentials).catch(goToLogin)} onCancel={goToLogin} />;
}
