// upgrades.js — the pool of level-up choices and how each is applied.

import { CONFIG } from './config.js';

// A catalogue of possible upgrades. Each has a name, icon, colour and apply().
export const UPGRADES = [
  {
    id: 'damage', name: 'Fierce Shot', icon: '✸', color: '#ff9a3c',
    desc: '+40% bullet damage',
    apply: (p) => { p.stats.damage += 0.4; },
  },
  {
    id: 'firespeed', name: 'Rapid Volley', icon: '➤', color: '#ffd27d',
    desc: '+30% fire rate',
    apply: (p) => { p.stats.fireRate += 0.3; },
  },
  {
    id: 'multishot', name: 'Split Shot', icon: '⋈', color: '#ffe9c9',
    desc: '+1 projectile per volley',
    apply: (p) => { p.stats.shotCount += 1; CONFIG.shotCount = p.stats.shotCount; },
  },
  {
    id: 'pierce', name: 'Piercing Bolt', icon: '↗', color: '#9fd8ff',
    desc: 'Bullets pierce 1 extra enemy',
    apply: (p) => { p.stats.pierce += 1; },
  },
  {
    id: 'bulletspeed', name: 'Swift Munition', icon: '»', color: '#5ef0ff',
    desc: '+40% bullet speed',
    apply: (p) => { p.stats.bulletSpeed += 0.4; },
  },
  {
    id: 'move', name: 'Swift Step', icon: '❯', color: '#7aff9a',
    desc: '+18% move speed',
    apply: (p) => { p.stats.speed += 0.18; },
  },
  {
    id: 'magnet', name: 'Magnetic Pull', icon: '❂', color: '#b58cff',
    desc: '+60% pickup magnet range',
    apply: (p) => { p.stats.magnet += 0.6; },
  },
  {
    id: 'maxhp', name: 'Ember Heart', icon: '♥', color: '#ff6b7a',
    desc: '+30 max HP and fully heal',
    apply: (p) => { p.maxHp += 30; p.hp = p.maxHp; },
  },
];

// Pick several distinct upgrade choices.
export function rollChoices(rng) {
  const pool = UPGRADES.slice();
  const choices = [];
  const used = new Set();
  const want = Math.min(CONFIG.maxUpgradeChoices, pool.length);
  while (choices.length < want) {
    const u = rng.pick(pool);
    if (!used.has(u.id)) {
      used.add(u.id);
      choices.push(u);
    }
  }
  return choices;
}