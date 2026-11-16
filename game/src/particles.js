// particles.js — particles, hit flashes, damage numbers and floating text.

import { CONFIG } from './config.js';

// Burst of little sparks from a hit or death.
export function burst(parts, x, y, color, count, speed, life, size = 3, spread = Math.PI * 2) {
  if (parts.length + count > CONFIG.maxParticles) return;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * spread;
    const v = speed * (0.4 + Math.random() * 0.6);
    parts.push({
      kind: 'spark',
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: life * (0.6 + Math.random() * 0.6),
      max: life,
      color,
      size: size * (0.6 + Math.random() * 0.8),
      drag: 0.9,
    });
  }
}

// A coloured ring that expands and fades (pickups, bombs, level-up).
export function ring(parts, x, y, color, maxR = 30, life = 0.35) {
  parts.push({
    kind: 'ring',
    x, y, r: 3, maxR, life, max: life, color,
  });
}

// A floating damage number.
export function damageNumber(parts, x, y, value, color = '#ffd27d', crit = false) {
  parts.push({
    kind: 'text',
    x, y,
    vx: (Math.random() - 0.5) * 20,
    vy: -60,
    life: 0.7,
    max: 0.7,
    text: String(Math.round(value)),
    color,
    size: crit ? 26 : 18,
  });
}

// A floating status label (e.g. "+25 HP", "MAGNET!", "BOMB!").
export function floatText(parts, x, y, text, color, size = 20) {
  parts.push({
    kind: 'text',
    x, y,
    vx: 0,
    vy: -42,
    life: 1.0,
    max: 1.0,
    text,
    color,
    size,
  });
}

export function updateParticles(parts, dt) {
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i];
    p.life -= dt;
    if (p.life <= 0) { parts.splice(i, 1); continue; }
    if (p.kind === 'spark') {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy *= Math.pow(p.drag, dt * 60);
    } else if (p.kind === 'text') {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(0.96, dt * 60);
    } else if (p.kind === 'ring') {
      const t = 1 - p.life / p.max;
      p.r = 3 + (p.maxR - 3) * t;
    }
  }
}