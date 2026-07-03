import { useEffect, useReducer, useRef, useState } from 'react';
import type {
  CardCategory,
  CardInstance,
  EnemyState,
  IconName,
  Intent,
  LogEntry,
  PlayerState,
} from './types';
import { createInitialState, gameReducer } from './engine';
import { Icon, SlimeCreature, type SlimeMood } from './art';

// ---------------------------------------------------------------------------
// GameDashboard — the cozy fantasy duel board.
// Warm Modern direction (warmth from material, light and pacing) with Soft
// materiality. No emoji: iconography and the creature are drawn in `art.tsx`.
// ---------------------------------------------------------------------------

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Gently ticks a number toward its new value (Warm Modern count-up). */
function useCountUp(value: number, duration = 420): number {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const shownRef = useRef(value);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = fromRef.current;
    const to = value;
    if (from === to) return;
    if (prefersReducedMotion()) {
      fromRef.current = to;
      shownRef.current = to;
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (to - from) * eased);
      shownRef.current = v;
      setDisplay(v);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      fromRef.current = shownRef.current;
    };
  }, [value, duration]);

  return display;
}

interface FloatText {
  id: number;
  target: 'enemy' | 'player';
  text: string;
  tone: 'damage' | 'heal';
  x: number;
}

export default function GameDashboard() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState);
  const { player, enemy, hand, drawPile, discardPile, log, phase, turn } = state;
  const canAct = phase === 'player';

  // --- combat feedback: floating numbers + a slime recoil on hit ------------
  const [floats, setFloats] = useState<FloatText[]>([]);
  const floatSeq = useRef(0);
  const spawnFloat = (target: FloatText['target'], text: string, tone: FloatText['tone']) => {
    const id = (floatSeq.current += 1);
    const x = Math.round((Math.random() - 0.5) * 44);
    setFloats((f) => [...f, { id, target, text, tone, x }]);
    window.setTimeout(() => setFloats((f) => f.filter((it) => it.id !== id)), 1000);
  };

  const [slimeHurt, setSlimeHurt] = useState(false);
  const [hitKey, setHitKey] = useState(0);
  const hurtTimer = useRef<number | undefined>(undefined);
  const pokeSlime = () => {
    setHitKey((k) => k + 1);
    setSlimeHurt(true);
    if (hurtTimer.current) clearTimeout(hurtTimer.current);
    hurtTimer.current = window.setTimeout(() => setSlimeHurt(false), 450);
  };

  const prevHp = useRef<{ p: number; e: number } | null>(null);
  useEffect(() => {
    const cur = { p: player.hp, e: enemy.hp };
    const prev = prevHp.current;
    prevHp.current = cur;
    if (!prev || prefersReducedMotion()) return;
    const dE = cur.e - prev.e;
    const dP = cur.p - prev.p;
    if (dE < 0) {
      spawnFloat('enemy', `${dE}`, 'damage');
      pokeSlime();
    }
    if (dP < 0) spawnFloat('player', `${dP}`, 'damage');
    else if (dP > 0) spawnFloat('player', `+${dP}`, 'heal');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.hp, enemy.hp]);

  const slimeMood: SlimeMood = phase === 'won' ? 'defeated' : slimeHurt ? 'hurt' : 'idle';
  const restart = () => dispatch({ type: 'RESTART' });

  return (
    <div className="relative min-h-[100dvh] w-full bg-[radial-gradient(120%_120%_at_50%_-10%,#f7eedd_0%,#efe3d0_46%,#e7dcc4_100%)] font-sans text-ink lg:h-screen lg:overflow-hidden">
      {/* soft glade atmosphere behind the scene (supports the creature, not a blob) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-[40vh] bg-[radial-gradient(60%_100%_at_50%_0%,rgba(111,138,91,0.16),transparent_70%)]"
      />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:grid lg:h-full lg:min-h-0 lg:grid-rows-[auto_minmax(0,1fr)_auto] lg:py-5">
        <TopBar turn={turn} onRestart={restart} />

        <main className="grid min-h-0 grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,1fr)_336px]">
          <div className="flex min-h-0 min-w-0 flex-col gap-4 lg:grid lg:grid-rows-[minmax(0,1fr)_auto]">
            <EnemyScene
              enemy={enemy}
              mood={slimeMood}
              hitKey={hitKey}
              floats={floats.filter((f) => f.target === 'enemy')}
            />
            <PlayerLedger
              player={player}
              draw={drawPile.length}
              discard={discardPile.length}
              canAct={canAct}
              floats={floats.filter((f) => f.target === 'player')}
              onEndTurn={() => dispatch({ type: 'END_TURN' })}
            />
          </div>

          <BattleLog log={log} />
        </main>

        <HandRail
          hand={hand}
          energy={player.energy}
          canAct={canAct}
          onPlay={(id) => dispatch({ type: 'PLAY_CARD', cardId: id })}
        />
      </div>

      {(phase === 'won' || phase === 'lost') && <EndOverlay phase={phase} onRestart={restart} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Top bar
// ---------------------------------------------------------------------------

function TopBar({ turn, onRestart }: { turn: number; onRestart: () => void }) {
  return (
    <header className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ember/12 text-ember ring-1 ring-ember/25">
          <Icon name="leaf" className="h-5 w-5" strokeWidth={1.7} />
        </span>
        <div className="leading-none">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ink-soft">Cozy fantasy duel</p>
          <h1 className="mt-1 font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
            Slay the Cards
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="rounded-full border border-line bg-cream/70 px-3.5 py-1.5 text-sm shadow-warm-sm">
          <span className="text-ink-soft">Round </span>
          <span className="font-bold tabular-nums text-ink">{turn}</span>
        </div>
        <button
          onClick={onRestart}
          className="group inline-flex items-center gap-1.5 rounded-full border border-line bg-cream px-3.5 py-1.5 text-sm font-semibold text-ink-soft shadow-warm-sm transition hover:border-ember/40 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/50"
        >
          <Icon name="restart" className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-90" />
          New run
        </button>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Enemy scene (the first complete "room" of the board)
// ---------------------------------------------------------------------------

function EnemyScene({
  enemy,
  mood,
  hitKey,
  floats,
}: {
  enemy: EnemyState;
  mood: SlimeMood;
  hitKey: number;
  floats: FloatText[];
}) {
  return (
    <section className="relative flex min-h-0 flex-1 flex-col justify-center overflow-hidden rounded-[28px] border border-line/80 bg-gradient-to-b from-[#f4ecda] to-[#ece1ca] p-4 shadow-warm sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-16 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(111,138,91,0.22),transparent_70%)]"
      />

      <div className="relative grid items-center gap-5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        {/* creature */}
        <div className="relative mx-auto w-full max-w-[180px] sm:max-w-[230px]">
          <FloatLayer floats={floats} />
          <div className="motion-safe:animate-breathe">
            <div key={hitKey} className={hitKey > 0 && mood !== 'defeated' ? 'motion-safe:animate-recoil' : ''}>
              <SlimeCreature mood={mood} className="w-full drop-shadow-[0_22px_24px_rgba(70,60,30,0.18)]" />
            </div>
          </div>
        </div>

        {/* dossier */}
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sage">The glade keeper</p>
          <h2 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink">{enemy.name}</h2>
          <p className="mt-1 max-w-sm text-sm text-ink-soft">{enemy.title}</p>

          <IntentBanner intent={enemy.intent} />

          <div className="mt-5 max-w-sm">
            <StatBar value={enemy.hp} max={enemy.maxHp} label="Health" icon="heart" fillClass="bg-clay" />
            {enemy.block > 0 && (
              <div className="mt-3">
                <ShieldChip value={enemy.block} label="Block" />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function IntentBanner({ intent }: { intent: Intent }) {
  const isAttack = intent.type === 'attack';
  const tone = isAttack
    ? 'border-clay/25 bg-clay/10 text-clay'
    : 'border-dusk/25 bg-dusk/10 text-dusk';
  return (
    <div className={`mt-4 inline-flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 ${tone}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-cream/70 ring-1 ring-inset ring-ink/5">
        <Icon name={isAttack ? 'sword' : 'shield'} className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <div className="leading-tight">
        <p className="text-[11px] font-semibold uppercase tracking-wide opacity-80">Telegraphed move</p>
        <p className="font-semibold tabular-nums text-ink">
          {isAttack ? `Attack for ${intent.value}` : `Brace — defend ${intent.value}`}
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Player ledger (the control "room")
// ---------------------------------------------------------------------------

function PlayerLedger({
  player,
  draw,
  discard,
  canAct,
  floats,
  onEndTurn,
}: {
  player: PlayerState;
  draw: number;
  discard: number;
  canAct: boolean;
  floats: FloatText[];
  onEndTurn: () => void;
}) {
  return (
    <section className="relative rounded-[24px] border border-line/80 bg-cream/85 p-4 shadow-warm-sm sm:p-5">
      <FloatLayer floats={floats} />

      <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink/5 text-ink ring-1 ring-line">
              <Icon name="leaf" className="h-5 w-5 text-sage" strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-soft">Adventurer</p>
              <h3 className="font-display text-xl font-semibold text-ink">You</h3>
            </div>
            {player.shield > 0 && (
              <div className="ml-auto">
                <ShieldChip value={player.shield} label="Shield" />
              </div>
            )}
          </div>

          <StatBar value={player.hp} max={player.maxHp} label="Health" icon="heart" fillClass="bg-berry" />

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <PileStat icon="cards" label="Draw" count={draw} />
            <PileStat icon="layers" label="Discard" count={discard} />
          </div>
        </div>

        <div className="flex flex-col items-start gap-4 sm:items-end">
          <EnergyMeter energy={player.energy} max={player.maxEnergy} />
          <button
            onClick={onEndTurn}
            disabled={!canAct}
            className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-ember px-6 py-3 font-semibold text-cream shadow-warm transition-transform active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            <span className="absolute inset-0 translate-y-full bg-ember-deep transition-transform duration-300 ease-out group-hover:translate-y-0" />
            <span className="relative z-10">End turn</span>
            <Icon name="arrow" className="relative z-10 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </section>
  );
}

function EnergyMeter({ energy, max }: { energy: number; max: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-sm font-semibold text-ink-soft">Energy</span>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: max }).map((_, i) => (
          <span
            key={i}
            className={`grid h-7 w-7 place-items-center rounded-full transition-colors ${
              i < energy
                ? 'bg-ember/15 text-ember ring-1 ring-ember/35'
                : 'text-ink-faint/40 ring-1 ring-line'
            }`}
          >
            <Icon name="flame" className="h-4 w-4" />
          </span>
        ))}
      </div>
      <span className="text-sm font-bold tabular-nums text-ink">
        {energy}
        <span className="text-ink-faint">/{max}</span>
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared stat pieces
// ---------------------------------------------------------------------------

function StatBar({
  value,
  max,
  label,
  icon,
  fillClass,
}: {
  value: number;
  max: number;
  label: string;
  icon: IconName;
  fillClass: string;
}) {
  const display = useCountUp(value);
  const pct = Math.max(0, Math.min(1, value / max));
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft">
          <Icon name={icon} className="h-4 w-4" /> {label}
        </span>
        <span className="text-sm font-bold tabular-nums text-ink">
          {display}
          <span className="text-ink-faint"> / {max}</span>
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink/[0.08]">
        <div
          className={`h-full origin-left rounded-l-full transition-transform duration-500 ease-out ${fillClass}`}
          style={{ transform: `scaleX(${pct})` }}
        />
      </div>
    </div>
  );
}

function ShieldChip({ value, label }: { value: number; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-dusk/12 px-2.5 py-1 text-sm font-bold tabular-nums text-dusk ring-1 ring-dusk/25">
      <Icon name="shield" className="h-3.5 w-3.5" strokeWidth={1.8} />
      {value}
      <span className="font-semibold text-dusk/70">{label}</span>
    </span>
  );
}

function PileStat({ icon, label, count }: { icon: IconName; label: string; count: number }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink/[0.05] text-ink-soft ring-1 ring-line">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      <span>
        <span className="font-bold tabular-nums text-ink">{count}</span>{' '}
        <span className="text-ink-faint">{label}</span>
      </span>
    </span>
  );
}

function FloatLayer({ floats }: { floats: FloatText[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 overflow-visible">
      {floats.map((f) => (
        <span key={f.id} className="absolute top-2 sm:top-4" style={{ left: `calc(50% + ${f.x}px)` }}>
          <span
            className={`block -translate-x-1/2 animate-rise text-2xl font-extrabold tabular-nums drop-shadow-sm ${
              f.tone === 'heal' ? 'text-sage' : 'text-clay'
            }`}
          >
            {f.text}
          </span>
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hand + cards
// ---------------------------------------------------------------------------

const CATEGORY: Record<
  CardCategory,
  { accent: string; plaque: string; lift: string; statIcon: IconName }
> = {
  attack: {
    accent: 'bg-clay',
    plaque: 'bg-clay/10 text-clay ring-clay/20',
    lift: 'hover:shadow-[0_24px_44px_-22px_rgba(177,90,62,0.6)]',
    statIcon: 'sword',
  },
  defense: {
    accent: 'bg-dusk',
    plaque: 'bg-dusk/10 text-dusk ring-dusk/20',
    lift: 'hover:shadow-[0_24px_44px_-22px_rgba(95,116,136,0.6)]',
    statIcon: 'shield',
  },
  heal: {
    accent: 'bg-sage',
    plaque: 'bg-sage/12 text-sage ring-sage/20',
    lift: 'hover:shadow-[0_24px_44px_-22px_rgba(111,138,91,0.6)]',
    statIcon: 'heart',
  },
  utility: {
    accent: 'bg-honey',
    plaque: 'bg-honey/14 text-honey ring-honey/25',
    lift: 'hover:shadow-[0_24px_44px_-22px_rgba(199,154,61,0.6)]',
    statIcon: 'cards',
  },
};

function HandRail({
  hand,
  energy,
  canAct,
  onPlay,
}: {
  hand: CardInstance[];
  energy: number;
  canAct: boolean;
  onPlay: (id: string) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between px-1">
        <h2 className="flex items-baseline gap-2 font-display text-lg font-semibold text-ink">
          Your hand
          <span className="font-sans text-sm font-medium tabular-nums text-ink-faint">{hand.length}/5</span>
        </h2>
        <p className="hidden text-sm text-ink-faint sm:block">Spend energy, then end your turn</p>
      </div>

      <div className="flex flex-wrap items-end justify-center gap-3 sm:gap-4">
        {hand.length === 0 ? (
          <div className="flex flex-col items-center gap-2 self-center rounded-2xl border border-dashed border-line px-8 py-10 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-ink/[0.04] text-ink-faint ring-1 ring-line">
              <Icon name="cards" className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-ink-soft">Your hand is empty</p>
            <p className="text-xs text-ink-faint">End your turn to draw a fresh hand of four.</p>
          </div>
        ) : (
          hand.map((card, i) => (
            <CardView
              key={card.id}
              card={card}
              index={i}
              playable={canAct && card.cost <= energy}
              reason={!canAct ? 'Not your turn' : card.cost > energy ? 'Not enough energy' : undefined}
              onPlay={() => onPlay(card.id)}
            />
          ))
        )}
      </div>
    </section>
  );
}

function CardView({
  card,
  index,
  playable,
  reason,
  onPlay,
}: {
  card: CardInstance;
  index: number;
  playable: boolean;
  reason?: string;
  onPlay: () => void;
}) {
  const cat = CATEGORY[card.category];
  return (
    <button
      type="button"
      onClick={onPlay}
      disabled={!playable}
      title={playable ? `Play ${card.name}` : reason}
      style={{ animationDelay: `${index * 55}ms` }}
      className={`group relative flex h-[196px] w-[142px] shrink-0 flex-col overflow-hidden rounded-[20px] border border-line bg-cream text-left shadow-warm-sm motion-safe:animate-popIn focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 focus-visible:ring-offset-2 focus-visible:ring-offset-parchment ${
        playable
          ? `cursor-pointer transition-[transform,box-shadow] duration-300 ease-out hover:-translate-y-3 ${cat.lift} active:-translate-y-1 active:duration-100`
          : 'cursor-not-allowed opacity-55 grayscale'
      }`}
    >
      <span className={`h-1.5 w-full ${cat.accent}`} />

      {/* hover sheen, only on playable cards */}
      {playable && (
        <span className="pointer-events-none absolute inset-0 z-10 overflow-hidden opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="absolute -inset-y-4 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent group-hover:animate-sheen" />
        </span>
      )}

      {/* cost token */}
      <span className="absolute left-2.5 top-2.5 z-20 grid h-8 w-8 place-items-center rounded-full bg-ink text-sm font-bold tabular-nums text-cream shadow-token ring-2 ring-cream">
        {card.cost}
      </span>

      <div className="relative z-0 flex flex-1 flex-col px-3 pb-3 pt-3.5">
        <h3 className="pl-9 font-display text-[15px] font-semibold leading-tight text-ink">{card.name}</h3>

        <div className="grid flex-1 place-items-center py-0.5">
          <span className={`grid h-14 w-14 place-items-center rounded-2xl ring-1 ring-inset ${cat.plaque}`}>
            <Icon name={card.icon} className="h-7 w-7" strokeWidth={1.5} />
          </span>
        </div>

        <p className="line-clamp-2 text-[11px] italic leading-snug text-ink-faint">{card.flavor}</p>

        <div className="mt-2 flex items-center gap-1.5 border-t border-line/70 pt-2 text-[12px] font-semibold text-ink">
          <Icon name={cat.statIcon} className="h-3.5 w-3.5 text-ink-soft" />
          {card.description}
        </div>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Adventure log
// ---------------------------------------------------------------------------

const LOG_TONE: Record<LogEntry['tone'], { text: string; dot: string }> = {
  info: { text: 'text-ink-soft', dot: 'bg-ink-faint/50' },
  player: { text: 'text-ink', dot: 'bg-sage' },
  enemy: { text: 'text-ink', dot: 'bg-clay' },
  system: { text: 'font-semibold text-ember-deep', dot: 'bg-ember' },
};

function BattleLog({ log }: { log: LogEntry[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [log]);

  return (
    <aside className="flex max-h-[20rem] min-h-0 flex-col overflow-hidden rounded-[24px] border border-line/80 bg-cream/70 shadow-warm-sm lg:max-h-none lg:h-full">
      <header className="flex items-center gap-2 border-b border-line/70 px-4 py-3">
        <Icon name="leaf" className="h-4 w-4 text-sage" />
        <h2 className="font-display text-base font-semibold text-ink">Adventure log</h2>
      </header>
      <div className="log-scroll min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3" aria-live="polite">
        {log.map((e) => {
          const tone = LOG_TONE[e.tone];
          return (
            <p key={e.id} className="flex gap-2.5 text-sm leading-snug">
              <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
              <span className={tone.text}>{e.text}</span>
            </p>
          );
        })}
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
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4 backdrop-blur-[3px]">
      <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-line bg-cream shadow-warm-lg motion-safe:animate-overlayIn">
        <div className={`grid h-36 place-items-center ${won ? 'bg-sage/15' : 'bg-clay/12'}`}>
          {won ? (
            <SlimeCreature mood="defeated" className="h-28 w-auto" />
          ) : (
            <Icon name="leaf" className="h-16 w-16 -rotate-12 text-clay/70" strokeWidth={1.4} />
          )}
        </div>
        <div className="p-6 text-center">
          <p
            className={`text-[11px] font-bold uppercase tracking-[0.22em] ${
              won ? 'text-sage' : 'text-clay'
            }`}
          >
            {won ? 'Victory' : 'Defeat'}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
            {won ? 'The glade is calm again' : 'You retreat to the campfire'}
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-ink-soft">
            {won
              ? 'The Sprout Slime dissolves into a puddle of cozy stardust. Well met, adventurer.'
              : 'Rest by the fire, gather your cards, and set out for the glade once more.'}
          </p>
          <button
            onClick={onRestart}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-ember px-6 py-3 font-semibold text-cream shadow-warm transition-transform active:translate-y-px hover:bg-ember-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember/60 focus-visible:ring-offset-2 focus-visible:ring-offset-cream"
          >
            <Icon name="restart" className="h-4 w-4" />
            Play again
          </button>
        </div>
      </div>
    </div>
  );
}
