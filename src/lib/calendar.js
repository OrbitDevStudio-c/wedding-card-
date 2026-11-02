import { couple, dates, events, venue } from '../config.js';

const toUtcStamp = (iso) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const title = `${couple.bride.name} & ${couple.groom.name}'s Wedding`;
const location = `${venue.name}, ${venue.address}`;

export function googleCalendarUrl() {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${toUtcStamp(dates.start)}/${toUtcStamp(dates.end)}`,
    details: `Celebrations: ${events.map((e) => e.name).join(', ')}. Details: ${window.location.origin}`,
    location,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

const escapeIcs = (s) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

// RFC 5545 asks for lines of at most 75 octets, continued with a leading space.
function fold(line) {
  const parts = [];
  let rest = line;
  while (rest.length > 74) {
    parts.push(rest.slice(0, 74));
    rest = ` ${rest.slice(74)}`;
  }
  parts.push(rest);
  return parts.join('\r\n');
}

export function buildIcs(now = new Date()) {
  const stamp = toUtcStamp(now.toISOString());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OrbitDevStudio//Wedding Invitation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcs(title)}`,
    ...events.flatMap((event) => [
      'BEGIN:VEVENT',
      `UID:${event.id}-${toUtcStamp(event.start)}@${couple.bride.name.toLowerCase()}-${couple.groom.name.toLowerCase()}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${toUtcStamp(event.start)}`,
      `DTEND:${toUtcStamp(event.end)}`,
      `SUMMARY:${escapeIcs(`${event.name} · ${couple.bride.name} & ${couple.groom.name}`)}`,
      `LOCATION:${escapeIcs(`${event.place}, ${location}`)}`,
      `DESCRIPTION:${escapeIcs(`${event.description}\nDress code: ${event.dressCode}`)}`,
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}
