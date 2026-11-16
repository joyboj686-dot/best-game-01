// ui.js — HUD, overlays and screens: title, pause, level-up, game over, victory.

import { CONFIG, COLORS } from './config.js';

const FONT = 'system-ui, sans-serif';

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(12,10,20,0.82)';
  ctx.strokeStyle = 'rgba(255,154,60,0.35)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = String(text).split(' ');
  let line = '';
  let cy = y;
  ctx.textAlign = 'left';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, cy);
      line = w;
      cy += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
}

// The in-game HUD: HP, XP, wave, score, timer, level.
export function drawHUD(ctx, player, score, waves, time, muted) {
  const barW = 240, barH = 14, x = 18, y = 18;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x, y, barW, barH);
  const hpf = Math.max(0, player.hp / player.maxHp);
  const hg = ctx.createLinearGradient(x, 0, x + barW, 0);
  hg.addColorStop(0, COLORS.hp);
  hg.addColorStop(1, '#ff9a3c');
  ctx.fillStyle = hg;
  ctx.fillRect(x, y, barW * hpf, barH);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.strokeRect(x, y, barW, barH);
  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 12px ' + FONT;
  ctx.textAlign = 'left';
  ctx.fillText(Math.ceil(player.hp) + ' / ' + player.maxHp, x + barW + 8, y + 12);

  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x, y + 22, barW, 10);
  const xpf = Math.min(1, player.xp / player.xpToNext);
  ctx.fillStyle = COLORS.xp;
  ctx.fillRect(x, y + 22, barW * xpf, 10);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '11px ' + FONT;
  ctx.fillText('LV ' + player.level + '  XP ' + Math.floor(player.xp) + '/' + player.xpToNext, x, y + 46);

  ctx.textAlign = 'right';
  ctx.font = 'bold 22px ' + FONT;
  ctx.fillStyle = COLORS.white;
  ctx.fillText('WAVE ' + waves.wave, CONFIG.width - 18, 40);
  ctx.font = 'bold 16px ' + FONT;
  ctx.fillStyle = '#ffd27d';
  ctx.fillText('SCORE ' + score.value, CONFIG.width - 18, 64);
  ctx.font = '14px ' + FONT;
  ctx.fillStyle = COLORS.textDim;
  const mm = Math.floor(time / 60);
  const ss = Math.floor(time % 60);
  ctx.fillText(mm + ':' + String(ss).padStart(2, '0'), CONFIG.width - 18, 84);

  if (muted) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#888';
    ctx.font = '12px ' + FONT;
    ctx.fillText('MUTED (M)', 18, CONFIG.height - 14);
  }
}

// --- Screens ----------------------------------------------------------------

export function drawTitle(ctx, best) {
  ctx.fillStyle = 'rgba(8,7,14,0.6)';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff9a3c';
  ctx.font = 'bold 76px ' + FONT;
  ctx.fillText('EMBERFALL', CONFIG.width / 2, 210);

  ctx.fillStyle = '#ffd27d';
  ctx.font = '22px ' + FONT;
  ctx.fillText('Survive the rising horde. Claim the ember.', CONFIG.width / 2, 250);

  ctx.fillStyle = COLORS.white;
  ctx.font = '18px ' + FONT;
  ctx.fillText('WASD / Arrows - move        Mouse - aim        Click / Space - fire', CONFIG.width / 2, 330);
  ctx.fillText('Pick up gems to level up. Choose your power.', CONFIG.width / 2, 358);
  ctx.fillText('Defeat the boss on wave 10 to win.', CONFIG.width / 2, 386);

  ctx.fillStyle = '#ffd27d';
  ctx.font = 'bold 24px ' + FONT;
  ctx.fillText('PRESS ENTER TO BEGIN', CONFIG.width / 2, 470);

  if (best) {
    ctx.fillStyle = '#5ef0ff';
    ctx.font = '18px ' + FONT;
    ctx.fillText('Best score: ' + best, CONFIG.width / 2, 516);
  }
}

