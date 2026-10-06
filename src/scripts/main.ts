import { initReducedMotion, getDeviceTier, shouldSkipWebGL } from '../lib/responsive.js';
import { AudioManager } from '../lib/audio/AudioManager.js';
import { setEnabled as setDiscEnabled, stopAll as stopDiscs, setReducedMotion as setDiscReduced } from '../lib/audio/discPlayer.js';
import { DiscCarousel } from '../components/DiscCarousel/DiscCarousel.js';

initReducedMotion();

// Datos de respaldo desde las MDX: si falla el fetch, se muestra este contenido igual.
// Solo repos verificados (DPPHapp, LandingPageAct). Sin demo ni métricas inventadas.
const FALLBACK_PROJECTS = [
  {
    title: 'BotPublicador IA',
    description: 'App en Streamlit con 6 bots sociales y publicación real en página de Facebook.',
    tech: ['Python', 'Streamlit', 'Ollama', 'Facebook Graph API'],
    year: '2026',
    pattern: 'circuit',
    primaryHue: 160,
    secondaryHue: 220,
    featured: true,
  },
  {
    title: 'LandingPageAct',
    description: 'Landing page activa en HTML, CSS y JavaScript, actualizada en octubre de 2026.',
    tech: ['HTML5', 'CSS3', 'JavaScript'],
    year: '2026',
    pattern: 'vinyl',
    primaryHue: 45,
    secondaryHue: 220,
    featured: true,
    repo: 'https://github.com/Charcraft/LandingPageAct',
  },
  {
    title: 'App Distribuciones de Probabilidad',
    description: 'Herramienta en Python para calcular distribuciones de probabilidad y prueba de hipótesis sin tablas manuales.',
    tech: ['Python'],
    year: '2025',
    pattern: 'data',
    primaryHue: 30,
    secondaryHue: 220,
    featured: true,
    repo: 'https://github.com/Charcraft/DPPHapp',
  },
  {
    title: 'Consejo de Enfermeria',
    description: 'Sitio estático en HTML con información y orientación de enfermería.',
    tech: ['HTML'],
    year: '2025',
    pattern: 'circuit',
    primaryHue: 200,
    secondaryHue: 160,
    featured: false,
  },
  {
    title: 'decoOne',
    description: 'Proyecto integrador en JavaScript con interfaz web para catálogo decorativo.',
    tech: ['JavaScript', 'HTML5', 'CSS3'],
    year: '2025',
    pattern: 'neon',
    primaryHue: 280,
    secondaryHue: 220,
    featured: false,
  },
] as any[];

// --- Nav movil/desktop: corre primero, sin depender del fetch ---
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
const navOverlay = document.querySelector('.nav-overlay');

function closeMenu() {
  if (!navToggle || !navMenu || !navOverlay) return;
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Abrir menu');
  navMenu.classList.remove('open');
  (navOverlay as HTMLElement).hidden = true;
  navOverlay.classList.remove('visible');
  (navOverlay as HTMLElement).style.opacity = '0';
  document.body.classList.remove('menu-open');
}

function openMenu() {
  if (!navToggle || !navMenu || !navOverlay) return;
  navToggle.setAttribute('aria-expanded', 'true');
  navToggle.setAttribute('aria-label', 'Cerrar menu');
  navMenu.classList.add('open');
  (navOverlay as HTMLElement).hidden = false;
  requestAnimationFrame(() => {
    navOverlay.classList.add('visible');
    (navOverlay as HTMLElement).style.opacity = '1';
  });
  document.body.classList.add('menu-open');
  if ((window as any).audioManager) (window as any).audioManager.play('open');
}

if (navToggle && navMenu && navOverlay && !(navToggle as HTMLElement).dataset.menuBound) {
  (navToggle as HTMLElement).dataset.menuBound = 'true';
  // Estado inicial movil: cerrado
  closeMenu();

  navToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    if (isOpen) closeMenu();
    else openMenu();
  });

  navOverlay.addEventListener('click', () => closeMenu());

  // Solo cierra en movil; en desktop los links no tocan el menu
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 1024) closeMenu();
    });
  });

  // Si pasa a desktop, asegura menu visible y overlay fuera
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      navMenu.classList.remove('open');
      (navOverlay as HTMLElement).hidden = true;
      document.body.classList.remove('menu-open');
    }
  });
}

const audioManager = new AudioManager();
(window as any).audioManager = audioManager;
audioManager.setVolume(0.25);
audioManager.init().catch(() => { /* audio opcional */ });

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// --- Sonidos de interfaz: hover.wav al pasar el puntero, click.wav al hacer clic ---
// Solo puntero fino, sin reduced-motion, volumen bajo, desbloqueo en primer gesto (AudioManager).
const SOUND_SELECTOR = '.btn-p5, .btn-p3, .btn, .nav-link, .social-link, .hero-cta, .vd-arrow, .vd-dot, .vd-code';
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

