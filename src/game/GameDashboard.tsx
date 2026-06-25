import { useEffect, useReducer, useRef } from 'react';
import type {
  CardCategory,
  CardInstance,
  EnemyState,
  Intent,
  LogEntry,
  PlayerState,
} from './types';
import { createInitialState, gameReducer } from './engine';

// ---------------------------------------------------------------------------
// GameDashboard — the single mounted component. It owns the reducer and renders
// the whole cozy battlefield out of small, presentational sub-components below.
// ---------------------------------------------------------------------------

export default function GameDashboard() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const { player, enemy, hand, drawPile, discardPile, log, phase, turn } = state;

  const canAct = phase === 'player';
  const restart = () => dispatch({ type: 'RESTART' });

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-amber-100 via-rose-100 to-emerald-100 font-cozy text-stone-700">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 p-4 lg:p-6">
        {/* Header ---------------------------------------------------------- */}
        <header className="flex items-center justify-between rounded-3xl bg-white/50 px-5 py-3 shadow-sm backdrop-blur">
          <div>
            <h1 className="text-2xl font-bold text-stone-700">🌿 Slay the Cards</h1>
            <p className="text-sm text-stone-500">A cozy fantasy roguelike deckbuilder</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-amber-200/70 px-3 py-1 text-sm font-semibold text-amber-800">
              Turn {turn}
            </span>
            <button
              onClick={restart}
              className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-600 shadow transition hover:bg-stone-50"
            >
              ↻ Restart
            </button>
          </div>
        </header>

        {/* Battlefield + log ---------------------------------------------- */}
        <main className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <section className="flex flex-col gap-4">
            <EnemyArea enemy={enemy} />
            <PlayerArea
              player={player}
              draw={drawPile.length}
              discard={discardPile.length}
              canAct={canAct}
              onEndTurn={() => dispatch({ type: 'END_TURN' })}
            />
          </section>
          <BattleLog log={log} />
        </main>

        {/* Hand ------------------------------------------------------------ */}
        <section className="rounded-3xl bg-white/40 p-4 shadow-inner backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">Your Hand</h2>
            <span className="text-xs text-stone-400">{hand.length} cards</span>
          </div>
          <div className="flex min-h-[15rem] flex-wrap items-end justify-center gap-3">
            {hand.length === 0 && (
              <p className="self-center text-sm italic text-stone-400">
                Hand empty — end your turn to draw a fresh one.
              </p>
            )}
            {hand.map((card) => (
              <CardView
                key={card.id}
                card={card}
                playable={canAct && card.cost <= player.energy}
                onPlay={() => dispatch({ type: 'PLAY_CARD', cardId: card.id })}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Win / loss overlay ----------------------------------------------- */}
      {(phase === 'won' || phase === 'lost') && <EndOverlay phase={phase} onRestart={restart} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Enemy
// ---------------------------------------------------------------------------

function EnemyArea({ enemy }: { enemy: EnemyState }) {
  return (
    <section className="relative flex flex-col items-center rounded-3xl bg-gradient-to-b from-emerald-200/60 to-emerald-100/40 p-6 shadow-sm">
      <IntentBubble intent={enemy.intent} />
      <div className="mt-3 animate-float select-none text-7xl drop-shadow">{enemy.emoji}</div>
      <h3 className="mt-2 text-lg font-bold text-emerald-900">{enemy.name}</h3>
      <div className="mt-3 w-64 max-w-full">
        <HealthBar value={enemy.hp} max={enemy.maxHp} color="emerald" />
      </div>
      {enemy.block > 0 && (
        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-sky-200 px-3 py-1 text-sm font-bold text-sky-800 shadow">
          🛡️ {enemy.block} Block
        </span>
      )}
    </section>
  );
}

function IntentBubble({ intent }: { intent: Intent }) {
  const isAttack = intent.type === 'attack';
  return (
    <div
      className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold shadow ${
        isAttack ? 'bg-rose-200 text-rose-800' : 'bg-sky-200 text-sky-800'
      }`}
    >
      <span className="text-base">{isAttack ? '⚔️' : '🛡️'}</span>
      <span>{isAttack ? `Attacking for ${intent.value}` : `Defending for ${intent.value}`}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

function PlayerArea({
  player,
  draw,
  discard,
  canAct,
  onEndTurn,
}: {
  player: PlayerState;
  draw: number;
  discard: number;
  canAct: boolean;
  onEndTurn: () => void;
}) {
  return (
    <section className="rounded-3xl bg-white/50 p-5 shadow-sm backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🧙</span>
          <div>
            <h3 className="font-bold text-stone-700">You</h3>
            <div className="mt-1 flex items-center gap-2 text-sm">
              {player.shield > 0 && (
                <span className="rounded-full bg-sky-200 px-2 py-0.5 font-bold text-sky-800">
                  🛡️ {player.shield}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-200 px-2 py-0.5 font-bold text-amber-800">
                ⚡ {player.energy}/{player.maxEnergy}
              </span>
            </div>
          </div>
        </div>
        <div className="w-56 max-w-full">
          <HealthBar value={player.hp} max={player.maxHp} color="rose" />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 text-xs font-semibold text-stone-500">
          <PileBadge icon="🂠" label="Draw" count={draw} />
          <PileBadge icon="🗑️" label="Discard" count={discard} />
        </div>
        <button
          onClick={onEndTurn}
          disabled={!canAct}
          className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-2.5 font-bold text-white shadow-md transition hover:from-amber-500 hover:to-orange-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          End Turn ➜
        </button>
      </div>
    </section>
  );
}

function PileBadge({ icon, label, count }: { icon: string; label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-stone-200/70 px-2 py-1">
      <span>{icon}</span>
      {label}: {count}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function HealthBar({ value, max, color }: { value: number; max: number; color: 'rose' | 'emerald' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const fill = color === 'emerald' ? 'bg-emerald-500' : 'bg-rose-500';
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs font-semibold text-stone-600">
        <span>❤️ HP</span>
        <span>
          {value} / {max}
        </span>
      </div>
      <div className="h-4 w-full overflow-hidden rounded-full bg-stone-300/60">
        <div
          className={`h-full rounded-full ${fill} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

const CATEGORY_STYLES: Record<CardCategory, { body: string; border: string; badge: string }> = {
  attack: { body: 'bg-gradient-to-b from-rose-50 to-rose-100', border: 'border-rose-300', badge: 'bg-rose-100 text-rose-700' },
  defense: { body: 'bg-gradient-to-b from-sky-50 to-sky-100', border: 'border-sky-300', badge: 'bg-sky-100 text-sky-700' },
  heal: { body: 'bg-gradient-to-b from-emerald-50 to-emerald-100', border: 'border-emerald-300', badge: 'bg-emerald-100 text-emerald-700' },
  utility: { body: 'bg-gradient-to-b from-violet-50 to-violet-100', border: 'border-violet-300', badge: 'bg-violet-100 text-violet-700' },
};

function CardView({
  card,
  playable,
  onPlay,
}: {
  card: CardInstance;
  playable: boolean;
  onPlay: () => void;
}) {
  const style = CATEGORY_STYLES[card.category];
  return (
    <button
      type="button"
      onClick={onPlay}
      disabled={!playable}
      title={playable ? `Play ${card.name}` : 'Not enough energy'}
      className={`group relative flex h-56 w-40 animate-pop flex-col rounded-2xl border-2 p-3 text-left shadow-lg transition-transform duration-200 ${style.body} ${style.border} ${
        playable
          ? 'cursor-pointer hover:-translate-y-4 hover:shadow-2xl'
          : 'cursor-not-allowed opacity-50 grayscale'
      }`}
    >
      {/* Energy badge, top-left */}
      <span className="absolute -left-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-base font-extrabold text-white shadow ring-2 ring-white">
        {card.cost}
      </span>

      <div className="mb-1 text-center text-sm font-extrabold text-stone-700">{card.name}</div>
      <div className="flex flex-1 items-center justify-center text-5xl">{card.emoji}</div>
      <div className={`rounded-xl px-2 py-1 text-center text-xs font-semibold ${style.badge}`}>
        {card.description}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Adventure log
// ---------------------------------------------------------------------------

const TONE_CLASS: Record<LogEntry['tone'], string> = {
  info: 'text-stone-400',
  player: 'text-emerald-700',
  enemy: 'text-rose-700',
  system: 'font-semibold text-amber-700',
};

function BattleLog({ log }: { log: LogEntry[] }) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [log]);

  return (
    <aside className="flex max-h-[26rem] flex-col rounded-3xl bg-white/50 p-4 shadow-sm backdrop-blur lg:max-h-none">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">Adventure Log</h2>
      <div className="flex-1 space-y-1 overflow-y-auto pr-1 text-sm leading-snug">
        {log.map((e) => (
          <p key={e.id} className={TONE_CLASS[e.tone]}>
            {e.text}
          </p>
        ))}
        <div ref={endRef} />
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Win / loss overlay
// ---------------------------------------------------------------------------

function EndOverlay({ phase, onRestart }: { phase: 'won' | 'lost'; onRestart: () => void }) {
  const won = phase === 'won';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">
      <div className="animate-pop rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="text-6xl">{won ? '🏆' : '🥀'}</div>
        <h2 className={`mt-3 text-3xl font-extrabold ${won ? 'text-emerald-600' : 'text-rose-600'}`}>
          {won ? 'Victory!' : 'Defeated'}
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-stone-500">
          {won
            ? 'The slime dissolves into a shower of cozy stardust. Well played, adventurer!'
            : 'The glade grows quiet. Rest by the fire, then rise to try again.'}
        </p>
        <button
          onClick={onRestart}
          className="mt-5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-6 py-2.5 font-bold text-white shadow-md transition hover:from-amber-500 hover:to-orange-500"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
