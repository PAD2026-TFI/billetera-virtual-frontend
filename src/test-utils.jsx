import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { mockTiming } from '@/services/mocks/walletService';
import { useWalletStore } from '@/store/useWalletStore';

export function resetWallet() {
  mockTiming.network = 0;
  mockTiming.settlement = 0;
  useWalletStore.setState({ summary: null, status: 'idle', balanceHidden: false, spendingDismissed: false });
}

export function renderAt(path, element) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={element} />
        <Route path="*" element={<p>Otra pantalla</p>} />
      </Routes>
    </MemoryRouter>,
  );
}
