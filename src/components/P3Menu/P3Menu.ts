const MENU_ITEMS = [
  { id: 'skill', label: 'SKILL', target: '#skills', icon: '', p3Name: 'Skill', sound: 'navigate' },
  { id: 'item', label: 'ITEM', target: '#projects', icon: '', p3Name: 'Item', sound: 'navigate' },
  { id: 'equip', label: 'EQUIP', target: '#experience', icon: '', p3Name: 'Equip', sound: 'navigate' },
  { id: 'persona', label: 'PERSONA', target: '#about', icon: '', p3Name: 'Persona', sound: 'navigate' },
  { id: 'stats', label: 'STATS', target: '#stats', icon: '', p3Name: 'Stats', sound: 'navigate' },
  { id: 'quest', label: 'QUEST', target: '#quests', icon: '', p3Name: 'Quest', sound: 'navigate' },
  { id: 'social', label: 'SOCIAL LINK', target: '#contact', icon: '', p3Name: 'Social Link', sound: 'navigate' },
  { id: 'calendar', label: 'CALENDAR', target: '#timeline', icon: '', p3Name: 'Calendar', sound: 'navigate' },
  { id: 'system', label: 'SYSTEM', target: '#settings', icon: '', p3Name: 'System', sound: 'navigate' },
];

export class P3Menu {
  private container: HTMLElement;
  private isOpen: boolean = false;
  private focusedIndex: number = 0;
  private audioManager: any;
  private gsap: any;
  private mediaQuery: MediaQueryList;

  constructor(container: HTMLElement, audioManager: any, gsap: any) {
    this.container = container;
    this.audioManager = audioManager;
    this.gsap = gsap;
    this.mediaQuery = window.matchMedia('(max-width: 768px)');
    this.init();
  }

  private init() {
    // Inerte: el dueno unico del menu movil es main.ts (.nav-toggle + #nav-menu).
    // No renderiza segundo menu, ni listeners globales, ni sonidos.
    if (typeof document !== 'undefined' && document.querySelector('#nav-menu')) return;
    this.render();
    this.cacheElements();
    this.bindEvents();
    this.handleResize();
    this.mediaQuery.addEventListener('change', this.handleResize.bind(this));
  }

  private render() {
    const menuHTML = `
      <nav class="p3-menu fixed top-0 left-0 z-50 h-full bg-fusion-bg/95 backdrop-blur-xl border-r border-p5-red-dim/30 transform transition-transform duration-500 ease-out ${this.mediaQuery.matches ? '-translate-x-full md:translate-x-0' : 'translate-x-0'} w-full md:w-72" 
           id="p3-menu" aria-label="Menú principal Persona 3 Style" role="navigation">
        
        <!-- Background video/grain -->
        <div class="menu-bg absolute inset-0 overflow-hidden" aria-hidden="true">
          <div class="absolute inset-0 bg-grad-tokyo"></div>
          <div class="grain-overlay absolute inset-0" aria-hidden="true"></div>
          <div class="scanlines absolute inset-0" aria-hidden="true"></div>
        </div>

        <!-- Close button for mobile -->
        <button class="menu-close md:hidden absolute top-4 right-4 z-20 p-2 bg-fusion-card/80 backdrop-blur rounded-lg border border-p5-red-dim/30 text-fusion-text-primary hover:border-p5-red hover:bg-fusion-card transition-all"
                aria-label="Cerrar menú" id="menu-close-btn">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Menu Items -->
        <ul class="menu-items relative z-10 flex flex-col items-start justify-center h-full gap-4 px-8 md:px-6" role="listbox" aria-label="Secciones del menú">
          ${MENU_ITEMS.map((item, index) => this.createMenuItem(item, index)).join('')}
        </ul>

        <!-- Controls hint -->
        <div class="menu-controls absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-fusion-text-muted font-ui text-xs">
          <div class="flex items-center gap-2">
            <kbd class="key-enter px-2 py-1 bg-fusion-card border border-p5-red-dim/30 rounded text-fusion-text-primary font-display text-xs">ENTER</kbd>
            <span>Confirmar</span>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="key-esc px-2 py-1 bg-fusion-card border border-p5-red-dim/30 rounded text-fusion-text-primary font-display text-xs">ESC</kbd>
            <span>Cerrar</span>
          </div>
          <div class="flex items-center gap-2">
            <kbd class="key-nav px-2 py-1 bg-fusion-card border border-p5-red-dim/30 rounded text-fusion-text-primary font-display text-xs">↑↓</kbd>
            <span>Navegar</span>
          </div>
        </div>

        <!-- Version indicator -->
        <div class="absolute bottom-4 right-4 text-p5-red-dim/50 font-display text-xs rotate-90 origin-bottom-right">
          CXRLOSMP v1.0
        </div>
      </nav>

      <!-- Overlay for mobile -->
      <div class="menu-overlay fixed inset-0 bg-p5-black/60 z-40 hidden md:hidden opacity-0 transition-opacity duration-300" 
           id="menu-overlay" aria-hidden="true"></div>

      <!-- Hamburger button (mobile only) -->
      <button class="hamburger-btn md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-fusion-card border-2 border-p5-red-dim/50 flex items-center justify-center shadow-[0_0_30px_rgba(217,35,35,0.3)] hover:border-p5-red hover:shadow-[0_0_50px_rgba(217,35,35,0.5)] transition-all duration-300"
              id="hamburger-btn" aria-label="Abrir menú" aria-expanded="false" aria-controls="p3-menu">
        <span class="hamburger-lines relative w-6 h-5 flex flex-col justify-between items-center">
          <span class="line w-full h-0.5 bg-p5-red transition-all duration-300 origin-center"></span>
          <span class="line w-3/4 h-0.5 bg-p5-red transition-all duration-300 origin-center"></span>
          <span class="line w-1/2 h-0.5 bg-p5-red transition-all duration-300 origin-center"></span>
        </span>
      </button>
    `;

    this.container.innerHTML = menuHTML;
  }

