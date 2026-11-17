import './Painted.css';
import elephantArt from '../assets/artwork/royal-elephant.webp';
import featherArt from '../assets/artwork/peacock-feather.webp';
import featherFlatArt from '../assets/artwork/peacock-feather-horizontal.webp';
import floralPeacockArt from '../assets/artwork/floral-peacock.webp';
import lotusArt from '../assets/artwork/lotus.webp';
import peacockArt from '../assets/artwork/royal-peacock.webp';

/*
  The painted collection used across the invitation, the gift page and the dashboard.
  Elephant, peacocks, lotus and feather are painted artwork (WebP with real transparency,
  prepared from photos-src by `node scripts/build-artwork.mjs`); the marigolds and floral
  corners are drawn in SVG in the same palette. Everything here is decorative.

  Facing: the artwork is normalised so every piece faces RIGHT by default; `flip` turns it to
  face left. Place pairs so each one looks towards the centre (left piece default, right flipped).
*/

export const PAL = {
  saffron: '#d98235',
  saffronLight: '#eaa457',
  vermilion: '#c94b36',
  gold: '#c5a15b',
  goldLight: '#e5c98a',
  pink: '#d98ba3',
  ivory: '#f8f3e8',
  leaf: '#657c45',
  leafDeep: '#46592f',
  ink: '#2b1d1a',
};

// Intrinsic sizes reserve space before the image loads (no layout shift).
function Art({ src, width, height, className, mirror = false, eager = false }) {
  return (
    <img
      className={`painted ${mirror ? 'painted--mirror' : ''} ${className}`}
      src={src}
      width={width}
      height={height}
      alt=""
      aria-hidden="true"
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable="false"
    />
  );
}

/* The source elephant faces left, so it is mirrored to face right by default. */
export function RoyalElephant({ className = '', flip = false, eager = false }) {
  return <Art src={elephantArt} width={617} height={583} className={`painted-elephant ${className}`} mirror={!flip} eager={eager} />;
}

/* The source peacock faces left too: mirrored to face right by default. */
export function RoyalPeacock({ className = '', flip = false, eager = false }) {
  return <Art src={peacockArt} width={309} height={237} className={`painted-peacock ${className}`} mirror={!flip} eager={eager} />;
}

/* A peacock perched among flowers; faces right. */
export function SidePeacock({ className = '', flip = false }) {
  return <Art src={floralPeacockArt} width={140} height={210} className={`painted-sidepeacock ${className}`} mirror={flip} />;
}

export function Lotus({ className = '' }) {
  return <Art src={lotusArt} width={334} height={222} className={`painted-lotus ${className}`} />;
}

/* One peacock feather, eye up and to the right. */
export function PaintedFeather({ className = '', flip = false }) {
  return <Art src={featherArt} width={306} height={346} className={`painted-feather ${className}`} mirror={flip} />;
}

/* Section divider: two peacock feathers, eyes outward, either side of a lotus. */
export function LotusDivider({ className = '' }) {
  return (
    <span className={`painted-divider ${className}`} aria-hidden="true">
      <Art src={featherFlatArt} width={420} height={182} className="painted-divider__feather" mirror />
      <Art src={lotusArt} width={334} height={222} className="painted-divider__lotus" />
      <Art src={featherFlatArt} width={420} height={182} className="painted-divider__feather" />
    </span>
  );
}

/* ============================== MARIGOLDS & FLORAL (SVG) ============================== */

