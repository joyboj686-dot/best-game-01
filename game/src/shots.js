// shots.js — player bullets and enemy projectiles.

import { CONFIG } from './config.js';

// Create a player bullet.
export function makeShot(x, y, ang) {
  const n = CONFIG.shotCount;
  const base = ang + (n === 1 ? 0 : -CONFIG.spread);
  const step = n > 1 ? (CONFIG.spread * 2) / (n - 1) : 0;
  const list = [];
  for (let i = 0; i < n; i++) {
    const a = base + step * i;
    list.push({
      x, y,
      vx: Math.cos(a) * CONFIG.shootSpeed,
      vy: Math.sin(a) * CONFIG.shootSpeed,
      life: CONFIG.bulletLife,
      r: CONFIG.bulletRadius,
      damage: CONFIG.shootDamage,
      friendly: true,
      hit: false,
    });
  }
  return list;
}

// Create an enemy bullet.
export function makeEnemyShot(x, y, ang, speed, damage, r = 6) {
  return {
    x, y,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    life: 4,
    r,
    damage,
    friendly: false,
    hit: false,
  };
}

export function updateShots(shots, dt, width, height) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    if (s.life <= 0 || s.x < -40 || s.x > width + 40 || s.y < -40 || s.y > height + 40) {
      shots.splice(i, 1);
    }
  }
}