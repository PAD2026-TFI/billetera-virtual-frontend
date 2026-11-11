import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import LoginForm from './LoginForm.jsx';
import ForgotPasswordForm from './ForgotPasswordForm.jsx';

describe('LoginForm', () => {
  it('muestra el placeholder en el campo de contraseña', () => {
    render(<LoginForm onSubmit={() => {}} busy={false} error="" />);
    const passwordInput = screen.getByLabelText('Contraseña');
    expect(passwordInput).toHaveAttribute('placeholder', 'Ingresá tu contraseña');
  });

  it('muestra el botón de olvidar contraseña y ejecuta la acción al hacer clic', async () => {
    const handleForgotPassword = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={() => {}} busy={false} error="" onForgotPassword={handleForgotPassword} />);

    const forgotBtn = screen.getByRole('button', { name: '¿Olvidaste tu contraseña?' });
    expect(forgotBtn).toBeInTheDocument();

    await user.click(forgotBtn);
    expect(handleForgotPassword).toHaveBeenCalledTimes(1);
  });

  it('muestra errores en línea cuando se envía vacío o con correo inválido', async () => {
    const handleSubmit = vi.fn();
    const user = userEvent.setup();
    render(<LoginForm onSubmit={handleSubmit} busy={false} error="" />);

    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Ingresá tu correo electrónico.')).toBeInTheDocument();
    expect(screen.getByText('Ingresá tu contraseña.')).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText('Correo electrónico'), 'correo-invalido');
    expect(await screen.findByText('El formato del correo no es válido.')).toBeInTheDocument();
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const json = (body, status = 200) =>
  new Response(body === null ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function requestCode(user, email = 'usuario@test.com') {
  await user.type(screen.getByLabelText('Correo electrónico'), email);
  await user.click(screen.getByRole('button', { name: 'Enviar código' }));
  await screen.findByRole('heading', { name: 'Elegí una contraseña nueva' });
}

async function fillReset(user, code, password = 'NuevaClave1') {
  await user.click(screen.getByLabelText('Dígito 1'));
  await user.paste(code);
  await user.type(screen.getByLabelText('Contraseña nueva'), password);
  await user.type(screen.getByLabelText('Repetir contraseña'), password);
  await user.click(screen.getByRole('button', { name: 'Cambiar contraseña' }));
}

describe('ForgotPasswordForm', () => {
  it('muestra error en línea si se envía con el campo de correo vacío', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm onBack={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Enviar código' }));
    expect(await screen.findByText('Ingresá tu correo electrónico.')).toBeInTheDocument();
  });

  it('envía el código por correo y cambia la contraseña con el código recibido', async () => {
    const request = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ retryAfterSeconds: 60 }, 202))
      .mockResolvedValueOnce(json({ reset: true }));
    const handleBack = vi.fn();
    const user = userEvent.setup();
    render(<ForgotPasswordForm onBack={handleBack} />);

    expect(screen.getByRole('heading', { name: 'Recuperar contraseña' })).toBeInTheDocument();
    await requestCode(user);
    expect(request).toHaveBeenNthCalledWith(1, expect.stringContaining('/api/v1/auth/password-reset'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ email: 'usuario@test.com' }) }));
    expect(screen.getByText('usuario@test.com')).toBeInTheDocument();
    expect(screen.getByText(/Reenviar código en/)).toBeInTheDocument();

    await fillReset(user, '123456');
    expect(request).toHaveBeenNthCalledWith(2, expect.stringContaining('/api/v1/auth/password-reset/confirm'),
      expect.objectContaining({ body: JSON.stringify({ email: 'usuario@test.com', code: '123456', newPassword: 'NuevaClave1' }) }));
    expect(await screen.findByRole('heading', { name: 'Contraseña actualizada' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
    await waitFor(() => expect(handleBack).toHaveBeenCalled());
  });

  it('avisa si el código es incorrecto y deja reintentar', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(json({ retryAfterSeconds: 60 }, 202))
      .mockResolvedValueOnce(json({ title: 'El código es incorrecto o venció. Revisalo o pedí otro.', code: 'PASSWORD_RESET_CODE_INVALID' }, 400));
    const user = userEvent.setup();
    render(<ForgotPasswordForm onBack={() => {}} />);

    await requestCode(user);
    await fillReset(user, '000000');
    expect(await screen.findByRole('alert')).toHaveTextContent('El código es incorrecto o venció. Revisalo o pedí otro.');
    expect(screen.getByLabelText('Dígito 1')).toHaveValue('');
    expect(screen.queryByRole('heading', { name: 'Contraseña actualizada' })).not.toBeInTheDocument();
  });

  it('no deja cambiar la contraseña si no cumple los requisitos', async () => {
    const request = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json({ retryAfterSeconds: 60 }, 202));
    const user = userEvent.setup();
    render(<ForgotPasswordForm onBack={() => {}} />);

    await requestCode(user);
    await fillReset(user, '123456', 'corta');
    expect(await screen.findByText('Mínimo 8 caracteres.')).toBeInTheDocument();
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('reparte en las casillas un código escrito de a uno o autocompletado entero', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(json({ retryAfterSeconds: 60 }, 202));
    const user = userEvent.setup();
    render(<ForgotPasswordForm onBack={() => {}} />);

    await requestCode(user);
    await user.type(screen.getByLabelText('Dígito 1'), '1234');
    expect(['1', '2', '3', '4'].map((_, i) => screen.getByLabelText(`Dígito ${i + 1}`).value)).toEqual(['1', '2', '3', '4']);

    fireEvent.change(screen.getByLabelText('Dígito 1'), { target: { value: '654321' } });
    expect([1, 2, 3, 4, 5, 6].map(i => screen.getByLabelText(`Dígito ${i}`).value).join('')).toBe('654321');
  });
});
