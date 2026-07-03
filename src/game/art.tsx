import type { IconName } from './types';

// ---------------------------------------------------------------------------
// Hand-drawn SVG art. The skill bans emoji-as-iconography, so every glyph here
// is a custom line icon on a shared 24px grid with one stroke weight, and the
// enemy is a real illustrated character rather than a 🟢.
// ---------------------------------------------------------------------------

const ICON_PATHS: Record<IconName, JSX.Element> = {
  sword: (
    <>
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="m4 20 3-3" />
      <path d="m7.5 13.5 3 3" />
    </>
  ),
  shield: <path d="M12 3.2 19 6v5.2c0 4.4-3 7.2-7 8.6-4-1.4-7-4.2-7-8.6V6l7-2.8Z" />,
  bowl: (
    <>
      <path d="M3.5 11.5h17a8.5 8.5 0 0 1-17 0Z" />
      <path d="M9 4.2c-1 .9.6 1.8 0 2.9" />
      <path d="M13 4.2c-1 .9.6 1.8 0 2.9" />
    </>
  ),
  sparkle: (
    <>
      <path d="M12 3.5 13.7 9 19 10.7 13.7 12.4 12 18l-1.7-5.6L5 10.7 10.3 9 12 3.5Z" />
      <path d="M18.5 14.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
    </>
  ),
  flame: (
    <path
      d="M12 2.6c.6 3 3.4 4.3 3.4 7.6A3.4 3.4 0 0 1 12 13.8a3.4 3.4 0 0 1-3.4-3.6c0-1 .4-1.9 1.1-2.5.1.9.6 1.4 1.3 1.6.5-2.5-.6-4.1.4-6.7Z"
      fill="currentColor"
      stroke="none"
    />
  ),
  heart: (
    <path d="M12 20s-6.6-4-8.4-8.2C2.3 8.6 4 5.8 7 5.8c1.9 0 3.2 1.4 5 3.2 1.8-1.8 3.1-3.2 5-3.2 3 0 4.7 2.8 3.4 6C18.6 16 12 20 12 20Z" />
  ),
  cards: (
    <>
      <rect x="8.5" y="5.5" width="9.5" height="13" rx="2.2" />
      <path d="M6 8v8.5A2.5 2.5 0 0 0 8.5 19H14" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3.5 20.5 8 12 12.5 3.5 8 12 3.5Z" />
      <path d="m4 12 8 4.3L20 12" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c-1-8 5-15 14-15 1 9-6 15-14 15Z" />
      <path d="M5 19C9 14.5 12.5 11 16 8" />
    </>
  ),
  restart: (
    <>
      <path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5" />
      <path d="M4 4.5V8h3.5" />
    </>
  ),
  arrow: (
    <>
      <path d="M4.5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
};

export function Icon({
  name,
  className,
  strokeWidth = 1.6,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export type SlimeMood = 'idle' | 'hurt' | 'defeated';

/**
 * The Sprout Slime — a real character illustration. `mood` swaps the face so the
 * creature reacts when it takes a hit or is defeated.
 */
export function SlimeCreature({ mood = 'idle', className }: { mood?: SlimeMood; className?: string }) {
  return (
    <svg viewBox="0 0 220 180" className={className} role="img" aria-label="Sprout Slime">
      <defs>
        <radialGradient id="slimeBody" cx="42%" cy="32%" r="78%">
          <stop offset="0%" stopColor="#a7bd86" />
          <stop offset="55%" stopColor="#7d9762" />
          <stop offset="100%" stopColor="#5f7a49" />
        </radialGradient>
        <linearGradient id="slimeBelly" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c7d8ac" stopOpacity="0.0" />
          <stop offset="100%" stopColor="#cfe0b3" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* soft cast shadow on the table */}
      <ellipse cx="110" cy="160" rx="74" ry="13" fill="#3a2e24" opacity="0.14" />

      {/* body */}
      <path
        d="M26 122 C26 74 60 42 110 42 C160 42 194 74 194 122 C194 142 168 152 110 152 C52 152 26 142 26 122 Z"
        fill="url(#slimeBody)"
      />
      {/* glossy belly light */}
      <path
        d="M40 120 C40 86 70 60 110 60 C150 60 180 86 180 120 C180 134 150 140 110 140 C70 140 40 134 40 120 Z"
        fill="url(#slimeBelly)"
      />
      {/* top sheen */}
      <ellipse cx="84" cy="74" rx="26" ry="15" fill="#ffffff" opacity="0.22" transform="rotate(-20 84 74)" />
      {/* little drip on top */}
      <path d="M120 44 c3 -10 13 -10 16 0 c2 7 -4 10 -8 10 c-4 0 -10 -3 -8 -10 Z" fill="url(#slimeBody)" />

      {/* blush */}
      <ellipse cx="74" cy="112" rx="9" ry="5" fill="#e0a25e" opacity="0.5" />
      <ellipse cx="146" cy="112" rx="9" ry="5" fill="#e0a25e" opacity="0.5" />

      {/* face */}
      {mood === 'defeated' ? (
        <g stroke="#36291f" strokeWidth="4.5" strokeLinecap="round">
          <path d="M82 92 l12 12 M94 92 l-12 12" />
          <path d="M126 92 l12 12 M138 92 l-12 12" />
          <path d="M98 120 q12 -8 24 0" fill="none" />
        </g>
      ) : mood === 'hurt' ? (
        <g stroke="#36291f" strokeWidth="4.5" strokeLinecap="round" fill="none">
          <path d="M80 96 l14 6 M80 102 l14 -6" />
          <path d="M126 102 l14 -6 M126 96 l14 6" />
          <circle cx="110" cy="122" r="5" fill="#36291f" stroke="none" />
        </g>
      ) : (
        <g>
          <ellipse cx="88" cy="100" rx="6.5" ry="8.5" fill="#36291f" />
          <ellipse cx="132" cy="100" rx="6.5" ry="8.5" fill="#36291f" />
          <circle cx="90.5" cy="96.5" r="2.1" fill="#fbf5ea" />
          <circle cx="134.5" cy="96.5" r="2.1" fill="#fbf5ea" />
          <path d="M98 118 q12 11 24 0" fill="none" stroke="#36291f" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