  private cacheElements() {
    this.menu = this.container.querySelector('#p3-menu') as HTMLElement;
    this.overlay = this.container.querySelector('#menu-overlay') as HTMLElement;
    this.hamburgerBtn = this.container.querySelector('#hamburger-btn') as HTMLButtonElement;
    this.closeBtn = this.container.querySelector('#menu-close-btn') as HTMLButtonElement;
    this.menuItems = Array.from(this.container.querySelectorAll('.menu-item')) as HTMLElement[];
    this.hamburgerLines = this.container.querySelectorAll('.hamburger-lines .line');
  }

  private bindEvents() {
    // Hamburger button
    this.hamburgerBtn?.addEventListener('click', this.toggle.bind(this));
    
    // Overlay click
    this.overlay?.addEventListener('click', this.close.bind(this));
    
    // Close button
    this.closeBtn?.addEventListener('click', this.close.bind(this));

    // Menu items
    this.menuItems.forEach((item, index) => {
      item.addEventListener('click', () => this.selectItem(index));
      item.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectItem(index);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.focusNext();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.focusPrev();
        } else if (e.key === 'Escape') {
          this.close();
        }
      });
      item.addEventListener('mouseenter', () => this.focusItem(index));
    });

    // Keyboard navigation (global)
    document.addEventListener('keydown', this.onGlobalKeyDown.bind(this));
  }

  private onGlobalKeyDown(e: KeyboardEvent) {
    if (!this.isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.focusNext();
        this.playSound('navigate');
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.focusPrev();
        this.playSound('navigate');
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.selectItem(this.focusedIndex);
        break;
      case 'Escape':
        this.close();
        break;
    }
  }

  private focusNext() {
    this.focusedIndex = (this.focusedIndex + 1) % this.menuItems.length;
    this.updateFocus();
  }

  private focusPrev() {
    this.focusedIndex = (this.focusedIndex - 1 + this.menuItems.length) % this.menuItems.length;
    this.updateFocus();
  }

  private focusItem(index: number) {
    this.focusedIndex = index;
    this.updateFocus();
  }

  private updateFocus() {
    this.menuItems.forEach((item, index) => {
      const isFocused = index === this.focusedIndex;
      item.setAttribute('aria-selected', isFocused.toString());
      item.classList.toggle('focused', isFocused);
      
      // Scroll into view if needed
      if (isFocused) {
        item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    });
  }

  private selectItem(index: number) {
    const item = MENU_ITEMS[index];
    const target = document.querySelector(item.target);
    
    if (target) {
      this.playSound('confirm');
      
      // Smooth scroll with Lenis if available
      const lenis = (window as any).lenis;
      if (lenis) {
        lenis.scrollTo(target, { offset: -80 });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      
      // Close menu on mobile
      if (window.innerWidth <= 768) {
        this.close();
      }
    }
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    
    this.playSound('open');
    
    // Animate menu
    this.gsap.to(this.menu, {
      x: 0,
      duration: 0.6,
      ease: 'power3.out',
    });
    
    this.gsap.to(this.overlay, {
      opacity: 1,
      display: 'block',
      duration: 0.3,
    });

    // Animate hamburger to X
    this.animateHamburger(true);

    // Focus first item
    this.focusedIndex = 0;
    this.updateFocus();
    this.menuItems[0]?.focus();

    // Trap focus
    this.trapFocus();
  }

  close() {
    if (!this.isOpen) return;
    this.isOpen = false;

    this.playSound('close');

    this.gsap.to(this.menu, {
      x: window.innerWidth <= 768 ? '-100%' : 0,
      duration: 0.4,
      ease: 'power3.in',
    });

    this.gsap.to(this.overlay, {
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        this.overlay.style.display = 'none';
      }
    });

    this.animateHamburger(false);
    this.releaseFocus();
  }

  private animateHamburger(isOpen: boolean) {
    const lines = Array.from(this.hamburgerLines) as HTMLElement[];
    
    if (isOpen) {
      this.gsap.to(lines[0], { rotation: 45, y: 6, duration: 0.3, ease: 'power2.out' });
      this.gsap.to(lines[1], { opacity: 0, duration: 0.2 });
      this.gsap.to(lines[2], { rotation: -45, y: -6, duration: 0.3, ease: 'power2.out' });
      this.hamburgerBtn?.setAttribute('aria-label', 'Cerrar menú');
      this.hamburgerBtn?.setAttribute('aria-expanded', 'true');
    } else {
      this.gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.3, ease: 'power2.out' });
      this.gsap.to(lines[1], { opacity: 1, duration: 0.2, delay: 0.1 });
      this.gsap.to(lines[2], { rotation: 0, y: 0, duration: 0.3, ease: 'power2.out' });
      this.hamburgerBtn?.setAttribute('aria-label', 'Abrir menú');
      this.hamburgerBtn?.setAttribute('aria-expanded', 'false');
    }
  }

  private trapFocus() {
    // Simple focus trap - keep focus within menu
    this.menu?.addEventListener('keydown', this.trapFocusHandler);
  }

  private releaseFocus() {
    this.menu?.removeEventListener('keydown', this.trapFocusHandler);
  }

  private trapFocusHandler = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      const focusableElements = this.menu?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements?.[0] as HTMLElement;
      const lastElement = focusableElements?.[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  private handleResize() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
      this.menu?.classList.add('-translate-x-full');
      this.menu?.classList.remove('md:translate-x-0');
    } else {
      this.menu?.classList.remove('-translate-x-full');
      this.menu?.classList.add('md:translate-x-0');
      
      // Close mobile menu if open on resize to desktop
      if (this.isOpen) {
        this.close();
      }
    }
  }

  private playSound(type: 'navigate' | 'confirm' | 'open' | 'close' | 'back') {
    if (this.audioManager) {
      this.audioManager.play(type);
    }
  }

  destroy() {
    this.menu?.removeEventListener('keydown', this.trapFocusHandler);
    document.removeEventListener('keydown', this.onGlobalKeyDown.bind(this));
  }
}

