import * as THREE from 'three';
// Shaders solo via dynamic import en createBackgroundShader() (chunk lazy, no bloquea LCP)

export class ParticleField {
  private count: number;
  private mesh: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private initialPositions: Float32Array;
  private velocities: Float32Array;
  private time: number = 0;

  constructor(count: number = 2000) {
    this.count = count;
    this.init();
  }

  private init() {
    this.geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(this.count * 3);
    const colors = new Float32Array(this.count * 3);
    const sizes = new Float32Array(this.count);
    this.velocities = new Float32Array(this.count * 3);
    this.initialPositions = new Float32Array(this.count * 3);

    const colorP5Red = new THREE.Color(0xD92323);
    const colorP5Dim = new THREE.Color(0x732424);
    const colorP5Gold = new THREE.Color(0xF2E852);
    const colorP3Blue = new THREE.Color(0x00B4FF);
    const colorP3Pink = new THREE.Color(0xFF6B9D);

    for (let i = 0; i < this.count; i++) {
      const radius = 5 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      this.initialPositions[i * 3] = x;
      this.initialPositions[i * 3 + 1] = y;
      this.initialPositions[i * 3 + 2] = z;

      this.velocities[i * 3] = (Math.random() - 0.5) * 0.003;
      this.velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.003;
      this.velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.003;

      const colorRand = Math.random();
      let color;
      if (colorRand < 0.3) color = colorP5Red;
      else if (colorRand < 0.5) color = colorP5Dim;
      else if (colorRand < 0.7) color = colorP5Gold;
      else if (colorRand < 0.85) color = colorP3Blue;
      else color = colorP3Pink;

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 2.5 + 0.5;
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Sprite circular: evita cuadrados planos (PointsMaterial sin mapa dibuja cuadrados)
    const sprite = (() => {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d')!;
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.4, 'rgba(255,255,255,0.8)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    })();

    this.material = new THREE.PointsMaterial({
      size: 0.9,
      map: sprite,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      alphaTest: 0.01,
    });

    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.frustumCulled = false;
  }

  update(delta: number, mouseX: number = 0, mouseY: number = 0, scrollProgress: number = 0) {
    if (!this.mesh) return;

    this.time += delta;
    const positions = this.geometry.attributes.position.array;
    const count = this.count;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;

      positions[idx] += this.velocities[idx];
      positions[idx + 1] += this.velocities[idx + 1];
      positions[idx + 2] += this.velocities[idx + 2];

      // Mouse attraction
      const dx = positions[idx] - mouseX * 20;
      const dy = positions[idx + 1] - mouseY * 20;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 10) {
        const force = (10 - dist) / 10 * 0.03;
        positions[idx] += dx / (dist + 0.001) * force;
        positions[idx + 1] += dy / (dist + 0.001) * force;
      }

      // Return to initial position
      const returnForce = 0.0005;
      positions[idx] += (this.initialPositions[idx] - positions[idx]) * returnForce;
      positions[idx + 1] += (this.initialPositions[idx + 1] - positions[idx + 1]) * returnForce;
      positions[idx + 2] += (this.initialPositions[idx + 2] - positions[idx + 2]) * returnForce;

      // Scroll wave
      const scrollWave = Math.sin(this.initialPositions[idx] * 0.5 + this.time * 2 + scrollProgress * 10) * 0.02;
      positions[idx + 1] += scrollWave;
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.mesh.rotation.y += delta * 0.015;
    this.mesh.rotation.x += delta * 0.008;
  }

  setMouse(x: number, y: number) {
    // Handled in update
  }

  getMesh(): THREE.Points {
    return this.mesh;
  }

  dispose() {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
  }
}

export class BuildingField {
  private mesh: THREE.InstancedMesh;
  private count: number;
  private geometry: THREE.BoxGeometry;
  private material: THREE.MeshBasicMaterial;

  constructor(count: number = 150) {
    this.count = count;
    this.init();
  }

  private init() {
    this.geometry = new THREE.BoxGeometry(1, 1, 1);
    
    this.material = new THREE.MeshBasicMaterial({
      color: 0x0A0A0F,
      transparent: true,
      opacity: 0.85,
      depthWrite: true,
    });

    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.count);
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < this.count; i++) {
      // Edificios siempre delante de la camara (z entre -80 y -15), nunca alrededor
      const width = 2 + Math.random() * 5;
      const height = 8 + Math.random() * 22;
      const depth = 2 + Math.random() * 5;

      dummy.scale.set(width, height, depth);
      
      const x = (Math.random() - 0.5) * 140;
      const z = -15 - Math.random() * 65;
      dummy.position.set(x, height / 2 - 8, z);
      dummy.rotation.y = Math.random() * Math.PI * 0.2;
      dummy.updateMatrix();

      this.mesh.setMatrixAt(i, dummy.matrix);
      
      // Store building data in color attribute (using instanceColor)
      color.setHSL(
        Math.random() * 0.1 + 0.95, // Mostly red/purple hue
        0.3 + Math.random() * 0.2,
        0.05 + Math.random() * 0.05
      );
      this.mesh.setColorAt(i, color);
    }

    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  getMesh(): THREE.InstancedMesh {
    return this.mesh;
  }

  update(delta: number, scrollProgress: number) {
    // Buildings are static, but could add subtle movement
  }

  dispose() {
    if (this.geometry) this.geometry.dispose();
    if (this.material) this.material.dispose();
  }
}

export class TokyoScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private canvas: HTMLCanvasElement;
  private particleField: ParticleField | null = null;
  private buildingField: BuildingField | null = null;
  private shaderMaterial: THREE.ShaderMaterial | null = null;
  private backgroundMesh: THREE.Mesh | null = null;
  private clock: THREE.Clock;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private targetMouseX: number = 0;
  private targetMouseY: number = 0;
  private scrollProgress: number = 0;
  private deviceTier: 'low' | 'medium' | 'high' = 'high';
  private resizeHandler: () => void;
  private mouseMoveHandler: (e: MouseEvent) => void;
  private rafId: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.clock = new THREE.Clock();
    this.resizeHandler = this.onResize.bind(this);
    this.mouseMoveHandler = this.onMouseMove.bind(this);
  }

  private getDprCap(): number {
    return this.deviceTier === 'low' ? 1 : this.deviceTier === 'medium' ? 1.5 : 2;
  }

  private shouldSkipRender(): boolean {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    try {
      const conn = (navigator as any).connection;
      if (conn && (conn.saveData === true || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g')) return true;
    } catch {
      /* sin Network Information API */
    }
    return this.deviceTier === 'low';
  }

  async init(deviceTier: 'low' | 'medium' | 'high' = 'high') {
    this.deviceTier = deviceTier;

    // Low tier / save-data / reduced-motion: sin WebGL, queda el fondo CSS estatico del hero
    if (this.shouldSkipRender()) {
      try {
        this.canvas.style.display = 'none';
      } catch {
        /* noop */
      }
      return;
    }

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0x0A0A0F, 60, 180);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      300
    );
    // Camara fuera de la geometria: mira al horizonte desde lejos
    this.camera.position.set(0, 10, 70);
    this.camera.lookAt(0, 5, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: this.deviceTier === 'high',
      alpha: true,
      powerPreference: this.deviceTier === 'low' ? 'low-power' : 'high-performance',
      preserveDrawingBuffer: false,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.getDprCap()));
    this.renderer.setClearColor(0x0A0A0F, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    // Create shader material for background
    await this.createBackgroundShader();

    // Particulas por tier: 300 low / 800 mid / 2000 high
    const particleCount = this.deviceTier === 'high' ? 2000 : (this.deviceTier === 'medium' ? 800 : 300);
    this.particleField = new ParticleField(particleCount);
    this.scene.add(this.particleField.getMesh());

    // Initialize buildings (only on medium/high)
    if (this.deviceTier !== 'low') {
      const buildingCount = this.deviceTier === 'high' ? 200 : 80;
      this.buildingField = new BuildingField(buildingCount);
      this.scene.add(this.buildingField.getMesh());
    }

    // Ambient light
    const ambient = new THREE.AmbientLight(0xD92323, 0.1);
    this.scene.add(ambient);

    // Directional light (moon)
    const directional = new THREE.DirectionalLight(0x00B4FF, 0.2);
    directional.position.set(50, 100, 50);
    this.scene.add(directional);

    // Point lights for neon accent
    const pointLight1 = new THREE.PointLight(0xD92323, 0.5, 80);
    pointLight1.position.set(-40, 20, -40);
    this.scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x00B4FF, 0.4, 80);
    pointLight2.position.set(40, 10, 40);
    this.scene.add(pointLight2);

    window.addEventListener('resize', this.resizeHandler);
    window.addEventListener('mousemove', this.mouseMoveHandler);

    this.isInitialized = true;
  }

  private async createBackgroundShader() {
    const { tokyoVertex } = await import('./shaders.js');
    const { tokyoFragment } = await import('./tokyoFragment.js');

    this.shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: tokyoVertex,
      fragmentShader: tokyoFragment,
      uniforms: {
        uTime: { value: 0 },
        uScrollProgress: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uDeviceTier: { value: this.deviceTier === 'high' ? 2 : (this.deviceTier === 'medium' ? 1 : 0) },
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const bgGeometry = new THREE.PlaneGeometry(2, 2);
    this.backgroundMesh = new THREE.Mesh(bgGeometry, this.shaderMaterial);
    this.backgroundMesh.position.z = -1;
    this.backgroundMesh.renderOrder = -1;
    this.scene.add(this.backgroundMesh);
  }

  onResize() {
    if (!this.renderer || !this.camera) return;

    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.getDprCap()));

    if (this.shaderMaterial) {
      this.shaderMaterial.uniforms.uResolution.value.set(window.innerWidth, window.innerHeight);
    }
  }

  onMouseMove(event: MouseEvent) {
    this.targetMouseX = (event.clientX / window.innerWidth) * 2 - 1;
    this.targetMouseY = -(event.clientY / window.innerHeight) * 2 + 1;
  }

  start() {
    if (this.isRunning) return;
    // Sin render en low tier, save-data o reduced-motion (el hero queda con fondo CSS)
    if (this.shouldSkipRender()) return;
    if (!this.isInitialized) return;
    this.isRunning = true;
    this.clock.start();
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
  }

  private animate = () => {
    if (!this.isRunning) return;

    this.rafId = requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    // Smooth mouse interpolation
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    // Update particle field
    if (this.particleField) {
      this.particleField.update(delta, this.mouseX, this.mouseY, this.scrollProgress);
    }

    // Update shader uniforms
    if (this.shaderMaterial) {
      this.shaderMaterial.uniforms.uTime.value = this.clock.getElapsedTime();
      this.shaderMaterial.uniforms.uScrollProgress.value = this.scrollProgress;
    }

    // Movimiento sutil alrededor de la posicion base (no hunde la camara)
    const baseX = 0;
    const baseY = 10;
    this.camera.position.x += (baseX + this.mouseX * 3 - this.camera.position.x) * 0.02;
    this.camera.position.y += (baseY + this.mouseY * 2 - this.camera.position.y) * 0.02;
    this.camera.lookAt(this.mouseX * 0.5, 5 + this.mouseY * 0.5, 0);

    this.renderer.render(this.scene, this.camera);
  };

  setScrollProgress(progress: number) {
    this.scrollProgress = Math.max(0, Math.min(1, progress));
  }

  setDeviceTier(tier: 'low' | 'medium' | 'high') {
    this.deviceTier = tier;
    // Would need to reinitialize for particle count changes
  }

  dispose() {
    this.stop();

    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('mousemove', this.mouseMoveHandler);

    if (this.particleField) this.particleField.dispose();
    if (this.buildingField) this.buildingField.dispose();
    if (this.shaderMaterial) this.shaderMaterial.dispose();
    if (this.backgroundMesh?.geometry) this.backgroundMesh.geometry.dispose();
    if (this.backgroundMesh?.material) this.backgroundMesh.material.dispose();
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
    }

    this.canvas = null as any;
    this.scene = null as any;
    this.camera = null as any;
    this.renderer = null as any;
    this.isInitialized = false;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }
}