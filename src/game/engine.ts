import type {
  CardInstance,
  EnemyState,
  GameAction,
  GameState,
  Intent,
  LogEntry,
  Phase,
} from './types';
import { buildDeck } from './cards';

// ---------------------------------------------------------------------------
// Pure(ish) game engine. The reducer never touches the DOM and returns a new
// GameState for every action, so the UI is a straight projection of state.
// (Randomness lives here, which is the only non-determinism.)
// ---------------------------------------------------------------------------

export const MAX_HP = 50;
export const START_ENERGY = 3;
export const HAND_SIZE = 4;
export const ENEMY_MAX_HP = 60;

const LOG_LIMIT = 40;

let logCounter = 0;
function entry(text: string, tone: LogEntry['tone']): LogEntry {
  logCounter += 1;
  return { id: logCounter, text, tone };
}

function pushLogs(log: LogEntry[], items: LogEntry[]): LogEntry[] {
  const merged = [...log, ...items];
  return merged.length > LOG_LIMIT ? merged.slice(merged.length - LOG_LIMIT) : merged;
}

function pushLog(log: LogEntry[], item: LogEntry): LogEntry[] {
  return pushLogs(log, [item]);
}

/** Fisher–Yates shuffle returning a new array. */
function shuffle<T>(arr: readonly T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Roll the slime's next intent: lean offensive, but it likes to turtle too. */
function rollIntent(): Intent {
  if (Math.random() < 0.55) {
    return { type: 'attack', value: 6 + Math.floor(Math.random() * 7) }; // 6–12
  }
  return { type: 'defend', value: 5 + Math.floor(Math.random() * 4) }; // 5–8
}

interface DrawResult {
  drawPile: CardInstance[];
  discardPile: CardInstance[];
  hand: CardInstance[];
}

/**
 * Draw `count` cards. When the draw pile runs dry, the discard pile is shuffled
 * back into it. If both are empty we simply draw fewer cards.
 */
function drawCards(
  count: number,
  drawPile: CardInstance[],
  discardPile: CardInstance[],
  hand: CardInstance[],
): DrawResult {
  let draw = drawPile.slice();
  let discard = discardPile.slice();
  const newHand = hand.slice();

  for (let i = 0; i < count; i += 1) {
    if (draw.length === 0) {
      if (discard.length === 0) break; // nothing left anywhere
      draw = shuffle(discard);
      discard = [];
    }
    newHand.push(draw.pop()!);
  }

  return { drawPile: draw, discardPile: discard, hand: newHand };
}

/** Apply damage to the enemy, chewing through block before HP. */
function damageEnemy(enemy: EnemyState, amount: number): EnemyState {
  const absorbed = Math.min(enemy.block, amount);
  const toHp = amount - absorbed;
  return {
    ...enemy,
    block: enemy.block - absorbed,
    hp: Math.max(0, enemy.hp - toHp),
  };
}

/** Fresh game: shuffled deck, full health, an opening hand and a first intent. */
export function createInitialState(): GameState {
  const deck = shuffle(buildDeck());
  const { drawPile, discardPile, hand } = drawCards(HAND_SIZE, deck, [], []);

  return {
    turn: 1,
    phase: 'player',
    player: {
      hp: MAX_HP,
      maxHp: MAX_HP,
      shield: 0,
      energy: START_ENERGY,
      maxEnergy: START_ENERGY,
    },
    enemy: {
      name: 'Sprout Slime',
      emoji: '🟢',
      hp: ENEMY_MAX_HP,
      maxHp: ENEMY_MAX_HP,
      block: 0,
      intent: rollIntent(),
    },
    drawPile,
    hand,
    discardPile,
    log: [entry('A wobbly Sprout Slime hops into the glade. Your move, friend! 🌿', 'system')],
  };
}

function playCard(state: GameState, cardId: string): GameState {
  if (state.phase !== 'player') return state;

  const card = state.hand.find((c) => c.id === cardId);
  if (!card) return state;

  if (card.cost > state.player.energy) {
    return { ...state, log: pushLog(state.log, entry(`Not enough energy for ${card.name}.`, 'info')) };
  }

  let player = { ...state.player, energy: state.player.energy - card.cost };
  let enemy = state.enemy;
  let drawPile = state.drawPile;
  let hand = state.hand.filter((c) => c.id !== cardId);
  // The played card leaves the hand and rests in the discard pile immediately.
  let discardPile = [...state.discardPile, card];
  const logs: LogEntry[] = [];

  const fx = card.effect;

  if (fx.damage) {
    enemy = damageEnemy(enemy, fx.damage);
    logs.push(entry(`You play ${card.name} ${card.emoji} — ${fx.damage} damage to the slime.`, 'player'));
  }
  if (fx.shield) {
    player = { ...player, shield: player.shield + fx.shield };
    logs.push(entry(`You play ${card.name} ${card.emoji} — gain ${fx.shield} shield.`, 'player'));
  }
  if (fx.heal) {
    const healed = Math.min(fx.heal, player.maxHp - player.hp);
    player = { ...player, hp: player.hp + healed };
    logs.push(entry(`You play ${card.name} ${card.emoji} — recover ${healed} HP.`, 'player'));
  }
  if (fx.draw) {
    const res = drawCards(fx.draw, drawPile, discardPile, hand);
    drawPile = res.drawPile;
    discardPile = res.discardPile;
    hand = res.hand;
    logs.push(entry(`You play ${card.name} ${card.emoji} — draw ${fx.draw} cards.`, 'player'));
  }

  let phase: Phase = state.phase;
  if (enemy.hp <= 0) {
    phase = 'won';
    logs.push(entry('The slime melts into a puddle of cozy stardust. Victory! 🏆', 'system'));
  }

  return { ...state, player, enemy, drawPile, hand, discardPile, phase, log: pushLogs(state.log, logs) };
}

function endTurn(state: GameState): GameState {
  if (state.phase !== 'player') return state;

  const logs: LogEntry[] = [entry('— You end your turn. The slime stirs… —', 'info')];

  // 1) Whatever is still in hand is discarded — a fresh hand comes next turn.
  let discardPile = [...state.discardPile, ...state.hand];
  let hand: CardInstance[] = [];
  let drawPile = state.drawPile;

  // 2) Enemy turn: its old block fades, then it acts on its telegraphed intent.
  let enemy: EnemyState = { ...state.enemy, block: 0 };
  let player = { ...state.player };
  const intent = state.enemy.intent;

  if (intent.type === 'attack') {
    const absorbed = Math.min(player.shield, intent.value);
    const toHp = intent.value - absorbed;
    player = { ...player, shield: player.shield - absorbed, hp: Math.max(0, player.hp - toHp) };

    if (absorbed > 0 && toHp > 0) {
      logs.push(entry(`Slime attacks for ${intent.value}! Shield blocks ${absorbed}, you take ${toHp}.`, 'enemy'));
    } else if (absorbed > 0) {
      logs.push(entry(`Slime attacks for ${intent.value}! Your shield soaks it all. 🛡️`, 'enemy'));
    } else {
      logs.push(entry(`Slime attacks for ${intent.value}! You take ${toHp} damage. 💥`, 'enemy'));
    }
  } else {
    enemy = { ...enemy, block: enemy.block + intent.value };
    logs.push(entry(`Slime hunkers down and gains ${intent.value} block.`, 'enemy'));
  }

  // 3) Defeat check before the new round begins.
  if (player.hp <= 0) {
    return {
      ...state,
      player: { ...player, hp: 0 },
      enemy,
      hand,
      drawPile,
      discardPile,
      phase: 'lost',
      log: pushLogs(state.log, [...logs, entry('You sink into the soft grass… Defeat. 🥀', 'system')]),
    };
  }

  // 4) Slime telegraphs its next intent.
  enemy = { ...enemy, intent: rollIntent() };

  // 5) New player turn: shield wipes, energy refills, draw a fresh hand of 4.
  player = { ...player, shield: 0, energy: player.maxEnergy };
  const res = drawCards(HAND_SIZE, drawPile, discardPile, hand);
  drawPile = res.drawPile;
  discardPile = res.discardPile;
  hand = res.hand;

  logs.push(entry(`Turn ${state.turn + 1} — you draw a fresh hand and your energy is restored.`, 'system'));

  return {
    ...state,
    turn: state.turn + 1,
    phase: 'player',
    player,
    enemy,
    drawPile,
    hand,
    discardPile,
    log: pushLogs(state.log, logs),
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'PLAY_CARD':
      return playCard(state, action.cardId);
    case 'END_TURN':
      return endTurn(state);
    case 'RESTART':
      return createInitialState();
    default:
      return state;
  }
}
