// Decorative line-art motifs. They are built once as SVG strings and used as CSS backgrounds,
// which keeps several hundred purely ornamental nodes out of the DOM (and out of style/layout).

const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

const SWAG = 150;
const FLOWER_COLORS = ['#e39b2d', '#f0b44c', '#e39b2d', '#d9822b', '#f0b44c', '#e39b2d'];

function quad(p0, c, p1, t) {
  const u = 1 - t;
  return [u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]];
}

// One period of the marigold toran, centred on a junction (where the mango leaf hangs).
// Two half-visible swags either side make the tile repeat seamlessly across any width.
const toranTile = (() => {
  const swags = [-SWAG / 2, SWAG / 2].map((x0) => ({ p0: [x0, 6], c: [x0 + SWAG / 2, 58], p1: [x0 + SWAG, 6] }));
  const flowers = swags
    .flatMap(({ p0, c, p1 }) =>
      FLOWER_COLORS.map((color, i) => {
        const [x, y] = quad(p0, c, p1, 0.12 + i * 0.152).map((n) => n.toFixed(1));
        return `<circle cx="${x}" cy="${y}" r="7" fill="${color}"/><circle cx="${x}" cy="${y}" r="7" fill="none" stroke="#b5651d" stroke-width=".8" stroke-dasharray="2 1.6"/><circle cx="${x}" cy="${y}" r="2.2" fill="#9c4f12"/>`;
      }),
    )
    .join('');
  const cords = swags.map(({ p0, c, p1 }) => `<path d="M${p0[0]} 6Q${c[0]} ${c[1]} ${p1[0]} 6" fill="none" stroke="#7a5c2b"/>`).join('');
  const x = SWAG / 2;
  const leaf = `<path d="M${x} 6C${x - 8} 22 ${x - 5} 38 ${x} 48C${x + 5} 38 ${x + 8} 22 ${x} 6Z" fill="#1e6458"/><path d="M${x} 10V44" stroke="#9fc3a8" stroke-width=".8"/><circle cx="${x}" cy="54" r="3" fill="#cfae72"/><path d="M${x} 57V66" stroke="#cfae72"/><circle cx="${x}" cy="69" r="2" fill="#cfae72"/>`;
  return svgUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SWAG} 84" width="${SWAG}" height="84">` +
      `<path d="M0 4H${SWAG}" stroke="#7a5c2b" stroke-width="1.5"/>${cords}${leaf}${flowers}</svg>`,
  );
})();

const mandalaRings = [
  { count: 12, r: 40, len: 26, w: 9 },
  { count: 16, r: 74, len: 30, w: 11 },
  { count: 24, r: 112, len: 26, w: 8 },
  { count: 32, r: 150, len: 22, w: 6 },
];

const mandalaSvg = (color) =>
  svgUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-200 -200 400 400" fill="none" stroke="${color}">` +
      [20, 66, 104, 142, 176, 196].map((r) => `<circle r="${r}" stroke-width="${r % 2 ? 0.6 : 0.9}"/>`).join('') +
      '<circle r="186" stroke-width=".6" stroke-dasharray="1 5"/>' +
      mandalaRings
        .map(({ count, r, len, w }) => {
          const d = `M0 ${-r + len / 2}C${-w} ${-r} ${-w / 2} ${-r - len / 2} 0 ${-r - len / 2 - 4}C${w / 2} ${-r - len / 2} ${w} ${-r} 0 ${-r + len / 2}Z`;
          return Array.from({ length: count }, (_, i) => `<path d="${d}" transform="rotate(${((360 / count) * i).toFixed(2)})" stroke-width=".8"/>`).join('');
        })
        .join('') +
      '</svg>',
  );

const mandalaGold = mandalaSvg('#cfae72');

export function Toran({ className = '' }) {
  return <div className={`toran ${className}`} style={{ backgroundImage: toranTile }} aria-hidden="true" />;
}

export function Mandala({ className = '' }) {
  return <div className={`mandala ${className}`} style={{ backgroundImage: mandalaGold }} aria-hidden="true" />;
}
