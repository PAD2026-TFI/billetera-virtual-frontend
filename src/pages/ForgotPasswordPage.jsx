import { useNavigate } from 'react-router-dom';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';
import { routes } from '@/lib/routes';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  return <ForgotPasswordForm onBack={() => navigate(routes.login)} />;
}
