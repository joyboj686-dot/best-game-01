// entities/player.js — the player: movement, aim, firing, XP, level, upgrades.

import { CONFIG } from '../config.js';
import { makeShot } from '../shots.js';
import { burst } from '../particles.js';

export function createPlayer(x, y) {
  return {
    x, y,
    hp: CONFIG.playerMaxHp,
    maxHp: CONFIG.playerMaxHp,
    xp: 0,
    level: 1,
    xpToNext: CONFIG.xpPerLevel,
    cooldown: 0,
    iframes: 0,
    dead: false,
    aim: 0,
    stats: {
      speed: 1,
      damage: 1,
      fireRate: 1,
      shotCount: 1,
      pierce: 0,
      maxHpBonus: 0,
      magnet: 1,
      bulletSpeed: 1,
    },
  };
}

export function gainXp(player, amount, audio, fx) {
  player.xp += amount;
  let leveled = false;
  while (player.xp >= player.xpToNext) {
    player.xp -= player.xpToNext;
    player.level += 1;
    player.xpToNext = Math.floor(CONFIG.xpPerLevel * (1 + (player.level - 1) * 0.35));
    leveled = true;
  }
  if (leveled) {
    audio.sfx.level();
    fx.ring && fx.ring(player.x, player.y, '#ffd27d', 60, 0.5);
  }
  return leveled;
}

// Attempt to fire; returns a list of new bullets or [] if on cooldown.
export function tryFire(player, fx, audio) {
  player.cooldown -= fx.dt;
  if (player.cooldown > 0) return [];
  player.cooldown = CONFIG.fireCooldown / player.stats.fireRate;
  const shots = makeShot(player.x, player.y, player.aim);
  audio.sfx.shoot();
  return shots;
}

// Apply knockback to an enemy after a hit.
export function applyKnockback(e, ang, power) {
  e.kx = (e.kx || 0) + Math.cos(ang) * power;
  e.ky = (e.ky || 0) + Math.sin(ang) * power;
}

export function takeDamage(player, amount, audio, fx, invuln) {
  if (player.iframes > 0 || player.dead) return false;
  player.hp -= amount;
  player.iframes = invuln;
  audio.sfx.hurt();
  fx.shake += 10;
  burst(fx.parts, player.x, player.y, '#ff4d5e', 14, 200, 0.4);
  if (player.hp <= 0) {
    player.hp = 0;
    player.dead = true;
  }
  return true;
}