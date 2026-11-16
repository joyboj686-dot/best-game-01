// random.js — a small seeded pseudo-random generator (mulberry32).
// Used for deterministic ?shot= screenshots and for a reproducible game seed.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A simple string hash so "seed=1" maps to a fixed 32-bit seed.
export function hashSeed(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Build a small RNG helper from a string seed.
export function makeRng(seed) {
  const rand = mulberry32(hashSeed(String(seed)));
  return {
    next: rand,
    int(lo, hi) {
      return lo + Math.floor(rand() * (hi - lo + 1));
    },
    range(lo, hi) {
      return lo + rand() * (hi - lo);
    },
    sign() {
      return rand() < 0.5 ? -1 : 1;
    },
    pick(arr) {
      return arr[Math.floor(rand() * arr.length)];
    },
  };
}