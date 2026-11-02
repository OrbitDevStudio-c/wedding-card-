import { useCallback, useEffect, useRef } from 'react';
import { useInView } from '../hooks/useInView.js';
import './ScratchCard.css';

const BRUSH = 26;
const REVEAL_AT = 0.45;

function paintFoil(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#a98446');
  g.addColorStop(0.3, '#f1dfb0');
  g.addColorStop(0.55, '#c9a465');
  g.addColorStop(0.8, '#ecd49f');
  g.addColorStop(1, '#8f6c33');
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Fine grain so it reads as foil rather than flat paint
  for (let i = 0; i < (w * h) / 90; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(80,55,15,0.08)';
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }

  const cx = w / 2;
  const cy = h * 0.56;
  ctx.strokeStyle = 'rgba(90,64,24,0.28)';
  ctx.lineWidth = 1;
  for (let r = 24; r < Math.max(w, h); r += 18) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 24, cy + Math.sin(a) * 24);
    ctx.lineTo(cx + Math.cos(a) * Math.max(w, h), cy + Math.sin(a) * Math.max(w, h));
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(70,48,14,0.85)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '500 13px Cinzel, Georgia, serif';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '3px';
  ctx.fillText('SCRATCH HERE', cx, cy);
  ctx.font = '400 26px "Pinyon Script", cursive';
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  ctx.fillText('the big day', cx, cy - 34);
}

export function ScratchCard({ revealed, onReveal, children }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const state = useRef({ drawing: false, last: null, moves: 0, width: 0 });
  // Paint the foil only as the card approaches the viewport, never behind the closed intro
  const near = useInView(wrapRef, { rootMargin: '400px 0px' });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const { width, height } = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintFoil(ctx, width, height);
    state.current.width = width;
  }, []);

  useEffect(() => {
    if (revealed || !near) return undefined;
    draw();
    document.fonts?.ready.then(() => !state.current.moves && draw());
    const ro = new ResizeObserver(([entry]) => {
      if (Math.abs(entry.contentRect.width - state.current.width) > 1) draw();
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [draw, revealed, near]);

  const progress = () => {
    const canvas = canvasRef.current;
    const { data } = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height);
    let cleared = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 24) {
      total++;
      if (data[i] < 128) cleared++;
    }
    return cleared / total;
  };

  const scratchTo = (x, y) => {
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    const { last } = state.current;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = BRUSH * 2;
    ctx.beginPath();
    ctx.moveTo(last ? last.x : x, last ? last.y : y);
    ctx.lineTo(x, y);
    ctx.stroke();
    state.current.last = { x, y };
    state.current.moves++;
    if (state.current.moves % 8 === 0 && progress() > REVEAL_AT) onReveal();
  };

  const point = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e) => {
    if (revealed) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    state.current.drawing = true;
    state.current.last = null;
    const { x, y } = point(e);
    scratchTo(x, y);
  };

  const onPointerMove = (e) => {
    if (!state.current.drawing || revealed) return;
    const { x, y } = point(e);
    scratchTo(x, y);
  };

  const onPointerUp = () => {
    state.current.drawing = false;
    state.current.last = null;
    if (!revealed && state.current.moves > 0 && progress() > REVEAL_AT) onReveal();
  };

  return (
    <div ref={wrapRef} className={`scratch ${revealed ? 'is-revealed' : ''}`}>
      <div className="scratch__content">{children}</div>
      <canvas
        ref={canvasRef}
        className="scratch__foil"
        aria-hidden="true"
        data-testid="scratch-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
    </div>
  );
}
