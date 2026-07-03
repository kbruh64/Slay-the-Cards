# Slay the Cards 🌿

A cozy fantasy roguelike deckbuilder built with **React + TypeScript + Tailwind CSS** (Vite).
Battle a wobbly Sprout Slime with a 10-card starter deck, manage your energy, and read the
enemy's telegraphed intent before ending your turn.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

```bash
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## Project structure

```
src/
  App.tsx               # mounts the dashboard
  main.tsx              # React entry point
  index.css             # Tailwind directives + base styles
  game/
    types.ts            # all TypeScript domain types
    cards.ts            # card library + 10-card starting deck
    engine.ts           # pure reducer: turn loop, draw/shuffle, combat, intents
    art.tsx             # hand-drawn SVG icon set + the illustrated slime
    GameDashboard.tsx   # the self-contained UI (enemy, hand, log, win/loss)
```

## Mechanics

- **Player:** HP 50, Shield (resets each turn), Energy 3/3 each turn.
- **Enemy:** Sprout Slime, HP 60, telegraphs its next intent (attack/defend).
- **Turn loop:** play cards -> *End Turn* -> enemy acts -> new intent -> draw a
  fresh hand of 4 -> energy refills.
- **Starting deck:** Strike x4 (1 energy, 6 dmg), Defend x4 (1 energy, +5 shield),
  Cozy Feast x1 (2 energy, heal 8), Power Surge x1 (0 energy, draw 2).

The `engine.ts` reducer is decoupled from the UI, so the dashboard is just a
projection of game state — easy to test or extend with new cards and enemies.

## Design

The interface follows the project's Taste Skill Pack (`taste-skill/`), routed to
**Warm Modern** with **Soft** materiality for the cozy-fantasy brief:

- One coherent warm palette (parchment/cream neutrals, a single ember accent,
  earthy clay/sage/dusk card tints) — no purple, no neon, no rainbow cards.
- A real font pairing: **Fraunces** (display) + **Mulish** (UI) with tabular
  numerals for all stats.
- Custom hand-drawn SVG iconography and an illustrated slime character instead of
  emoji.
- Weighted, purposeful motion: count-up stat numbers, scaleX health bars,
  staggered card deals, hover lift, a slime recoil and floating combat numbers on
  hits — all gated behind `prefers-reduced-motion`.
