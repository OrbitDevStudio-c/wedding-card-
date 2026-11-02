// Global styles first so component styles can override them in the cascade
import './styles/tokens.css';
import './styles/base.css';
import './components/FloatingControls.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
