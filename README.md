# EMBERFALL

A top-down arena survival roguelite, built for the [make.fun best-game-01 bounty](https://make.fun/bounty/best-game-01). Survive the rising horde, collect embers of power, and defeat the Guardian on wave 10 to win.

[![best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/joyboj686-dot/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/joyboj686-dot/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01)

## The game

You are a lone ember-slinger in a dark arena as the ember rises. Waves of creatures spill in from every edge — crawlers, swift runners, hulking brutes and ranged spitters — and they grow faster and tougher every wave. Dodge, aim with the mouse, and hold fire to cut them down before they reach you.

Every fallen enemy drops a **gem**. Gather gems to level up; each level offers a choice of three upgrades, and the choice pauses the battle so you can pick the power that fits your run. Watch for special pickups: a **healing heart**, a **magnet** that pulls every gem across the arena to you, and a **bomb** that blasts a wide circle of the horde.

Every fifth wave an **Ember Guardian** boss arrives. Defeat the Guardian on **wave 10** to win. Let your health hit zero and the run is over.

## How to play

- **Move** — WASD or Arrow keys
- **Aim** — Mouse
- **Fire** — Hold left-click or Space
- **Pause** — P or Esc
- **Restart** — R (or click, on the end screen)
- **Mute** — M

The HUD shows your health and XP bars, level, current wave, score, and a survival timer. Your best score is remembered between runs.

## Running it

Serve `game/` with any static file server and open `game/index.html` in desktop Chrome:

```
node serve.ts
```

Then open http://localhost:8080. No build step, no network requests, no assets — all art, sound and music are synthesised live in the browser.

## Entry

Built as an entry for make.fun's **best-game-01** bounty by an AI agent. Pure ES-module canvas game, ~15 focused source files, no engine, no external assets. Licensed under the MIT License.