import { photos } from '../config.js';

const srcSet = (name, ext) => photos.widths.map((w) => `${photos.basePath}/${name}-${w}.${ext} ${w}w`).join(', ');

// AVIF → WebP → JPEG with responsive widths. Width/height reserve space so nothing shifts.
export function Picture({ name, alt, width, height, sizes, className, imgClassName, loading = 'lazy' }) {
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={srcSet(name, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(name, 'webp')} sizes={sizes} />
      <img
        className={imgClassName}
        src={`${photos.basePath}/${name}-${photos.widths[1]}.jpg`}
        srcSet={srcSet(name, 'jpg')}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        decoding="async"
      />
    </picture>
  );
}
