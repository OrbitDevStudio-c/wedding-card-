// Synthesises a royalty-free placeholder track (santoor-like melody over a tanpura drone,
// raag Bhupali) and encodes it to MP3. Replace public/music/wedding-theme.mp3 with your own.
import { mkdir, writeFile } from 'node:fs/promises';
import { Mp3Encoder } from '@breezystack/lamejs';

const RATE = 32000;
const BEAT = 0.5;
const SA = 293.66;
const ratio = { S: 1, R: 9 / 8, G: 5 / 4, P: 3 / 2, D: 5 / 3, s: 2, r: 9 / 4, g: 5 / 2 };

// [note, beats]; '-' is a rest
const phrase = [
  ['G', 1], ['P', 1], ['D', 2], ['s', 1], ['D', 1], ['P', 2],
  ['G', 1], ['R', 1], ['G', 1], ['P', 1], ['G', 2], ['-', 2],
  ['P', 1], ['D', 1], ['s', 1], ['r', 1], ['g', 2], ['r', 1], ['s', 1],
  ['D', 1], ['P', 1], ['G', 1], ['R', 1], ['S', 4],
];
const loopBeats = phrase.reduce((n, [, b]) => n + b, 0);
const seconds = loopBeats * BEAT * 2;
const out = new Float32Array(Math.ceil(seconds * RATE));

function pluck(freq, start, dur, gain, harmonics, decay) {
  const s0 = Math.floor(start * RATE);
  const n = Math.floor(dur * RATE);
  for (let i = 0; i < n && s0 + i < out.length; i++) {
    const t = i / RATE;
    const env = Math.min(1, t * 400) * Math.exp(-t * decay);
    let v = 0;
    harmonics.forEach((amp, h) => {
      v += amp * Math.sin(2 * Math.PI * freq * (h + 1) * t * (1 + h * 0.0007)) * Math.exp(-t * h * 0.6);
    });
    out[s0 + i] += v * env * gain;
  }
}

// Tanpura: Pa – Sa – Sa – low Sa, cycling softly underneath
const drone = [ratio.P / 2, 1, 1, 0.5];
for (let t = 0, k = 0; t < seconds; t += 1.25, k++) {
  pluck(SA * drone[k % 4], t, 5, 0.06, [1, 0.6, 0.45, 0.3, 0.22, 0.15, 0.1], 0.55);
}

// Melody plays twice, the second time an octave-doubled tremolo for colour
for (let pass = 0; pass < 2; pass++) {
  let t = pass * loopBeats * BEAT;
  for (const [note, beats] of phrase) {
    if (note !== '-') {
      const f = SA * ratio[note];
      pluck(f, t, 2.5, 0.16, [1, 0.35, 0.18, 0.08], 2.2);
      if (pass === 1) pluck(f * 2, t + 0.12, 1.5, 0.05, [1, 0.2], 3);
    }
    t += beats * BEAT;
  }
}

// Light reverb: a few feedback comb filters, then normalise
const wet = new Float32Array(out.length);
for (const [delay, fb] of [[0.0297, 0.72], [0.0371, 0.7], [0.0411, 0.68], [0.0437, 0.66]]) {
  const d = Math.floor(delay * RATE);
  const buf = new Float32Array(out.length);
  for (let i = 0; i < out.length; i++) {
    buf[i] = out[i] + (i >= d ? buf[i - d] * fb : 0);
    wet[i] += buf[i] * 0.12;
  }
}
let peak = 0;
for (let i = 0; i < out.length; i++) {
  out[i] = out[i] * 0.8 + wet[i];
  peak = Math.max(peak, Math.abs(out[i]));
}
const fade = RATE * 0.4;
const pcm = new Int16Array(out.length);
for (let i = 0; i < out.length; i++) {
  const edge = Math.min(1, i / fade, (out.length - i) / fade);
  pcm[i] = Math.round((out[i] / peak) * 0.85 * edge * 32767);
}

const encoder = new Mp3Encoder(1, RATE, 64);
const chunks = [];
for (let i = 0; i < pcm.length; i += 1152) chunks.push(encoder.encodeBuffer(pcm.subarray(i, i + 1152)));
chunks.push(encoder.flush());

await mkdir(new URL('../public/music/', import.meta.url), { recursive: true });
await writeFile(new URL('../public/music/wedding-theme.mp3', import.meta.url), Buffer.concat(chunks.map((c) => Buffer.from(c))));
process.stdout.write(`Wrote ${seconds.toFixed(1)}s track to public/music/wedding-theme.mp3\n`);
