type SoundType = 'navigate' | 'confirm' | 'open' | 'close' | 'click' | 'hover' | 'back';

interface SoundMap {
  navigate: string;
  confirm: string;
  open: string;
  close: string;
  click: string;
  hover: string;
  back: string;
}

const BASE = (() => {
  try {
    const b = import.meta.env.BASE_URL || '/';
    return b.endsWith('/') ? b : `${b}/`;
  } catch {
    return '/';
  }
})();

const SOUND_MAP: SoundMap = {
  navigate: `${BASE}assets/audio/hover.wav`,
  confirm: `${BASE}assets/audio/click.wav`,
  open: `${BASE}assets/audio/click.wav`,
  close: `${BASE}assets/audio/click.wav`,
  click: `${BASE}assets/audio/click.wav`,
  hover: `${BASE}assets/audio/hover.wav`,
  back: `${BASE}assets/audio/hover.wav`,
};

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private buffers: Map<SoundType, AudioBuffer> = new Map();
  private isLoaded: boolean = false;
  private isMuted: boolean = false;
  private volume: number = 0.25;
  private reducedMotion: boolean = false;
  private hasInteracted: boolean = false;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.init();
    this.setupInteractionListener();
  }

  private setupInteractionListener() {
    const resumeAudio = async () => {
      if (!this.hasInteracted) {
        this.hasInteracted = true;
        await this.resumeContext();
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
        document.removeEventListener('touchstart', resumeAudio);
      }
    };
    
    document.addEventListener('click', resumeAudio, { once: true, passive: true });
    document.addEventListener('keydown', resumeAudio, { once: true, passive: true });
    document.addEventListener('touchstart', resumeAudio, { once: true, passive: true });
  }

  async init() {
    if (this.reducedMotion) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        await this.loadAllSounds();
      } catch (e) {
        console.warn('Audio initialization failed:', e);
      }
    })();
    return this.initPromise;
  }

  private async loadAllSounds() {
    const loadPromises = Object.entries(SOUND_MAP).map(async ([type, url]) => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load ${url}`);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = await this.audioContext!.decodeAudioData(arrayBuffer);
        this.buffers.set(type as SoundType, buffer);
      } catch (e) {
        console.warn(`Failed to load sound ${type}:`, e);
      }
    });

    await Promise.all(loadPromises);
    this.isLoaded = this.buffers.size > 0;
  }

  async resumeContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  play(type: SoundType) {
    if (this.reducedMotion || this.isMuted || !this.isLoaded || !this.audioContext) return;
    
    const buffer = this.buffers.get(type);
    if (!buffer) return;

    this.resumeContext();

    try {
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = this.volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start(0);
    } catch (e) {
      console.warn('Audio playback failed:', e);
    }
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  setReducedMotion(reduced: boolean) {
    this.reducedMotion = reduced;
    if (reduced) this.isMuted = true;
  }

  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.buffers.clear();
    this.isLoaded = false;
  }
}