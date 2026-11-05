import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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

describe('ForgotPasswordForm', () => {
  it('muestra error en línea si se envía con el campo de correo vacío', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm onBack={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Enviar enlace' }));
    expect(await screen.findByText('Ingresá tu correo electrónico.')).toBeInTheDocument();
  });

  it('permite ingresar el correo y abre el modal de confirmación al enviar', async () => {
    const handleBack = vi.fn();
    const user = userEvent.setup();
    render(<ForgotPasswordForm onBack={handleBack} />);

    expect(screen.getByRole('heading', { name: 'Recuperar contraseña' })).toBeInTheDocument();

    const emailInput = screen.getByLabelText('Correo electrónico');
    await user.type(emailInput, 'usuario@test.com');

    const submitBtn = screen.getByRole('button', { name: 'Enviar enlace' });
    await user.click(submitBtn);

    const modalTitle = await screen.findByRole('heading', { name: 'Enlace enviado' });
    expect(modalTitle).toBeInTheDocument();
    expect(screen.getByText(/usuario@test\.com/)).toBeInTheDocument();

    const entendidoBtn = screen.getByRole('button', { name: 'Entendido' });
    await user.click(entendidoBtn);

    await waitFor(() => {
      expect(handleBack).toHaveBeenCalledTimes(1);
    });
  });
});
