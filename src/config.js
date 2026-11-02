// Every piece of content on the site lives here. To reuse the invitation for another
// couple, edit this file, swap the files in /photos-src and /public/music, and rebuild.

// import.meta.env in the browser; process.env when build scripts import this file in Node.
const env = import.meta.env || (typeof process !== 'undefined' ? process.env : {});

export const SITE_URL = (env.VITE_SITE_URL || 'https://alica-weds-rushil.vercel.app').replace(/\/$/, '');

export const couple = {
  bride: {
    name: 'Alica',
    fullName: 'Alica Kapoor',
    relation: 'Daughter of',
    parents: 'Mrs. Meera & Mr. Rajesh Kapoor',
  },
  groom: {
    name: 'Rushil',
    fullName: 'Rushil Mehta',
    relation: 'Son of',
    parents: 'Mrs. Sunita & Mr. Vikram Mehta',
  },
  monogram: { left: 'A', right: 'R' },
  hashtag: '#AlicaWedsRushil',
};

export const invitation = {
  eyebrow: 'Together with their families',
  line: 'request the pleasure of your company at the wedding celebrations of',
  // Shown on the intro and hero when the link carries ?guest=Name
  personalGreeting: 'Dear {guest},',
};

// All times are IST. ISO strings keep the offset explicit so the countdown is correct worldwide.
export const dates = {
  start: '2027-02-12T11:00:00+05:30',
  end: '2027-02-13T23:30:00+05:30',
  reveal: { days: '12 · 13', month: 'February', year: '2027', weekdays: 'Friday & Saturday' },
  display: '12 – 13 February 2027',
  rsvpBy: '10 January 2027',
};

export const venue = {
  name: 'The Aranya Palace Resort',
  city: 'Udaipur, Rajasthan',
  address: '14 Lake Pichola Road, Udaipur 313001',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('The Aranya Palace Resort, 14 Lake Pichola Road, Udaipur 313001'),
};

export const story = [
  {
    year: '2019',
    title: 'How we met',
    text: 'A borrowed umbrella outside a Mumbai bookshop, during the first rain of the monsoon. Rushil never got it back. He got her number instead.',
    photo: 'story-1',
  },
  {
    year: '2024',
    title: 'The proposal',
    text: 'Sunrise on a quiet ghat in Udaipur, a ring tucked inside her favourite book. She said yes before he could finish the question.',
    photo: 'story-2',
  },
  {
    year: '2027',
    title: 'Forever',
    text: 'Now we begin our favourite chapter, in the same city where he asked. It would mean the world to have you there.',
    photo: 'story-3',
  },
];

export const events = [
  {
    id: 'mehendi',
    name: 'Mehendi',
    icon: 'paisley',
    date: '2027-02-12',
    start: '2027-02-12T11:00:00+05:30',
    end: '2027-02-12T15:00:00+05:30',
    time: '11:00 AM – 3:00 PM',
    place: 'The Lakeside Lawns',
    description: 'Henna, folk songs and cutting chai under the bougainvillea. Look closely, his initials are hidden somewhere in her mehendi.',
    dressCode: 'Shades of green',
    palette: [
      { name: 'Parrot green', hex: '#6E8B3D' },
      { name: 'Mint', hex: '#A9D3B8' },
      { name: 'Ivory', hex: '#F6EFDF' },
    ],
  },
  {
    id: 'haldi',
    name: 'Haldi',
    icon: 'marigold',
    date: '2027-02-12',
    start: '2027-02-12T16:30:00+05:30',
    end: '2027-02-12T18:30:00+05:30',
    time: '4:30 PM – 6:30 PM',
    place: 'The Sun Courtyard',
    description: 'Turmeric, marigolds and a lot of laughter. Wear something you will not mind turning a little yellow.',
    dressCode: 'Sunshine & white',
    palette: [
      { name: 'Marigold', hex: '#E9A23B' },
      { name: 'Turmeric', hex: '#F2CF5B' },
      { name: 'White', hex: '#FFFFFF' },
    ],
  },
  {
    id: 'sangeet',
    name: 'Sangeet',
    icon: 'dhol',
    date: '2027-02-12',
    start: '2027-02-12T20:00:00+05:30',
    end: '2027-02-13T00:30:00+05:30',
    time: '8:00 PM onwards',
    place: 'The Durbar Hall',
    description: 'A night of music, a friendly dance-off between the two families, and a few surprise performances.',
    dressCode: 'Indo-western glam',
    palette: [
      { name: 'Midnight', hex: '#1F2A4D' },
      { name: 'Silver', hex: '#C7C9CC' },
      { name: 'Wine', hex: '#6D2335' },
    ],
  },
  {
    id: 'pheras',
    name: 'Wedding Pheras',
    icon: 'diya',
    date: '2027-02-13',
    start: '2027-02-13T10:30:00+05:30',
    end: '2027-02-13T14:00:00+05:30',
    time: '10:30 AM · Muhurat 11:15 AM',
    place: 'The Lake Pavilion',
    description: 'Seven vows around the sacred fire, with the morning sun on Lake Pichola. Lunch follows the ceremony.',
    dressCode: 'Traditional pastels',
    palette: [
      { name: 'Blush', hex: '#E8B9B5' },
      { name: 'Powder blue', hex: '#B9CCE0' },
      { name: 'Sage', hex: '#B5C2A5' },
    ],
  },
  {
    id: 'reception',
    name: 'Reception',
    icon: 'sparkle',
    date: '2027-02-13',
    start: '2027-02-13T19:30:00+05:30',
    end: '2027-02-13T23:30:00+05:30',
    time: '7:30 PM onwards',
    place: 'The Palace Terrace',
    description: 'Dinner under the stars, a few toasts, and dancing until the lamps burn low.',
    dressCode: 'Black tie',
    palette: [
      { name: 'Emerald', hex: '#0F4A40' },
      { name: 'Black', hex: '#1A1A1A' },
      { name: 'Gold', hex: '#C2A36B' },
    ],
  },
];

