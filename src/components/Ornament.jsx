// Lotus-and-line divider used under every section title.
export function Ornament({ className = '' }) {
  return (
    <svg className={`ornament ${className}`} viewBox="0 0 200 24" fill="none" aria-hidden="true">
      <path d="M8 12h62M130 12h62" stroke="currentColor" strokeWidth="0.8" />
      <path d="M70 12l4-3 4 3-4 3z" fill="currentColor" />
      <path d="M122 12l4-3 4 3-4 3z" fill="currentColor" />
      <path
        d="M100 20c-4-4.5-4-9.5 0-15 4 5.5 4 10.5 0 15zM100 20c-6.5-.5-11-4-12-9.5 6 .5 10 4.5 12 9.5zM100 20c6.5-.5 11-4 12-9.5-6 .5-10 4.5-12 9.5z"
        stroke="currentColor"
        strokeWidth="0.9"
      />
      <circle cx="84" cy="12" r="1.2" fill="currentColor" />
      <circle cx="116" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}
