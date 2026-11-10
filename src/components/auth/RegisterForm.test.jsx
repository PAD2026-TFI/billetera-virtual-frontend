import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@/services/api';
import RegisterForm from './RegisterForm.jsx';

vi.mock('@/services/api', () => ({ api: vi.fn() }));

const slow = { timeout: 4000 };
const proof = 'a'.repeat(64);

beforeEach(() => {
  api.mockReset();
  api.mockImplementation(async (path) => {
    if (path.endsWith('/email-verification')) return { retryAfterSeconds: 60 };
    if (path.endsWith('/confirm')) return { verificationToken: proof };
    if (path.endsWith('/register')) return { id: 'user-1' };
    throw new Error('Unexpected path ' + path);
  });
});

async function completePersonalData(user, { firstName = 'Ana', lastName = 'Pérez', dni = '40123456' } = {}) {
  await user.type(screen.getByLabelText('Nombre'), firstName);
  await user.type(screen.getByLabelText('Apellido'), lastName);
  await user.type(screen.getByLabelText('DNI'), dni);
  await user.click(screen.getByRole('button', { name: 'Continuar' }));
}

async function verifyEmail(user, email = 'ana@test.com') {
  await user.type(await screen.findByLabelText('Correo electrónico'), email);
  await user.click(screen.getByRole('button', { name: 'Enviar código' }));
  await screen.findByRole('heading', { name: 'Ingresá el código' });
  await vi.waitFor(() => expect(screen.getAllByRole('textbox')[0]).toHaveFocus());
  await user.keyboard('123456');
  await user.click(screen.getByRole('button', { name: 'Verificar código' }));
  expect(await screen.findByText('Código verificado correctamente', {}, slow)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Continuar a contraseña' }));
}

async function createPassword(user, password = 'ClaveSegura1') {
  await user.type(await screen.findByLabelText('Contraseña'), password);
  await user.type(screen.getByLabelText('Repetir contraseña'), password);
  await user.click(screen.getByRole('button', { name: 'Continuar a validación de DNI' }));
}

describe('RegisterForm', () => {
  it('pide nombre, apellido y un DNI de 7 u 8 números', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await user.click(screen.getByRole('button', { name: 'Continuar' }));
    expect(screen.getByText('Ingresá tu nombre.')).toBeInTheDocument();

    await completePersonalData(user, { dni: '12ab3' });
    expect(screen.getByLabelText('DNI')).toHaveValue('123');
    expect(screen.getByText('Ingresá un DNI válido (7 u 8 números).')).toBeInTheDocument();
  });

  it('valida el correo y verifica el código de 6 dígitos', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await completePersonalData(user);
    await user.type(await screen.findByLabelText('Correo electrónico'), 'correo-sin-arroba');
    await user.click(screen.getByRole('button', { name: 'Enviar código' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Ingresá un correo electrónico válido.');

    await user.clear(screen.getByLabelText('Correo electrónico'));
    await verifyEmail(user);
    expect(await screen.findByRole('heading', { name: 'Creá tu contraseña' })).toBeInTheDocument();
  });

  it('mantiene el paso del código cuando el backend lo rechaza', async () => {
    const user = userEvent.setup();
    api.mockResolvedValueOnce({ retryAfterSeconds: 60 })
      .mockRejectedValueOnce(new Error('El código es incorrecto o venció.'));
    render(<RegisterForm />);
    await completePersonalData(user);
    await user.type(await screen.findByLabelText('Correo electrónico'), 'ana@test.com');
    await user.click(screen.getByRole('button', { name: 'Enviar código' }));
    const firstDigit = await screen.findByLabelText('Dígito 1');
    await vi.waitFor(() => expect(firstDigit).toHaveFocus());
    await user.keyboard('000001');
    await user.click(screen.getByRole('button', { name: 'Verificar código' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('El código es incorrecto o venció.');
    expect(screen.queryByRole('button', { name: 'Continuar a contraseña' })).toBeNull();
    expect(api).toHaveBeenLastCalledWith('/api/v1/auth/email-verification/confirm', {
      method: 'POST', token: null, body: { email: 'ana@test.com', code: '000001' },
    });
  });

  it('exige una contraseña segura que coincida y permite mostrarla', async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);
    await completePersonalData(user);
    await verifyEmail(user);

    const password = await screen.findByLabelText('Contraseña');
    const submit = screen.getByRole('button', { name: 'Continuar a validación de DNI' });
    await user.type(password, 'debil');
    expect(submit).toBeDisabled();

    await user.clear(password);
    await user.type(password, 'ClaveSegura1');
    await user.type(screen.getByLabelText('Repetir contraseña'), 'OtraClave1');
    expect(screen.getByText('Las contraseñas no coinciden.')).toBeInTheDocument();
    expect(submit).toBeDisabled();

    await user.clear(screen.getByLabelText('Repetir contraseña'));
    await user.type(screen.getByLabelText('Repetir contraseña'), 'ClaveSegura1');
    expect(submit).toBeEnabled();

    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getAllByRole('button', { name: 'Mostrar contraseña' })[0]);
    expect(password).toHaveAttribute('type', 'text');
  });

  it('completa la validación de DNI y facial y entrega las credenciales al terminar', async () => {
    const onRegistered = vi.fn();
    const user = userEvent.setup();
    render(<RegisterForm onRegistered={onRegistered} />);
    await completePersonalData(user);
    await verifyEmail(user);
    await createPassword(user);

    await user.click(await screen.findByRole('button', { name: 'Capturar frente del DNI' }));
    await user.click(await screen.findByRole('button', { name: 'Capturar dorso del DNI' }, slow));
    await user.click(await screen.findByRole('button', { name: 'Continuar a validación facial' }, slow));

    await user.click(await screen.findByRole('button', { name: 'Iniciar escaneo facial' }));
    await user.click(await screen.findByRole('button', { name: 'Finalizar registro' }, slow));

    const welcome = await screen.findByRole('dialog', {}, slow);
    expect(api).toHaveBeenLastCalledWith('/api/v1/auth/register', expect.objectContaining({
      method: 'POST', body: expect.objectContaining({ emailVerificationToken: proof }),
    }));
    expect(within(welcome).getByRole('heading', { name: '¡Bienvenido a padi!' })).toBeInTheDocument();
    await user.click(within(welcome).getByRole('button', { name: 'Comenzar a operar' }));
    await vi.waitFor(() => expect(onRegistered).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Ana', lastName: 'Pérez', email: 'ana@test.com', dni: '40123456' }),
      { email: 'ana@test.com', password: 'ClaveSegura1' },
    ));
  });
});
