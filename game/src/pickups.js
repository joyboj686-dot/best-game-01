// pickups.js — XP gems and the health / magnet / bomb pickups.

import { CONFIG } from './config.js';
import { burst, ring, floatText, damageNumber } from './particles.js';

export function makeGem(x, y, value) {
  return { kind: 'gem', x, y, value, r: 5, t: Math.random() * 6 };
}

export function makePickup(x, y, kind) {
  return { kind, x, y, r: 12, t: 0 };
}

// Update pickups: magnet draws gems/pickups to the player; overlap collects them.
export function updatePickups(pickups, player, score, fx, audio) {
  const mag = CONFIG.magnetRadius * player.stats.magnet;
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i];
    p.t += 0.02;
    const dx = player.x - p.x;
    const dy = player.y - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < mag && dist > 4) {
      const pull = p.kind === 'gem' ? 900 : 600;
      const sp = pull * (1 - dist / mag) * 0.06 + 40;
      p.x += (dx / dist) * sp;
      p.y += (dy / dist) * sp;
    }
    const rr = p.r + CONFIG.playerRadius;
    if (dist < rr) {
      collect(pickups, i, p, player, score, fx, audio);
    }
  }
}

function collect(pickups, i, p, player, score, fx, audio) {
  if (p.kind === 'gem') {
    player.xp += p.value;
    while (player.xp >= player.xpToNext) {
      player.xp -= player.xpToNext;
      player.level += 1;
      player.xpToNext = Math.floor(CONFIG.xpPerLevel * (1 + (player.level - 1) * 0.35));
    }
    score.value += 5;
    audio.sfx.gem();
    burst(fx.parts, p.x, p.y, CONFIG.gemColor, 6, 120, 0.3, 2);
  } else if (p.kind === 'health') {
    player.hp = Math.min(player.maxHp, player.hp + 30);
    floatText(fx.parts, player.x, player.y, '+30 HP', '#6bff8a', 20);
    audio.sfx.heal();
    ring(fx.parts, player.x, player.y, '#6bff8a', 34, 0.35);
  } else if (p.kind === 'magnet') {
    player.magnetTimer = 6;
    floatText(fx.parts, player.x, player.y, 'MAGNET!', '#b58cff', 22);
    audio.sfx.pickup();
    ring(fx.parts, player.x, player.y, '#b58cff', 60, 0.4);
  } else if (p.kind === 'bomb') {
    fx.bombs.push({ x: p.x, y: p.y, r: 0, maxR: CONFIG.bombRadius, t: 0 });
    audio.sfx.bomb();
    floatText(fx.parts, p.x, p.y, 'BOMB!', '#ff9a3c', 22);
    burst(fx.parts, p.x, p.y, '#ff9a3c', 40, 300, 0.5, 4);
  }
  pickups.splice(i, 1);
}

// Expand bombs and damage enemies caught in them.
export function updateBombs(fx, enemies, width, height) {
  for (let i = fx.bombs.length - 1; i >= 0; i--) {
    const b = fx.bombs[i];
    b.t += 0.033;
    b.r = b.maxR * (1 - Math.pow(1 - Math.min(1, b.t / 0.5), 2));
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const dx = e.x - b.x;
      const dy = e.y - b.y;
      const d = Math.hypot(dx, dy);
      if (d < b.r + e.r) {
        const dead = (e.hp -= CONFIG.bombDamage) <= 0;
        damageNumber(fx.parts, e.x, e.y, CONFIG.bombDamage, '#ff9a3c', false);
        e.kx += (dx / (d || 1)) * 500;
        e.ky += (dy / (d || 1)) * 500;
        if (dead) { burst(fx.parts, e.x, e.y, e.color, 14, 200, 0.4, 3); enemies.splice(j, 1); }
      }
    }
    if (b.t > 0.6) fx.bombs.splice(i, 1);
  }
}