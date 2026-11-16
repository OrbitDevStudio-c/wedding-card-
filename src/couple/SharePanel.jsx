import { useCallback, useEffect, useState } from 'react';
import { SITE_URL, couple } from '../config.js';
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
      setError('The QR code could not be generated.');
    }
  }, [url]);

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
      setError('Copy failed. Select the link and copy it manually.');
    }
  };

  return (
    <div className="qr-card" data-testid="qr-card" data-url={url}>
      <div className="qr-card__code">
        {png ? <img src={png} alt={`QR code that opens ${title}`} width="220" height="220" data-testid="qr-image" /> : <span className="couple-muted">Generating…</span>}
      </div>
      <div className="qr-card__body">
        <p className="manage-item__name">{title}</p>
        <a className="qr-card__url" href={url} target="_blank" rel="noopener">
          {url}
        </a>
        {error && <p className="form-alert">{error}</p>}
        <div className="qr-card__actions">
          <button type="button" className="button button--small" onClick={() => download(png, `${fileName}.png`)} disabled={!png}>
            Download PNG
          </button>
          <button type="button" className="button button--ghost button--small" onClick={downloadSvg}>
            Download SVG
          </button>
          <button type="button" className="button button--ghost button--small" onClick={copy}>
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button type="button" className="button button--ghost button--small" onClick={() => setVersion((n) => n + 1)}>
            Regenerate
          </button>
        </div>
        <span className="visually-hidden" aria-live="polite">
          {copied ? 'Link copied' : ''}
        </span>
      </div>
    </div>
  );
}

export function SharePanel({ onAuthError }) {
  const [state, reload] = useResource('/couple/dreams', onAuthError);
  return (
    <div className="couple-stack">
      <p className="couple-muted">
        Codes point to <strong>{SITE_URL}</strong>. Print them on cards or share them on WhatsApp. If you change a dream's link, download its
        code again.
      </p>
      <section className="couple-card" aria-labelledby="master-qr">
        <h2 id="master-qr" className="couple-h2">
          Wedding Gifts page
        </h2>
        <QrCard title={`${couple.bride.name} & ${couple.groom.name} · Wedding Gifts`} path="/gifts" fileName="wedding-gifts" />
      </section>
      <section className="couple-card" aria-labelledby="dream-qrs">
        <h2 id="dream-qrs" className="couple-h2">
          Dreams
        </h2>
        {state.status === 'loading' && <Loading />}
        {state.status === 'error' && <LoadError error={state.error} retry={reload} />}
        {state.status === 'ready' && (
          <div className="couple-stack">
            {state.data.dreams.map((d) => (
              <QrCard key={d.id} title={d.title} path={`/gifts/dream/${d.slug}`} fileName={`dream-${d.slug}`} />
            ))}
            {!state.data.dreams.length && <p className="couple-muted">Add a dream to get its QR code.</p>}
          </div>
        )}
      </section>
    </div>
  );
}
