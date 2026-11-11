import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import OpenRenaperModal from './OpenRenaperModal.jsx';

describe('OpenRenaperModal', () => {
  it('muestra el logo, la leyenda del servicio y el estado de validación', async () => {
    render(
      <OpenRenaperModal
        open={true}
        dni="40123456"
        validationDuration={60}
      />
    );

    expect(screen.getByAltText('OpenRENAPER')).toBeInTheDocument();
    expect(
      screen.getByText('Servicio de validación provisto por OpenRENAPER')
    ).toBeInTheDocument();
    expect(screen.getByText('Validando documento…')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('DNI validado con éxito')).toBeInTheDocument();
    });
    expect(screen.getByText('40123456')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Continuar a validación facial' })
    ).toBeInTheDocument();
  });

  it('permite continuar al completar la validación exitosa', async () => {
    const onContinue = vi.fn();
    const user = userEvent.setup();

    render(
      <OpenRenaperModal
        open={true}
        dni="40123456"
        initialStatus="success"
        onContinue={onContinue}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'Continuar a validación facial' })
    );
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('muestra el estado de error y permite reintentar', async () => {
    const onRetry = vi.fn();
    const user = userEvent.setup();

    render(
      <OpenRenaperModal
        open={true}
        dni="00000000"
        initialStatus="validating"
        validationDuration={20}
        onRetry={onRetry}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Validación no exitosa')).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole('button', { name: 'Reintentar captura de DNI' })
    );
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
