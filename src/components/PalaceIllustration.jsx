import { useRef } from 'react';
import { useInView } from '../hooks/useInView.js';
import './PalaceIllustration.css';

const groundArches = Array.from({ length: 11 }, (_, i) => {
  const x = 166 + i * 28;
  return `M${x} 230V204q0-12 9-16q9 4 9 16v26`;
});

const upperWindows = Array.from({ length: 6 }, (_, i) => {
  const x = 204 + i * 40;
  return `M${x} 146v-13q0-8 8-11q8 3 8 11v13M${x - 4} 148h24`;
});

const chhatri = (cx) =>
  `M${cx - 11} 110v-14M${cx + 11} 110v-14M${cx - 15} 96h30M${cx - 12} 96q0-12 12-17q12 5 12 17M${cx} 79v-6`;

const tower = (cx) =>
  `M${cx - 20} 230V126h40v104M${cx - 22} 126h44M${cx - 18} 126q0-20 18-28q18 8 18 28M${cx} 98v-10M${cx - 8} 160h16v22h-16zM${cx - 8} 196h16v22h-16z`;

const ripples = [
  [40, 250, 90], [190, 248, 140], [380, 252, 120], [540, 249, 70],
  [120, 266, 110], [300, 264, 160], [500, 268, 90],
  [60, 284, 80], [230, 282, 120], [420, 286, 140],
];

// Each stroke animates from stroke-dashoffset 1 → 0 (pathLength="1") once the art scrolls in.
const strokes = [
  { d: 'M0 172q80-44 160-20t160-12 160-6 160 14', cls: 'hills' },
  { d: 'M0 232H640', cls: 'water' },
  { d: 'M150 230V150h340v80', cls: 'main' },
  { d: 'M144 150h352M188 150v-40h264v40M182 110h276', cls: 'main' },
  { d: 'M280 110V82h80v28M276 82h88M286 82q0-30 34-42q34 12 34 42M320 40V24M320 24l13 4-13 4', cls: 'main' },
  { d: tower(130), cls: 'main' },
  { d: tower(510), cls: 'main' },
  { d: chhatri(214), cls: 'detail' },
  { d: chhatri(426), cls: 'detail' },
  { d: groundArches.join(''), cls: 'detail' },
  { d: upperWindows.join(''), cls: 'detail' },
  { d: 'M300 110v-16h40v16M310 104q0-8 10-10q10 2 10 10', cls: 'detail' },
  { d: 'M46 232q-12-40 4-74q16 34 4 74M42 200h16M594 232q-12-40 4-74q16 34 4 74M590 200h16', cls: 'tree' },
  { d: ripples.map(([x, y, l]) => `M${x} ${y}h${l}`).join(''), cls: 'ripple' },
  { d: 'M90 272q20 12 52 0M96 272h40M116 272v-18M106 258l22 22', cls: 'boat' },
  { d: 'M408 60q6-6 12 0q6-6 12 0M444 46q5-5 10 0q5-5 10 0M180 70q5-5 10 0q5-5 10 0', cls: 'birds' },
];

export function PalaceIllustration() {
  const ref = useRef(null);
  const drawn = useInView(ref, { rootMargin: '0px 0px -15% 0px' });

  return (
    <svg
      ref={ref}
      className={`palace ${drawn ? 'is-drawn' : ''}`}
      viewBox="0 0 640 300"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Line drawing of a lakeside palace with domed pavilions, arched windows and a boat on the water"
    >
      <circle className="palace__sun" cx="500" cy="92" r="26" pathLength="1" />
      {strokes.map(({ d, cls }, i) => (
        <path key={i} className={`palace__${cls}`} d={d} pathLength="1" style={{ '--i': i }} />
      ))}
    </svg>
  );
}
