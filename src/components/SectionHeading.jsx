import { withAmp } from './Amp.jsx';
import { Ornament } from './Ornament.jsx';
import { Reveal } from './Reveal.jsx';
import './SectionHeading.css';

export function SectionHeading({ id, eyebrow, title, children }) {
  return (
    <Reveal as="header" className="section-heading">
      <p className="label section-heading__eyebrow">{eyebrow}</p>
      <h2 id={id} className="script section-heading__title">
        {withAmp(title)}
      </h2>
      <Ornament className="section-heading__ornament" />
      {children && <p className="lede section-heading__lede">{children}</p>}
    </Reveal>
  );
}
