import { useNavigate } from 'react-router-dom';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm.jsx';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <ForgotPasswordForm onBack={() => navigate('/login')} />
  );
}
