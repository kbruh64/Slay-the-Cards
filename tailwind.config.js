/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Display = warm storybook serif; Sans = grounded humanist body/UI.
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        sans: ['Mulish', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // One coherent warm-neutral family + a single ember accent.
        parchment: '#efe3d0',
        cream: '#fbf5ea',
        'cream-deep': '#f4e9d7',
        ink: '#3a2e24',
        'ink-soft': '#7b6a58',
        'ink-faint': '#a8957f',
        line: '#e6d8c2',
        // Accent + functional, earthy tints (no neon, no purple).
        ember: '#c5772d',
        'ember-soft': '#e0a25e',
        'ember-deep': '#a35d1d',
        clay: '#b15a3e', // attack
        sage: '#6f8a5b', // heal / nature
        dusk: '#5f7488', // defend / block
        honey: '#c79a3d', // utility / energy
        berry: '#a2495a', // player vitality
      },
      boxShadow: {
        warm: '0 18px 42px -24px rgba(82,54,30,0.55)',
        'warm-sm': '0 8px 20px -12px rgba(82,54,30,0.45)',
        'warm-lg': '0 34px 70px -30px rgba(70,44,24,0.6)',
        token: '0 2px 0 rgba(120,80,40,0.35)',
      },
      keyframes: {
        popIn: {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.9)' },
          '18%': { opacity: '1' },
          '100%': { opacity: '0', transform: 'translateY(-38px) scale(1.05)' },
        },
        recoil: {
          '0%': { transform: 'translateX(0) scale(1,1)' },
          '28%': { transform: 'translateX(-5px) scale(1.06,0.94)' },
          '60%': { transform: 'translateX(4px) scale(0.97,1.03)' },
          '100%': { transform: 'translateX(0) scale(1,1)' },
        },
        breathe: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-4px) scale(1.012)' },
        },
        sheen: {
          '0%': { transform: 'translateX(-130%) skewX(-12deg)' },
          '100%': { transform: 'translateX(230%) skewX(-12deg)' },
        },
        overlayIn: {
          '0%': { opacity: '0', transform: 'translateY(14px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        popIn: 'popIn 0.45s cubic-bezier(0.22,1,0.36,1) both',
        rise: 'rise 1s ease-out forwards',
        recoil: 'recoil 0.4s ease-in-out',
        breathe: 'breathe 4.2s ease-in-out infinite',
        sheen: 'sheen 0.9s ease-out',
        overlayIn: 'overlayIn 0.4s cubic-bezier(0.22,1,0.36,1) both',
      },
    },
  },
  plugins: [],
};
