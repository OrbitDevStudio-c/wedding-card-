import { lazy, Suspense, useRef } from 'react';
import { photos } from '../config.js';
import { SectionHeading } from '../components/SectionHeading.jsx';
import { useInView } from '../hooks/useInView.js';
import './Gallery.css';

const GalleryGrid = lazy(() => import('./GalleryGrid.jsx'));

// The grid (and its lightbox) are separate chunks fetched shortly before the section scrolls in.
export function Gallery() {
  const ref = useRef(null);
  const near = useInView(ref, { rootMargin: '800px 0px 800px 0px' });

  return (
    <section
      ref={ref}
      className="section tone-dark has-scallop has-scallop-bottom gallery"
      id="gallery"
      aria-labelledby="gallery-title"
      style={{ '--scallop-from': 'var(--ivory-100)', '--scallop-to': 'var(--ivory-50)' }}
    >
      <div className="container">
        <SectionHeading id="gallery-title" eyebrow="A few of our favourite frames" title="Moments" />
        {near ? (
          <Suspense fallback={<div className="gallery__placeholder" style={{ '--count': photos.gallery.length }} />}>
            <GalleryGrid />
          </Suspense>
        ) : (
          <div className="gallery__placeholder" style={{ '--count': photos.gallery.length }} />
        )}
      </div>
    </section>
  );
}
