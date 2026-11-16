import crypto from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import sharp from 'sharp';
import { env } from '../env.js';
import { HttpError } from './validate.js';

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif']);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter: (_req, file, cb) =>
    ALLOWED.has(file.mimetype) ? cb(null, true) : cb(new HttpError(400, 'invalid_image', 'Please upload a JPEG, PNG, WebP or AVIF image.')),
});

// Every upload is decoded and re-encoded by sharp: anything that is not really an image fails
// here, and metadata (EXIF location etc.) and any embedded payloads are dropped.
export async function saveImage(buffer, weddingId) {
  let output;
  try {
    output = await sharp(buffer, { limitInputPixels: 40_000_000 })
      .rotate()
      .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new HttpError(400, 'invalid_image', 'That file could not be read as an image.');
  }
  const dir = path.join(env.UPLOAD_DIR, String(weddingId));
  await mkdir(dir, { recursive: true });
  const name = `${crypto.randomUUID()}.webp`;
  await writeFile(path.join(dir, name), output);
  return `/api/uploads/${weddingId}/${name}`;
}
