import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import TwoFactorLoginForm from '@/components/auth/TwoFactorLoginForm';
import { routes } from '@/lib/routes';
import { useAuthStore } from '@/store/useAuthStore';

export default function LoginPage() {
  const signIn = useAuthStore(state => state.signIn);
  const completeTwoFactor = useAuthStore(state => state.completeTwoFactor);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);

  async function submit(credentials) {
    setBusy(true);
    setError('');
    try {
      const result = await signIn(credentials);
      if (result?.twoFactorRequired) {
        setPending({ credentials, challengeToken: result.challengeToken });
        setBusy(false);
      }
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  async function verify(code) {
    setBusy(true);
    setError('');
    try {
      await completeTwoFactor({ challengeToken: pending.challengeToken, code }, pending.credentials);
    } catch (e) {
      if (e.code === 'TWO_FACTOR_CHALLENGE_EXPIRED') setPending(null);
      setError(e.message);
      setBusy(false);
    }
  }

  function backToPassword() {
    setPending(null);
    setError('');
  }

  if (pending) {
    return <TwoFactorLoginForm onSubmit={verify} onBack={backToPassword} busy={busy} error={error} />;
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
