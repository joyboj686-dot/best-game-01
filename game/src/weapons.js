// weapons.js — firing logic and bullet-vs-enemy/player resolution.

import { CONFIG } from './config.js';
import { makeShot } from './shots.js';
import { hitEnemy } from './entities/enemies.js';

// Fire while the trigger is held and off cooldown. Appends new bullets.
export function fireIfHeld(player, firing, fx, shots) {
  if (!firing || player.dead) return;
  player.cooldown -= fx.dt;
  if (player.cooldown > 0) return;
  player.cooldown = CONFIG.fireCooldown / player.stats.fireRate;
  const speedMul = player.stats.bulletSpeed;
  const newShots = makeShot(player.x, player.y, player.aim).map((s) => {
    s.vx *= speedMul;
    s.vy *= speedMul;
    s.damage = CONFIG.shootDamage * player.stats.damage;
    return s;
  });
  fx.audio.sfx.shoot();
  shots.push(...newShots);
}

// Move every bullet, then resolve it against enemies (friendly) or the player (hostile).
export function updateShots(shots, enemies, player, fx, dt, width, height) {
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.life -= dt;
    let remove = s.life <= 0 || s.x < -40 || s.x > width + 40 || s.y < -40 || s.y > height + 40     ;
    if (!remove && s.friendly) {
      for (let j = 0; j < enemies.length; j++) {
        const e = enemies[j];
        const dx = e.x - s.x;
        const dy = e.y - s.y;
        const rr = e.r + s.r;
        if (dx * dx + dy * dy < rr * rr) {
          const ang = Math.atan2(dy, dx);
          const dead = hitEnemy(e, s.damage, ang, CONFIG.knockback, fx, false);
          remove = true;
          if (player.stats.pierce > 0) {
            s.hit = (s.hit || 0) + 1;
            remove = s.hit > player.stats.pierce;
            if (dead) remove = true;
          }
          if (remove) break;
        }
      }
    } else if (!remove && !s.friendly) {
      const dx = player.x - s.x;
      const dy = player.y - s.y;
      const rr = s.r + CONFIG.playerRadius;
      if (dx * dx + dy * dy < rr * rr && player.iframes <= 0 && !player.dead) {
        player.iframes = CONFIG.iFrames;
        player.hp -= s.damage;
        fx.shake += 10;
        fx.audio.sfx.hurt();
        remove = true;
      }
    }
    if (remove) shots.splice(i, 1);
  }
}

// Point the player's aim at the mouse.
export function updateAim(player, input) {
  player.aim = Math.atan2(input.mouseY - player.y, input.mouseX - player.x);
}