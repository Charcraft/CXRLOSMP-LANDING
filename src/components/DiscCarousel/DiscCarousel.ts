import { playDisc, stopAll, getTrackTitle } from '../../lib/audio/discPlayer.js';

interface ProjectData {
  title: string;
  description: string;
  tech: string[];
  year: string;
  pattern?: string;
  primaryHue?: number;
  secondaryHue?: number;
  featured?: boolean;
  repo?: string;
}

const STYLE_ID = 'vd-carousel-style';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .vd-carousel { position: relative; max-width: 1120px; margin: 0 auto; color: #FFFFFF; }
    .vd-grain { position: absolute; inset: 0; pointer-events: none; opacity: .07;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); }
    .vd-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: clamp(2rem, 4vw, 3.5rem); align-items: start; position: relative; }
    .vd-stage { position: relative; height: 400px; min-width: 0; overflow: hidden; perspective: 1200px; border-radius: 0.75rem; isolation: isolate; }
    .vd-track { position: absolute; inset: 0; transform-style: preserve-3d; }
    .vd-slot { position: absolute; left: 50%; top: 50%; width: min(280px, 60vw); aspect-ratio: 1 / 1;
      margin-left: calc(min(280px, 60vw) / -2); margin-top: calc(min(280px, 60vw) / -2);
      transition: transform .55s cubic-bezier(.22,.8,.24,1), opacity .45s ease; transform-style: preserve-3d; }
    .vd-disc { width: 100%; height: 100%; border-radius: 50%; position: relative; transform-style: preserve-3d;
      background:
        radial-gradient(circle at 32% 28%, rgba(255,255,255,.14), transparent 42%),
        repeating-radial-gradient(circle at 50% 50%, #1a1a24 0 2px, #0a0a0f 2px 4px);
      box-shadow: 0 30px 80px rgba(0,0,0,.55), 0 0 42px rgba(217,35,35,.22), inset 0 0 0 1px rgba(255,255,255,.12);
      border: 1px solid rgba(217,35,35,.38); }
    .vd-spinner { position: absolute; inset: 0; border-radius: 50%; }
    .vd-slot.is-on .vd-spinner { animation: vd-spin 26s linear infinite; }
    @keyframes vd-spin { to { transform: rotate(360deg); } }
    .vd-grooves { position: absolute; inset: 0; border-radius: 50%;
      background: repeating-radial-gradient(circle at 50% 50%, transparent 0 5px, rgba(255,255,255,.055) 5px 6px); }
    .vd-label { position: absolute; left: 50%; top: 50%; width: 36%; aspect-ratio: 1 / 1; translate: -50% -50%;
      border-radius: 50%; background: #0D0D0D; color: #FFFFFF;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: .1rem;
      box-shadow: 0 0 0 3px #D92323, 0 0 0 4px rgba(0,0,0,.4); }
    .vd-initial { font-weight: 700; font-size: clamp(1.6rem, 4vw, 2.2rem); line-height: 1; letter-spacing: -.02em; color: #FFFFFF; }
    .vd-label-year { font-size: .72rem; letter-spacing: .18em; opacity: .75; color: #A0A0B0; }
    .vd-hole { position: absolute; left: 50%; top: 50%; width: 11px; height: 11px; translate: -50% -50%;
      border-radius: 50%; background: #0a0a0f; box-shadow: 0 0 0 3px rgba(217,35,35,.35); z-index: 2; }
    .vd-shine { position: absolute; inset: 0; border-radius: 50%; pointer-events: none;
      background: conic-gradient(from 210deg, transparent 0 42%, rgba(255,255,255,.12) 49%, transparent 57% 100%); }
    .vd-meta { display: flex; align-items: baseline; justify-content: space-between; gap: 1rem;
      border-top: 1px solid rgba(217,35,35,.32); padding-top: 1.25rem; margin-bottom: 1.5rem; }
    .vd-count { font-variant-numeric: tabular-nums; letter-spacing: .12em; font-size: .95rem; white-space: nowrap; color: #F2E852; }
    .vd-count .vd-total { color: rgba(255,255,255,.45); }
    .vd-year { font-size: .95rem; letter-spacing: .12em; color: #A0A0B0; }
    .vd-info.swap { opacity: 0; transform: translateY(10px); }
    .vd-info { opacity: 1; transform: none; transition: opacity .32s ease, transform .32s ease;
      min-width: 0; max-width: 100%; overflow: visible; padding: 1.75rem; }
    .vd-kicker { display: block; font-size: .85rem; letter-spacing: .22em; color: #D92323; margin-bottom: 1rem; text-transform: uppercase; }
    .vd-title { font-size: clamp(1.6rem, 5vw, 3.2rem); line-height: 1.12; letter-spacing: -.015em;
      margin: 0 0 1.1rem; font-weight: 650; color: #FFFFFF; text-wrap: balance; overflow-wrap: anywhere; max-width: 100%; }
    .vd-desc { font-size: 1.075rem; line-height: 1.65; max-width: 52ch; margin: 0 0 1.4rem; color: rgba(255,255,255,.86);
      overflow: visible; overflow-wrap: break-word; display: block; max-height: none; }
    .vd-stack { font-size: .95rem; letter-spacing: .04em; color: #A0A0B0; margin: 0 0 2rem; overflow-wrap: anywhere; max-width: 100%; }
    .vd-song { font-size: .9rem; letter-spacing: .08em; color: #F2E852; margin: 0 0 1rem; text-transform: uppercase; overflow-wrap: anywhere; }
    .vd-song span { color: #FFFFFF; }
    .vd-code { display: inline-flex; align-items: center; justify-content: center; border: 2px solid #D92323; color: #D92323;
      padding: .7rem 1.9rem; font-size: .9rem; letter-spacing: .18em; text-decoration: none; text-transform: uppercase;
      transition: background-color .25s ease, color .25s ease; background: transparent; }
    .vd-code:hover { background: #D92323; color: #0D0D0D; }
    .vd-code:focus-visible { outline: 2px solid #00B4FF; outline-offset: 3px; }
    .vd-code.btn-p5 { font-family: inherit; }
    .vd-controls { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
      border-top: 1px solid rgba(217,35,35,.32); margin-top: 2.25rem; padding-top: 1.5rem; }
    .vd-arrows { display: flex; gap: .75rem; }
    .vd-arrow { width: 3rem; height: 3rem; padding: 0; border: 2px solid #D92323; background: transparent;
      color: #D92323; font-size: 1.2rem; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
      transition: background-color .25s ease, color .25s ease, border-color .25s ease; }
    .vd-arrow[data-action="prev"]:hover { background: #D92323; color: #0D0D0D; }
    .vd-arrow[data-action="next"] { border-color: #00B4FF; color: #00B4FF; }
    .vd-arrow[data-action="next"]:hover { background: #00B4FF; color: #0D0D0D; }
    .vd-arrow:focus-visible { outline: 2px solid #FFFFFF; outline-offset: 3px; }
    .vd-dots { display: flex; flex-wrap: wrap; gap: .6rem; list-style: none; margin: 0; padding: 0; }
    .vd-dot { width: .7rem; height: .7rem; border-radius: 50%; border: 1px solid rgba(255,255,255,.5);
      background: transparent; padding: 0; cursor: pointer; }
    .vd-dot[aria-current="true"] { background: #F2E852; border-color: #F2E852; }
    .vd-dot:focus-visible { outline: 2px solid #FFFFFF; outline-offset: 3px; }
    .vd-empty { border-top: 1px solid rgba(217,35,35,.32); padding: 2rem 0; color: #A0A0B0; }
    .vd-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
    @media (min-width: 1024px) and (max-width: 1440px) {
      .vd-grid { grid-template-columns: minmax(320px, 1fr) minmax(320px, 1fr); gap: 3rem; }
      .vd-stage { height: 380px; min-width: 320px; }
      .vd-info { min-width: 320px; }
    }
    @media (max-width: 860px) {
      .vd-grid { grid-template-columns: minmax(0, 1fr); gap: 1.5rem; }
      .vd-stage { height: 300px; order: -1; }
      .vd-info { padding: 1.25rem; }
    }
    @media (max-width: 430px) {
      .vd-stage { height: 250px; }
      .vd-desc { font-size: 1rem; }
      .vd-controls { gap: .75rem; }
      .vd-arrow { width: 2.75rem; height: 2.75rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      .vd-slot { transition: none; }
      .vd-slot.is-on .vd-spinner { animation: none; }
      .vd-info { transition: none; }
      .vd-info.swap { transform: none; }
    }
  `;
  document.head.appendChild(style);
}

export class DiscCarousel {
  private container: HTMLElement;
  private projects: ProjectData[];
  private currentIndex = 0;
  private infoEl: HTMLElement | null = null;
  private countEl: HTMLElement | null = null;
  private liveEl: HTMLElement | null = null;
  private dotsEl: HTMLElement | null = null;
  private slots: HTMLElement[] = [];
  private touchStartX = 0;
  private touchStartY = 0;
  private swapTimeout: number | undefined = undefined;
  private onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.navigate(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.navigate(1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      this.goTo(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      this.goTo(this.projects.length - 1);
    }
  };
  private onPointerDown = (e: PointerEvent): void => {
    this.touchStartX = e.clientX;
    this.touchStartY = e.clientY;
  };
  private onPointerUp = (e: PointerEvent): void => {
    const dx = e.clientX - this.touchStartX;
    const dy = e.clientY - this.touchStartY;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      this.navigate(dx < 0 ? 1 : -1);
    }
  };

  constructor(container: HTMLElement, projects: ProjectData[], _gsap?: unknown) {
    this.container = container;
    this.projects = Array.isArray(projects) ? projects : [];
    ensureStyles();
    this.render();
  }

  private isRealRepo(url?: string): url is string {
    if (!url || typeof url !== 'string') return false;
    const clean = url.trim();
    if (clean === '' || clean === '#') return false;
    try {
      const u = new URL(clean, window.location.origin);
      if (u.protocol !== 'https:') return false;
      if (u.hostname !== 'github.com') return false;
      const parts = u.pathname.split('/').filter(Boolean);
      return parts.length >= 2;
    } catch {
      return false;
    }
  }

  private pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private initialOf(title: string): string {
    const clean = (title || 'C').trim();
    return (clean.charAt(0) || 'C').toUpperCase();
  }

  private infoHTML(project: ProjectData, index: number): string {
    const stack = (project.tech || []).join(' · ');
    const track = getTrackTitle(index);
    const code = this.isRealRepo(project.repo)
      ? `<a class="vd-code btn-p5" href="${this.escape(project.repo)}" target="_blank" rel="noopener noreferrer"><span>CÓDIGO</span></a>`
      : '';
    return `
      <span class="vd-kicker">Proyecto ${this.pad(index + 1)}</span>
      <h3 class="vd-title" tabindex="-1">${this.escape(project.title)}</h3>
      <p class="vd-song" data-vd-song>Suena: <span>${this.escape(track)}</span></p>
      <p class="vd-desc">${this.escape(project.description)}</p>
      <p class="vd-stack">${this.escape(stack)}${project.year ? ` — ${this.escape(project.year)}` : ''}</p>
      ${code}
    `;
  }

  private slotTransform(offset: number): { css: string; opacity: string; z: string } {
    const narrow = typeof window !== 'undefined' && window.innerWidth < 860;
    const side = narrow ? 40 : 48;
    if (offset === 0) return { css: 'translateX(0) scale(1) rotateY(0deg)', opacity: '1', z: '3' };
    if (offset === 1) return { css: `translateX(${side}%) scale(.72) rotateY(-30deg)`, opacity: '.9', z: '2' };
    if (offset === -1) return { css: `translateX(-${side}%) scale(.72) rotateY(30deg)`, opacity: '.9', z: '2' };
    return { css: 'translateX(0) scale(.5) rotateY(0deg)', opacity: '0', z: '0' };
  }

  private render(): void {
    if (this.projects.length === 0) {
      this.container.innerHTML = `<div class="vd-carousel"><p class="vd-empty">Proyectos en camino. Vuelve pronto.</p></div>`;
      return;
    }
    const project = this.projects[this.currentIndex];
    const discs = this.projects
      .map((p, i) => `
        <div class="vd-slot" data-slot="${i}" aria-hidden="true">
          <div class="vd-disc">
            <div class="vd-spinner">
              <div class="vd-grooves"></div>
              <div class="vd-label">
                <span class="vd-initial">${this.escape(this.initialOf(p.title))}</span>
                <span class="vd-label-year">${this.escape(p.year || '')}</span>
              </div>
              <div class="vd-hole"></div>
            </div>
            <div class="vd-shine"></div>
          </div>
        </div>
      `)
      .join('');
    this.container.innerHTML = `
      <div class="vd-carousel" tabindex="0" role="region" aria-roledescription="carousel" aria-label="Proyectos">
        <div class="vd-grain" aria-hidden="true"></div>
        <div class="vd-meta">
          <span class="vd-count" aria-hidden="true">${this.pad(this.currentIndex + 1)}<span class="vd-total">/${this.pad(this.projects.length)}</span></span>
          <span class="vd-year">${this.escape(project.year || '')}</span>
        </div>
        <div class="vd-grid">
          <div class="vd-stage">
            <div class="vd-track">
              ${discs}
            </div>
          </div>
          <div>
            <p class="vd-sr" aria-live="polite" data-vd-live>Proyecto ${this.currentIndex + 1} de ${this.projects.length}: ${this.escape(project.title)}. Suena: ${this.escape(getTrackTitle(this.currentIndex))}</p>
            <article class="vd-info card-p5" role="group" aria-roledescription="slide" aria-label="Proyecto ${this.currentIndex + 1} de ${this.projects.length}: ${this.escape(project.title)}. Suena: ${this.escape(getTrackTitle(this.currentIndex))}">
              ${this.infoHTML(project, this.currentIndex)}
            </article>
          </div>
        </div>
        <div class="vd-controls">
          <div class="vd-arrows">
            <button type="button" class="vd-arrow btn-p5" data-action="prev" aria-label="Proyecto anterior"><span>←</span></button>
            <button type="button" class="vd-arrow btn-p3" data-action="next" aria-label="Proyecto siguiente"><span>→</span></button>
          </div>
          <ul class="vd-dots" aria-label="Elegir proyecto">
            ${this.projects.map((p, i) => `
              <li><button type="button" class="vd-dot" data-index="${i}" aria-label="Ir al proyecto ${i + 1}: ${this.escape(p.title)}"${i === this.currentIndex ? ' aria-current="true"' : ''}></button></li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;
    this.infoEl = this.container.querySelector('.vd-info');
    this.countEl = this.container.querySelector('.vd-count');
    this.dotsEl = this.container.querySelector('.vd-dots');
    this.liveEl = this.container.querySelector('[data-vd-live]');
    this.slots = Array.from(this.container.querySelectorAll('.vd-slot'));
    this.container.querySelector('[data-action="prev"]')?.addEventListener('click', () => this.navigate(-1));
    this.container.querySelector('[data-action="next"]')?.addEventListener('click', () => this.navigate(1));
    this.dotsEl?.querySelectorAll('.vd-dot').forEach((dot) => {
      dot.addEventListener('click', () => {
        const i = Number((dot as HTMLElement).dataset.index || '0');
        this.goTo(i);
      });
    });
    const root = this.container.querySelector('.vd-carousel');
    root?.addEventListener('keydown', this.onKeyDown as EventListener);
    root?.addEventListener('pointerdown', this.onPointerDown as EventListener);
    root?.addEventListener('pointerup', this.onPointerUp as EventListener);
    this.updateSlots();
  }

  private offsetFor(slotIndex: number): number {
    const total = this.projects.length;
    let offset = (slotIndex - this.currentIndex) % total;
    if (offset > total / 2) offset -= total;
    if (offset < -total / 2) offset += total;
    return offset;
  }

  private updateSlots(): void {
    this.slots.forEach((slot, i) => {
      const offset = this.offsetFor(i);
      const t = this.slotTransform(offset);
      slot.style.transform = t.css;
      slot.style.opacity = t.opacity;
      slot.style.zIndex = t.z;
      slot.style.pointerEvents = offset === 0 ? 'auto' : 'none';
      slot.style.visibility = t.opacity === '0' ? 'hidden' : 'visible';
      if (offset === 0) slot.classList.add('is-on');
      else slot.classList.remove('is-on');
    });
  }

  private navigate(direction: number): void {
    const total = this.projects.length;
    if (total <= 1) return;
    this.goTo((this.currentIndex + direction + total) % total);
  }

  private goTo(index: number): void {
    if (index === this.currentIndex || index < 0 || index >= this.projects.length) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hadFocus = !!this.infoEl?.contains(document.activeElement);
    this.currentIndex = index;
    const project = this.projects[index];
    if (this.countEl) {
      this.countEl.innerHTML = `${this.pad(index + 1)}<span class="vd-total">/${this.pad(this.projects.length)}</span>`;
    }
    const yearEl = this.container.querySelector('.vd-year');
    if (yearEl) yearEl.textContent = project.year || '';
    this.dotsEl?.querySelectorAll('.vd-dot').forEach((dot, i) => {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    if (this.liveEl) {
      this.liveEl.textContent = `Proyecto ${index + 1} de ${this.projects.length}: ${project.title}. Suena: ${getTrackTitle(index)}`;
    }
    this.updateSlots();
    playDisc(index);
    if (!this.infoEl) return;
    this.infoEl.setAttribute('aria-label', `Proyecto ${index + 1} de ${this.projects.length}: ${project.title}. Suena: ${getTrackTitle(index)}`);
    const swap = (): void => {
      if (!this.infoEl) return;
      this.infoEl.innerHTML = this.infoHTML(project, index);
      this.infoEl.classList.remove('swap');
      if (hadFocus) {
        this.infoEl.querySelector('.vd-title')?.focus({ preventScroll: true } as FocusOptions);
      }
    };
    if (reduced) {
      swap();
      return;
    }
    this.infoEl.classList.add('swap');
    if (this.swapTimeout !== undefined) clearTimeout(this.swapTimeout);
    this.swapTimeout = window.setTimeout(swap, 160);
  }

  destroy(): void {
    stopAll();
    if (this.swapTimeout !== undefined) {
      clearTimeout(this.swapTimeout);
      this.swapTimeout = undefined;
    }
    const root = this.container.querySelector('.vd-carousel');
    root?.removeEventListener('keydown', this.onKeyDown as EventListener);
    root?.removeEventListener('pointerdown', this.onPointerDown as EventListener);
    root?.removeEventListener('pointerup', this.onPointerUp as EventListener);
  }
}
