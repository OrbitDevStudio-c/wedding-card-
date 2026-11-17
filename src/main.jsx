// Global styles first so component styles can override them in the cascade
import './styles/tokens.css';
import './styles/base.css';
import './components/FloatingControls.css';
import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { gifts } from './config.js';
import { LanguageProvider, initialLang, loadLanguage } from './i18n/index.jsx';
import { usePath } from './lib/router.js';

// The gifts page and the couple dashboard are separate chunks, so the invitation never
// downloads their code (and the public pages never download the dashboard's).
const GiftsPage = lazy(() => import('./gifts/GiftsPage.jsx'));
const CoupleApp = lazy(() => import('./couple/CoupleApp.jsx'));

function PageFallback() {
  return (
    <div className="page-loading" role="status">
      <span className="visually-hidden">Loading…</span>
    </div>
  );
}

function Root() {
  const path = usePath();
  if (gifts.enabled && (path === '/gifts' || path.startsWith('/gifts/'))) {
    return (
      <Suspense fallback={<PageFallback />}>
        <GiftsPage path={path} />
      </Suspense>
    );
  }
  if (path === '/couple' || path.startsWith('/couple/')) {
    return (
      <Suspense fallback={<PageFallback />}>
        <CoupleApp path={path} />
      </Suspense>
    );
  }
  return <App />;
}

function render() {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <LanguageProvider>
        <Root />
      </LanguageProvider>
    </StrictMode>,
  );
}

// A returning Gujarati guest gets the Gujarati pack before the first paint; if it cannot load,
// the page simply renders in English.
loadLanguage(initialLang()).catch(() => {}).finally(render);