if (finePointer && !prefersReducedMotion) {
  let lastHoverEl: Element | null = null;
  let lastHoverAt = 0;

  document.addEventListener('mouseover', (e) => {
    const target = (e.target as HTMLElement)?.closest?.(SOUND_SELECTOR);
    if (!target || target === lastHoverEl) return;
    const now = performance.now();
    if (now - lastHoverAt < 80) {
      lastHoverEl = target;
      return;
    }
    lastHoverAt = now;
    lastHoverEl = target;
    audioManager.play('hover');
  }, { passive: true });

  document.addEventListener('mouseout', (e) => {
    if (lastHoverEl && !(lastHoverEl as HTMLElement).contains?.(e.relatedTarget as Node)) {
      lastHoverEl = null;
    }
  }, { passive: true });

  // Delegado: cubre botones del carrusel montado por JS sin re-enlazar.
  document.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement)?.closest?.(SOUND_SELECTOR);
    if (!target) return;
    audioManager.play('click');
  }, { passive: true });
}

// Interruptor de sonido del header: solo interfaz (hover/clic), no toca discos.
const soundToggle = document.getElementById('sound-toggle');
if (soundToggle) {
  const syncToggle = (muted: boolean) => {
    soundToggle.setAttribute('aria-pressed', String(!muted));
    soundToggle.setAttribute('aria-label', muted ? 'Activar sonidos de interfaz' : 'Desactivar sonidos de interfaz');
    const label = soundToggle.querySelector('[data-sound-label]');
    if (label) label.textContent = muted ? 'OFF' : 'ON';
    soundToggle.classList.toggle('is-off', muted);
  };
  if (prefersReducedMotion) {
    audioManager.toggleMute();
    syncToggle(true);
  }
  soundToggle.addEventListener('click', () => {
    const muted = audioManager.toggleMute();
    syncToggle(muted);
  });
}

// Musica de discos: solo loops de proyectos, independiente del toggle global.
// Con reduced-motion arranca apagado; el clic manual permite opt-in.
const discMusicToggle = document.getElementById('disc-music-toggle');
let discMusicOn = !prefersReducedMotion;
if (discMusicToggle) {
  const syncDiscMusic = (on: boolean) => {
    discMusicToggle.setAttribute('aria-pressed', String(on));
    discMusicToggle.setAttribute('aria-label', on ? 'Silenciar musica de proyectos' : 'Activar musica de proyectos');
    const label = discMusicToggle.querySelector('[data-disc-music-label]');
    if (label) label.textContent = on ? 'Musica ON' : 'Musica OFF';
    discMusicToggle.classList.toggle('btn-p5', on);
    discMusicToggle.classList.toggle('btn-p3', !on);
  };
  setDiscEnabled(discMusicOn);
  if (prefersReducedMotion) setDiscReduced(true);
  if (!discMusicOn) stopDiscs();
  syncDiscMusic(discMusicOn);
  discMusicToggle.addEventListener('click', () => {
    discMusicOn = !discMusicOn;
    if (discMusicOn) setDiscReduced(false);
    setDiscEnabled(discMusicOn);
    if (!discMusicOn) stopDiscs();
    syncDiscMusic(discMusicOn);
  });
} else if (prefersReducedMotion) {
  setDiscReduced(true);
}

// --- GSAP opcional: import dinamico con guard. Si falla, el contenido queda visible. ---
let gsapObj: any = null;
let scrollTrigger: any = null;
if (!prefersReducedMotion) {
  try {
    const gsapModule = await import('gsap');
    const stModule = await import('gsap/ScrollTrigger');
    gsapObj = gsapModule.gsap;
    scrollTrigger = stModule.ScrollTrigger;
    gsapObj.registerPlugin(scrollTrigger);
    gsapObj.config({ nullTargetWarn: false, trialWarn: false });
    scrollTrigger.config({ ignoreMobileResize: true });
  } catch {
    gsapObj = null;
    scrollTrigger = null;
  }
}

// --- Lenis opcional: solo si existe el modulo y sin reduced-motion ---
let lenis: any = null;
let rafId = 0;

function raf(time: number) {
  if (!lenis) return;
  lenis.raf(time);
  rafId = requestAnimationFrame(raf);
}

if (!prefersReducedMotion && !shouldSkipWebGL()) {
  try {
    const lenisModule: any = await import('lenis');
    const LenisCtor = lenisModule.default ?? lenisModule.Lenis;
    if (typeof LenisCtor === 'function') {
      lenis = new LenisCtor({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smooth: true,
        smoothTouch: false,
      });

      if (scrollTrigger) lenis.on('scroll', scrollTrigger.refresh);
      rafId = requestAnimationFrame(raf);

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          cancelAnimationFrame(rafId);
        } else if (lenis) {
          rafId = requestAnimationFrame(raf);
        }
      });
    }
  } catch {
    lenis = null;
  }
}
(window as any).lenis = lenis;

