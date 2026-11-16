import { couple, dates, gifts, invitation, photos } from '../config.js';
import { withAmp } from '../components/Amp.jsx';
import { Mandala } from '../components/Motifs.jsx';
import { Ornament } from '../components/Ornament.jsx';
import { Picture } from '../components/Picture.jsx';

export function GiftsHero({ guest }) {
  const { hero } = gifts;
  const photo = photos.gallery.find((p) => p.name === hero.photo) || photos.gallery[0];
  return (
    <section className="gifts-hero tone-dark" aria-labelledby="gifts-hero-title">
      <Mandala className="gifts-hero__mandala" />
      <div className="container gifts-hero__inner">
        <div className="gifts-hero__text">
          {guest && <p className="gifts-hero__greeting">{invitation.personalGreeting.replace('{guest}', guest)}</p>}
          <p className="label gifts-hero__eyebrow">{hero.eyebrow}</p>
          <h1 id="gifts-hero-title" className="script gifts-hero__title">
            {withAmp(hero.title)}
          </h1>
          <Ornament className="gifts-hero__ornament" />
          <p className="lede gifts-hero__message">{hero.message}</p>
          <p className="gifts-hero__couple">
            <span className="script">
              {couple.bride.name} <span className="amp">&amp;</span> {couple.groom.name}
            </span>
            <span className="label">{dates.display}</span>
          </p>
          <nav className="gifts-hero__nav" aria-label="Gift sections">
            <a className="button button--gold" href="#wishlist">
              Our Wishlist
            </a>
            <a className="button button--ghost" href="#dreams">
              Our Dreams
            </a>
          </nav>
        </div>
        <div className="gifts-hero__photo">
          <Picture
            name={photo.name}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            sizes="(min-width: 1024px) 420px, 70vw"
            loading="eager"
            imgClassName="gifts-hero__img"
          />
        </div>
      </div>
    </section>
  );
}
