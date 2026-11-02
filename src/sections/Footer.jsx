import { credit } from '../config.js';
import { Monogram } from '../components/Monogram.jsx';
import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <Monogram className="footer__monogram" shimmer={false} label={false} />
      <p className="footer__credit">
        {credit.text}{' '}
        <span role="img" aria-label="love">
          ❤️
        </span>{' '}
        in India by{' '}
        <a href={credit.url} target="_blank" rel="noopener">
          {credit.by}
        </a>
      </p>
    </footer>
  );
}
