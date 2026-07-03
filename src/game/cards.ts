import type { CardDef, CardInstance } from './types';

// ---------------------------------------------------------------------------
// Card library + starting deck.
// Add a new CardDef here and drop it into STARTING_DECK to expand the deck.
// ---------------------------------------------------------------------------

export const STRIKE: CardDef = {
  key: 'strike',
  name: 'Strike',
  cost: 1,
  category: 'attack',
  icon: 'sword',
  description: 'Deal 6 damage.',
  flavor: 'A clean swing of the practice blade.',
  effect: { damage: 6 },
};

export const DEFEND: CardDef = {
  key: 'defend',
  name: 'Defend',
  cost: 1,
  category: 'defense',
  icon: 'shield',
  description: 'Gain 5 shield.',
  flavor: 'Raise your guard and hold steady.',
  effect: { shield: 5 },
};

export const COZY_FEAST: CardDef = {
  key: 'cozy_feast',
  name: 'Cozy Feast',
  cost: 2,
  category: 'heal',
  icon: 'bowl',
  description: 'Heal 8 HP.',
  flavor: 'Warm stew by the campfire.',
  effect: { heal: 8 },
};

export const POWER_SURGE: CardDef = {
  key: 'power_surge',
  name: 'Power Surge',
  cost: 0,
  category: 'utility',
  icon: 'sparkle',
  description: 'Draw 2 cards.',
  flavor: 'A spark of inspiration takes hold.',
  effect: { draw: 2 },
};

/** The 10-card starting deck, described as (definition, copies) pairs. */
export const STARTING_DECK: ReadonlyArray<{ card: CardDef; count: number }> = [
  { card: STRIKE, count: 4 },
  { card: DEFEND, count: 4 },
  { card: COZY_FEAST, count: 1 },
  { card: POWER_SURGE, count: 1 },
];

let idCounter = 0;
/** Monotonic id so every card instance has a stable, unique React key. */
function makeCardId(key: string): string {
  idCounter += 1;
  return `${key}-${idCounter}`;
}

/** Build a fresh, unshuffled deck of CardInstances from the starting list. */
export function buildDeck(): CardInstance[] {
  const deck: CardInstance[] = [];
  for (const { card, count } of STARTING_DECK) {
    for (let i = 0; i < count; i += 1) {
      deck.push({ ...card, id: makeCardId(card.key) });
    }
  }
  return deck;
}
