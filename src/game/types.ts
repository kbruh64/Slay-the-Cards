// ---------------------------------------------------------------------------
// Core domain types for the Slay the Cards deckbuilder.
// Everything the game needs is described here so the engine and UI stay typed.
// ---------------------------------------------------------------------------

/** Visual + behavioural family a card belongs to (drives colour theming). */
export type CardCategory = 'attack' | 'defense' | 'heal' | 'utility';

/** A bundle of effects a card applies when played. All fields are optional. */
export interface CardEffect {
  /** Damage dealt to the enemy (chips block first, then HP). */
  damage?: number;
  /** Shield granted to the player this turn. */
  shield?: number;
  /** HP restored to the player (capped at max HP). */
  heal?: number;
  /** Number of cards drawn from the draw pile. */
  draw?: number;
}

/** A card definition (the "template" — many instances can share one). */
export interface CardDef {
  key: string;
  name: string;
  cost: number;
  category: CardCategory;
  description: string;
  emoji: string;
  effect: CardEffect;
}

/** A concrete card living in a pile, with a stable unique id for React keys. */
export interface CardInstance extends CardDef {
  id: string;
}

/** What the enemy plans to do on its next turn. */
export type IntentType = 'attack' | 'defend';

export interface Intent {
  type: IntentType;
  value: number;
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  /** Temporary block; reset to 0 at the start of every player turn. */
  shield: number;
  energy: number;
  maxEnergy: number;
}

export interface EnemyState {
  name: string;
  emoji: string;
  hp: number;
  maxHp: number;
  /** Block the enemy is sitting behind; reset at the start of its turn. */
  block: number;
  intent: Intent;
}

/** Whose turn / game outcome the board is currently in. */
export type Phase = 'player' | 'won' | 'lost';

export type LogTone = 'info' | 'player' | 'enemy' | 'system';

export interface LogEntry {
  id: number;
  text: string;
  tone: LogTone;
}

/** The full, serialisable game state. The reducer only ever returns one of these. */
export interface GameState {
  turn: number;
  phase: Phase;
  player: PlayerState;
  enemy: EnemyState;
  drawPile: CardInstance[];
  hand: CardInstance[];
  discardPile: CardInstance[];
  log: LogEntry[];
}

/** Every way the player can mutate the game. */
export type GameAction =
  | { type: 'PLAY_CARD'; cardId: string }
  | { type: 'END_TURN' }
  | { type: 'RESTART' };
