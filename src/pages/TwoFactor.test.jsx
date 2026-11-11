import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LoginPage from './LoginPage.jsx';
import TwoFactorSettings from '@/components/security/TwoFactorSettings';
import { renderAt } from '@/test-utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';

const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
const user = { id: 'u1', firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.com', accountType: 'personal' };

function stubApi(routes) {
  const fetch = vi.fn(async (url, request) => {
    const path = new URL(url).pathname;
    const handler = routes[`${request?.method ?? 'GET'} ${path}`];
    if (!handler) return json(404, { title: 'No encontrado' });
    return handler(request?.body ? JSON.parse(request.body) : undefined);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

async function enterCredentials(person) {
  await person.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com');
  await person.type(screen.getByLabelText('Contraseña'), 'Frase de prueba 2026!');
  await person.click(screen.getByRole('button', { name: 'Ingresar' }));
}

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ session: null });
  useNotificationStore.setState({ toasts: [], serviceUnavailable: false });
});
afterEach(() => vi.unstubAllGlobals());

describe('inicio de sesión con verificación en dos pasos', () => {
  const loginRoutes = {
    'POST /api/v1/auth/login': () => json(202, { twoFactorRequired: true, challengeToken: 'desafio', expiresIn: 300 }),
    'POST /api/v1/auth/login/two-factor': body => body.code === '123456'
      ? json(200, { accessToken: 'jwt-real', tokenType: 'Bearer', expiresIn: 900 })
      : json(401, { code: 'TWO_FACTOR_LOGIN_FAILED', title: 'El código no es correcto. Revisá tu app de autenticación.' }),
    'GET /api/v1/me/profile': () => json(200, user),
  };

  it('pide el código de la app y recién entonces inicia la sesión', async () => {
    const fetch = stubApi(loginRoutes);
    const person = userEvent.setup();
    renderAt('/login', <LoginPage />);
    await enterCredentials(person);

    expect(await screen.findByRole('heading', { name: 'Verificación en dos pasos' })).toBeInTheDocument();
    expect(useAuthStore.getState().session).toBeNull();

    await person.type(screen.getByLabelText('Código de verificación'), '000000');
    await person.click(screen.getByRole('button', { name: 'Verificar e ingresar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El código no es correcto');
    expect(useAuthStore.getState().session).toBeNull();

    await person.clear(screen.getByLabelText('Código de verificación'));
    await person.type(screen.getByLabelText('Código de verificación'), '123456');
    await person.click(screen.getByRole('button', { name: 'Verificar e ingresar' }));
    await vi.waitFor(() => expect(useAuthStore.getState().session?.token).toBe('jwt-real'));
    const verifyCall = fetch.mock.calls.filter(([url]) => url.endsWith('/api/v1/auth/login/two-factor')).at(-1);
    expect(JSON.parse(verifyCall[1].body)).toEqual({ challengeToken: 'desafio', code: '123456' });
  });

  it('si la verificación venció vuelve al paso de la contraseña', async () => {
    stubApi({
      ...loginRoutes,
      'POST /api/v1/auth/login/two-factor': () => json(401, { code: 'TWO_FACTOR_CHALLENGE_EXPIRED', title: 'La verificación venció. Iniciá sesión de nuevo.' }),
    });
    const person = userEvent.setup();
    renderAt('/login', <LoginPage />);
    await enterCredentials(person);
    await person.type(await screen.findByLabelText('Código de verificación'), '123456');
    await person.click(screen.getByRole('button', { name: 'Verificar e ingresar' }));
    expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('La verificación venció');
  });

  it('sin la verificación activa el inicio de sesión no cambia', async () => {
    stubApi({
      'POST /api/v1/auth/login': () => json(200, { accessToken: 'jwt-directo', tokenType: 'Bearer', expiresIn: 900 }),
      'GET /api/v1/me/profile': () => json(200, user),
    });
    renderAt('/login', <LoginPage />);
    await enterCredentials(userEvent.setup());
    await vi.waitFor(() => expect(useAuthStore.getState().session?.token).toBe('jwt-directo'));
    expect(screen.queryByRole('heading', { name: 'Verificación en dos pasos' })).not.toBeInTheDocument();
  });
});

describe('configuración en Mi perfil', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: { token: 'jwt-real', user, expiresAt: Date.now() + 3600000 } });
  });

  it('activa la verificación con el código de la app y después la desactiva', async () => {
    let enabled = false;
    stubApi({
      'GET /api/v1/me/two-factor': () => json(200, { enabled, enabledAt: null }),
      'POST /api/v1/me/two-factor/setup': () => json(200, {
        secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
        otpAuthUri: 'otpauth://totp/padi:ana%40example.com?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=padi',
      }),
      'POST /api/v1/me/two-factor/confirm': body => {
        enabled = body.code === '654321';
        return enabled ? json(200, { enabled: true, enabledAt: '2026-11-10T21:00:00Z' })
          : json(400, { code: 'TWO_FACTOR_CODE_INVALID', title: 'El código no es correcto. Revisá tu app de autenticación.' });
      },
      'POST /api/v1/me/two-factor/disable': () => {
        enabled = false;
        return json(200, { enabled: false, enabledAt: null });
      },
    });
    const person = userEvent.setup();
    render(<TwoFactorSettings />);

    await person.click(await screen.findByRole('button', { name: 'Activar' }));
    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('JBSW Y3DP EHPK 3PXP JBSW Y3DP EHPK 3PXP')).toBeInTheDocument();

    await person.type(within(dialog).getByLabelText('Código de 6 números'), '111111');
    await person.click(within(dialog).getByRole('button', { name: 'Activar' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('El código no es correcto');

    await person.clear(within(dialog).getByLabelText('Código de 6 números'));
    await person.type(within(dialog).getByLabelText('Código de 6 números'), '654321');
    await person.click(within(dialog).getByRole('button', { name: 'Activar' }));
    expect(await screen.findByText('Activa')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await person.click(screen.getByRole('button', { name: 'Desactivar' }));
    await person.type(await screen.findByLabelText('Código de 6 números'), '222222');
    await person.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Desactivar' }));
    expect(await screen.findByText('Inactiva')).toBeInTheDocument();
  });

  it('no muestra nada si el backend todavía no tiene la función', async () => {
    const fetch = stubApi({});
    const { container } = render(<TwoFactorSettings />);
    await vi.waitFor(() => expect(fetch).toHaveBeenCalled());
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(container).toBeEmptyDOMElement();
  });

  it('en la sesión de demostración no consulta al backend', () => {
    useAuthStore.setState({ session: { token: 'mock-jwt-token', user, expiresAt: Date.now() + 3600000 } });
    const fetch = stubApi({});
    const { container } = render(<TwoFactorSettings />);
    expect(fetch).not.toHaveBeenCalled();
    expect(container).toBeEmptyDOMElement();
  });
});
