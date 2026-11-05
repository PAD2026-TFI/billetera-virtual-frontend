import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthLayout from '@/components/auth/AuthLayout';
import LoginForm from '@/components/auth/LoginForm';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const signIn = useAuthStore(state => state.signIn);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      await signIn({ email: form.get('email'), password: form.get('password') });
    } catch (e) {
      setError(e.message || 'No pudimos comunicarnos con la API.');
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <LoginForm onSubmit={submit} busy={busy} error={error} onCreateAccount={() => navigate(routes.register)} />
    </AuthLayout>
  );
}
