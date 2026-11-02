import { useId } from 'react';
import { couple } from '../config.js';
import './Monogram.css';

// "A & R" set inside a jharokha (ogee) arch. The letters carry a slow gold shimmer.
export function Monogram({ className = '', shimmer = true, label = true, ...svgProps }) {
  const id = useId().replace(/:/g, '');
  const { left, right } = couple.monogram;
  const letters = (
    <>
      <text x="45" y="96" fontSize="52" textAnchor="middle">{left}</text>
      <text x="61" y="104" fontSize="17" textAnchor="middle">&amp;</text>
      <text x="77" y="114" fontSize="52" textAnchor="middle">{right}</text>
    </>
  );

  return (
    <svg
      className={`monogram ${shimmer ? 'monogram--shimmer' : ''} ${className}`}
      viewBox="0 0 120 152"
      role={label ? 'img' : undefined}
      aria-label={label ? `${couple.bride.name} and ${couple.groom.name} monogram` : undefined}
      aria-hidden={label ? undefined : 'true'}
      {...svgProps}
    >
      <defs>
        <clipPath id={`${id}-clip`}>{letters}</clipPath>
        <linearGradient id={`${id}-sheen`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff8e6" stopOpacity="0.95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g className="monogram__frame" fill="none" strokeWidth="1.2">
        <path d="M14 146V64c0-24 24-36 46-56 22 20 46 32 46 56v82" />
        <path d="M22 146V66c0-20 20-30 38-47 18 17 38 27 38 47v80" strokeWidth="0.7" />
        <path d="M6 146h108" />
        <circle cx="60" cy="4" r="2.2" />
        <path d="M60 141c-3.5-5-3.5-9 0-13 3.5 4 3.5 8 0 13zM60 141c-6-1-9.5-4.5-10-9 4.5.5 8.5 4 10 9zM60 141c6-1 9.5-4.5 10-9-4.5.5-8.5 4-10 9z" strokeWidth="0.8" />
      </g>
      <g className="monogram__letters">{letters}</g>
      {shimmer && (
        <g clipPath={`url(#${id}-clip)`}>
          <rect className="monogram__sheen" x="-60" y="30" width="60" height="100" fill={`url(#${id}-sheen)`} />
        </g>
      )}
    </svg>
  );
}
