import { useNavigate } from 'react-router-dom';
import RegisterForm from '@/components/auth/RegisterForm.jsx';
import { useAuthStore } from '@/store/useAuthStore.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const signIn = useAuthStore(state => state.signIn);

  async function handleRegistered(user, credentials) {
    if (credentials) {
      const success = await signIn(credentials);
      if (success) {
        navigate('/', { replace: true });
        return;
      }
    }
    navigate('/login', { replace: true });
  }

  return (
    <RegisterForm
      onRegistered={handleRegistered}
      onCancel={() => navigate('/login')}
    />
  );
}