const deviceTier = getDeviceTier();
document.documentElement.dataset.deviceTier = deviceTier;

// --- Fondo sticky con parallax leve: solo desktop, sin reduced-motion y tier distinto de low ---
// Movil (<=768px o hover none), low o reduced-motion: imagen estatica sin movimiento.
try {
  const fondoStage = document.getElementById('fondo-stage');
  const fondoImg = document.getElementById('fondo-img') as HTMLElement | null;
  const staticFondo = window.matchMedia('(max-width: 768px)').matches || window.matchMedia('(hover: none)').matches;
  if (fondoStage && fondoImg && !prefersReducedMotion && !staticFondo && deviceTier !== 'low' && !shouldSkipWebGL(deviceTier)) {
    let ticking = false;
    let lastY = -1;
    const render = (): void => {
      ticking = false;
      const rect = fondoStage.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
      const progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - window.innerHeight)));
      const y = Math.round(progress * 90);
      if (y !== lastY) {
        lastY = y;
        fondoImg.style.transform = `translateY(${y}px) scale(1.08)`;
      }
    };
    const onScroll = (): void => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(render);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    let resizeT: number | undefined;
    window.addEventListener('resize', () => {
      if (resizeT !== undefined) clearTimeout(resizeT);
      resizeT = window.setTimeout(() => {
        lastY = -1;
        render();
      }, 150);
    });
    fondoImg.style.transform = 'translateY(0px) scale(1.08)';
    render();
  } else if (fondoImg) {
    fondoImg.style.transform = 'none';
  }
} catch {
  /* fondo decorativo: nunca rompe */
}

// Dueno unico del menu movil: main.ts (.nav-toggle + #nav-menu).
// P3Menu no se monta: segundo sistema eliminado (doble overlay, doble toggle y sonidos invalidos).

// --- Proyectos: fetch con BASE_URL normalizada y fallback embebido, nunca vacio ---
const discContainer = document.getElementById('disc-carousel');
async function loadProjects(): Promise<any[]> {
  const rawBase = import.meta.env.BASE_URL || '/';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
  const url = `${base}projects-data.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) return data;
    throw new Error('vacio');
  } catch (err) {
    console.warn('[projects] uso fallback embebido:', err);
    return FALLBACK_PROJECTS;
  }
}

if (discContainer) {
  try {
    const projectData = await loadProjects();
    if (!Array.isArray(projectData) || projectData.length === 0) {
      console.warn('[projects] sin datos, queda respaldo estático visible');
    } else {
      try {
        const carousel = new DiscCarousel(discContainer, projectData, gsapObj);
        if (carousel) {
          const staticFallback = discContainer.querySelector('.projects-fallback');
          if (staticFallback) staticFallback.remove();
        }
      } catch (innerErr) {
        console.warn('[projects] carrusel no montado, queda respaldo estático:', innerErr);
      }
    }
  } catch (err) {
    console.warn('[projects] carrusel no montado, queda respaldo estático:', err);
  }
}

if (gsapObj && scrollTrigger) {
  try {
    // Titulos: animacion segura sin ocultar contenido si el trigger no dispara.
    // Se usa fromTo con immediateRender false para no dejar opacity 0 en captura completa.
    gsapObj.utils.toArray('.section-title').forEach((title: unknown) => {
      gsapObj.fromTo(title as object, { opacity: 0, y: 30 }, {
        scrollTrigger: {
          trigger: title as object,
          start: 'top 85%',
          toggleActions: 'play none none none',
          once: true,
        },
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
        immediateRender: false,
      });
    });

    // Secciones bajas (Skills, Proyectos, Experiencia, Stats): sin animacion GSAP.
    // El contenido queda visible siempre, con o sin JS y en captura de página completa.
  } catch {
    /* GSAP opcional: el contenido ya es visible por CSS */
  }
}

const header = document.querySelector('header');
const toggleHeader = (scrollY: number) => {
  if (!header) return;
  if (scrollY > 50) {
    header.classList.add('bg-fusion-bg/95', 'border-p5-red/30');
  } else {
    header.classList.remove('bg-fusion-bg/95', 'border-p5-red/30');
  }
};
if (lenis) {
  lenis.on('scroll', ({ scroll }: { scroll: number }) => toggleHeader(scroll));
} else {
  window.addEventListener('scroll', () => toggleHeader(window.scrollY), { passive: true });
}

const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: 0.1 }
  );

  sections.forEach((section) => observer.observe(section));
}

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', function (this: HTMLAnchorElement, e: MouseEvent) {
    const targetId = this.getAttribute('href');
    if (!targetId || targetId === '#') return;
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target as HTMLElement, { offset: -80 });
      } else {
        (target as HTMLElement).scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      }
    }
  });
});

export { lenis };
