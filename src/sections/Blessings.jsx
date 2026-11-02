import { blessings, couple } from '../config.js';
import { withAmp } from '../components/Amp.jsx';
import { Mandala } from '../components/Motifs.jsx';
import { Ornament } from '../components/Ornament.jsx';
import { Reveal } from '../components/Reveal.jsx';
import './Blessings.css';

export function Blessings() {
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
          <p className="label blessings__eyebrow">With love &amp; gratitude</p>
          <h2 id="blessings-title" className="script blessings__title">
            Thank You
          </h2>
          <Ornament className="blessings__ornament" />
          <blockquote className="blessings__quote">
            <p>“{blessings.quote}”</p>
          </blockquote>
          <p className="blessings__message">{blessings.message}</p>
          <p className="script blessings__signature">{withAmp(blessings.signature)}</p>
          <p className="label blessings__hashtag">{couple.hashtag}</p>
        </Reveal>
      </div>
    </section>
  );
}
