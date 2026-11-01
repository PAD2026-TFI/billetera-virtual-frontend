import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import RegisterForm from './RegisterForm.jsx';

async function fill(user, overrides = {}) {
  const v = { firstName: 'Ana', lastName: 'Pérez', email: 'ana@test.com', password: 'claveSegura123', confirm: 'claveSegura123', ...overrides };
  await user.type(screen.getByLabelText('Nombre'), v.firstName);
  await user.type(screen.getByLabelText('Apellido'), v.lastName);
  await user.type(screen.getByLabelText('Correo electrónico'), v.email);
  await user.type(screen.getByLabelText('Contraseña'), v.password);
  await user.type(screen.getByLabelText('Repetir contraseña'), v.confirm);
}

const submit = user => user.click(screen.getByRole('button', { name: 'Crear cuenta' }));

afterEach(() => vi.restoreAllMocks());

describe('RegisterForm', () => {
  it('muestra los errores si se envía vacío', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await submit(user);
    expect(await screen.findByText('Ingresá tu nombre.')).toBeInTheDocument();
    expect(screen.getByText('Mínimo 12 caracteres.')).toBeInTheDocument();
  });

  it('avisa si las contraseñas no coinciden', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await fill(user, { confirm: 'otraClave12345' });
    await submit(user);
    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeInTheDocument();
  });

  it('envía los datos sin la confirmación y avisa al terminar', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: '1', firstName: 'Ana', lastName: 'Pérez', email: 'ana@test.com' }), { status: 201 }));
    const onRegistered = vi.fn();
    const user = userEvent.setup();
    render(<RegisterForm onRegistered={onRegistered} />);
    await fill(user);
    await submit(user);
    await vi.waitFor(() => expect(onRegistered).toHaveBeenCalled());
    expect(JSON.parse(fetchMock.mock.calls[0][1].body))
      .toEqual({ firstName: 'Ana', lastName: 'Pérez', email: 'ana@test.com', password: 'claveSegura123' });
  });

  it('muestra el error del backend si el correo ya existe', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ code: 'EMAIL_ALREADY_REGISTERED' }), { status: 409 }));
    const user = userEvent.setup();
    render(<RegisterForm />);
    await fill(user);
    await submit(user);
    expect(await screen.findByText('Ese correo ya tiene una cuenta.')).toBeInTheDocument();
  });

  it('permite mostrar la contraseña', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    const input = screen.getByLabelText('Contraseña');
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getAllByRole('button', { name: 'Mostrar contraseña' })[0]);
    expect(input).toHaveAttribute('type', 'text');
  });
});