// The level-up overlay with choice cards.
export function drawLevelUp(ctx, choices, level) {
  ctx.fillStyle = 'rgba(8,7,14,0.72)';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd27d';
  ctx.font = 'bold 40px ' + FONT;
  ctx.fillText('LEVEL ' + level + '!', CONFIG.width / 2, 170);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '18px ' + FONT;
  ctx.fillText('Choose an upgrade', CONFIG.width / 2, 204);

  const n = choices.length;
  const cw = 250, ch = 300, gap = 36;
  const total = n * cw + (n - 1) * gap;
  const startX = (CONFIG.width - total) / 2;
  const y = 250;
  for (let i = 0; i < n; i++) {
    const c = choices[i];
    const cx = startX + i * (cw + gap);
    panel(ctx, cx, y, cw, ch);
    ctx.textAlign = 'center';
    ctx.fillStyle = c.color;
    ctx.font = '46px ' + FONT;
    ctx.fillText(c.icon, cx + cw / 2, y + 70);
    ctx.fillStyle = COLORS.white;
    ctx.font = 'bold 20px ' + FONT;
    ctx.fillText(c.name, cx + cw / 2, y + 118);
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '16px ' + FONT;
    ctx.fillText('Press ' + (i + 1), cx + cw / 2, y + ch - 30);
    ctx.font = '15px ' + FONT;
    wrapText(ctx, c.desc, cx + 20, y + 150, cw - 40, 20);
  }
}

export function drawPause(ctx) {
  ctx.fillStyle = 'rgba(8,7,14,0.6)';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 44px ' + FONT;
  ctx.fillText('PAUSED', CONFIG.width / 2, CONFIG.height / 2 - 10);
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '18px ' + FONT;
  ctx.fillText('Press P or Esc to resume', CONFIG.width / 2, CONFIG.height / 2 + 30);
}

export function drawEnd(ctx, player, score, waves, time, won) {
  ctx.fillStyle = 'rgba(8,7,14,0.82)';
  ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);

  ctx.textAlign = 'center';
  ctx.fillStyle = won ? '#ffd27d' : '#ff4d5e';
  ctx.font = 'bold 64px ' + FONT;
  ctx.fillText(won ? 'VICTORY!' : 'GAME OVER', CONFIG.width / 2, 220);

  ctx.fillStyle = COLORS.white;
  ctx.font = '24px ' + FONT;
  ctx.fillText('Score: ' + score.value, CONFIG.width / 2, 300);
  ctx.fillText('Wave reached: ' + waves.wave, CONFIG.width / 2, 340);
  ctx.fillText('Time survived: ' + Math.floor(time) + 's', CONFIG.width / 2, 380);

  ctx.fillStyle = '#5ef0ff';
  ctx.font = 'bold 20px ' + FONT;
  ctx.fillText('Press R or click to play again', CONFIG.width / 2, 460);
}

// A banner announcing a new wave or boss.
export function drawBanner(ctx, banner) {
  const t = banner.t;
  const a = Math.min(1, t * 2, (1 - t / 2) * 2);
  ctx.globalAlpha = Math.max(0, a);
  ctx.textAlign = 'center';
  ctx.fillStyle = banner.color;
  ctx.font = 'bold 44px ' + FONT;
  ctx.fillText(banner.text, CONFIG.width / 2, 250);
  ctx.fillStyle = COLORS.white;
  ctx.font = '18px ' + FONT;
  ctx.fillText(banner.sub, CONFIG.width / 2, 284);
  ctx.globalAlpha = 1;
}

// The boss health bar across the top.
export function drawBossBar(ctx, boss) {
  const w = 420, x = (CONFIG.width - w) / 2, y = 14, h = 16;
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#ff3d5e';
  ctx.fillRect(x, y, w * Math.max(0, boss.hp / boss.maxHp), h);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.strokeRect(x, y, w, h);
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.white;
  ctx.font = 'bold 13px ' + FONT;
  ctx.fillText('EMBER GUARDIAN', CONFIG.width / 2, y + h + 20);
}