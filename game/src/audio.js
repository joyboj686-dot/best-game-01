// audio.js — procedural sound: synthesised SFX and a soft looping music bed, all WebAudio.
// No audio files, no network requests. Mute with M.

export function createAudio() {
  let ctx = null;
  let muted = false;
  let master = null;
  let musicGain = null;
  let musicTimer = null;
  let musicStep = 0;
  let nextBeatTime = 0;

  const ensure = () => {
    if (ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0.5;
    musicGain.connect(master);
  };

  const resume = () => { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); };

  // A short blip: type 'sine'|'square'|'sawtooth'|'triangle'.
  const blip = (freq, dur, type = 'sine', vol = 0.3, slideTo = null, when = 0) => {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.02);
  };

  // A small burst of noise (for explosions).
  const noise = (dur, vol = 0.3, cutoff = 1200, when = 0) => {
    if (!ctx) return;
    const t = ctx.currentTime + when;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt); filt.connect(g); g.connect(master);
    src.start(t);
  };

  const sfx = {
    shoot: () => blip(720, 0.07, 'square', 0.1, 260),
    hit: () => blip(320, 0.06, 'sawtooth', 0.12, 140),
    enemyDie: () => { noise(0.16, 0.18, 900); blip(200, 0.14, 'sawtooth', 0.12, 60); },
    pickup: () => { blip(520, 0.06, 'sine', 0.16, 880); },
    gem: () => blip(760, 0.05, 'triangle', 0.08, 1060),
    level: () => { blip(440, 0.1, 'triangle', 0.2, 660); setTimeout(() => blip(660, 0.12, 'triangle', 0.2, 880), 90); },
    hurt: () => { blip(140, 0.18, 'sawtooth', 0.22, 70); noise(0.12, 0.14, 500); },
    heal: () => blip(500, 0.16, 'sine', 0.2, 780),
    bomb: () => { noise(0.5, 0.35, 700); blip(110, 0.4, 'sine', 0.25, 40); },
    boss: () => { blip(90, 0.6, 'sawtooth', 0.28, 45); blip(180, 0.5, 'sawtooth', 0.16, 60, 0.1); },
    win: () => {
      const notes = [523, 659, 784, 1047];
      notes.forEach((n, i) => setTimeout(() => blip(n, 0.28, 'triangle', 0.22), i * 140));
    },
    lose: () => {
      const notes = [392, 330, 262, 196];
      notes.forEach((n, i) => setTimeout(() => blip(n, 0.3, 'sawtooth', 0.18, n * 0.6), i * 150));
    },
  };

  // A gentle looping arpeggio, ember-scale feel.
  const SCHEDULE = [220, 0, 262, 0, 330, 262, 0, 220, 0, 196, 0, 262, 330, 392, 0, 330];
  const stepDur = 0.22;

  const scheduleMusic = () => {
    if (!ctx || muted) return;
    while (nextBeatTime < ctx.currentTime + 0.5) {
      const s = SCHEDULE[musicStep % SCHEDULE.length];
      if (s > 0) {
        const t = nextBeatTime - ctx.currentTime;
        blip(s, stepDur * 0.9, 'triangle', 0.06, null, Math.max(0, t));
      }
      nextBeatTime += stepDur;
      musicStep++;
    }
  };

  const startMusic = () => {
    ensure();
    if (!ctx || musicTimer) return;
    nextBeatTime = ctx.currentTime + 0.1;
    musicTimer = setInterval(scheduleMusic, 90);
  };

  const stopMusic = () => {
    if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  };

  const toggleMute = () => {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : 0.55;
    return muted;
  };

  return { resume, sfx, startMusic, stopMusic, toggleMute, isMuted: () => muted, ensure };
}