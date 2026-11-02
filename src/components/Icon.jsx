const paths = {
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
    </>
  ),
  musicOff: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="17" cy="16" r="3" />
      <path d="M3 3l18 18" />
    </>
  ),
  arrowUp: <path d="M12 19V5M5 12l7-7 7 7" />,
  pin: (
    <>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </>
  ),
  download: <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  chevronLeft: <path d="M15 5l-7 7 7 7" />,
  chevronRight: <path d="M9 5l7 7-7 7" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  send: <path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z" />,
  plane: <path d="M10.5 13.5L4 11l1.5-1.5 7 1 4-4c1-1 2.6-1.4 3.2-.7.7.6.3 2.2-.7 3.2l-4 4 1 7L14.5 21.5 12 15l-3 3v2.5L7.5 22l-1-3.5L3 17.5 4.5 16H7l3-3z" />,
  train: (
    <>
      <rect x="5" y="3" width="14" height="14" rx="3" />
      <path d="M5 11h14M8.5 21l2-4M15.5 21l-2-4" />
      <circle cx="9" cy="14" r="0.8" />
      <circle cx="15" cy="14" r="0.8" />
    </>
  ),
  car: (
    <>
      <path d="M4 16v-4l2-5h12l2 5v4z" />
      <path d="M4 12h16" />
      <circle cx="7.5" cy="16.5" r="1.8" />
      <circle cx="16.5" cy="16.5" r="1.8" />
    </>
  ),
  paisley: (
    <>
      <path d="M14 21c-5 0-9-3.6-9-8.5C5 7.2 9 3 14 3c3.6 0 5.5 2.6 5 5.4-.5 2.7-3.4 3.6-5.5 2.6-1.6-.8-1.6-3 0-3.4" />
      <path d="M14 21c2.5 0 5-1.6 5-4.6" />
      <circle cx="11" cy="14" r="1.6" />
    </>
  ),
  marigold: (
    <>
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 3.5c1.8 2 1.8 4 0 6-1.8-2-1.8-4 0-6zM12 14.5c1.8 2 1.8 4 0 6-1.8-2-1.8-4 0-6zM3.5 12c2-1.8 4-1.8 6 0-2 1.8-4 1.8-6 0zM14.5 12c2-1.8 4-1.8 6 0-2 1.8-4 1.8-6 0z" />
      <path d="M6 6c2.6.2 4 1.6 4.2 4.2C7.6 10 6.2 8.6 6 6zM18 18c-2.6-.2-4-1.6-4.2-4.2 2.6.2 4 1.6 4.2 4.2zM18 6c-.2 2.6-1.6 4-4.2 4.2.2-2.6 1.6-4 4.2-4.2zM6 18c.2-2.6 1.6-4 4.2-4.2-.2 2.6-1.6 4-4.2 4.2z" />
    </>
  ),
  dhol: (
    <>
      <ellipse cx="6" cy="12" rx="2.5" ry="6" />
      <ellipse cx="18" cy="12" rx="2.5" ry="6" />
      <path d="M6 6h12M6 18h12M8 6.5l4 11 4-11M10 17.5l2-5 2 5" />
    </>
  ),
  diya: (
    <>
      <path d="M3 13h18c-1 4-4.5 6-9 6s-8-2-9-6z" />
      <path d="M12 10.5c-1.6-1.4-1.8-3.4 0-6.5 1.8 3.1 1.6 5.1 0 6.5z" />
      <path d="M8 21h8" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7z" />
      <path d="M19 15.5c.2 1.5.9 2.2 2.4 2.4-1.5.2-2.2.9-2.4 2.4-.2-1.5-.9-2.2-2.4-2.4 1.5-.2 2.2-.9 2.4-2.4z" />
    </>
  ),
};

export function Icon({ name, className, title }) {
  if (name === 'whatsapp') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden={title ? undefined : 'true'} role={title ? 'img' : undefined}>
        {title && <title>{title}</title>}
        <path d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 4.8 5-1.3A9.8 9.8 0 1 0 12 2.2zm0 17.9a8.1 8.1 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.1 8.1 0 1 1 12 20.1zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.7a2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3z" />
      </svg>
    );
  }
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      {paths[name]}
    </svg>
  );
}
