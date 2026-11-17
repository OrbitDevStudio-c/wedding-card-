import { credit } from '../config.js';
import { useI18n } from '../i18n/index.jsx';
import { Monogram } from '../components/Monogram.jsx';
import './Footer.css';

export function Footer() {
  const { t } = useI18n();
  // The sentence order differs between languages, so the heart and studio link are slotted in.
  const parts = t('footer.credit').split(/(\{heart\}|\{studio\})/);
  return (
    <footer className="footer">
      <Monogram className="footer__monogram" shimmer={false} label={false} />
      <p className="footer__credit">
        {parts.map((part, i) =>
          part === '{heart}' ? (
            <span key={i} role="img" aria-label={t('footer.love')}>
              ❤️
            </span>
          ) : part === '{studio}' ? (
            <a key={i} href={credit.url} target="_blank" rel="noopener">
              {credit.by}
            </a>
          ) : (
            part
          ),
        )}
      </p>
    </footer>
  );
}
