import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon.jsx';
import { Picture } from './Picture.jsx';
import './Lightbox.css';

export default function Lightbox({ items, index, onIndex, onClose }) {
  const ref = useRef(null);
  const closeRef = useRef(null);
  const swipe = useRef(null);
  const item = items[index];
  const count = items.length;

  const go = (step) => onIndex((index + step + count) % count);

  useEffect(() => {
    closeRef.current.focus();
    document.body.classList.add('is-locked');
    return () => document.body.classList.remove('is-locked');
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onIndex((index + 1) % count);
      else if (e.key === 'ArrowLeft') onIndex((index - 1 + count) % count);
      else if (e.key === 'Tab') {
        // Keep focus inside the dialog
        const focusable = ref.current.querySelectorAll('button');
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, count, onIndex, onClose]);

  const onPointerDown = (e) => {
    swipe.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = (e) => {
    if (!swipe.current) return;
    const dx = e.clientX - swipe.current.x;
    const dy = e.clientY - swipe.current.y;
    swipe.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
  };

  return createPortal(
    <div
      ref={ref}
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Photo viewer"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button ref={closeRef} type="button" className="lightbox__control lightbox__close" onClick={onClose} aria-label="Close photo viewer">
        <Icon name="close" />
      </button>
      <figure className="lightbox__figure" onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <Picture
          key={item.name}
          name={item.name}
          alt={item.alt}
          width={item.width}
          height={item.height}
          sizes="(min-width: 1024px) 80vw, 100vw"
          loading="eager"
          className="lightbox__picture"
          imgClassName="lightbox__img"
        />
        <figcaption className="lightbox__caption">
          <span className="label" aria-live="polite">
            {index + 1} / {count}
          </span>
          <span>{item.alt}</span>
        </figcaption>
      </figure>
      <button type="button" className="lightbox__control lightbox__prev" onClick={() => go(-1)} aria-label="Previous photo">
        <Icon name="chevronLeft" />
      </button>
      <button type="button" className="lightbox__control lightbox__next" onClick={() => go(1)} aria-label="Next photo">
        <Icon name="chevronRight" />
      </button>
    </div>,
    document.body,
  );
}
