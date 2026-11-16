// waves.js — wave timing, spawning, bosses, and the run record.

import { CONFIG } from './config.js';
import { makeEnemy, makeElite, makeBoss, spawnEdge, pickWaveComp } from './entities/enemies.js';

// Create the wave state for a fresh run.
export function createWaves() {
  return {
    wave: 1,
    timer: 0,
    spawnCd: 0.5,
    spawnQueue: [],          // enemy types still to spawn this wave
    spawning: false,
    bossActive: false,
    between: false,
  };
}

// Advance to the next wave, filling the spawn queue.
export function startWave(waves, width, height, rng, fx) {
  waves.wave += 1;
  waves.spawning = true;
  waves.between = false;
  waves.spawnCd = 0.6;
  waves.spawnQueue.length = 0;
  const w = waves.wave;

  // A boss on every 5th wave, else a normal comp.
  if (w % CONFIG.bossEvery === 0) {
    waves.spawnQueue.push('BOSS');
    fx.audio.sfx.boss();
    fx.banner = { text: 'WAVE ' + w, sub: 'THE EMBER GUARDIAN AWAKENS', color: '#ff3d5e', t: 0 };
  } else {
    const comp = pickWaveComp(w, rng);
    waves.spawnQueue.push(...comp);
    // Occasionally a lone elite joins the crowd.
    if (w >= 3 && rng.next() < 0.35) waves.spawnQueue.splice(Math.floor(waves.spawnQueue.length / 2), 0, 'ELITE');
    fx.banner = { text: 'WAVE ' + w, sub: 'THE EMBER RISES', color: '#ff9a3c', t: 0 };
  }
}

// Called each frame while a wave is spawning.
export function updateWaves(waves, enemies, player, width, height, rng, fx, dt) {
  if (waves.spawning) {
    waves.spawnCd -= dt;
    if (waves.spawnCd <= 0 && waves.spawnQueue.length) {
      const type = waves.spawnQueue.shift();
      const pt = spawnEdge(width, height, rng);
      let e;
      if (type === 'BOSS') {
        e = makeBoss(width / 2, height / 2 + 60, waves.wave);
        waves.bossActive = true;
      } else if (type === 'ELITE') {
        e = makeElite(pt.x, pt.y, waves.wave);
      } else {
        e = makeEnemy(pt.x, pt.y, type, waves.wave);
      }
      enemies.push(e);
      waves.spawnCd = Math.max(CONFIG.minSpawnInterval, CONFIG.baseSpawnInterval - waves.wave * 0.09);
    }
    if (waves.spawnQueue.length === 0) waves.spawning = false;
  } else if (waves.bossActive) {
    // Wave is over once the boss dies (checked by the caller).
  } else if (!enemies.length) {
    // Wave cleared: a short pause, then the next wave.
    waves.timer += dt;
    if (waves.timer > 2.2) {
      waves.timer = 0;
      startWave(waves, width, height, rng, fx);
    }
  }
}