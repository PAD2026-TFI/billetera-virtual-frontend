import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const signIn = useAuthStore(state => state.signIn);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(credentials) {
    setBusy(true);
    setError('');
    try {
      await signIn(credentials);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <LoginForm
      onSubmit={submit}
      busy={busy}
      error={error}
      onCreateAccount={() => navigate(routes.register)}
      onForgotPassword={() => navigate(routes.forgotPassword)}
    />
  );
}
