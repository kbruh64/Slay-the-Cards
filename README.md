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
    GameDashboard.tsx   # the self-contained UI (enemy, hand, log, win/loss)
```

## Mechanics

- **Player:** HP 50, Shield (resets each turn), Energy 3/3 each turn.
- **Enemy:** Sprout Slime, HP 60, telegraphs its next intent (attack/defend).
- **Turn loop:** play cards → *End Turn* → enemy acts → new intent → draw a fresh
  hand of 4 → energy refills.
- **Starting deck:** Strike ×4 (1⚡, 6 dmg), Defend ×4 (1⚡, +5 shield),
  Cozy Feast ×1 (2⚡, heal 8), Power Surge ×1 (0⚡, draw 2).

The `engine.ts` reducer is decoupled from the UI, so the dashboard is just a
projection of game state — easy to test or extend with new cards and enemies.
