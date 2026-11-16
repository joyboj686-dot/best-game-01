// config.js — central tuning constants for Emberfall, an arena survival roguelite.
// Every gameplay value lives here so the rest of the code reads cleanly.

export const CONFIG = {
  // Arena / viewport: the whole canvas is the playing field.
  width: 1280,
  height: 720,

  // Player.
  playerSpeed: 295,
  playerRadius: 15,
  playerMaxHp: 100,
  fireCooldown: 0.2,
  shootSpeed: 640,
  shootDamage: 12,
  shotCount: 1,
  spread: 0.07,
  knockback: 300,
  bulletRadius: 5,
  bulletLife: 0.95,
  iFrames: 0.6,

  // Waves / spawning.
  waveDuration: 26,
  baseSpawnInterval: 1.7,
  minSpawnInterval: 0.32,
  bossEvery: 5,

  // XP / levelling.
  xpPerLevel: 4,
  gemValue: 1,
  maxUpgradeChoices: 3,

  // Pickups.
  magnetRadius: 130,
  bombRadius: 170,
  bombDamage: 90,

  // Particle tuning.
  maxParticles: 900,
};

// Ember palette — warm fire against cold night, readable at a glance.
export const COLORS = {
  bgTop: '#0b0e17',
  bgBottom: '#191321',
  player: '#ffe9c9',
  accent: '#ff9a3c',
  accent2: '#ff5e3a',
  gem: '#5ef0ff',
  enemy: '#d24a7a',
  enemyDark: '#7d2a50',
  elite: '#c86bff',
  boss: '#ff3d5e',
  hp: '#ff4d5e',
  xp: '#5ef0ff',
  white: '#ffffff',
  textDim: '#9aa3b8',
};