export type DeviceTier = 'low' | 'medium' | 'high';

export interface QualityConfig {
  particles: number;
  buildings: number;
  grain: number;
  scanlines: boolean;
  heroMode: 'webgl' | 'canvas2d';
}

/** Particulas por tier: 300 low / 800 mid / 2000 high (alineado con TokyoScene). */
export const PARTICLES_PER_TIER: Record<DeviceTier, number> = {
  low: 300,
  medium: 800,
  high: 2000,
};

/** DPR maximo por tier: 1 / 1.5 / 2. */
export const DPR_CAP_PER_TIER: Record<DeviceTier, number> = {
  low: 1,
  medium: 1.5,
  high: 2,
};

function isSaveData(): boolean {
  try {
    const conn = (navigator as any).connection;
    if (conn && conn.saveData === true) return true;
    const ect = conn?.effectiveType;
    if (ect === 'slow-2g' || ect === '2g') return true;
  } catch {
    /* navigator.connection no disponible */
  }
  return false;
}

export function getDeviceTier(): DeviceTier {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent);
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory ?? 4;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // low: reduced-motion, save-data/conexion lenta, CPU<=4, o movil de gama baja
  if (prefersReduced) return 'low';
  if (isSaveData()) return 'low';
  if (cores <= 4) return 'low';
  if (isMobile && (memory <= 2 || cores <= 6)) return 'low';

  // Movil de gama media/alta: tope en medium para ahorrar bateria/GPU
  if (isMobile) return 'medium';
  if (cores < 8 || memory < 4) return 'medium';
  return 'high';
}

export const QUALITY_CONFIG: Record<DeviceTier, QualityConfig> = {
  high: {
    particles: 2000,
    buildings: 200,
    grain: 0.15,
    scanlines: true,
    heroMode: 'webgl'
  },
  medium: {
    particles: 800,
    buildings: 80,
    grain: 0.1,
    scanlines: true,
    heroMode: 'webgl'
  },
  low: {
    particles: 300,
    buildings: 0,
    grain: 0,
    scanlines: false,
    heroMode: 'canvas2d'
  }
};

export function getQualityConfig(tier: DeviceTier = getDeviceTier()): QualityConfig {
  return QUALITY_CONFIG[tier];
}

/** true si se debe omitir WebGL por completo (low, save-data o reduced-motion). */
export function shouldSkipWebGL(tier?: DeviceTier): boolean {
  if (prefersReducedMotion()) return true;
  if (isSaveData()) return true;
  const t = tier ?? getDeviceTier();
  return t === 'low';
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function onReducedMotionChange(callback: (reduced: boolean) => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const handler = (e: MediaQueryListEvent) => callback(e.matches);
  mediaQuery.addEventListener('change', handler);
  return () => mediaQuery.removeEventListener('change', handler);
}

export function applyReducedMotionStyles(reduced: boolean) {
  const html = document.documentElement;

  if (reduced) {
    html.classList.add('reduce-motion');
    html.style.setProperty('--animation-duration', '0.01ms');
    html.style.setProperty('--transition-duration', '0.01ms');
  } else {
    html.classList.remove('reduce-motion');
    html.style.removeProperty('--animation-duration');
    html.style.removeProperty('--transition-duration');
  }
}

export function initReducedMotion(): () => void {
  const reduced = prefersReducedMotion();
  applyReducedMotionStyles(reduced);

  return onReducedMotionChange((matches) => {
    applyReducedMotionStyles(matches);
    const event = new CustomEvent('reducedMotionChange', {
      detail: { reduced: matches }
    });
    document.dispatchEvent(event);
  });
}

export function getAnimationDuration(normal: string, reduced = '0.01ms'): string {
  return prefersReducedMotion() ? reduced : normal;
}

export function getTransitionDuration(normal: string, reduced = '0.01ms'): string {
  return prefersReducedMotion() ? reduced : normal;
}

export function shouldAnimate(): boolean {
  return !prefersReducedMotion();
}

export function respectReducedMotion<T>(animationFn: () => T, fallbackFn: () => T = () => undefined as any): T {
  if (prefersReducedMotion()) {
    return fallbackFn();
  }
  return animationFn();
}