// A marigold head: rings of ruffled saffron petals.
function MarigoldHead({ x, y, r = 10, light = false }) {
  const rings = [
    [r, light ? '#f2b84b' : PAL.saffron],
    [r * 0.72, light ? '#f6cd6a' : PAL.saffronLight],
    [r * 0.42, light ? '#f9dc8a' : '#f0b860'],
  ];
  return (
    <g transform={`translate(${x} ${y})`}>
      {rings.map(([rr, fill], k) => (
        <g key={k}>
          {Array.from({ length: 14 }, (_, i) => {
            const a = (i / 14) * Math.PI * 2 + k * 0.2;
            return <circle key={i} cx={Math.cos(a) * rr * 0.62} cy={Math.sin(a) * rr * 0.62} r={rr * 0.42} fill={fill} stroke={PAL.vermilion} strokeWidth="0.35" />;
          })}
        </g>
      ))}
      <circle r={r * 0.18} fill={PAL.vermilion} />
    </g>
  );
}

export function Marigold({ className = '' }) {
  return (
    <svg className={`painted painted-marigold ${className}`} viewBox="-14 -14 28 28" aria-hidden="true">
      <MarigoldHead x={0} y={0} r={12} />
    </svg>
  );
}

// A swag of marigolds with leaves and a lotus-bud drop at the centre: a toran for headers.
export function MarigoldGarland({ className = '', count = 15 }) {
  const pts = Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    return [10 + t * 380, 12 + Math.sin(t * Math.PI) * 30];
  });
  return (
    <svg className={`painted painted-garland ${className}`} viewBox="0 0 400 76" aria-hidden="true" preserveAspectRatio="xMidYMin meet">
      <path d={`M${pts.map((p) => p.join(' ')).join(' L')}`} fill="none" stroke={PAL.leafDeep} strokeWidth="1" />
      {pts.map(([x, y], i) =>
        i % 2 ? (
          <g key={i}>
            <path d={`M${x} ${y} c-5 4 -6 10 -2 14 c3 -4 4 -9 2 -14z`} fill={PAL.leaf} />
            <MarigoldHead x={x} y={y} r={8} light />
          </g>
        ) : (
          <MarigoldHead key={i} x={x} y={y} r={9.5} />
        ),
      )}
      <g transform="translate(200 44)">
        <path d="M0 0 v12" stroke={PAL.gold} strokeWidth="1" />
        <path d="M0 26 C-8 20 -8 12 0 10 C8 12 8 20 0 26 Z" fill={PAL.pink} stroke={PAL.gold} strokeWidth="0.8" />
        <circle cy="29" r="2" fill={PAL.gold} />
      </g>
    </svg>
  );
}

// A corner spray: a curling vine with paisley leaves, jasmine buds, a marigold and a lotus bud.
export function FloralCorner({ className = '' }) {
  return (
    <svg className={`painted painted-corner ${className}`} viewBox="0 0 140 140" aria-hidden="true">
      <path d="M4 136 C8 90 30 50 70 26 C90 14 112 8 136 6" fill="none" stroke={PAL.leafDeep} strokeWidth="1.6" />
      {[[22, 96, -40], [38, 66, -30], [60, 42, -20], [88, 22, -10], [112, 12, 0]].map(([x, y, a], i) => (
        <g key={i} transform={`translate(${x} ${y}) rotate(${a + (i % 2 ? 160 : 0)})`}>
          {/* paisley leaf */}
          <path d="M0 0 C10 -4 20 2 18 12 C16 20 6 18 4 12 C2 8 8 6 10 9" fill={PAL.leaf} stroke={PAL.leafDeep} strokeWidth="0.8" />
        </g>
      ))}
      {[[30, 82], [50, 52], [76, 32], [100, 16]].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cy="-3.2" rx="1.8" ry="3.2" fill={PAL.ivory} stroke={PAL.goldLight} strokeWidth="0.4" transform={`rotate(${a})`} />
          ))}
          <circle r="1.2" fill={PAL.saffron} />
        </g>
      ))}
      <MarigoldHead x={14} y={124} r={10} />
      <g transform="translate(126 8) rotate(70)">
        <path d="M0 0 C-8 -6 -8 -16 0 -20 C8 -16 8 -6 0 0 Z" fill={PAL.pink} stroke={PAL.gold} strokeWidth="0.8" />
      </g>
    </svg>
  );
}
