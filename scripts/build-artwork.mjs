// Prepares the painted artwork in src/assets/artwork from the originals in photos-src.
//
//   node scripts/build-artwork.mjs
//
// - Cuts the baked-in white/grey background out of the peacock feather (a soft key on
//   low-saturation light pixels, so the fine coloured strands keep their edges).
// - Makes a horizontal copy of the feather for section dividers.
// - Converts everything to compact WebP with real transparency.
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const OUT = 'src/assets/artwork';
await mkdir(OUT, { recursive: true });

async function cutOutLightBackground(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const sat = max - Math.min(r, g, b);
    // Near-white or light grey (the background and its checkerboard): transparent.
    // Saturated colour: opaque. In between: a soft ramp, so antialiased edges blend.
    const lightness = max / 255;
    let alpha = 255;
    if (lightness > 0.75) {
      const t = Math.min(1, Math.max(0, (sat - 18) / 50));
      alpha = Math.round(255 * t);
    }
    data[i + 3] = Math.min(data[i + 3], alpha);
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

const webp = (input, name, width) =>
  sharp(input)
    .trim({ threshold: 1 })
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 84, alphaQuality: 90, effort: 6 })
    .toFile(`${OUT}/${name}.webp`)
    .then((r) => console.log(`${name}.webp ${r.width}x${r.height} ${Math.round(r.size / 1024)} KB`));

// Peacock feather: cut out, then upright and horizontal (eye pointing right) versions
const feather = await cutOutLightBackground('photos-src/peacock feather.png');
await webp(feather, 'peacock-feather', 360);
const horizontal = await sharp(feather).rotate(49, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer();
await webp(horizontal, 'peacock-feather-horizontal', 420);

// Already transparent: convert and size for their largest use (2x for retina where the source allows)
await webp('photos-src/peackcok main.webp', 'royal-peacock', 720);
await webp('src/assets/royal-elephant-transparent-v2.png', 'royal-elephant', 840);
await webp('src/assets/floral-peacock-transparent-wide.png', 'floral-peacock', 360);
await webp('src/assets/lotus-transparent.png', 'lotus', 350);
