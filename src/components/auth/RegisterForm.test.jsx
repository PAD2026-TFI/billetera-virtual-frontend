import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RegisterForm from './RegisterForm.jsx';

afterEach(() => vi.restoreAllMocks());

describe('RegisterForm', () => {
  it('muestra los errores debajo de los inputs si se envía vacío en el paso 1', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText('Ingresá tu nombre.')).toBeInTheDocument();
    expect(screen.getByText('Ingresá tu apellido.')).toBeInTheDocument();
    expect(screen.getByText('Ingresá tu DNI.')).toBeInTheDocument();
  });

  it('valida el formato de DNI en el paso 1', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText('Nombre'), 'Ana');
    await user.type(screen.getByLabelText('Apellido'), 'Pérez');
    await user.type(screen.getByLabelText('DNI'), '123');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByText('Ingresá un DNI válido (7 u 8 números).')).toBeInTheDocument();
  });

  it('avanza al paso 2 y muestra error si el correo es inválido', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText('Nombre'), 'Ana');
    await user.type(screen.getByLabelText('Apellido'), 'Pérez');
    await user.type(screen.getByLabelText('DNI'), '40123456');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    expect(await screen.findByRole('heading', { name: 'Tu correo electrónico' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Enviar código' }));
    expect(await screen.findByText('Ingresá tu correo electrónico.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Correo electrónico'), 'correo-invalido');
    await user.click(screen.getByRole('button', { name: 'Enviar código' }));
    expect(await screen.findByText('Ingresá un correo electrónico válido.')).toBeInTheDocument();
  });

  it('permite regresar al paso 1 desde el paso 2', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByLabelText('Nombre'), 'Ana');
    await user.type(screen.getByLabelText('Apellido'), 'Pérez');
    await user.type(screen.getByLabelText('DNI'), '40123456');
    await user.click(screen.getByRole('button', { name: 'Continuar' }));

    const backBtn = await screen.findByRole('button', { name: 'Volver a datos personales' });
    await user.click(backBtn);

    expect(await screen.findByRole('heading', { name: 'Crear cuenta' })).toBeInTheDocument();
  });
});
