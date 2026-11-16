// main.js — Emberfall: the game loop, state machine, and wiring of every module.

import { CONFIG, COLORS } from './config.js';
import { makeRng } from './random.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { burst, ring, floatText, updateParticles } from './particles.js';
import { createPlayer, gainXp } from './entities/player.js';
import { updateEnemy, makeEnemy, makeBoss, makeElite } from './entities/enemies.js';
import { fireIfHeld, updateShots } from './weapons.js';
import { makeShot } from './shots.js';
import { createWaves, updateWaves, startWave } from './waves.js';
import { rollChoices } from './upgrades.js';
import { updatePickups, updateBombs } from './pickups.js';
import { makeGem, makePickup } from './pickups.js';
import {
  drawBackground, drawVignette, drawPlayer, drawEnemy, drawPickup,
  drawParticles, drawBombs,
} from './render.js';
import { drawHUD, drawTitle, drawLevelUp, drawPause, drawEnd, drawBanner, drawBossBar } from './ui.js';

const canvas = document.getElementById('game');
canvas.width = CONFIG.width;
canvas.height = CONFIG.height;
const ctx = canvas.getContext('2d');
const input = createInput(canvas);
const audio = createAudio();

// Parse a ?shot=scene&seed=n URL for deterministic screenshots.
const url = new URL(location.href);
const shotScene = url.searchParams.get('shot');
const shotSeed = url.searchParams.get('seed') || '1';

// ---- Game state ----
let game;

function newGame(mode) {
  return {
    mode,               // 'title' | 'play' | 'level' | 'pause' | 'end'
    audio,
    player: createPlayer(CONFIG.width / 2, CONFIG.height / 2),
    shots: [],
    enemies: [],
    pickups: [],
    parts: [],
    bombs: [],
    score: { value: 0 },
    waves: createWaves(),
    time: 0,
    x: 0, y: 0,
    shake: 0,
    banner: null,
    choices: [],
    levelPending: 0,
    won: false,
    appliedLevel: 1,
    fired: false,
    rng: makeRng(shotScene ? shotSeed : String(Date.now())),
  };
}

// ---- Level-up handling ----
function maybeTriggerLevel(g) {
  if (g.player.level > g.appliedLevel && g.mode === 'play') {
    g.appliedLevel = g.player.level;
    g.choices = rollChoices(g.rng);
    g.mode = 'level';
    audio.sfx.level();
  }
}

// ---- Death / win ----
function endRun(g, won) {
  g.won = won;
  g.mode = 'end';
  if (won) audio.sfx.win(); else audio.sfx.lose();
  const best = Number(localStorage.getItem('emberfall_best') || 0);
  if (g.score.value > best) localStorage.setItem('emberfall_best', String(g.score.value));
  burst(g.parts, g.player.x, g.player.y, won ? '#ffd27d' : '#ff4d5e', 60, 300, 1.0, 4);
}

// ---- Deterministic screenshots ----
function buildShotScene(scene, seed) {
  const rng = makeRng(seed);
  const g = newGame('play');
  g.rng = rng;
  g.player.x = CONFIG.width / 2;
  g.player.y = CONFIG.height / 2;
  g.player.aim = 0;
  if (scene === 'title') {
    g.mode = 'title';
    return g;
  }
  if (scene === 'play') {
    g.waves.wave = 2;
    g.time = 14;
    g.score.value = 1280;
    g.player.level = 3;
    g.player.xp = 2;
    g.appliedLevel = 3;
    for (let i = 0; i < 6; i++) {
      const e = makeEnemyAt(rng, 120 + i * 190, 130 + (i % 3) * 160, 'crawler');
      g.enemies.push(e);
    }
    g.enemies.push(makeEnemyAt(rng, 200, 180, 'runner'));
    // A spread of live bullets streaking toward the nearest enemy.
    g.shots.push(makeShot(g.player.x, g.player.y, 0.5)[0]);
    g.shots.push(makeShot(g.player.x, g.player.y, 0.1)[0]);
    g.pickups.push(makeGem(700, 400, 1));
    g.pickups.push(makeGem(760, 460, 1));
    g.pickups.push(makePickup(640, 520, 'health'));
    for (let i = 0; i < 30; i++) burst(g.parts, 200 + i * 20, 300 + Math.sin(i) * 60, '#ff9a3c', 1, 60, 0.5);
    return g;
  }
  if (scene === 'boss') {
    g.waves.wave = 10;
    g.waves.bossActive = true;
    g.time = 190;
    g.score.value = 9800;
    g.player.level = 8;
    g.appliedLevel = 8;
    const b = makeBossAt(CONFIG.width / 2, CONFIG.height / 2 + 40, 10);
    g.enemies.push(b);
    g.player.x = CONFIG.width / 2 - 120;
    g.player.y = CONFIG.height / 2 + 40;
    for (let i = 0; i < 3; i++) {
      const e = makeEnemyAt(rng, 300 + i * 160, 120 + i * 40, i % 2 ? 'runner' : 'crawler');
      g.enemies.push(e);
    }
    for (let i = 0; i < 40; i++) burst(g.parts, 200 + i * 18, 260 + Math.sin(i * 1.3) * 80, '#ff3d5e', 1, 80, 0.5);
    return g;
  }
  if (scene === 'victory') {
    g.mode = 'end';
    g.won = true;
    g.score.value = 12400;
    g.waves.wave = 10;
    g.time = 224;
    g.player.hp = 62;
    return g;
  }
  g.mode = 'title';
  return g;
}

