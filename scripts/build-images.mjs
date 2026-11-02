// Converts every image in /photos-src into AVIF, WebP and JPEG at the widths listed in
// src/config.js, cropped to the aspect ratio configured for that photo.
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { photos } from '../src/config.js';

const root = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(root, '..', 'photos-src');
const OUT = path.join(root, '..', 'public', photos.basePath);

const ratios = new Map([
  ...Object.entries(photos.story).map(([name, p]) => [name, p.height / p.width]),
  ...photos.gallery.map((p) => [p.name, p.height / p.width]),
]);

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png|webp|avif|heic)$/i.test(f));

for (const file of files) {
  const name = path.parse(file).name;
  const ratio = ratios.get(name);
  for (const width of photos.widths) {
    // Never upscale: a smaller original simply caps the largest variant at its own size
    const resize = ratio
      ? { width, height: Math.round(width * ratio), fit: 'cover', position: 'attention', withoutEnlargement: true }
      : { width, withoutEnlargement: true };
    const base = sharp(path.join(SRC, file)).rotate().resize(resize);
    await Promise.all([
      base.clone().avif({ quality: 50, effort: 6 }).toFile(path.join(OUT, `${name}-${width}.avif`)),
      base.clone().webp({ quality: 74 }).toFile(path.join(OUT, `${name}-${width}.webp`)),
      base.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(OUT, `${name}-${width}.jpg`)),
    ]);
  }
  process.stdout.write(`✓ ${name}\n`);
}
