import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { applyTheme, useThemeStore } from './store/useThemeStore';
import './index.css';
applyTheme(useThemeStore.getState().theme);
createRoot(document.getElementById('root')).render(<React.StrictMode>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</React.StrictMode>);
