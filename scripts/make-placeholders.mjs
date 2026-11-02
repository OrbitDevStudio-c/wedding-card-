// Writes tasteful illustrated placeholders into /photos-src for every photo named in
// src/config.js. Real photos dropped into /photos-src with the same names replace them.
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { photos } from '../src/config.js';

const OUT = new URL('../photos-src/', import.meta.url);

const moods = [
  ['#0F3B35', '#2F6B5E', '#E7C98F'],
  ['#3A2B4A', '#9A5C6E', '#F2C79A'],
  ['#18324F', '#4F7A94', '#EBD3A4'],
  ['#4A2E2A', '#B0694E', '#F5D8A8'],
  ['#1E3D36', '#7C8F6A', '#F1E2B8'],
  ['#2C2440', '#B07A5C', '#F7CF8E'],
];

function scene(w, h, [deep, mid, light], seed) {
  const horizon = h * 0.62;
  const sunR = Math.min(w, h) * 0.14;
  const sunX = w * (0.3 + (seed % 3) * 0.2);
  const archW = w * 0.56;
  const archX = (w - archW) / 2;
  const archTop = h * 0.16;
  const ripples = Array.from({ length: 7 }, (_, i) => {
    const y = horizon + 14 + i * (h - horizon) / 8;
    const len = w * (0.12 + ((i * 37 + seed * 11) % 25) / 100);
    const x = (w - len) / 2 + (((i * 53 + seed * 17) % 40) - 20) * w / 200;
    return `<line x1="${x}" y1="${y}" x2="${x + len}" y2="${y}" stroke="${light}" stroke-opacity="${0.35 - i * 0.04}" stroke-width="${Math.max(2, w / 300)}" stroke-linecap="round"/>`;
  }).join('');
  const domes = [0.2, 0.38, 0.62, 0.8].map((p, i) => {
    const cx = w * p;
    const r = w * (i % 3 ? 0.035 : 0.05);
    const base = horizon - h * 0.08 - (i % 2) * h * 0.04;
    return `<rect x="${cx - r}" y="${base}" width="${r * 2}" height="${horizon - base}" fill="${deep}" fill-opacity="0.55"/>
      <path d="M${cx - r} ${base} Q${cx - r} ${base - r * 1.5} ${cx} ${base - r * 2} Q${cx + r} ${base - r * 1.5} ${cx + r} ${base} Z" fill="${deep}" fill-opacity="0.55"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${deep}"/><stop offset="0.7" stop-color="${mid}"/><stop offset="1" stop-color="${light}"/>
    </linearGradient>
    <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${mid}"/><stop offset="1" stop-color="${deep}"/>
    </linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="${light}" stop-opacity="0.9"/><stop offset="1" stop-color="${light}" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${w}" height="${horizon}" fill="url(#sky)"/>
  <circle cx="${sunX}" cy="${horizon - sunR * 0.6}" r="${sunR * 2.6}" fill="url(#glow)" opacity="0.6"/>
  <circle cx="${sunX}" cy="${horizon - sunR * 0.6}" r="${sunR}" fill="${light}" opacity="0.85"/>
  ${domes}
  <rect y="${horizon}" width="${w}" height="${h - horizon}" fill="url(#lake)"/>
  ${ripples}
  <path d="M${archX} ${h} V${archTop + archW / 2} A${archW / 2} ${archW / 2} 0 0 1 ${archX + archW} ${archTop + archW / 2} V${h}"
    fill="none" stroke="${light}" stroke-opacity="0.55" stroke-width="${Math.max(3, w / 220)}"/>
  <path d="M${archX + w * 0.03} ${h} V${archTop + archW / 2 + w * 0.02} A${archW / 2 - w * 0.03} ${archW / 2 - w * 0.03} 0 0 1 ${archX + archW - w * 0.03} ${archTop + archW / 2 + w * 0.02} V${h}"
    fill="none" stroke="${light}" stroke-opacity="0.25" stroke-width="${Math.max(2, w / 400)}"/>
</svg>`;
}

await mkdir(OUT, { recursive: true });

const entries = [
  ...Object.entries(photos.story).map(([name, p]) => ({ name, ...p })),
  ...photos.gallery,
];

for (const [i, p] of entries.entries()) {
  const svg = scene(p.width, p.height, moods[i % moods.length], i);
  const jpg = await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
  await writeFile(new URL(`${p.name}.jpg`, OUT), jpg);
}

process.stdout.write(`Wrote ${entries.length} placeholders to photos-src/\n`);
