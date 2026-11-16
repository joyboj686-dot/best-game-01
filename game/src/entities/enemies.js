// entities/enemies.js — enemy types, their AI, spawning and death.

import { CONFIG } from '../config.js';
import { makeEnemyShot } from '../shots.js';
import { burst, ring, damageNumber } from '../particles.js';

// Enemy archetypes. speed, hp, r, dmg (contact), color, score, xp, shape.
const TYPES = {
  crawler: { speed: 95, hp: 26, r: 15, dmg: 12, color: '#d24a7a', score: 10, xp: 1, shape: 'circle' },
  runner: { speed: 165, hp: 16, r: 11, dmg: 8, color: '#ff8a4d', score: 15, xp: 1, shape: 'diamond' },
  brute: { speed: 62, hp: 90, r: 24, dmg: 22, color: '#7d2a50', score: 30, xp: 2, shape: 'square' },
  spitter: { speed: 70, hp: 40, r: 16, dmg: 10, color: '#6b9bff', score: 25, xp: 2, shape: 'circle', ranged: true },
};

export function makeEnemy(x, y, type, wave) {
  const t = TYPES[type];
  const scale = 1 + (wave - 1) * 0.06;
  return {
    type,
    x, y,
    hp: Math.round(t.hp * scale),
    maxHp: Math.round(t.hp * scale),
    r: t.r,
    dmg: t.dmg,
    speed: t.speed * (1 + (wave - 1) * 0.03),
    color: t.color,
    score: t.score,
    xp: t.xp,
    shape: t.shape,
    kx: 0, ky: 0,
    flash: 0,
    wobble: Math.random() * Math.PI * 2,
    ranged: !!t.ranged,
    shootCd: Math.random() * 2,
    boss: false,
    elite: false,
  };
}

// An elite is a buffed enemy with a ring and high reward.
export function makeElite(x, y, wave) {
  const t = TYPES[Math.random() < 0.5 ? 'brute' : 'crawler'];
  const scale = 1 + (wave - 1) * 0.08;
  return {
    type: 'elite',
    x, y,
    hp: Math.round(t.hp * 6 * scale),
    maxHp: Math.round(t.hp * 6 * scale),
    r: t.r + 8,
    dmg: t.dmg * 2,
    speed: t.speed * 1.05,
    color: '#c86bff',
    score: 100,
    xp: 4,
    shape: 'elite',
    kx: 0, ky: 0,
    flash: 0,
    wobble: Math.random() * Math.PI * 2,
    ranged: true,
    shootCd: Math.random() * 2,
    boss: false,
    elite: true,
  };
}

// The wave-5 / wave-10 boss: big, summoning, ranged, with a health bar.
export function makeBoss(x, y, wave) {
  const hp = 1400 + (wave - 5) * 300;
  return {
    type: 'boss',
    x, y,
    hp, maxHp: hp,
    r: 46,
    dmg: 26,
    speed: 46,
    color: '#ff3d5e',
    score: 400,
    xp: 6,
    shape: 'boss',
    kx: 0, ky: 0,
    flash: 0,
    wobble: 0,
    ranged: true,
    shootCd: 0,
    boss: true,
    elite: false,
  };
}

// Pick a spawn point just off one of the arena edges.
export function spawnEdge(width, height, rng) {
  const side = rng.int(0, 3);
  let x, y;
  if (side === 0) { x = -30; y = rng.range(0, height); }
  else if (side === 1) { x = width + 30; y = rng.range(0, height); }
  else if (side === 2) { x = rng.range(0, width); y = -30; }
  else { x = rng.range(0, width); y = height + 30; }
  return { x, y };
}

// Pick a composition for a normal wave's spawns.
export function pickWaveComp(wave, rng) {
  const count = Math.min(3 + wave, 8);
  const pool = ['crawler'];
  if (wave >= 2) pool.push('runner');
  if (wave >= 3) pool.push('brute');
  if (wave >= 4) pool.push('spitter');
  const comp = [];
  for (let i = 0; i < count; i++) {
    comp.push(rng.pick(pool));
  }
  return comp;
}

// Update one enemy's movement and behaviour toward the player.
export function updateEnemy(e, player, dt, width, height, shots, fx) {
  const dx = player.x - e.x;
  const dy = player.y - e.y;
  const dist = Math.hypot(dx, dy) || 1;
  const nx = dx / dist;
  const ny = dy / dist     ;
  const chase = e.type === 'spitter' || e.type === 'boss' || e.elite ? 0.4 : 1;
  const speed = e.boss ? e.speed : e.speed * chase;

  e.wobble += dt * 4;
  const wob = Math.sin(e.wobble) * 0.25;

  e.x += (nx * speed * (1 + wob) + e.kx) * dt;
  e.y += (ny * speed * (1 + wob) + e.ky) * dt;

  // Knockback decays.
  e.kx *= Math.pow(0.86, dt * 60);
  e.ky *= Math.pow(0.86, dt * 60);

  e.x = Math.max(-60, Math.min(width + 60, e.x));
  e.y = Math.max(-60, Math.min(height + 60, e.y));

  if (e.flash > 0) e.flash -= dt;

  // Ranged enemies fire bullets at the player from a distance.
  if (e.ranged) {
    e.shootCd -= dt;
    if (e.shootCd <= 0 && dist < 620 && dist > 80) {
      e.shootCd = e.boss ? 1.15 : 2.2;
      const n = e.boss ? 8 : e.elite ? 3 : 1;
      for (let i = 0; i < n; i++) {
        const a = e.boss ? (i * Math.PI * 2) / n + e.wobble * 0.5 : Math.atan2(dy, dx);
        shots.push(makeEnemyShot(e.x, e.y, a, e.boss ? 240 : 220, 12, e.boss ? 8 : 6));
      }
    }
  }

  // Contact damage to the player.
  const rr = e.r + CONFIG.playerRadius;
  if (dist < rr && player.iframes <= 0 && !player.dead) {
    player.iframes = CONFIG.iFrames;
    player.hp -= e.dmg;
    fx.shake += 12;
    fx.audio.sfx.hurt();
    burst(fx.parts, player.x, player.y, '#ff4d5e', 12, 180, 0.35);
    if (player.hp <= 0) { player.hp = 0; player.dead = true; }
  }
}

// Apply damage to an enemy; returns true if it died.
export function hitEnemy(e, dmg, ang, knock, fx, crit = false) {
  e.hp -= dmg;
  e.flash = 0.08;
  e.kx += Math.cos(ang) * knock;
  e.ky += Math.sin(ang) * knock;
  damageNumber(fx.parts, e.x, e.y, dmg, crit ? '#ffe27a' : '#ffd27d', crit);
  if (e.hp <= 0) {
    burst(fx.parts, e.x, e.y, e.color, e.boss ? 50 : e.elite ? 30 : 18, e.boss ? 320 : 220, 0.5, e.boss ? 4 : 3);
    ring(fx.parts, e.x, e.y, e.color, e.r + 12, 0.3);
    return true;
  }
  return false;
}