// Menu item component HTML
function createMenuItem(item: typeof MENU_ITEMS[0], index: number): string {
  const isFirst = index === 0;
  return `
    <li role="option" class="menu-item group relative flex items-center gap-4 px-4 py-3 rounded-xl 
           bg-fusion-card/50 border border-p5-red-dim/20 hover:border-p5-red/50 hover:bg-fusion-card 
           transition-all duration-300 ease-out cursor-pointer
           ${isFirst ? 'focused' : ''}"
        role="option" aria-selected="false" tabindex="${isFirst ? '0' : '-1'}"
        data-target="${MENU_ITEMS[index].target}">
      
      <!-- SVG Selector Mask (P3 Style) -->
      <svg class="menu-selector w-8 h-8 md:w-10 md:h-10 flex-shrink-0" viewBox="0 0 950 200" aria-hidden="true">
        <defs>
          <mask id="menu-mask-${item.id}" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="950" height="200">
            <rect width="100%" height="100%" fill="black"/>
            <g transform="translate(-60, -10) rotate(8, 0, 100) scale(4, 3)" transform-origin="left center">
              <path fill="white" d="M 24.853754, 93.31573 135.14625, 49.684266 114.14751, 97.331142 Z"/>
              <path fill="white" d="M 12.7428765,95.50088 144.25712,47.499123 116.75625,95.465764 Z"/>
            </g>
          </mask>
        </defs>
        <g transform="translate(-60, -10) rotate(8, 0, 100) scale(4, 3)" transform-origin="left center" style="display: block;">
          <path class="fill-fusion-accent-tertiary" d="M 12.7428765,95.50088 144.25712,47.499123 116.75625,95.465764 Z"/>
          <path class="fill-fusion-text-primary" d="M 24.853754, 93.31573 135.14625, 49.684266 114.14751, 97.331142 Z"/>
        </g>
        <text x="150" y="120" class="menu-label" mask="url(#menu-mask-${item.id})" style="font-family: 'Press Start 2P', cursive; font-size: 2.5rem; font-weight: 400;">
          ${item.p3Name}
        </text>
      </svg>

      <!-- Icon -->
      <span class="menu-icon text-2xl md:text-3xl transition-transform duration-300 group-hover:scale-110" aria-hidden="true">${MENU_ITEMS.find(m => m.id === 'skill' || m.id === 'item' || m.id === 'equip' || m.id === 'persona' || m.id === 'stats' || m.id === 'quest' || m.id === 'social' || m.id === 'calendar' || m.id === 'system')?.icon || ''}</span>

      <!-- Label -->
      <span class="menu-label font-display text-sm md:text-base uppercase tracking-wider text-fusion-text-muted group-hover:text-fusion-accent-primary transition-colors duration-300">
        ${item.label}
      </span>

      <!-- Active indicator -->
      <div class="active-indicator absolute right-4 w-1 h-10 bg-fusion-accent-tertiary rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <!-- Focus ring -->
      <div class="focus-ring absolute inset-0 border-2 border-fusion-accent-tertiary rounded-xl opacity-0 pointer-events-none"></div>
    </li>
  `;
}