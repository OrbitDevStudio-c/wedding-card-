import { useRef } from 'react';
import { photos, story } from '../config.js';
import { Picture } from '../components/Picture.jsx';
import { Reveal } from '../components/Reveal.jsx';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { useInView } from '../hooks/useInView.js';
import './Story.css';

export function Story() {
  const listRef = useRef(null);
  const drawn = useInView(listRef, { rootMargin: '0px 0px -30% 0px' });

  return (
    <section className="section tone-parchment story" id="story" aria-labelledby="story-title">
      <div className="container">
        <SectionHeading id="story-title" eyebrow="Chapter by chapter" title="Our Story" />
        <ol ref={listRef} className={`story__list ${drawn ? 'is-drawn' : ''}`}>
          {story.map((item, i) => {
            const photo = photos.story[item.photo];
            return (
              <Reveal as="li" key={item.year} className="story__item" delay={i * 120}>
                <div className="story__photo">
                  <Picture
                    name={item.photo}
                    alt={photo.alt}
                    width={photo.width}
                    height={photo.height}
                    sizes="(min-width: 768px) 160px, 112px"
                  />
                </div>
                <div className="story__body">
                  <p className="label story__year">{item.year}</p>
                  <h3 className="story__title">{item.title}</h3>
                  <p className="story__text">{item.text}</p>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
