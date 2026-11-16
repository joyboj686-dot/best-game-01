// render.js — all canvas drawing for Emberfall: background, entities, particles, HUD, screens.

import { CONFIG, COLORS } from './config.js';

// --- Arena / background -----------------------------------------------------

export function drawBackground(ctx, width, height, time) {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, COLORS.bgTop);
  g.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  // Sparse drift of warm ember motes.
  for (let i = 0; i < 46; i++) {
    const px = (((i * 137.5) + Math.sin(i) * 30 + time * 14) % width + width) % width;
    const py = (((i * 61.3) + Math.cos(i * 1.3) * 40 + time * 7) % height + height) % height;
    const a = 0.08 + 0.10 * Math.sin(time * 1.5 + i);
    ctx.fillStyle = 'rgba(255,154,60,' + a.toFixed(3) + ')';
    ctx.beginPath();
    ctx.arc(px, py, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A faint danger vignette toward the edges.
export function drawVignette(ctx, width, height) {
  const g = ctx.createRadialGradient(width / 2, height / 2, height * 0.35, width / 2, height / 2, height * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(5,5,12,0.55)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

// --- Player -----------------------------------------------------------------

export function drawPlayer(ctx, p, time) {
  ctx.save();
  ctx.translate(p.x, p.y);
  // Glow.
  if (p.iframes > 0 && Math.floor(p.iframes * 12) % 2 === 0) ctx.globalAlpha = 0.45;

  // Muzzle + body: a bright warm orb with a directional visor.
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(0, 0, CONFIG.playerRadius, 0, Math.PI * 2);
  ctx.fill();
  // Aim visor.
  ctx.fillStyle = '#ffb14d';
  ctx.beginPath();
  ctx.arc(Math.cos(p.aim) * 7, Math.sin(p.aim) * 7, 7, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring pulses.
  ctx.strokeStyle = 'rgba(255,233,201,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, CONFIG.playerRadius + 2 + Math.sin(time * 6) * 1.5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// --- Enemies ----------------------------------------------------------------

export function drawEnemy(ctx, e, time) {
  ctx.save();
  ctx.translate(e.x, e.y);
  if (e.flash > 0) {
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(e.flash * 60);
    ctx.fillStyle = '#ffffff';
  } else {
    ctx.fillStyle = e.color;
  }

  if (e.shape === 'diamond') {
    ctx.beginPath();
    ctx.moveTo(0, -e.r); ctx.lineTo(e.r * 0.7, 0); ctx.lineTo(0, e.r); ctx.lineTo(-e.r * 0.7, 0);
    ctx.closePath(); ctx.fill();
  } else if (e.shape === 'square') {
    ctx.fillRect(-e.r * 0.75, -e.r * 0.75, e.r * 1.5, e.r * 1.5);
  } else if (e.shape === 'elite') {
    ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(200,107,255,0.9)'; ctx.lineWidth = 3;
    ctx.setLineDash([6, 5]); ctx.beginPath(); ctx.arc(0, 0, e.r + 6, time * 2, time * 2 + Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  } else if (e.shape === 'boss') {
    // Spiked guardian core.
    ctx.rotate(time * 0.4);
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * e.r * 0.5, Math.sin(a) * e.r * 0.5);
      ctx.lineTo(Math.cos(a + 0.22) * e.r, Math.sin(a + 0.22) * e.r);
      ctx.lineTo(Math.cos(a + 0.44) * e.r * 0.5, Math.sin(a + 0.44) * e.r * 0.5);
      ctx.closePath(); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(0, 0, e.r * 0.5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(0, 0, e.r, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
}

// --- Pickups ----------------------------------------------------------------

export function drawPickup(ctx, p, time) {
  const bob = Math.sin(p.t * 2) * 2;
  ctx.save();
  ctx.translate(p.x, p.y + bob);
  if (p.kind === 'gem') {
    ctx.rotate(time * 2);
    ctx.fillStyle = COLORS.gem;
    ctx.beginPath();
    ctx.moveTo(0, -6); ctx.lineTo(5, 0); ctx.lineTo(0, 6); ctx.lineTo(-5, 0);
    ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.4 + 0.2 * Math.sin(time * 6);
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
  } else if (p.kind === 'health') {
    ctx.fillStyle = '#ff6b7a';
    ctx.fillRect(-7, -7, 14, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, -4, 2, 8); ctx.fillRect(-4, -1, 8, 2);
  } else if (p.kind === 'magnet') {
    ctx.strokeStyle = '#b58cff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#b58cff'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, Math.PI * 2); ctx.fill();
  } else if (p.kind === 'bomb') {
    ctx.fillStyle = '#ff9a3c';
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0b0e17';
    ctx.fillRect(-6, -3, 12, 2); ctx.fillRect(-1, -6, 2, 6);
  }
  ctx.restore();
}

// --- Particles --------------------------------------------------------------

export function drawParticles(ctx, parts) {
  for (const p of parts) {
    const t = p.life / p.max;
    if (p.kind === 'spark') {
      ctx.globalAlpha = t;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2); ctx.fill();
    } else if (p.kind === 'ring') {
      ctx.globalAlpha = t * 0.8;
      ctx.strokeStyle = p.color; ctx.lineWidth = 2 + 3 * (1 - t);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
    } else if (p.kind === 'text') {
      ctx.globalAlpha = Math.min(1, t * 1.8);
      ctx.font = 'bold ' + p.size + 'px system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
    }
  }
  ctx.globalAlpha = 1;
}

// --- Bombs (expanding blast) ------------------------------------------------

export function drawBombs(ctx, bombs, time) {
  for (const b of bombs) {
    const t = Math.min(1, b.t / 0.5);
    const a = (1 - t) * 0.6;
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ff9a3c';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = a * 0.6;
    ctx.strokeStyle = '#fff3c9'; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}