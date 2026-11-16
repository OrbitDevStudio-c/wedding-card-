// Generates the sample wishlist and dream artwork in /public/gifts as small line-art SVGs in the
// invitation's palette. Couples replace these by uploading real photos from the dashboard.
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = new URL('../public/gifts/', import.meta.url);
const EM = '#165047';
const GOLD = '#b8955a';

const ring = (cx, cy, r, op = 0.18) =>
  Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    return `<ellipse cx="${cx + Math.cos(a) * r}" cy="${cy + Math.sin(a) * r}" rx="${r * 0.32}" ry="${r * 0.12}" transform="rotate(${(a * 180) / Math.PI} ${cx + Math.cos(a) * r} ${cy + Math.sin(a) * r})" fill="none" stroke="${GOLD}" stroke-opacity="${op}"/>`;
  }).join('');

const product = (title, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" role="img" aria-label="${title}">
<defs><radialGradient id="bg" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#fdfaf3"/><stop offset="1" stop-color="#ece0c6"/></radialGradient></defs>
<rect width="600" height="600" fill="url(#bg)"/>
${ring(300, 290, 190)}
<circle cx="300" cy="290" r="150" fill="none" stroke="${GOLD}" stroke-opacity=".35"/>
<g fill="none" stroke="${EM}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${body}</g>
<path d="M240 520h120M280 520l20-10 20 10" fill="none" stroke="${GOLD}" stroke-width="2"/>
</svg>`;

const items = {
  watch: [
    'Apple Watch',
    `<rect x="225" y="200" width="150" height="180" rx="38"/><path d="M250 200l12-70h76l12 70M250 380l12 70h76l12-70"/><rect x="375" y="255" width="12" height="36" rx="5"/>
     <path d="M300 245v45l30 22" stroke="${GOLD}"/><circle cx="300" cy="290" r="58" stroke-width="3" stroke="${GOLD}"/>`,
  ],
  sneakers: [
    'Sneakers',
    `<path d="M140 360c0-30 10-60 25-80l40 20c30 15 70 15 95-5l25 35c40 25 100 35 140 40 20 3 30 20 25 40H150c-6 0-10-4-10-10z"/>
     <path d="M140 380h350M210 300l15 25M240 305l12 25M270 302l10 25"/><path d="M180 345c80 0 150-5 200-20" stroke="${GOLD}"/>`,
  ],
  headphones: [
    'Headphones',
    `<path d="M190 330v-40a110 110 0 0 1 220 0v40"/><rect x="165" y="320" width="55" height="95" rx="22"/><rect x="380" y="320" width="55" height="95" rx="22"/>
     <path d="M192 345v45M408 345v45" stroke="${GOLD}"/>`,
  ],
  coffee: [
    'Coffee machine',
    `<rect x="200" y="170" width="200" height="250" rx="18"/><path d="M200 230h200M260 230v40h80v-40"/><path d="M265 330h70v50a20 20 0 0 1-20 20h-30a20 20 0 0 1-20-20z"/>
     <path d="M335 345h14a12 12 0 0 1 0 24h-14"/><path d="M285 305c-8-10 8-18 0-28M315 305c-8-10 8-18 0-28" stroke="${GOLD}"/><circle cx="370" cy="200" r="9"/>`,
  ],
  perfume: [
    'Perfume',
    `<rect x="215" y="255" width="170" height="185" rx="26"/><rect x="265" y="205" width="70" height="50" rx="8"/><rect x="280" y="170" width="40" height="35" rx="6"/>
     <path d="M240 300h120" stroke="${GOLD}"/><path d="M300 330l14 30 32 4-24 22 6 32-28-16-28 16 6-32-24-22 32-4z" stroke="${GOLD}" stroke-width="3"/>`,
  ],
  dinnerware: [
    'Dinner set',
    `<ellipse cx="300" cy="330" rx="160" ry="62"/><ellipse cx="300" cy="322" rx="105" ry="38" stroke="${GOLD}"/><ellipse cx="300" cy="318" rx="60" ry="20"/>
     <path d="M120 250v120M110 250v35a10 10 0 0 0 20 0v-35M480 250c18 0 22 40 0 50v70"/>`,
  ],
  spa: [
    'Spa day',
    `<path d="M300 420c-60-40-70-110-0-190 70 80 60 150 0 190z"/><path d="M300 420c-70 0-130-40-150-110 70-5 130 40 150 110zM300 420c70 0 130-40 150-110-70-5-130 40-150 110z"/>
     <path d="M300 420V300" stroke="${GOLD}"/><path d="M180 455h240" stroke="${GOLD}"/>`,
  ],
};

const scene = (title, body, sky = ['#0b2b27', '#1e6458']) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" role="img" aria-label="${title}">
<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient></defs>
<rect width="1200" height="800" fill="url(#sky)"/>
${ring(960, 190, 150, 0.12)}
<g fill="none" stroke="#e2c995" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">${body}</g>
</svg>`;

const dreams = {
  'dream-alps': scene(
    'Snow-capped Alps',
    `<circle cx="960" cy="190" r="70"/><path d="M0 620l220-300 120 140 180-260 230 330 140-160 310 250"/>
     <path d="M440 300l80-100 80 100-40-10-40 30-40-30zM180 375l40-55 50 60-30-8z" fill="#f7f0e1" fill-opacity=".85"/>
     <path d="M0 700c200-40 400-40 600 0s400 40 600 0" stroke-opacity=".6"/><path d="M150 760h900" stroke-opacity=".4"/>`,
  ),
  'dream-home': scene(
    'A home with a garden',
    `<circle cx="960" cy="190" r="60"/><path d="M380 640V420l220-170 220 170v220z"/><path d="M340 450l260-200 260 200"/>
     <path d="M540 640V520h120v120M440 470h70v60h-70zM690 470h70v60h-70z"/><path d="M700 330v-70h50v110"/>
     <path d="M120 640h960M200 640c0-60 30-90 30-90s30 30 30 90M980 640c0-70 35-100 35-100s35 30 35 100" stroke-opacity=".7"/>`,
    ['#0f3b35', '#165047'],
  ),
  'dream-anniversary': scene(
    'Two people under an umbrella in the rain',
    `<path d="M420 360a180 180 0 0 1 360 0z"/><path d="M420 360c30-25 60-25 90 0 30-25 60-25 90 0 30-25 60-25 90 0 30-25 60-25 90 0"/>
     <path d="M600 180v-20M600 360v200a25 25 0 0 1-50 0"/><circle cx="520" cy="450" r="26"/><circle cx="680" cy="450" r="26"/>
     <path d="M520 476v130M680 476v130M490 530h60M650 530h60"/>
     ${Array.from({ length: 26 }, (_, i) => `<path d="M${60 + (i * 47) % 1100} ${80 + ((i * 131) % 600)}l-10 26" stroke-opacity=".45"/>`).join('')}`,
    ['#061b18', '#0f3b35'],
  ),
};

await mkdir(OUT, { recursive: true });
for (const [name, [title, body]] of Object.entries(items)) await writeFile(new URL(`${name}.svg`, OUT), product(title, body));
for (const [name, svg] of Object.entries(dreams)) await writeFile(new URL(`${name}.svg`, OUT), svg);
console.log(`Wrote ${Object.keys(items).length + Object.keys(dreams).length} illustrations to public/gifts/`);