function makeEnemyAt(rng, x, y, type) {
  const e = makeEnemy(x, y, type, 2);
  e.x = x; e.y = y;
  return e;
}
function makeBossAt(x, y, wave) {
  const e = makeBoss(x, y, wave);
  e.x = x; e.y = y;
  return e;
}

// ---- Update: one fixed 60Hz step ----
function step(g, dt) {
  if (g.mode !== 'play' && g.mode !== 'level') return;

  // Pause/level overlays freeze world time.
  const live = g.mode === 'play';
  g.time += live ? dt : 0;

  if (g.banner) { g.banner.t += dt; if (g.banner.t > 2) g.banner = null; }
  if (g.shake > 0) g.shake = Math.max(0, g.shake - dt * 40);

  if (!live) {
    updateParticles(g.parts, dt);
    return;
  }

  // Aim at the mouse.
  g.player.aim = Math.atan2(input.mouseY - g.player.y, input.mouseX - g.player.x);

  // Movement.
  let mx = 0, my = 0;
  if (input.keys['a'] || input.keys['arrowleft']) mx -= 1;
  if (input.keys['d'] || input.keys['arrowright']) mx += 1;
  if (input.keys['w'] || input.keys['arrowup']) my -= 1;
  if (input.keys['s'] || input.keys['arrowdown']) my += 1;
  const mlen = Math.hypot(mx, my) || 1;
  const speed = CONFIG.playerSpeed * g.player.stats.speed;
  g.player.x += (mx / mlen) * speed * dt;
  g.player.y += (my / mlen) * speed * dt;
  g.player.x = Math.max(16, Math.min(CONFIG.width - 16, g.player.x));
  g.player.y = Math.max(16, Math.min(CONFIG.height - 16, g.player.y));

  if (g.player.iframes > 0) g.player.iframes -= dt;

  // Fire while holding click or space.
  const firing = input.mouseDown || input.keys[' '];
  fireIfHeld(g.player, firing, g, g.shots);
  updateShots(g.shots, g.enemies, g.player, g, dt, CONFIG.width, CONFIG.height);

  // Enemies.
  for (let i = g.enemies.length - 1; i >= 0; i--) {
    const e = g.enemies[i];
    updateEnemy(e, g.player, dt, CONFIG.width, CONFIG.height, g.shots, g);
    if (e.hp <= 0) {
      g.score.value += e.score;
      g.pickups.push(makeGem(e.x, e.y, e.xp));
      if (e.boss) {
        g.waves.bossActive = false;
        if (g.waves.wave >= 10) { endRun(g, true); return; }
      }
      g.enemies.splice(i, 1);
    }
  }

  // If no boss and no enemies remain, advance the wave.
  if (!g.enemies.length && !g.waves.bossActive && !g.waves.spawning && g.waves.wave % CONFIG.bossEvery !== 0) {
    startNextWave(g);
  }

  // Waves.
  updateWaves(g.waves, g.enemies, g.player, CONFIG.width, CONFIG.height, g.rng, g, dt);

  // Pickups + bombs.
  updatePickups(g.pickups, g.player, g.score, g, audio);
  updateBombs(g, g.enemies, CONFIG.width, CONFIG.height);

  // Level-up?
  maybeTriggerLevel(g);

  // Particles.
  updateParticles(g.parts, dt);

  // Death check.
  if (g.player.dead) endRun(g, false);
}