export const days = [
  { date: '2027-02-12', label: 'Day one', title: 'Friday, 12 February' },
  { date: '2027-02-13', label: 'Day two', title: 'Saturday, 13 February' },
];

// Photos are generated from /photos-src by `npm run images` into /public/photos
// as AVIF, WebP and JPEG at each width below. `width`/`height` give the aspect ratio.
export const photos = {
  basePath: '/photos',
  widths: [480, 960, 1440],
  story: {
    'story-1': { alt: 'Alica and Rushil sharing an umbrella in the rain', width: 960, height: 960 },
    'story-2': { alt: 'Rushil proposing to Alica at sunrise by the lake', width: 960, height: 960 },
    'story-3': { alt: 'Alica and Rushil smiling together', width: 960, height: 960 },
  },
  gallery: [
    { name: 'gallery-1', alt: 'Alica in a red bridal lehenga and Rushil in an ivory sherwani at golden hour', width: 1087, height: 1447 },
    { name: 'gallery-2', alt: 'The couple smiling by turquoise water on a sunny beach', width: 1122, height: 1402 },
    { name: 'gallery-3', alt: 'Alica and Rushil in black outfits on a European shopping street', width: 1024, height: 1536 },
    { name: 'gallery-4', alt: 'The couple dressed for a gala, she in a navy satin gown and he in a tuxedo', width: 971, height: 1620 },
    { name: 'gallery-5', alt: 'Alica in burgundy velvet and Rushil in black under neon party lights', width: 1122, height: 1402 },
    { name: 'gallery-6', alt: 'The couple in winter coats beside a magazine stall', width: 1157, height: 1360 },
  ],
};

export const travel = {
  modes: [
    {
      title: 'By air',
      icon: 'plane',
      text: 'Maharana Pratap Airport (UDR) is 24 km away, about 40 minutes by road. Direct flights from Delhi, Mumbai and Bengaluru.',
    },
    {
      title: 'By rail',
      icon: 'train',
      text: 'Udaipur City station is 6 km from the venue. Mewar Express and Chetak Express run daily from Delhi.',
    },
    {
      title: 'By road',
      icon: 'car',
      text: 'A scenic 4-hour drive from Ahmedabad or 5 hours from Jaipur on NH 48. Valet parking is available at the resort.',
    },
  ],
  shuttleNote: 'Complimentary shuttles run between the airport, partner hotels and the venue on both days.',
  hotels: [
    { name: 'The Lakeview Haveli', distance: '1.2 km', note: 'Room block under “Kapoor–Mehta” until 10 Jan' },
    { name: 'Pichola Courtyard Hotel', distance: '2.5 km', note: 'Heritage rooms, 10% off with code ARWED' },
    { name: 'Amet Garden Retreat', distance: '4 km', note: 'Quiet garden cottages, family-friendly' },
  ],
  faq: [
    {
      q: 'Is accommodation arranged for guests?',
      a: 'Out-of-town family and friends are hosted at The Aranya Palace Resort. If you would like to stay elsewhere, our partner hotels above hold rooms at a reduced rate.',
    },
    {
      q: 'What will the weather be like?',
      a: 'February in Udaipur is lovely: around 25°C during the day and 12°C at night. Bring a shawl or light jacket for the evening events.',
    },
    {
      q: 'Are children welcome?',
      a: 'Absolutely. Little ones are part of the family, and there will be a supervised play area during the Sangeet and Reception.',
    },
    {
      q: 'Can I bring a plus-one?',
      a: 'Please include everyone in your party when you RSVP so we can plan seating and transport for them.',
    },
    {
      q: 'Do you have a gift registry?',
      a: 'Your presence is the only gift we need. If you insist, your blessings and a handwritten note will mean the most.',
    },
  ],
};

export const rsvp = {
  // Set VITE_RSVP_ENDPOINT to a Formspree URL or a Google Apps Script web-app URL.
  // When it is empty the form runs in demo mode and simply shows the success state.
  endpoint: env.VITE_RSVP_ENDPOINT || '',
  deadline: dates.rsvpBy,
  maxGuests: 6,
};

export const blessings = {
  quote: 'Two souls, one journey, and a thousand reasons to celebrate with the people we love.',
  message:
    'Thank you for the love, the laughter and the blessings that brought us here. We cannot wait to see you in Udaipur.',
  signature: 'Alica & Rushil',
};

export const music = {
  src: '/music/wedding-theme.mp3',
  title: 'Background music',
  volume: 0.55,
};

export const share = {
  message: 'You are invited to celebrate the wedding of Alica & Rushil, 12–13 February 2027 in Udaipur.',
};

export const credit = {
  text: 'Crafted with',
  by: 'OrbitDevStudio',
  url: 'https://orbit-dev-studio.vercel.app/',
};

export const seo = {
  title: 'Alica & Rushil · Wedding Invitation · 12–13 February 2027',
  description:
    'Join Alica and Rushil for their wedding celebrations at The Aranya Palace Resort, Udaipur, on 12–13 February 2027.',
  image: '/og-image.jpg',
};
