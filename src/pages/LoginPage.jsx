import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm.jsx';
import { useAuthStore } from '@/store/useAuthStore.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const signIn = useAuthStore(state => state.signIn);
  const busy = useAuthStore(state => state.busy);
  const error = useAuthStore(state => state.error);
  const setError = useAuthStore(state => state.setError);

  async function handleLogin(credentials) {
    const success = await signIn(credentials);
    if (success) {
      navigate('/', { replace: true });
    }
  }

  return (
    <LoginForm
      onSubmit={handleLogin}
      busy={busy}
      error={error}
      onCreateAccount={() => {
        setError('');
        navigate('/register');
      }}
      onForgotPassword={() => {
        setError('');
        navigate('/forgot-password');
      }}
    />
  );
}