function startNextWave(g) {
  // Wait a short beat, then roll the next wave (startWave increments).
  g.waves.timer += 1 / 60;
  if (g.waves.timer > 1.5) {
    g.waves.timer = 0;
    startWave(g.waves, CONFIG.width, CONFIG.height, g.rng, g);
  }
}

// ---- Render ----
function render(g) {
  ctx.clearRect(0, 0, CONFIG.width, CONFIG.height);
  drawBackground(ctx, CONFIG.width, CONFIG.height, g.time);

  ctx.save();
  if (g.shake > 0) {
    const s = g.shake;
    ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
  }

  drawPlayer(ctx, g.player, g.time);
  for (const e of g.enemies) drawEnemy(ctx, e, g.time);
  for (const p of g.pickups) drawPickup(ctx, p, g.time);
  drawBombs(ctx, g.bombs, g.time);
  drawParticles(ctx, g.parts);
  drawVignette(ctx, CONFIG.width, CONFIG.height);

  ctx.restore();

  // HUD and screens.
  if (g.mode === 'title') {
    const best = Number(localStorage.getItem('emberfall_best') || 0);
    drawTitle(ctx, best);
  } else if (g.mode === 'level') {
    drawHUD(ctx, g.player, g.score, g.waves, g.time, audio.isMuted());
    drawLevelUp(ctx, g.choices, g.player.level);
  } else if (g.mode === 'pause') {
    drawHUD(ctx, g.player, g.score, g.waves, g.time, audio.isMuted());
    drawPause(ctx);
  } else if (g.mode === 'end') {
    drawEnd(ctx, g.player, g.score, g.waves, g.time, g.won);
  } else {
    drawHUD(ctx, g.player, g.score, g.waves, g.time, audio.isMuted());
    if (g.banner) drawBanner(ctx, g.banner);
    const boss = g.enemies.find((e) => e.boss);
    if (boss) drawBossBar(ctx, boss);
  }
}

// ---- Loop ----
const STEP = 1 / 60;
let acc = 0;
let last = performance.now();
let startedAudio = false;

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  acc += dt;
  input.begin();
  while (acc >= STEP) {
    step(game, STEP);
    acc -= STEP;
  }
  render(game);

  if (!startedAudio) {
    audio.resume();
    if (game.mode !== 'title') audio.startMusic();
    startedAudio = true;
  }

  if (window.__shotReady === true) {
    // A screenshot scene: draw once, then stop after a couple frames.
    if (window.__shotFrames === undefined) window.__shotFrames = 0;
    window.__shotFrames++;
    if (window.__shotFrames > 3) { /* keep rendering but we can stop counting */ }
  }

  requestAnimationFrame(loop);
}

// ---- Input for menus ----
function onKey(e) {
  const k = e.key.toLowerCase();
  if (k === 'm') { audio.toggleMute(); return; }
  if (k === 'p' || k === 'escape') {
    if (game.mode === 'play') game.mode = 'pause';
    else if (game.mode === 'pause') game.mode = 'play';
    return;
  }
  if (k === 'r' && game.mode === 'end') { restart(); return; }
  if (game.mode === 'title' && (k === 'enter' || e.key === 'Enter')) { startGame(); return; }
  if (game.mode === 'end' && k === 'r') { startGame(); return; }
  if (game.mode === 'level') {
    if (k === '1' || k === '2' || k === '3') {
      const idx = Number(k) - 1;
      if (game.choices[idx]) {
        game.choices[idx].apply(game.player);
        game.mode = 'play';
      }
    }
  }
}

function startGame() {
  game = newGame('play');
  window.__game = game;
  audio.resume();
  audio.startMusic();
  audio.sfx.pickup();
  // First wave.
  startWave(game.waves, CONFIG.width, CONFIG.height, game.rng, game);
}

function restart() {
  game = newGame('play');
  window.__game = game;
  audio.resume();
  audio.startMusic();
  startWave(game.waves, CONFIG.width, CONFIG.height, game.rng, game);
}

function init() {
  // Build the deterministic shot scene, or the title screen.
  if (shotScene) {
    game = buildShotScene(shotScene, shotSeed);
  } else {
    game = newGame('title');
  }

  window.addEventListener('keydown', onKey);
  canvas.addEventListener('click', () => {
    if (game.mode === 'end') startGame();
    else if (game.mode === 'title') startGame();
  });

  // Signal the shot harness that a scene is ready.
  window.__shotReady = true;
  window.__game = game;
  requestAnimationFrame(loop);
}

init();