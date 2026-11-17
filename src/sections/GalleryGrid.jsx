import { useI18n } from '../i18n/index.jsx';
import { lazy, Suspense, useCallback, useRef, useState } from 'react';
import { Picture } from '../components/Picture.jsx';
import { Reveal } from '../components/Reveal.jsx';

const Lightbox = lazy(() => import('../components/Lightbox.jsx'));

export default function GalleryGrid() {
  const { t, content } = useI18n();
  const { photos } = content;
  const [index, setIndex] = useState(-1);
  const triggers = useRef([]);
  const opener = useRef(null);

  const open = (i) => {
    opener.current = triggers.current[i];
    setIndex(i);
  };

  const close = useCallback(() => {
    opener.current?.focus({ preventScroll: true });
    setIndex(-1);
  }, []);

  return (
    <>
      <ul className="gallery__grid">
        {photos.gallery.map((photo, i) => (
          <Reveal as="li" key={photo.name} className="gallery__item" delay={(i % 3) * 100}>
            <button
              ref={(el) => (triggers.current[i] = el)}
              type="button"
              className="gallery__button"
              onClick={() => open(i)}
              aria-label={t('gallery.open', { n: i + 1, total: photos.gallery.length, alt: photo.alt })}
            >
              <Picture
                name={photo.name}
                alt=""
                width={photo.width}
                height={photo.height}
                sizes="(min-width: 1024px) 360px, (min-width: 768px) 33vw, 50vw"
                imgClassName="gallery__img"
              />
            </button>
          </Reveal>
        ))}
      </ul>
      {index >= 0 && (
        <Suspense fallback={null}>
          <Lightbox items={photos.gallery} index={index} onIndex={setIndex} onClose={close} />
        </Suspense>
      )}
    </>
  );
}
