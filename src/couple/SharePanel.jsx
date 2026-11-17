import { useCallback, useEffect, useState } from 'react';
import { SITE_URL, couple } from '../config.js';
import { useI18n } from '../i18n/index.jsx';
import { FloralCorner } from '../components/Painted.jsx';
import { LoadError, Loading, useResource } from './shared.jsx';

// QR codes always encode the deployed domain (VITE_SITE_URL), never the address the couple
// happens to be browsing from, so a code generated on a laptop at localhost still works in print.
export const shareUrl = (path) => `${SITE_URL}${path}`;

const QR_OPTIONS = { errorCorrectionLevel: 'M', margin: 2, color: { dark: '#0b2b27', light: '#ffffff' } };

function download(href, name) {
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
}

export function QrCard({ title, path, fileName }) {
  const { t } = useI18n();
  const url = shareUrl(path);
  const [png, setPng] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [version, setVersion] = useState(0);

  const generate = useCallback(async () => {
    try {
      // The QR library is only downloaded when a QR code is actually shown.
      const QRCode = (await import('qrcode')).default;
      setPng(await QRCode.toDataURL(url, { ...QR_OPTIONS, width: 1024 }));
      setError('');
    } catch {
      setError(t('qr.error'));
    }
  }, [url, t]);

  useEffect(() => {
    generate();
  }, [generate, version]);

  const downloadSvg = async () => {
    const QRCode = (await import('qrcode')).default;
    const svg = await QRCode.toString(url, { ...QR_OPTIONS, type: 'svg' });
    const href = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    download(href, `${fileName}.svg`);
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t('qr.copyFailed'));
    }
  };

  return (
    <div className="qr-card" data-testid="qr-card" data-url={url}>
      <div className="qr-card__frame">
        <div className="qr-card__code">
          <FloralCorner className="qr-card__corner qr-card__corner--tl" />
          <FloralCorner className="qr-card__corner qr-card__corner--tr" />
          {png ? (
            <img src={png} alt={t('qr.alt', { title })} width="220" height="220" data-testid="qr-image" />
          ) : (
            <span className="couple-muted">{t('qr.generating')}</span>
          )}
        </div>
        <p className="qr-card__scan">{t('qr.scan')}</p>
      </div>
      <div className="qr-card__body">
        <p className="manage-item__name">{title}</p>
        <a className="qr-card__url" href={url} target="_blank" rel="noopener">
          {url}
        </a>
        {error && <p className="form-alert">{error}</p>}
        <div className="qr-card__actions">
          <button type="button" className="button button--small" onClick={() => download(png, `${fileName}.png`)} disabled={!png}>
            {t('qr.png')}
          </button>
          <button type="button" className="button button--ghost button--small" onClick={downloadSvg}>
            {t('qr.svg')}
          </button>
          <button type="button" className="button button--ghost button--small" onClick={copy}>
            {copied ? t('qr.copied') : t('qr.copy')}
          </button>
          <button type="button" className="button button--ghost button--small" onClick={() => setVersion((n) => n + 1)}>
            {t('qr.regenerate')}
          </button>
        </div>
        <span className="visually-hidden" aria-live="polite">
          {copied ? t('qr.copiedAnnounce') : ''}
        </span>
      </div>
    </div>
  );
}

export function SharePanel({ onAuthError }) {
  const { t } = useI18n();
  const [state, reload] = useResource('/couple/dreams', onAuthError);
  return (
    <div className="couple-stack">
      <p className="couple-muted">{t('share.intro', { url: SITE_URL })}</p>
      <section className="couple-card" aria-labelledby="master-qr">
        <h2 id="master-qr" className="couple-h2">
          {t('share.master')}
        </h2>
        <QrCard title={`${couple.bride.name} & ${couple.groom.name} · ${t('gifts.bar')}`} path="/gifts" fileName="wedding-gifts" />
      </section>
      <section className="couple-card" aria-labelledby="dream-qrs">
        <h2 id="dream-qrs" className="couple-h2">
          {t('share.dreams')}
        </h2>
        {state.status === 'loading' && <Loading />}
        {state.status === 'error' && <LoadError error={state.error} retry={reload} />}
        {state.status === 'ready' && (
          <div className="couple-stack">
            {state.data.dreams.map((d) => (
              <QrCard key={d.id} title={d.title} path={`/gifts/dream/${d.slug}`} fileName={`dream-${d.slug}`} />
            ))}
            {!state.data.dreams.length && <p className="couple-muted">{t('share.noDreams')}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
