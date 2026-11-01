import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import MovementsPage from './pages/MovementsPage.jsx';
import TransferPage from './pages/TransferPage.jsx';
import TopUpPage from './pages/TopUpPage.jsx';
import PayPage from './pages/PayPage.jsx';
import CardPage from './pages/CardPage.jsx';
import { routes } from './lib/routes';
import { applyTheme, useThemeStore } from './store/useThemeStore';
import './index.css';
applyTheme(useThemeStore.getState().theme);
createRoot(document.getElementById('root')).render(<React.StrictMode>
  <BrowserRouter>
    <Routes>
      <Route path={routes.home} element={<DashboardPage />} />
      <Route path={routes.movements} element={<MovementsPage />} />
      <Route path={routes.transfer} element={<TransferPage />} />
      <Route path={routes.topUp} element={<TopUpPage />} />
      <Route path={routes.pay} element={<PayPage />} />
      <Route path={routes.card} element={<CardPage />} />
      <Route path="*" element={<App />} />
    </Routes>
  </BrowserRouter>
</React.StrictMode>);
