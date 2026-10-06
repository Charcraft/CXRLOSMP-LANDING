const BASE = (() => {
  try {
    const b = import.meta.env.BASE_URL || '/';
    return b.endsWith('/') ? b : `${b}/`;
  } catch {
    return '/';
  }
})();

let current: HTMLAudioElement | null = null;
let currentIndex = -1;
let enabled = true;
let unlocked = false;
let reduced = false;

// Override publicado (decision expresa del dueno):
// public/assets/audio/persona/disco1.mp3 .. disco5.mp3.
// Si existe, suena ese; si no, el loop original discN.mp3 del deploy.
export const DISC_TRACKS: readonly string[] = [
  'Burn My Dread',
  'Peace',
  "When The Moon's Reaching Out Stars",
  'Iwatodai Dorm',
  'Mass Destruction',
];

export function getTrackTitle(index: number): string {
  const i = Math.max(0, Math.min(DISC_TRACKS.length - 1, Math.floor(index)));
  return DISC_TRACKS[i] ?? `Disco ${i + 1}`;
}
const overrideCache = new Map<number, boolean>();
let requestId = 0;

function originalSrc(n: number): string {
  return `${BASE}assets/audio/disc${n}.mp3`;
}

function overrideSrc(n: number): string {
  return `${BASE}assets/audio/persona/disco${n}.mp3`;
}

async function resolveSrc(n: number): Promise<string> {
  const cached = overrideCache.get(n);
  if (cached === true) return overrideSrc(n);
  if (cached === false) return originalSrc(n);
  try {
    const res = await fetch(overrideSrc(n), { method: 'HEAD' });
    const ok = !!res && res.ok;
    overrideCache.set(n, ok);
    return ok ? overrideSrc(n) : originalSrc(n);
  } catch {
    overrideCache.set(n, false);
    return originalSrc(n);
  }
}

if (typeof window !== 'undefined') {
  try {
    reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    reduced = false;
  }
  const unlock = () => {
    unlocked = true;
  };
  window.addEventListener('pointerdown', unlock, { once: true, passive: true });
  window.addEventListener('keydown', unlock, { once: true, passive: true });
  window.addEventListener('touchstart', unlock, { once: true, passive: true });
}

function canPlay(): boolean {
  return enabled && unlocked && !reduced && typeof window !== 'undefined';
}

export function playDisc(i: number): void {
  if (!canPlay()) return;
  if (i === currentIndex && current && !current.paused) return;
  stopAll();
  try {
    const n = Math.max(0, Math.min(4, Math.floor(i))) + 1;
    currentIndex = i;
    const myReq = ++requestId;
    void resolveSrc(n).then((src) => {
      if (myReq !== requestId) return;
      if (!canPlay()) return;
      if (currentIndex !== i) return;
      try {
        const el = new Audio(src);
        el.loop = true;
        el.preload = 'auto';
        el.volume = 0.32;
        current = el;
        const p = el.play();
        if (p && typeof (p as Promise<void>).catch === 'function') {
          (p as Promise<void>).catch(() => {
            if (current === el) {
              current = null;
              currentIndex = -1;
            }
          });
        }
      } catch {
        if (currentIndex === i) {
          current = null;
          currentIndex = -1;
        }
      }
    });
  } catch {
    current = null;
    currentIndex = -1;
  }
}

export function stopAll(): void {
  requestId++;
  try {
    if (current) {
      current.pause();
      current.removeAttribute('src');
      try {
        current.load();
      } catch {
        /* noop */
      }
    }
  } catch {
    /* noop */
  }
  current = null;
  currentIndex = -1;
}

export function setEnabled(v: boolean): void {
  enabled = !!v;
  if (!enabled) stopAll();
}

export function setReducedMotion(v: boolean): void {
  reduced = !!v;
  if (reduced) stopAll();
}

export function isEnabled(): boolean {
  return enabled;
}
