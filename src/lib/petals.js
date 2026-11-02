import { prefersReducedMotion } from './motion.js';

const COLORS = ['#e39b2d', '#f0b44c', '#c46f6a', '#e8b9b5', '#d9b56f'];
const MAX_PARTICLES = 120;
const AMBIENT_MAX = 9;
const SPRITE = 40;

function makeSprite(color) {
  const c = document.createElement('canvas');
  c.width = c.height = SPRITE;
  const ctx = c.getContext('2d');
  const grad = ctx.createLinearGradient(0, 0, SPRITE, SPRITE);
  grad.addColorStop(0, color);
  grad.addColorStop(1, '#fff3dc');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(20, 3);
  ctx.bezierCurveTo(36, 10, 32, 31, 20, 37);
  ctx.bezierCurveTo(8, 31, 4, 10, 20, 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, 8);
  ctx.quadraticCurveTo(22, 20, 20, 33);
  ctx.stroke();
  return c;
}

class PetalField {
  particles = [];
  ambient = false;
  running = false;
  nextAmbient = 0;
  lastTrail = { x: 0, y: 0, t: 0 };

  mount(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sprites = COLORS.map(makeSprite);
    this.resize = this.resize.bind(this);
    this.frame = this.frame.bind(this);
    this.onVisibility = this.onVisibility.bind(this);
    this.resize();
    window.addEventListener('resize', this.resize, { passive: true });
    document.addEventListener('visibilitychange', this.onVisibility);
  }

  unmount() {
    window.removeEventListener('resize', this.resize);
    document.removeEventListener('visibilitychange', this.onVisibility);
    cancelAnimationFrame(this.raf);
    this.running = false;
    this.canvas = null;
  }

  resize() {
    if (!this.canvas) return;
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
  }

  onVisibility() {
    if (document.hidden) {
      cancelAnimationFrame(this.raf);
      this.running = false;
    } else {
      this.start();
    }
  }

  get enabled() {
    return Boolean(this.canvas) && !prefersReducedMotion();
  }

  setAmbient(on) {
    this.ambient = on;
    if (on) this.start();
  }

  spawn(p) {
    if (this.particles.length >= MAX_PARTICLES) return;
    this.particles.push({
      rot: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 3,
      flip: Math.random() * Math.PI * 2,
      flipSpeed: 2 + Math.random() * 3,
      sway: Math.random() * Math.PI * 2,
      age: 0,
      sprite: this.sprites[(Math.random() * this.sprites.length) | 0],
      ...p,
    });
  }

  spawnAmbient() {
    this.spawn({
      kind: 'ambient',
      x: Math.random() * this.w,
      y: -30,
      vx: 10 + Math.random() * 20,
      vy: 30 + Math.random() * 35,
      size: 10 + Math.random() * 10,
      life: Infinity,
      alpha: 0.55 + Math.random() * 0.25,
    });
  }

  burst(x, y, count = 48) {
    if (!this.enabled) return;
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const speed = 260 + Math.random() * 380;
      this.spawn({
        kind: 'burst',
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 10 + Math.random() * 12,
        life: 2.2 + Math.random() * 0.8,
        alpha: 1,
      });
    }
    this.start();
  }

  trail(x, y) {
    if (!this.enabled) return;
    const now = performance.now();
    const { x: lx, y: ly, t } = this.lastTrail;
    if (now - t < 70 || Math.hypot(x - lx, y - ly) < 28) return;
    this.lastTrail = { x, y, t: now };
    this.spawn({
      kind: 'trail',
      x,
      y,
      vx: (Math.random() - 0.5) * 30,
      vy: 20 + Math.random() * 30,
      size: 7 + Math.random() * 5,
      life: 1.3,
      alpha: 0.85,
    });
    this.start();
  }

  start() {
    if (this.running || !this.enabled || document.hidden) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  }

  frame(now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const { ctx, dpr } = this;

    if (this.ambient && now > this.nextAmbient) {
      if (this.particles.filter((p) => p.kind === 'ambient').length < AMBIENT_MAX) this.spawnAmbient();
      this.nextAmbient = now + 700 + Math.random() * 900;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles = this.particles.filter((p) => {
      p.age += dt;
      if (p.kind === 'burst') {
        p.vy += 520 * dt;
        p.vx *= 1 - 1.4 * dt;
        p.vy *= 1 - 0.9 * dt;
      }
      p.sway += dt * 1.6;
      p.x += (p.vx + Math.sin(p.sway) * 18) * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
      p.flip += p.flipSpeed * dt;

      const fadeStart = p.life * 0.65;
      const lifeAlpha = p.age > fadeStart ? Math.max(0, 1 - (p.age - fadeStart) / (p.life - fadeStart)) : 1;
      if (lifeAlpha <= 0 || p.y > this.h + 40 || p.x < -60 || p.x > this.w + 60) return false;

      const scaleX = Math.cos(p.flip);
      const s = (p.size / SPRITE) * dpr;
      ctx.globalAlpha = p.alpha * lifeAlpha;
      ctx.setTransform(
        Math.cos(p.rot) * s * scaleX,
        Math.sin(p.rot) * s * scaleX,
        -Math.sin(p.rot) * s,
        Math.cos(p.rot) * s,
        p.x * dpr,
        p.y * dpr,
      );
      ctx.drawImage(p.sprite, -SPRITE / 2, -SPRITE / 2);
      return true;
    });

    if (this.particles.length || this.ambient) {
      this.raf = requestAnimationFrame(this.frame);
    } else {
      this.running = false;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

export const petals = new PetalField();
