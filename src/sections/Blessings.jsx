import { useI18n } from '../i18n/index.jsx';
import { withAmp } from '../components/Amp.jsx';
import { Mandala } from '../components/Motifs.jsx';
import { LotusDivider, Lotus, SidePeacock } from '../components/Painted.jsx';
import { Reveal } from '../components/Reveal.jsx';
import './Blessings.css';

export function Blessings() {
  const { t, content } = useI18n();
  const { blessings, couple } = content;
  return (
    <section
      className="section tone-dark has-scallop blessings"
      id="blessings"
      aria-labelledby="blessings-title"
      style={{ '--scallop-from': 'var(--ivory-100)' }}
    >
      <div className="container">
        <Reveal className="blessings__card">
          <Mandala className="blessings__mandala" />
          <p className="label blessings__eyebrow">{t('blessings.eyebrow')}</p>
          <h2 id="blessings-title" className="script blessings__title">
            {t('blessings.title')}
          </h2>
          <LotusDivider className="blessings__ornament" />
          <blockquote className="blessings__quote">
            <p>“{blessings.quote}”</p>
          </blockquote>
          <p className="blessings__message">{blessings.message}</p>
          <p className="script latin blessings__signature" lang="en">{withAmp(blessings.signature)}</p>
          <p className="label blessings__hashtag">{couple.hashtag}</p>
          <div className="blessings__elephants" aria-hidden="true">
            <SidePeacock className="blessings__peacock" />
            <Lotus className="blessings__lotus" />
            <SidePeacock className="blessings__peacock" flip />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
