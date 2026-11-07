// MAD Club / NHCE - The Premium Motion Experience Engine
// Art Direction: Void / Titanium / Iris / Optical Glass
// Universal Transition Director, Particle-to-Product Foundry, Living Device Screen Router,
// Deterministic Collaborative Swarm, and Web Audio Microfeedback.

(function () {
  "use strict";

  // --- Constants & Core Configuration ---
  const NAV = [
    ["index.html", "Home"],
    ["events.html", "Events"],
    ["about.html", "About"],
    ["achievements.html", "Achievements"],
    ["team.html", "Team"],
    ["contact.html", "Contact"]
  ];

  const SKINS = [
    ["nebula", "Nebula"],
    ["ocean", "Ocean"],
    ["aurora", "Aurora"],
    ["solar", "Solar"]
  ];

  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // --- Data Loader & Cache Manager ---
  const dataCache = new Map();
  const loadData = name => {
    if (!dataCache.has(name)) {
      dataCache.set(name, fetchJson(name));
    }
    return dataCache.get(name);
  };

  const fetchJson = async name => {
    try {
      const draft = localStorage.getItem("mad_content_" + name);
      if (draft) return JSON.parse(draft);
    } catch {}
    const res = await fetch(`content/${name}.json`);
    if (!res.ok) throw new Error(`Could not load content/${name}.json`);
    return res.json();
  };

  const draftKeys = () => {
    try {
      return Object.keys(localStorage).filter(k => k.startsWith("mad_content_"));
    } catch {
      return [];
    }
  };

  const photoSrc = p => (/^(data:|https?:|\/\/)/i.test(p) ? p : String(p).replace(/^\/+/, ""));
  const semKey = s => {
    const m = String(s).match(/^(\d\d)-(\d\d) (Odd|Even)/);
    return m ? +m[1] * 10 + (m[3] === "Even" ? 2 : 1) : -1;
  };
  const semYear = s => (String(s).match(/^\d\d-\d\d/) || [""])[0];

  // Route normalizer: guarantees '/' and 'index.html' map directly to 'home'
  function normalizeRoute(url) {
    if (!url) return "home";
    const clean = url.split("?")[0].split("#")[0];
    const last = clean.split("/").filter(Boolean).pop() || "home";
    const name = last.replace(/\.html$/i, "");
    if (name === "index" || name === "" || name === "home") return "home";
    return name;
  }

  // --- Skin / Atmosphere Presets ---
  const skinOk = k => (SKINS.some(s => s[0] === k) ? k : "nebula");
  try {
    const qSkin = new URLSearchParams(location.search).get("skin");
    root.dataset.skin = skinOk(qSkin || localStorage.getItem("skin") || "nebula");
  } catch {
    root.dataset.skin = "nebula";
  }

  function setSkin(k) {
    const valid = skinOk(k);
    root.dataset.skin = valid;
    try { localStorage.setItem("skin", valid); } catch {}
    $$(".theme-selector button").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.skin === valid)));
    syncThemeColor();
    if (particleEngine && particleEngine.syncSkinColors) particleEngine.syncSkinColors();
    sound.playTone(520, 0.05);
  }

  function syncThemeColor() {
    const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
    const meta = $('meta[name="theme-color"]');
    if (bg && meta) meta.content = bg;
  }

  // --- Web Audio Microfeedback Synthesizer (Default Muted) ---
  const sound = {
    ctx: null,
    enabled: false,
    init() {
      try {
        this.enabled = localStorage.getItem("mad_sound") === "true";
      } catch {
        this.enabled = false;
      }
    },
    toggle() {
      this.enabled = !this.enabled;
      try { localStorage.setItem("mad_sound", String(this.enabled)); } catch {}
      if (this.enabled) this.playTone(660, 0.08, "triangle");
      return this.enabled;
    },
    playTone(freq = 440, duration = 0.05, type = "sine") {
      if (!this.enabled || reduced) return;
      try {
        if (!this.ctx) {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          if (AudioContext) this.ctx = new AudioContext();
        }
        if (!this.ctx) return;
        if (this.ctx.state === "suspended") this.ctx.resume();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(0.035, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch {}
    }
  };
  sound.init();

  // --- The Particle-to-Product Choreography Engine (Sections 03 & 05) ---
  // High-performance Three.js WebGL GPU Simulation with Authored Morphs:
  // Target 0: Cosmic Haze (ambient unformed energy)
  // Target 1: Geometric MAD Emblem (monogram: M pillars, delta A apex, D curve & counter)
  // Target 2: Titanium Smartphone Chassis (rounded rect rim, camera pill, bezel)
  // Target 3: Living App Interface Grid (matrix of squircle app tiles & dock)
  const particleEngine = {
    canvas: null,
    renderer: null,
    scene: null,
    camera: null,
    points: null,
    geometry: null,
    material: null,
    count: 880,
    targets: [[], [], [], []], // 0: haze, 1: emblem, 2: phone, 3: app
    currentPos: null,
    origPos: null,
    phases: null,
    colors: null,
    mouse: { x: -2000, y: -2000, targetX: 0, targetY: 0, active: false },
    camTarget: { x: 0, y: 0 },
    morph: { progress: 0 },
    state: "idle",
    running: true,
    rafId: null,
    useWebGL: false,
    ctx2d: null,
    particles2d: [],

    init() {
      this.canvas = $("#particles");
      if (!this.canvas || reduced) return;

      if (typeof THREE !== "undefined") {
        try {
          this.initThree();
          this.useWebGL = true;
        } catch (e) {
          console.warn("Three.js WebGL initialization fallback to 2D:", e);
          this.init2dFallback();
        }
      } else {
        this.init2dFallback();
      }

      window.addEventListener("resize", () => this.resize(), { passive: true });
      window.addEventListener("pointermove", e => {
        this.mouse.active = true;
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        if (this.useWebGL) {
          this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
          this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
          this.camTarget.x = this.mouse.targetX * 30;
          this.camTarget.y = this.mouse.targetY * 30;
        }
      }, { passive: true });

      window.addEventListener("pointerleave", () => {
        this.mouse.active = false;
        this.camTarget.x = 0;
        this.camTarget.y = 0;
      });

      window.addEventListener("scroll", () => {
        if (this.points && this.useWebGL) {
          const sc = Math.min(1, window.scrollY / 600);
          this.points.position.z = -sc * 180;
          if (this.material) this.material.opacity = Math.max(0.2, 0.95 - sc * 0.6);
        }
      }, { passive: true });

      document.addEventListener("visibilitychange", () => {
        this.running = !document.hidden;
        if (this.running) this.loop();
      });

      this.startChoreography();
      this.loop();
    },

    createGlowTexture() {
      const c = document.createElement("canvas");
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext("2d");
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255, 255, 255, 1)");
      g.addColorStop(0.2, "rgba(235, 245, 255, 0.9)");
      g.addColorStop(0.5, "rgba(121, 91, 255, 0.45)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(c);
    },

    getThemeColors() {
      const skin = root.dataset.skin || "nebula";
      if (skin === "aurora") {
        return { primary: new THREE.Color(0.06, 0.72, 0.50), secondary: new THREE.Color(0.18, 0.83, 0.75) };
      } else if (skin === "ocean") {
        return { primary: new THREE.Color(0.15, 0.39, 0.92), secondary: new THREE.Color(0.22, 0.74, 0.97) };
      } else if (skin === "solar") {
        return { primary: new THREE.Color(0.96, 0.62, 0.04), secondary: new THREE.Color(0.96, 0.25, 0.37) };
      }
      // Nebula (default)
      return { primary: new THREE.Color(0.47, 0.36, 1.0), secondary: new THREE.Color(0.40, 0.91, 0.98) };
    },

    initThree() {
      const w = window.innerWidth;
      const h = window.innerHeight;

      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(55, w / h, 1, 3000);
      this.camera.position.set(0, 0, 660);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance"
      });
      this.renderer.setSize(w, h);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      this.buildTargets();

      this.geometry = new THREE.BufferGeometry();
      this.currentPos = new Float32Array(this.count * 3);
      this.origPos = new Float32Array(this.count * 3);
      this.colors = new Float32Array(this.count * 3);
      this.phases = new Float32Array(this.count);

      const themeCols = this.getThemeColors();

      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        // Start at Target 0 (Cosmic Haze)
        this.currentPos[i3] = this.targets[0][i3];
        this.currentPos[i3 + 1] = this.targets[0][i3 + 1];
        this.currentPos[i3 + 2] = this.targets[0][i3 + 2];

        this.origPos[i3] = this.currentPos[i3];
        this.origPos[i3 + 1] = this.currentPos[i3 + 1];
        this.origPos[i3 + 2] = this.currentPos[i3 + 2];

        this.phases[i] = Math.random() * Math.PI * 2;

        const c = Math.random() > 0.4 ? themeCols.primary : themeCols.secondary;
        this.colors[i3] = c.r;
        this.colors[i3 + 1] = c.g;
        this.colors[i3 + 2] = c.b;
      }

      this.geometry.setAttribute("position", new THREE.BufferAttribute(this.currentPos, 3));
      this.geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));

      const texture = this.createGlowTexture();
      this.material = new THREE.PointsMaterial({
        size: 14,
        map: texture,
        transparent: true,
        opacity: 0.92,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexColors: true
      });

      this.points = new THREE.Points(this.geometry, this.material);
      this.scene.add(this.points);
    },

    buildTargets() {
      // Initialize 4 target buffers of size count * 3
      for (let t = 0; t < 4; t++) {
        this.targets[t] = new Float32Array(this.count * 3);
      }

      // --- TARGET 0: Cosmic Volumetric Haze ---
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        const r = 180 + Math.random() * 320;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        this.targets[0][i3] = r * Math.sin(phi) * Math.cos(theta);
        this.targets[0][i3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        this.targets[0][i3 + 2] = (Math.random() - 0.5) * 260;
      }

      // --- TARGET 1: Geometric MAD Emblem ---
      // Monogram geometry derived from official brand emblem:
      // Outer Squircle, M pillars & diagonal, Delta A apex & bar, D semicircular arc & loop
      const scaleEmblem = 3.2;
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        let x = 0, y = 0, z = (Math.random() - 0.5) * 16;

        if (i < 220) {
          // Outer squircle rim: radius 36 centered at (0, 0)
          const angle = (i / 220) * Math.PI * 2;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const rx = Math.sign(cos) * Math.pow(Math.abs(cos), 0.7) * 44;
          const ry = Math.sign(sin) * Math.pow(Math.abs(sin), 0.7) * 44;
          x = rx * scaleEmblem;
          y = ry * scaleEmblem;
        } else if (i < 440) {
          // M shape: Left vertical pillar and diagonal chevron
          const t = (i - 220) / 220;
          if (t < 0.5) {
            // Left pillar: x = -28, y in [-22, 22]
            x = -28;
            y = -22 + (t / 0.5) * 44;
          } else {
            // M diagonal chevron: (-28, 22) -> (-10, -2) -> (-2, 8)
            const dt = (t - 0.5) / 0.5;
            x = -28 + dt * 18;
            y = 22 - dt * 24;
          }
          x *= scaleEmblem;
          y *= scaleEmblem;
        } else if (i < 640) {
          // A shape: Delta apex and crossbar
          const t = (i - 440) / 200;
          if (t < 0.4) {
            // Left leg: (-8, -22) -> (0, 22)
            const dt = t / 0.4;
            x = -8 + dt * 8;
            y = -22 + dt * 44;
          } else if (t < 0.8) {
            // Right leg: (0, 22) -> (8, -22)
            const dt = (t - 0.4) / 0.4;
            x = dt * 8;
            y = 22 - dt * 44;
          } else {
            // Crossbar: (-5, -4) -> (5, -4)
            const dt = (t - 0.8) / 0.2;
            x = -5 + dt * 10;
            y = -4;
          }
          x *= scaleEmblem;
          y *= scaleEmblem;
        } else {
          // D shape: Stem & curved semicircular loop
          const t = (i - 640) / (this.count - 640);
          if (t < 0.35) {
            // D Stem: x = 12, y in [-22, 22]
            x = 12;
            y = -22 + (t / 0.35) * 44;
          } else {
            // D Arc: centered at (12, 0), radius 22, angle from -PI/2 to PI/2
            const dt = (t - 0.35) / 0.65;
            const angle = -Math.PI / 2 + dt * Math.PI;
            x = 12 + Math.cos(angle) * 20;
            y = Math.sin(angle) * 22;
          }
          x *= scaleEmblem;
          y *= scaleEmblem;
        }

        this.targets[1][i3] = x + (Math.random() - 0.5) * 4;
        this.targets[1][i3 + 1] = y + (Math.random() - 0.5) * 4;
        this.targets[1][i3 + 2] = z;
      }

      // --- TARGET 2: Smartphone Chassis ---
      const pw = 280, ph = 560, pr = 42;
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        let x = 0, y = 0, z = (Math.random() - 0.5) * 8;

        if (i < 380) {
          // Outer perimeter of rounded phone chassis
          const t = (i / 380) * 4;
          const hw = pw / 2, hh = ph / 2;
          if (t < 1) {
            x = -hw + t * pw;
            y = hh;
          } else if (t < 2) {
            x = hw;
            y = hh - (t - 1) * ph;
          } else if (t < 3) {
            x = hw - (t - 2) * pw;
            y = -hh;
          } else {
            x = -hw;
            y = -hh + (t - 3) * ph;
          }
        } else if (i < 460) {
          // Camera Dynamic Island at top center
          const t = (i - 380) / 80;
          x = -32 + t * 64;
          y = 215;
          z = 6;
        } else if (i < 720) {
          // Inner screen bezel perimeter
          const t = ((i - 460) / 260) * 4;
          const bw = pw - 24, bh = ph - 28;
          const hbw = bw / 2, hbh = bh / 2;
          if (t < 1) { x = -hbw + t * bw; y = hbh; }
          else if (t < 2) { x = hbw; y = hbh - (t - 1) * bh; }
          else if (t < 3) { x = hbw - (t - 2) * bw; y = -hbh; }
          else { x = -hbw; y = -hbh + (t - 3) * bh; }
        } else {
          // Specular chassis edge halo
          const angle = Math.random() * Math.PI * 2;
          const rad = 240 + Math.random() * 80;
          x = Math.cos(angle) * (pw / 2 + 15);
          y = Math.sin(angle) * (ph / 2 + 15);
          z = (Math.random() - 0.5) * 35;
        }

        this.targets[2][i3] = x + (Math.random() - 0.5) * 4;
        this.targets[2][i3 + 1] = y + (Math.random() - 0.5) * 4;
        this.targets[2][i3 + 2] = z;
      }

      // --- TARGET 3: App Grid / Living Matrix ---
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        let x = 0, y = 0, z = (Math.random() - 0.5) * 12;

        if (i < 640) {
          // App icons: 4 columns x 5 rows in screen space
          const iconIdx = Math.floor(i / 32) % 20;
          const col = iconIdx % 4;
          const row = Math.floor(iconIdx / 4);
          const iconX = -78 + col * 52;
          const iconY = 145 - row * 62;

          // Clustered squircle around icon center
          const angle = Math.random() * Math.PI * 2;
          const rad = Math.random() * 16;
          x = iconX + Math.cos(angle) * rad;
          y = iconY + Math.sin(angle) * rad;
        } else if (i < 760) {
          // Bottom dock: 4 icons at y = -205
          const dockCol = Math.floor((i - 640) / 30) % 4;
          const dockX = -75 + dockCol * 50;
          const angle = Math.random() * Math.PI * 2;
          const rad = Math.random() * 15;
          x = dockX + Math.cos(angle) * rad;
          y = -205 + Math.sin(angle) * rad;
        } else {
          // Status bar and screen edges
          const t = (i - 760) / (this.count - 760);
          x = -100 + t * 200;
          y = 238;
        }

        this.targets[3][i3] = x + (Math.random() - 0.5) * 4;
        this.targets[3][i3 + 1] = y + (Math.random() - 0.5) * 4;
        this.targets[3][i3 + 2] = z;
      }
    },

    screenToWorld(clientX, clientY, targetZ = 0) {
      if (!this.useWebGL || !this.camera || !this.renderer) return new THREE.Vector3(0, 0, 0);
      const rect = this.canvas.getBoundingClientRect();
      const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((clientY - rect.top) / rect.height) * 2 + 1;
      const v = new THREE.Vector3(ndcX, ndcY, 0.5);
      v.unproject(this.camera);
      const dir = v.sub(this.camera.position).normalize();
      const dist = (targetZ - this.camera.position.z) / dir.z;
      return this.camera.position.clone().add(dir.multiplyScalar(dist));
    },

    startChoreography() {
      // Keeps particles in ambient cosmic haze on load (phone stage is initially empty)
      this.state = "ambient";
      this.morph.progress = 0;
    },

    emitFromElements(elements, targetRect) {
      if (!this.useWebGL || !this.geometry || !elements.length) return;
      this.state = "collecting";

      const targetWorld = this.screenToWorld(
        targetRect.left + targetRect.width / 2,
        targetRect.top + targetRect.height / 2,
        0
      );

      const pos = this.geometry.attributes.position.array;
      const workerCount = Math.floor(this.count * 0.7);

      for (let i = 0; i < workerCount; i++) {
        const i3 = i * 3;
        const el = elements[i % elements.length];
        const r = el.getBoundingClientRect();

        const ex = r.left + Math.random() * r.width;
        const ey = r.top + Math.random() * r.height;
        const sourceWorld = this.screenToWorld(ex, ey, (Math.random() - 0.5) * 30);

        pos[i3] = sourceWorld.x;
        pos[i3 + 1] = sourceWorld.y;
        pos[i3 + 2] = sourceWorld.z;

        // Animate toward stage arrival targets
        this.targets[0][i3] = targetWorld.x + (Math.random() - 0.5) * 140;
        this.targets[0][i3 + 1] = targetWorld.y + (Math.random() - 0.5) * 220;
        this.targets[0][i3 + 2] = (Math.random() - 0.5) * 60;
      }

      this.geometry.attributes.position.needsUpdate = true;
    },

    formChassisWireframe() {
      if (!this.useWebGL) return;
      this.state = "chassis";
      if (typeof gsap !== "undefined") {
        gsap.to(this.morph, {
          progress: 2,
          duration: 1.25,
          ease: "power2.out"
        });
      } else {
        this.morph.progress = 2;
      }
    },

    formInternalContainers() {
      if (!this.useWebGL) return;
      this.state = "containers";
      if (typeof gsap !== "undefined") {
        gsap.to(this.morph, {
          progress: 3,
          duration: 1.1,
          ease: "power2.inOut"
        });
      } else {
        this.morph.progress = 3;
      }
    },

    shootNavigationBeam(targetEl) {
      if (!this.useWebGL || !targetEl) return;
      const r = targetEl.getBoundingClientRect();
      const dest = this.screenToWorld(r.left + r.width / 2, r.top + r.height / 2, 20);
      const pos = this.geometry.attributes.position.array;

      for (let i = 0; i < 40; i++) {
        const i3 = i * 3;
        pos[i3] = dest.x + (Math.random() - 0.5) * 30;
        pos[i3 + 1] = dest.y + (Math.random() - 0.5) * 16;
        pos[i3 + 2] = 20 + (Math.random() - 0.5) * 10;
      }
      this.geometry.attributes.position.needsUpdate = true;
      sound.playTone(620, 0.05, "sine");
    },

    emitBeamToElement(sourceEl, targetEl) {
      if (!this.useWebGL || !sourceEl || !targetEl) return;
      const sr = sourceEl.getBoundingClientRect();
      const tr = targetEl.getBoundingClientRect();
      const startW = this.screenToWorld(sr.left + sr.width / 2, sr.top + sr.height / 2, 10);
      const endW = this.screenToWorld(tr.left + tr.width / 2, tr.top + tr.height / 2, 10);

      const pos = this.geometry.attributes.position.array;
      const beamCount = 60;
      for (let i = 0; i < beamCount; i++) {
        const i3 = (i + 120) * 3;
        const t = i / beamCount;
        pos[i3] = startW.x + (endW.x - startW.x) * t + (Math.random() - 0.5) * 15;
        pos[i3 + 1] = startW.y + (endW.y - startW.y) * t + Math.sin(t * Math.PI) * 30;
        pos[i3 + 2] = 20;
      }
      this.geometry.attributes.position.needsUpdate = true;
      sound.playTone(720, 0.06, "triangle");
    },

    resetToAmbient() {
      this.state = "ambient";
      if (typeof gsap !== "undefined") {
        gsap.to(this.morph, {
          progress: 0,
          duration: 1.2,
          ease: "power2.out"
        });
      } else {
        this.morph.progress = 0;
      }
    },

    resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      if (this.useWebGL && this.renderer && this.camera) {
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
      } else if (this.canvas) {
        this.canvas.width = w;
        this.canvas.height = h;
      }
    },

    syncSkinColors() {
      if (!this.useWebGL || !this.colors || !this.geometry) return;
      const themeCols = this.getThemeColors();
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        const c = i % 2 === 0 ? themeCols.primary : themeCols.secondary;
        this.colors[i3] = c.r;
        this.colors[i3 + 1] = c.g;
        this.colors[i3 + 2] = c.b;
      }
      this.geometry.attributes.color.needsUpdate = true;
    },

    init2dFallback() {
      this.useWebGL = false;
      this.ctx2d = this.canvas.getContext("2d");
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      const count = Math.min(220, Math.floor((this.canvas.width * this.canvas.height) / 10000));
      this.particles2d = [];
      for (let i = 0; i < count; i++) {
        this.particles2d.push({
          x: Math.random() * this.canvas.width,
          y: Math.random() * this.canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 1.6 + 0.6,
          alpha: Math.random() * 0.45 + 0.15
        });
      }
    },

    loop() {
      if (!this.running) return;

      if (this.useWebGL) {
        this.loopThree();
      } else if (this.ctx2d) {
        this.loop2d();
      }

      this.rafId = requestAnimationFrame(() => this.loop());
    },

    loopThree() {
      const pos = this.geometry.attributes.position.array;
      const prog = this.morph.progress;
      const fromTargetIdx = Math.min(3, Math.floor(prog));
      const toTargetIdx = Math.min(3, fromTargetIdx + 1);
      const subProg = prog - fromTargetIdx;

      const fromT = this.targets[fromTargetIdx];
      const toT = this.targets[toTargetIdx];
      const time = performance.now() * 0.0012;

      // Mouse position in 3D projection
      const mouse3dX = this.mouse.targetX * 360;
      const mouse3dY = this.mouse.targetY * 260;

      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3;
        const phase = this.phases[i];

        // Base target interpolation
        let tx = fromT[i3] + (toT[i3] - fromT[i3]) * subProg;
        let ty = fromT[i3 + 1] + (toT[i3 + 1] - fromT[i3 + 1]) * subProg;
        let tz = fromT[i3 + 2] + (toT[i3 + 2] - fromT[i3 + 2]) * subProg;

        // Subtle organic Brownian oscillation
        const drift = (this.state === "living" || this.state === "idle") ? 3.5 : 1.2;
        tx += Math.sin(time + phase) * drift;
        ty += Math.cos(time + phase * 1.3) * drift;

        // Pointer repulsion in 3D
        if (this.mouse.active) {
          const dx = tx - mouse3dX;
          const dy = ty - mouse3dY;
          const distSq = dx * dx + dy * dy;
          if (distSq < 19600 && distSq > 0) { // radius ~140px
            const dist = Math.sqrt(distSq);
            const force = (140 - dist) / 140;
            tx += (dx / dist) * force * 45;
            ty += (dy / dist) * force * 45;
            tz += force * 25;
          }
        }

        // Smooth spring towards target
        pos[i3] += (tx - pos[i3]) * 0.1;
        pos[i3 + 1] += (ty - pos[i3 + 1]) * 0.1;
        pos[i3 + 2] += (tz - pos[i3 + 2]) * 0.1;
      }

      this.geometry.attributes.position.needsUpdate = true;

      // Camera parallax
      this.camera.position.x += (this.camTarget.x - this.camera.position.x) * 0.04;
      this.camera.position.y += (this.camTarget.y - this.camera.position.y) * 0.04;
      this.camera.lookAt(0, 0, 0);

      this.renderer.render(this.scene, this.camera);
    },

    loop2d() {
      const w = this.canvas.width;
      const h = this.canvas.height;
      this.ctx2d.clearRect(0, 0, w, h);
      const skin = root.dataset.skin || "nebula";
      const col = skin === "aurora" ? "16, 185, 129" :
                  skin === "ocean" ? "37, 99, 235" :
                  skin === "solar" ? "245, 158, 11" : "121, 91, 255";

      for (let i = 0; i < this.particles2d.length; i++) {
        const p = this.particles2d[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        if (this.mouse.active) {
          const dx = this.mouse.x - p.x;
          const dy = this.mouse.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120 && dist > 0) {
            const force = (120 - dist) / 120;
            p.x -= (dx / dist) * force * 1.8;
            p.y -= (dy / dist) * force * 1.8;
          }
        }

        this.ctx2d.fillStyle = `rgba(${col}, ${p.alpha})`;
        this.ctx2d.beginPath();
        this.ctx2d.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx2d.fill();
      }
    }
  };

  // --- Universal Transition Director (Section 04) ---
  // Coordinates internal page navigation, tabs, FLIP filters, and modals without page reloads.
  const TransitionDirector = {
    isTransitioning: false,

    init(site, events) {
      document.addEventListener("click", e => {
        const link = e.target.closest("a");
        if (!link) return;
        const href = link.getAttribute("href");
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("http") || href.startsWith("//") || link.target === "_blank") {
          return;
        }

        // Only handle internal HTML page transitions
        if (href.endsWith(".html") || href.includes(".html?")) {
          e.preventDefault();
          particleEngine.shootNavigationBeam(link);
          this.navigateTo(href, site, events);
        }
      });

      // Browser History Back/Forward Support
      window.addEventListener("popstate", () => {
        const currentUrl = location.pathname.split("/").filter(Boolean).pop() || "index.html";
        const target = currentUrl + location.search;
        this.renderView(target, site, events, false);
      });
    },

    async navigateTo(url, site, events) {
      if (this.isTransitioning) return;
      this.isTransitioning = true;

      const main = $("#main");
      sound.playTone(460, 0.04);

      // Phase 1: Animate outgoing surface out
      if (main && !reduced) {
        main.classList.add("page-leaving");
        await new Promise(r => setTimeout(r, 220));
      }

      // Update History
      history.pushState(null, "", url);

      // Phase 2: Render incoming scene
      await this.renderView(url, site, events, true);

      // Phase 3: Animate incoming surface in
      if (main && !reduced) {
        main.classList.remove("page-leaving");
        main.classList.add("page-entering");
        requestAnimationFrame(() => {
          main.classList.remove("page-entering");
        });
      }

      this.isTransitioning = false;
    },

    async renderView(url, site, events, scrollReset = true) {
      const pageName = normalizeRoute(url);
      const pageFile = pageName === "home" ? "index.html" : `${pageName}.html`;
      document.body.dataset.page = pageName;

      // Update active links in nav and dock
      $$(".links a, .dock a").forEach(a => {
        const href = a.getAttribute("href");
        const isMatch = href === pageFile || (pageName === "home" && (href === "index.html" || href === "./" || href === "/"));
        a.toggleAttribute("aria-current", isMatch);
        if (isMatch) a.setAttribute("aria-current", "page");
        else a.removeAttribute("aria-current");
      });

      const main = $("#main");
      const renderer = pages[pageName] || pages.notfound;
      main.innerHTML = await renderer(site, events);

      if (scrollReset) window.scrollTo({ top: 0, behavior: "instant" });

      // Wire interactive controllers for current page
      if (pageName === "home") {
        wireLivingPhone(events);
        wireCollaborativeSwarm();
        wireTheFoundry(events);
        PhoneBuilder.init(events);
        ContainerTracer.initHomepageTraces();
      } else if (pageName === "events") {
        wireEventsArena();
      } else if (pageName === "about") {
        wireAboutPage(site);
      } else if (pageName === "team") {
        wireTeamPage();
      } else if (pageName === "contact") {
        wireContactPortal();
      }

      activateCountersAndReveals();
      syncThemeColor();
    }
  };

  // --- Container-Tracing Engine (Part 2) ---
  // On homepage load, main UI containers become visible through animated edge tracing.
  // Thin luminous traces travel along actual container boundaries, illuminating corners
  // before the container surface materializes into optical glass.
  const ContainerTracer = {
    trace(el, delay = 0, duration = 0.85, onComplete = null) {
      if (!el || reduced) {
        el?.classList.add("traced");
        if (onComplete) onComplete();
        return;
      }

      el.classList.add("is-tracing");
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      const radius = parseFloat(style.borderRadius) || 12;
      const width = Math.max(24, Math.round(rect.width));
      const height = Math.max(24, Math.round(rect.height));
      const perimeter = Math.max(30, Math.round(2 * (width + height) - 8 * radius + 2 * Math.PI * radius));

      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("class", "container-trace-svg");
      svg.setAttribute("aria-hidden", "true");
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.style.position = "absolute";
      svg.style.inset = "0";
      svg.style.width = "100%";
      svg.style.height = "100%";
      svg.style.pointerEvents = "none";
      svg.style.overflow = "visible";
      svg.style.zIndex = "8";

      const path = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      path.setAttribute("x", "1");
      path.setAttribute("y", "1");
      path.setAttribute("width", String(width - 2));
      path.setAttribute("height", String(height - 2));
      path.setAttribute("rx", String(radius));
      path.setAttribute("ry", String(radius));
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "url(#trace-grad)");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-dasharray", `${perimeter}`);
      path.setAttribute("stroke-dashoffset", `${perimeter}`);

      svg.appendChild(path);
      if (style.position === "static") el.style.position = "relative";
      el.appendChild(svg);

      if (typeof gsap !== "undefined") {
        gsap.to(path, {
          strokeDashoffset: 0,
          duration: duration,
          delay: delay,
          ease: "power2.inOut",
          onComplete: () => {
            el.classList.remove("is-tracing");
            el.classList.add("traced");
            sound.playTone(520, 0.03, "sine");
            gsap.to(svg, {
              opacity: 0,
              duration: 0.4,
              onComplete: () => svg.remove()
            });
            if (onComplete) onComplete();
          }
        });
      } else {
        setTimeout(() => {
          el.classList.remove("is-tracing");
          el.classList.add("traced");
          svg.remove();
          if (onComplete) onComplete();
        }, (delay + duration) * 1000);
      }
    },

    initHomepageTraces() {
      const targets = [
        { sel: "header.nav", delay: 0.1, dur: 0.8 },
        { sel: ".hero-badge", delay: 0.3, dur: 0.5 },
        { sel: ".hero-copy", delay: 0.45, dur: 0.9 },
        { sel: ".build-dock", delay: 0.7, dur: 0.7 },
        { sel: ".stage-blueprint", delay: 0.85, dur: 1.0 },
        { sel: ".hero-actions a", delay: 1.0, dur: 0.6 }
      ];

      targets.forEach(t => {
        const el = $(t.sel);
        if (el) this.trace(el, t.delay, t.dur);
      });
    }
  };

  // --- PhoneBuilder: State Machine & 7-Stage Assembly Orchestrator (Parts 3 & 4) ---
  const PhoneBuilder = {
    state: "IDLE",
    isBusy: false,

    init(events) {
      this.state = "READY_TO_BUILD";
      this.isBusy = false;

      const buildBtn = $("#btn-build-phone");
      const phone = $(".phone");
      const blueprint = $("#stage-blueprint");

      // Phone stage starts strictly EMPTY
      if (phone) {
        phone.classList.add("is-hidden");
        phone.classList.remove("is-materializing", "is-live");
      }
      if (blueprint) {
        blueprint.classList.remove("is-faded");
      }

      if (buildBtn) {
        buildBtn.onclick = () => {
          if (this.isBusy) return;
          if (this.state === "COMPLETE") {
            this.rebuild(events);
          } else {
            this.startBuild(events);
          }
        };
      }
    },

    updateTicker(phaseText, progressPct) {
      const ticker = $("#build-phase-ticker");
      const fill = $(".build-progress-bar .bp-fill");
      if (ticker) ticker.textContent = phaseText;
      if (fill) fill.style.width = `${progressPct}%`;
    },

    async startBuild(events) {
      if (this.isBusy) return;
      this.isBusy = true;
      this.state = "ACTIVATING";

      const buildBtn = $("#btn-build-phone");
      const phone = $(".phone");
      const blueprint = $("#stage-blueprint");
      const stage = $(".stage");

      if (buildBtn) buildBtn.classList.add("is-active");
      sound.playTone(280, 0.15, "triangle");

      // STAGE 1: Global Activation
      this.updateTicker("STAGE 1/7: ACTIVATING GLOBAL ENERGY BUS...", 15);
      const donorSelectors = [
        "header.nav",
        ".brand-emblem-svg",
        ".links a",
        ".hero-title",
        ".hero-badge",
        ".hero-actions a",
        ".code-badge",
        ".btn-build"
      ];
      $$(donorSelectors.join(",")).forEach((el, idx) => {
        setTimeout(() => el.classList.add("pulse-donor"), idx * 60);
      });

      await new Promise(r => setTimeout(r, 650));

      // STAGE 2: Particle Emission from Real UI Modules
      this.state = "COLLECTING_PARTICLES";
      this.updateTicker("STAGE 2/7: EXTRACTING PARTICLES FROM UI MODULES...", 35);
      sound.playTone(420, 0.2, "sawtooth");

      const donorElements = [
        $(".brand-emblem-svg"),
        ...$$(".links a"),
        $(".hero-title"),
        $(".code-badge"),
        $(".btn-build")
      ].filter(Boolean);

      if (particleEngine.emitFromElements && stage) {
        particleEngine.emitFromElements(donorElements, stage.getBoundingClientRect());
      }

      await new Promise(r => setTimeout(r, 1200));

      // STAGE 3: Construct Device Chassis Wireframe
      this.state = "BUILDING_CHASSIS";
      this.updateTicker("STAGE 3/7: FORGING TITANIUM DEVICE SKELETON...", 55);
      sound.playTone(520, 0.25, "triangle");

      if (particleEngine.formChassisWireframe) {
        particleEngine.formChassisWireframe();
      }

      await new Promise(r => setTimeout(r, 1300));

      // STAGE 4: Internal Screen Container Assembly
      this.state = "ASSEMBLING_CONTAINERS";
      this.updateTicker("STAGE 4/7: SYNTHESIZING SCREEN CONTAINERS...", 75);
      sound.playTone(660, 0.2, "sine");

      if (particleEngine.formInternalContainers) {
        particleEngine.formInternalContainers();
      }

      await new Promise(r => setTimeout(r, 1100));

      // STAGE 5: Materialization into Physical Device
      this.state = "MATERIALIZING";
      this.updateTicker("STAGE 5/7: MATERIALIZING TITANIUM & OPTICAL GLASS...", 88);

      if (blueprint) blueprint.classList.add("is-faded");
      if (phone) {
        phone.classList.remove("is-hidden");
        phone.classList.add("is-materializing");
      }
      sound.playTone(740, 0.3, "sine");

      await new Promise(r => setTimeout(r, 950));

      // STAGE 6: MAD Emblem Ignition Flight
      this.state = "LOGO_APPROACH";
      this.updateTicker("STAGE 6/7: COUPLING MAD CORE IGNITION EMBLEM...", 95);

      const brandLogo = $(".brand-emblem-svg");
      const phoneScreen = $(".screen", phone);
      if (brandLogo && phoneScreen) {
        await this.animateTravelingEmblem(brandLogo, phoneScreen);
      }

      // STAGE 7: Power-up & Boot Screen
      this.state = "POWERING_UP";
      this.updateTicker("STAGE 7/7: MAD OS ONLINE · SYSTEM SYNCHRONIZED", 100);
      sound.playTone(880, 0.35, "triangle");

      const bootScreen = $("#phone-boot-screen", phone);
      if (bootScreen) {
        bootScreen.classList.remove("is-off");
        await new Promise(r => setTimeout(r, 900));
        bootScreen.classList.add("is-off");
      }

      // COMPLETE STATE
      this.state = "COMPLETE";
      this.isBusy = false;
      if (phone) {
        phone.classList.remove("is-materializing");
        phone.classList.add("is-live");
      }

      // Update button UI to Rebuild / Reset options
      const buildDock = $("#build-dock");
      if (buildDock) {
        buildDock.innerHTML = `
          <div class="build-complete-actions">
            <button class="btn-build is-rebuild" id="btn-rebuild-phone" type="button">
              <div class="btn-build-surface">
                <div class="btn-build-icon">✦</div>
                <div class="btn-build-meta">
                  <span class="btn-build-primary">REBUILD EXPERIENCE</span>
                  <span class="btn-build-secondary">Re-ignite site-wide particle synthesis</span>
                </div>
              </div>
            </button>
            <button class="btn-reset" id="btn-reset-stage" type="button">Reset Stage</button>
          </div>
          <div class="build-phase-ticker" id="build-phase-ticker">ASSEMBLY COMPLETE · EXPLORE MAD OS INTERFACE</div>
        `;
        const newRebuild = $("#btn-rebuild-phone");
        const newReset = $("#btn-reset-stage");
        if (newRebuild) newRebuild.onclick = () => this.rebuild(events);
        if (newReset) newReset.onclick = () => this.reset(events);
      }

      wireLivingPhone(events);
      sound.playTone(1040, 0.4, "sine");
    },

    async animateTravelingEmblem(fromEl, toEl) {
      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();

      const proxy = document.createElement("img");
      proxy.src = "assets/brand/mad-emblem.svg";
      proxy.className = "traveling-emblem-proxy";
      proxy.style.left = `${fromRect.left}px`;
      proxy.style.top = `${fromRect.top}px`;
      proxy.style.width = `${fromRect.width}px`;
      proxy.style.height = `${fromRect.height}px`;
      document.body.appendChild(proxy);

      sound.playTone(600, 0.25, "sawtooth");

      if (typeof gsap !== "undefined") {
        await new Promise(resolve => {
          gsap.to(proxy, {
            left: toRect.left + toRect.width / 2 - 24,
            top: toRect.top + toRect.height / 2 - 24,
            width: 48,
            height: 48,
            scale: 1.4,
            rotation: 360,
            duration: 1.1,
            ease: "power3.inOut",
            onComplete: () => {
              gsap.to(proxy, {
                scale: 0.2,
                opacity: 0,
                duration: 0.35,
                onComplete: () => {
                  proxy.remove();
                  resolve();
                }
              });
            }
          });
        });
      } else {
        proxy.remove();
      }
    },

    async reset(events) {
      if (this.isBusy) return;
      this.isBusy = true;
      this.state = "RESETTING";

      const phone = $(".phone");
      const blueprint = $("#stage-blueprint");
      sound.playTone(320, 0.15, "triangle");

      if (phone) {
        phone.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        phone.style.opacity = "0";
        phone.style.transform = "scale(0.92)";
        await new Promise(r => setTimeout(r, 520));
        phone.classList.add("is-hidden");
        phone.classList.remove("is-live", "is-materializing");
        phone.style.opacity = "";
        phone.style.transform = "";
      }

      if (blueprint) {
        blueprint.classList.remove("is-faded");
      }

      if (particleEngine.resetToAmbient) {
        particleEngine.resetToAmbient();
      }

      // Restore initial Build Dock
      const buildDock = $("#build-dock");
      if (buildDock) {
        buildDock.innerHTML = `
          <button class="btn-build" id="btn-build-phone" type="button" aria-label="Initialize Build">
            <div class="btn-build-surface">
              <div class="btn-build-icon">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="btn-build-meta">
                <span class="btn-build-primary">INITIALIZE BUILD</span>
                <span class="btn-build-secondary">Your interface is waiting to be assembled</span>
              </div>
              <span class="btn-build-arrow">✦</span>
            </div>
          </button>
          <div class="build-progress-bar"><div class="bp-fill"></div></div>
          <div class="build-phase-ticker" id="build-phase-ticker">SYSTEM READY · 0 / 7 STAGES</div>
        `;
        const newBtn = $("#btn-build-phone");
        if (newBtn) newBtn.onclick = () => this.startBuild(events);
      }

      this.state = "READY_TO_BUILD";
      this.isBusy = false;
    },

    rebuild(events) {
      this.reset(events).then(() => {
        setTimeout(() => this.startBuild(events), 300);
      });
    }
  };

  // --- Scene B: Upgraded Living Phone & Stateful Screen Router (Section 06) ---
  function wireLivingPhone(events) {
    const phone = $(".phone");
    if (!phone) return;

    const tabs = $$(".phone-tab", phone);
    const views = $$(".phone-view", phone);
    const eventItems = $$(".s-list li", phone);
    const descText = $("#phone-desc", phone);
    const actionLink = $("#phone-action", phone);

    let activeEventIdx = 0;
    let autoTimer = null;

    // Switch between internal phone screens: Discover, Telemetry, Join
    tabs.forEach((tab, idx) => {
      tab.onclick = () => {
        tabs.forEach(t => t.classList.remove("active"));
        views.forEach(v => v.classList.remove("active"));

        tab.classList.add("active");
        if (views[idx]) views[idx].classList.add("active");

        sound.playTone(480, 0.04);
        clearInterval(autoTimer);
      };
    });

    // Event list clicks inside phone
    const selectEvent = (idx) => {
      if (!eventItems[idx]) return;
      eventItems.forEach((li, i) => li.classList.toggle("on", i === idx));
      activeEventIdx = idx;
      const d = eventItems[idx].dataset.desc || "";
      const slug = eventItems[idx].dataset.slug || "";
      if (descText) descText.textContent = d;
      if (actionLink) {
        actionLink.href = `event.html?e=${encodeURIComponent(slug)}`;
        actionLink.textContent = `Open ${eventItems[idx].querySelector("b")?.textContent} →`;
      }
      sound.playTone(540, 0.03);
    };

    eventItems.forEach((li, i) => {
      li.onclick = () => {
        clearInterval(autoTimer);
        selectEvent(i);
        setTimeout(startPhoneCycle, 8000);
      };
    });

    function startPhoneCycle() {
      clearInterval(autoTimer);
      if (!reduced && eventItems.length > 1) {
        autoTimer = setInterval(() => {
          selectEvent((activeEventIdx + 1) % eventItems.length);
        }, 3200);
      }
    }
    startPhoneCycle();

    // Wire phone mini form with real async submission
    const miniForm = $("#phone-mini-form", phone);
    if (miniForm) {
      miniForm.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = $("#pm-submit", miniForm);
        const feedback = $("#pm-feedback", miniForm);
        const nameInput = $("#pm-name", miniForm);
        const emailInput = $("#pm-email", miniForm);

        if (!nameInput || !emailInput) return;
        const nameVal = nameInput.value.trim();
        const emailVal = emailInput.value.trim();

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Transmitting...";
        }

        try {
          const resp = await fetch("https://formspree.io/f/xbjvlqwe", {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: nameVal,
              email: emailVal,
              source: "MAD OS Smartphone Mini Fast-Track",
              submittedAt: new Date().toISOString()
            })
          });

          if (resp.ok) {
            miniForm.innerHTML = `
              <div style="padding:10px 8px;border-radius:10px;background:rgba(52,211,153,0.12);border:1px solid rgba(52,211,153,0.4);text-align:center;">
                <b style="color:#34d399;font-size:0.8rem;display:block;margin-bottom:4px;">✦ Request Confirmed!</b>
                <p style="font-size:0.72rem;color:var(--text);margin:0;line-height:1.4;">Welcome aboard, ${esc(nameVal)}. Our core team will reach out via student email shortly.</p>
              </div>
            `;
            sound.playTone(880, 0.08);
          } else {
            throw new Error("Server status " + resp.status);
          }
        } catch (err) {
          console.warn("Phone mini-form submit error:", err);
          if (feedback) {
            feedback.style.display = "block";
            feedback.style.color = "#fbbf24";
            feedback.innerHTML = `⚠️ Direct transmit offline. Please DM us on <a href="https://instagram.com/mad_club_nhce" target="_blank" style="color:var(--accent-text);text-decoration:underline;">Instagram</a> to join!`;
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Retry Request";
          }
        }
      };
    }

    // Bounded gyroscopic inertial tilt
    if (isFinePointer && !reduced) {
      const stage = $(".stage");
      if (stage) {
        stage.addEventListener("pointermove", e => {
          const r = stage.getBoundingClientRect();
          const px = (((e.clientX - r.left) / r.width - 0.5) * 1.1).toFixed(3);
          const py = (((e.clientY - r.top) / r.height - 0.5) * 1.1).toFixed(3);
          stage.style.setProperty("--px", px);
          stage.style.setProperty("--py", py);
        }, { passive: true });
        stage.addEventListener("pointerleave", () => {
          stage.style.setProperty("--px", "0");
          stage.style.setProperty("--py", "0");
        });
      }
    }
  }

  // --- Scene C: Deterministic Collaborative Swarm (Section 06) ---
  function wireCollaborativeSwarm() {
    const hero = $(".hero");
    if (!hero || reduced) return;

    const layer = document.createElement("div");
    layer.className = "swarm";
    layer.setAttribute("aria-hidden", "true");
    hero.prepend(layer);

    const steps = [
      { name: "Design", color: "#a855f7", sel: ".hero-badge" },
      { name: "Code", color: "#38bdf8", sel: ".stage .phone" },
      { name: "QA", color: "#f59e0b", sel: ".phone-header" },
      { name: "Deploy", color: "#2dd4bf", sel: ".hero-actions .btn.primary" },
      { name: "Launch", color: "#ec4899", sel: ".hero-title" }
    ];

    let currentStep = 0;
    const agentEl = document.createElement("div");
    agentEl.className = "agent active";
    agentEl.innerHTML = `
      <i class="box"></i>
      <span class="cur">
        <svg viewBox="0 0 16 20" width="16" height="20">
          <path d="M1 1l13 7-6 2-2 7z" fill="currentColor" stroke="#000" stroke-width="1"/>
        </svg>
        <b id="agent-label">Design</b>
      </span>`;
    layer.append(agentEl);

    const box = agentEl.querySelector(".box");
    const cur = agentEl.querySelector(".cur");
    const label = agentEl.querySelector("#agent-label");

    function runDeterministicStep() {
      if (document.hidden) return;
      const step = steps[currentStep];
      const target = $(step.sel, hero);
      if (target) {
        const hRect = hero.getBoundingClientRect();
        const tRect = target.getBoundingClientRect();
        const pad = 6;
        const x = Math.max(0, tRect.left - hRect.left - pad);
        const y = Math.max(0, tRect.top - hRect.top - pad);
        const w = tRect.width + pad * 2;
        const h = tRect.height + pad * 2;

        agentEl.style.setProperty("--c", step.color);
        label.textContent = step.name;

        agentEl.style.setProperty("--x", `${x}px`);
        agentEl.style.setProperty("--y", `${y}px`);
        agentEl.style.setProperty("--w", `${w}px`);
        agentEl.style.setProperty("--h", `${h}px`);

        agentEl.style.setProperty("--cx", `${x + w * 0.75}px`);
        agentEl.style.setProperty("--cy", `${y + h * 0.75}px`);
      }

      currentStep = (currentStep + 1) % steps.length;
    }

    runDeterministicStep();
    const interval = setInterval(runDeterministicStep, 3600);
    hero.addEventListener("pointerenter", () => clearInterval(interval), { once: true });
  }

  // --- Scene D: The Foundry (Hands-on Product Assembly - Section 06) ---
  function wireTheFoundry(events) {
    const box = $(".foundry-box");
    if (!box) return;

    const chips = $$(".foundry-chip", box);
    const bays = $$(".foundry-bay", box);
    const countLabel = $("#foundry-progress", box);
    const resultBox = $("#foundry-result", box);
    const autoAssembleBtn = $("#foundry-auto", box);

    let slottedCount = 0;
    const nextEvent = events.find(e => e.status === "open" || e.status === "upcoming") || events[0];

    const slotChip = (chip, idx) => {
      if (chip.classList.contains("slotted")) return;
      chip.classList.add("slotted");
      if (bays[slottedCount]) {
        bays[slottedCount].classList.add("filled");
        bays[slottedCount].textContent = chip.querySelector("span")?.textContent || "Loaded";
      }
      slottedCount++;
      sound.playTone(320 + slottedCount * 110, 0.08, "triangle");

      if (countLabel) countLabel.textContent = `${slottedCount} of 4 Modules Assembled`;

      if (slottedCount >= 4) {
        if (resultBox) resultBox.classList.add("active");
        sound.playTone(880, 0.2, "sine");
      }
    };

    chips.forEach((chip, i) => {
      chip.onclick = () => slotChip(chip, i);
    });

    if (autoAssembleBtn) {
      autoAssembleBtn.onclick = () => {
        chips.forEach((c, idx) => setTimeout(() => slotChip(c, idx), idx * 120));
      };
    }
  }

  // --- FLIP Layout & Filter Controller for Event Arena (Section 07) ---
  function wireEventsArena() {
    const state = window.__eventState;
    if (!state) return;

    const container = $("#events-container");
    const countEl = $("#event-count");
    const searchInput = $("#q");
    const statusBtns = $$("#status-filters .chip");
    const yearBtns = $$("#year-filters .chip");

    function renderArenaWithFlip() {
      // 1. First: measure current card positions
      const firstRects = new Map();
      $$(".event-card", container).forEach(card => {
        firstRects.set(card.dataset.slug, card.getBoundingClientRect());
      });

      const q = state.query.trim().toLowerCase();
      const filtered = state.events.filter(e => {
        const matchYear = state.year === "all" || semYear(e.semester) === state.year;
        const matchStatus = state.status === "all" || e.status === state.status;
        const matchQuery = !q || `${e.name} ${e.description} ${e.semester} ${e.category || ""}`.toLowerCase().includes(q);
        return matchYear && matchStatus && matchQuery;
      });

      if (countEl) countEl.textContent = `Showing ${filtered.length} of ${state.events.length} events`;

      if (!filtered.length) {
        container.innerHTML = `<div class="empty">No events match your criteria. Try adjusting your search query or filters.</div>`;
        return;
      }

      container.innerHTML = `
        <div class="events-grid">
          ${filtered.map(e => {
            const cover = (e.photos && e.photos[0]) ? photoSrc(e.photos[0]) : (e.poster ? photoSrc(e.poster) : "");
            return `
              <div class="card event-card reveal in" data-slug="${esc(e.slug)}">
                <div class="event-poster">
                  ${cover ? `
                    <img src="${esc(cover)}" alt="${esc(e.name)}" loading="lazy">
                  ` : `
                    <div class="event-cover-art">
                      <div class="art-pattern"></div>
                      <span class="art-glyph">${esc(e.name.slice(0, 2))}</span>
                    </div>
                  `}
                  <span class="status-badge ${e.status}">${e.status === "open" ? "Live Registration" : e.status}</span>
                </div>
                <div class="event-body">
                  <div class="event-meta">
                    <span>${esc(e.semester)}</span>
                    <span>•</span>
                    <span>${esc(e.category || "Hackathon")}</span>
                  </div>
                  <h3>${esc(e.name)}</h3>
                  <p>${esc(e.description)}</p>
                  <div class="event-footer">
                    <a class="btn sm primary" href="event.html?e=${encodeURIComponent(e.slug)}">
                      ${e.status === "open" ? "Register & Details →" : "View Details & Photos →"}
                    </a>
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;

      // 2. Last & Invert: FLIP animate cards from old to new positions
      if (!reduced) {
        $$(".event-card", container).forEach(card => {
          const first = firstRects.get(card.dataset.slug);
          if (first) {
            const last = card.getBoundingClientRect();
            const dx = first.left - last.left;
            const dy = first.top - last.top;
            if (dx !== 0 || dy !== 0) {
              card.style.transform = `translate(${dx}px, ${dy}px)`;
              card.style.transition = "none";
              requestAnimationFrame(() => {
                card.style.transform = "";
                card.style.transition = "transform var(--dur-layout) var(--ease-spring-soft)";
              });
            }
          }
        });
      }
    }

    searchInput?.addEventListener("input", e => {
      state.query = e.target.value;
      renderArenaWithFlip();
    });

    statusBtns.forEach(btn => {
      btn.onclick = () => {
        statusBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.status = btn.dataset.status;
        renderArenaWithFlip();
        sound.playTone(450, 0.04);
      };
    });

    yearBtns.forEach(btn => {
      btn.onclick = () => {
        yearBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        state.year = btn.dataset.y;
        renderArenaWithFlip();
        sound.playTone(450, 0.04);
      };
    });

    renderArenaWithFlip();
  }

  // --- About Page: 5-Phase Interactive Pipeline Controller ---
  function wireAboutPage(site) {
    const pipeline = site.learning_pipeline || [];
    const stepperBtns = $$(".pipeline-step-btn");
    const stageName = $("#pipeline-active-name");
    const stageTag = $("#pipeline-active-tag");
    const stageDesc = $("#pipeline-active-desc");
    const previewBox = $("#pipeline-preview-content");

    if (!stepperBtns.length) return;

    const stagePreviews = [
      // 01: Discover
      `<div class="preview-metric" style="width:100%;">
         <span class="mono-label" style="color:var(--accent-text);font-size:0.75rem;letter-spacing:0.08em;">CAMPUS BOTTLENECK AUDIT</span>
         <h4 style="margin:8px 0 12px;font-size:1.15rem;">Event Registration Friction: 42%</h4>
         <div style="background:rgba(255,255,255,0.04);padding:14px;border-radius:10px;font-family:var(--font-mono);font-size:0.75rem;text-align:left;line-height:1.6;border:1px solid var(--line);">
           <div>&gt; Problem: Fragmented Google Forms cause drop-offs.</div>
           <div>&gt; Proposed: Unified Evently mobile companion with 1-tap QR ticket.</div>
           <div style="color:#10b981;margin-top:4px;">✓ Validated across 1,200+ student survey respondents.</div>
         </div>
       </div>`,
      // 02: Prototype
      `<div class="preview-metric" style="width:100%;">
         <span class="mono-label" style="color:var(--accent-secondary);font-size:0.75rem;letter-spacing:0.08em;">FIGMA TOKEN ARCHITECTURE</span>
         <h4 style="margin:8px 0 12px;font-size:1.15rem;">Optical Glass &amp; Kinetic Micro-interactions</h4>
         <div style="display:flex;gap:8px;justify-content:center;margin:12px 0;">
           <div style="padding:6px 12px;background:rgba(121,91,255,0.2);border:1px solid rgba(121,91,255,0.4);border-radius:16px;font-family:var(--font-mono);font-size:0.72rem;color:#c4b5fd;">--blur: 24px</div>
           <div style="padding:6px 12px;background:rgba(56,189,248,0.2);border:1px solid rgba(56,189,248,0.4);border-radius:16px;font-family:var(--font-mono);font-size:0.72rem;color:#7dd3fc;">--spring: 400ms</div>
           <div style="padding:6px 12px;background:rgba(16,185,129,0.2);border:1px solid rgba(16,185,129,0.4);border-radius:16px;font-family:var(--font-mono);font-size:0.72rem;color:#6ee7b7;">--fps: 120hz</div>
         </div>
         <div style="font-size:0.78rem;color:var(--muted);">Tactile haptic presets &amp; contrast-tested AA/AAA accessibility.</div>
       </div>`,
      // 03: Collaborate
      `<div class="preview-metric" style="width:100%;">
         <span class="mono-label" style="color:#f59e0b;font-size:0.75rem;letter-spacing:0.08em;">GIT SWARM WORKFLOW</span>
         <h4 style="margin:8px 0 12px;font-size:1.15rem;">Peer Review &amp; Trunk-based CI</h4>
         <div style="background:rgba(0,0,0,0.45);padding:14px;border-radius:10px;font-family:var(--font-mono);font-size:0.75rem;text-align:left;line-height:1.6;border:1px solid var(--line);">
           <div><span style="color:#f59e0b;">PR #42:</span> feat(ar): camera occlusion filter</div>
           <div><span style="color:#10b981;">✓ Reviewer 1:</span> Clean state lifecycle management.</div>
           <div><span style="color:#10b981;">✓ Reviewer 2:</span> Memory leak checks passed (0 leaks).</div>
           <div style="color:#38bdf8;margin-top:4px;">→ Merged into main via squashed commit.</div>
         </div>
       </div>`,
      // 04: Build
      `<div class="preview-metric" style="width:100%;">
         <span class="mono-label" style="color:#10b981;font-size:0.75rem;letter-spacing:0.08em;">HIGH-PERFORMANCE RUNTIME</span>
         <h4 style="margin:8px 0 12px;font-size:1.15rem;">Flutter 3 + On-Device CoreML</h4>
         <div style="background:rgba(0,0,0,0.55);padding:14px;border-radius:10px;font-family:var(--font-mono);font-size:0.72rem;text-align:left;line-height:1.55;border:1px solid var(--line);">
           <div style="color:#10b981;">$ flutter run --release -d device-pixel8</div>
           <div>⚡ Compilation: 1.4s (Ahead-of-Time native ARM64)</div>
           <div>📊 Frame telemetry: 120.0 fps (0 frame drops)</div>
           <div style="color:#38bdf8;">🧠 Local TFLite inference: 8.2ms latency</div>
         </div>
       </div>`,
      // 05: Ship
      `<div class="preview-metric" style="width:100%;">
         <span class="mono-label" style="color:#ec4899;font-size:0.75rem;letter-spacing:0.08em;">PRODUCTION DEPLOYMENT</span>
         <h4 style="margin:8px 0 12px;font-size:1.15rem;">Play Store &amp; App Store Ingest</h4>
         <div style="background:rgba(236,72,153,0.12);border:1px solid rgba(236,72,153,0.3);padding:14px;border-radius:10px;font-family:var(--font-mono);font-size:0.75rem;text-align:left;line-height:1.6;">
           <div>🚀 Fastlane automated release #104</div>
           <div>📱 iOS TestFlight: Passed Apple notarization</div>
           <div>🤖 Google Play Console: Production 100% rollout</div>
           <div style="color:#10b981;margin-top:4px;">📈 Active installs: 1,400+ campus builders</div>
         </div>
       </div>`
    ];

    if (previewBox) previewBox.innerHTML = stagePreviews[0];

    stepperBtns.forEach((btn, idx) => {
      btn.onclick = () => {
        stepperBtns.forEach(b => {
          b.classList.remove("active");
          b.setAttribute("aria-selected", "false");
        });
        btn.classList.add("active");
        btn.setAttribute("aria-selected", "true");

        const p = pipeline[idx];
        if (p) {
          if (stageName) stageName.textContent = `${p.step}. ${p.name}`;
          if (stageTag) stageTag.textContent = p.tag;
          if (stageDesc) stageDesc.textContent = p.desc;
        }
        if (previewBox && stagePreviews[idx]) {
          previewBox.innerHTML = stagePreviews[idx];
          particleEngine.emitBeamToElement(btn, previewBox);
        }
        sound.playTone(420 + idx * 70, 0.05);
      };
    });
  }

  // --- Team Page Controller ---
  function wireTeamPage() {
    const chips = $$("#team-filters .chip");
    const cards = $$("#team-members .person-card");
    if (!chips.length) return;

    chips.forEach(chip => {
      chip.onclick = () => {
        chips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        const comm = chip.dataset.comm;
        cards.forEach(card => {
          card.style.display = (comm === "all" || card.dataset.comm === comm) ? "" : "none";
        });
        sound.playTone(450, 0.04);
      };
    });
  }

  // --- Contact & Intent Portal ---
  function wireContactPortal() {
    const form = $("#contact-form");
    if (!form) return;

    const intentBtns = $$("#intent-selector .intent-btn");
    const intentInput = $("#intent-input");
    const feedback = $("#contact-feedback");
    const submitBtn = $("#contact-submit");

    intentBtns.forEach(btn => {
      btn.onclick = () => {
        intentBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        if (intentInput) intentInput.value = btn.dataset.intent;
        sound.playTone(480, 0.04);
      };
    });

    form.onsubmit = async e => {
      e.preventDefault();
      const action = form.getAttribute("action");
      feedback.className = "form-feedback";
      feedback.style.display = "none";

      submitBtn.disabled = true;
      submitBtn.textContent = "Transmitting Application...";

      try {
        if (!action || !action.startsWith("http")) {
          await new Promise(r => setTimeout(r, 600));
          feedback.className = "form-feedback success";
          feedback.textContent = "Application recorded! For fast coordination, please DM us on Instagram @md_club_nhce.";
          form.reset();
        } else {
          const res = await fetch(action, {
            method: "POST",
            body: new FormData(form),
            headers: { Accept: "application/json" }
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          feedback.className = "form-feedback success";
          feedback.textContent = "Transmission confirmed! Our committee will reach out on your student email.";
          form.reset();
        }
        sound.playTone(720, 0.15, "triangle");
      } catch (err) {
        feedback.className = "form-feedback error";
        feedback.textContent = "Could not transmit application. Please connect on Instagram @md_club_nhce.";
        sound.playTone(240, 0.15, "sawtooth");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Transmit Application →";
      }
    };
  }

  // --- Scroll Reveal & Animated Number Counters ---
  function activateCountersAndReveals() {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1 });

    $$(".reveal").forEach(el => io.observe(el));

    const cio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        const match = e.target.textContent.match(/^(\d+)(.*)$/);
        if (!match || reduced) return;

        const end = +match[1];
        const suffix = match[2];
        const start = performance.now();
        const duration = 1200;

        function tick(now) {
          const progress = Math.min(1, (now - start) / duration);
          const ease = 1 - Math.pow(1 - progress, 3);
          e.target.textContent = Math.round(end * ease) + suffix;
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });

    $$("[data-count]").forEach(el => cio.observe(el));
  }

  // --- Page Template Renderers ---
  const pages = {
    // 01 / HOMEPAGE
    async home(site, events) {
      const flags = events.filter(e => e.flagship);
      const nextOpen = events.find(e => e.status === "open" || e.status === "upcoming") || events[0];

      const phoneListHtml = events.slice(0, 5).map((e, idx) => `
        <li class="${idx === 0 ? "on" : ""}" data-desc="${esc(e.description)}" data-slug="${esc(e.slug)}">
          <b>${esc(e.name)}</b>
          <span>${esc(e.semester)} · ${esc(e.category || "Hackathon")}</span>
        </li>
      `).join("");

      const marqueeHtml = [...events, ...events].map(e => `<span>${esc(e.name)}</span>`).join("");

      const highlightsHtml = site.highlights.map((h, i) => `
        <div class="big reveal">
          <span class="idx">${String(i + 1).padStart(2, "0")}</span>
          <div>
            <span class="mono-label" style="color:var(--accent-text);font-size:0.8rem;text-transform:uppercase;">${esc(h.tag || "CRAFT")}</span>
            <h3>${esc(h.title)}</h3>
          </div>
          <p>${esc(h.text)}</p>
        </div>
      `).join("");

      const flagshipCardsHtml = flags.map(e => {
        const cover = (e.photos && e.photos[0]) ? photoSrc(e.photos[0]) : "";
        return `
          <div class="card event-card reveal">
            <div class="event-poster">
              ${cover ? `<img src="${esc(cover)}" alt="${esc(e.name)}" loading="lazy">` : `
                <div class="event-cover-art">
                  <div class="art-pattern"></div>
                  <span class="art-glyph">${esc(e.name.slice(0, 2))}</span>
                </div>
              `}
              <span class="status-badge ${e.status}">${e.status === "open" ? "Live Registration" : e.status}</span>
            </div>
            <div class="event-body">
              <div class="event-meta">
                <span>${esc(e.semester)}</span>
                <span>•</span>
                <span>${esc(e.category || "Flagship")}</span>
              </div>
              <h3>${esc(e.name)}</h3>
              <p>${esc(e.description)}</p>
              <div class="event-footer">
                <a class="btn sm primary" href="event.html?e=${encodeURIComponent(e.slug)}">View Event & Photos →</a>
              </div>
            </div>
          </div>
        `;
      }).join("");

      return `
        <!-- Scene A: The Arrival (Headline & Particle Proof) -->
        <section class="hero wrap">
          <div class="hero-copy">
            <div class="hero-badge">
              <span class="pulse-dot"></span>
              <span>${esc(site.hero_badge || "MOBILE APP DEVELOPMENT CLUB · NHCE")}</span>
            </div>
            <h1 class="hero-title">
              Don't just use the future. <span class="highlight">Build it.</span>
            </h1>
            <p class="lead">${esc(site.hero_lead)}</p>
            <div class="hero-actions">
              <a class="btn primary" href="events.html">${esc(site.hero_cta_primary || "Explore Events")}</a>
              <a class="btn" href="contact.html">${esc(site.hero_cta_secondary || "Join the Guild")}</a>
            </div>

            <!-- Interactive Assembly Dock (Prompt Part 3: The Build Phone Experience) -->
            <div class="build-dock reveal">
              <div class="build-dock-header">
                <span class="mono-label" style="font-size:0.75rem;letter-spacing:0.12em;color:var(--accent-text);">INTERACTIVE PROTOTYPE FABRICATOR</span>
                <span class="badge" style="font-size:0.68rem;padding:2px 8px;">ZERO-G STAGE</span>
              </div>
              <p style="font-size:0.85rem;color:var(--muted);margin:6px 0 12px;line-height:1.45;">
                Watch the website deconstruct and channel its energy to assemble the MAD OS smartphone flagship in real time.
              </p>
              <div class="build-action-row">
                <button type="button" class="btn-build" id="btn-build-phone">
                  <span class="btn-build-surface">
                    <span class="build-icon">⚡</span>
                    <span class="build-text">INITIALIZE BUILD</span>
                  </span>
                </button>
                <div class="build-phase-ticker" id="build-phase-ticker">
                  <span class="ticker-dot"></span>
                  <span class="ticker-text" id="ticker-text">STAGE READY // CLICK TO COMMENCE</span>
                </div>
              </div>
              <div class="build-progress-bar" id="build-progress-bar">
                <div class="build-progress-fill" id="build-progress-fill"></div>
              </div>
              <div class="build-complete-actions" id="build-complete-actions" style="display:none;">
                <button type="button" class="btn sm" id="btn-rebuild-phone">Rebuild Experience</button>
                <button type="button" class="btn sm" id="btn-reset-stage">Reset Stage</button>
              </div>
            </div>
          </div>

          <!-- Scene B: The Living Phone Stage (Initially Empty Blueprint until user triggers Build) -->
          <div class="stage" aria-label="Interactive Product Experience">
            <!-- Stage Blueprint (Empty State with Coordinate Grid & Radar Sweep) -->
            <div class="stage-blueprint" id="stage-blueprint">
              <div class="blueprint-grid"></div>
              <div class="blueprint-radar"></div>
              <div class="blueprint-crosshairs"></div>
              <div class="blueprint-beacon">
                <span class="beacon-pulse"></span>
                <span class="beacon-label">STAGE // ZERO-G FABRICATOR - AWAITING ASSEMBLY INITIATION</span>
              </div>
              <div class="blueprint-coords">
                <span>SYS.FAB // 44.02° N</span>
                <span>CHASSIS // VACANT</span>
              </div>
            </div>

            <!-- Smartphone Chassis (Starts is-hidden, materializes during Phase 5) -->
            <div class="phone is-hidden" id="hero-phone">
              <span class="phone-vol-up"></span>
              <span class="phone-vol-down"></span>
              <span class="phone-power"></span>
              <div class="dynamic-island">
                <span class="sensor"></span>
                <span class="camera"></span>
              </div>
              <div class="screen">
                <!-- Boot Screen Overlay for Power-up Sequence -->
                <div class="phone-boot-screen is-off" id="phone-boot-screen">
                  <div class="boot-emblem-wrap">
                    <img src="assets/brand/mad-emblem.svg" class="boot-emblem" alt="MAD Emblem">
                  </div>
                  <span class="boot-status" id="boot-status">MAD OS // INITIALIZING...</span>
                  <div class="boot-bar">
                    <div class="boot-progress" id="boot-progress"></div>
                  </div>
                </div>

                <div class="phone-header">
                  <span class="s-brand">MAD / OS</span>
                  <span class="s-status">Live</span>
                </div>
                <div class="phone-tabs">
                  <button class="phone-tab active" type="button">Discover</button>
                  <button class="phone-tab" type="button">Telemetry</button>
                  <button class="phone-tab" type="button">Join</button>
                </div>
                <!-- View 1: Discover -->
                <div class="phone-view active">
                  <ul class="s-list">${phoneListHtml}</ul>
                  <div class="s-desc-card">
                    <p id="phone-desc">${esc(events[0]?.description || "")}</p>
                    <a class="action-link" id="phone-action" href="event.html?e=${encodeURIComponent(events[0]?.slug || "")}">
                      Open ${esc(events[0]?.name || "")} →
                    </a>
                  </div>
                </div>
                <!-- View 2: Telemetry -->
                <div class="phone-view">
                  <div class="telemetry-item">
                    <small>ENGINE RUNTIME</small>
                    <span>Flutter 3.24 + Dart VM</span>
                  </div>
                  <div class="telemetry-item">
                    <small>FRAME BUDGET</small>
                    <span>16.6ms @ 60 FPS Locked</span>
                  </div>
                  <div class="telemetry-item">
                    <small>EDGE STATE</small>
                    <span>Riverpod + SQLite Cache</span>
                  </div>
                  <div class="telemetry-item">
                    <small>CAMPUS NODES</small>
                    <span>450+ Active Handshakes</span>
                  </div>
                </div>
                <!-- View 3: Join Mini (Verified Real Async Submission) -->
                <div class="phone-view">
                  <p style="font-size:0.75rem;color:var(--muted);margin-bottom:8px;">Fast-track membership interest:</p>
                  <form class="phone-mini-form" id="phone-mini-form">
                    <input type="text" id="pm-name" name="name" placeholder="Your Name" required>
                    <input type="email" id="pm-email" name="email" placeholder="Student Email" required>
                    <button type="submit" id="pm-submit">Submit Request</button>
                    <div class="pm-feedback" id="pm-feedback" style="display:none;font-size:0.75rem;margin-top:6px;"></div>
                  </form>
                </div>
              </div>
            </div>
            <div class="code-badge" aria-hidden="true">
              <span class="c-kw">class</span> <span class="c-type">MadGuild</span> <span class="c-kw">extends</span> <span class="c-type">StatelessWidget</span> {<br>
              &nbsp;&nbsp;<span class="c-fn">Widget</span> build(ctx) =&gt;<br>
              &nbsp;&nbsp;&nbsp;&nbsp;<span class="c-type">Ship</span>(<span class="c-str">'Code. Fun. Repeat.'</span>);<br>
              }
            </div>
          </div>
        </section>

        <!-- Ribbon -->
        <div class="marquee" aria-hidden="true">
          <div class="track">${marqueeHtml}</div>
        </div>

        <!-- Evidence Stats -->
        <section class="wrap">
          <div class="stats">
            ${site.stats.map(s => `
              <div class="stat reveal">
                <b data-count>${esc(s.value)}</b>
                <span>${esc(s.label)}</span>
              </div>
            `).join("")}
          </div>
        </section>

        <!-- Scene D: The Foundry (Interactive Hands-on Assembly) -->
        <section class="wrap foundry-section">
          <p class="eyebrow">Interactive Digital Foundry</p>
          <div class="foundry-box reveal">
            <div>
              <h2>The MAD Assembly Foundry</h2>
              <p class="lead" style="margin-bottom: 20px;">
                Drag or click all 4 modular building blocks into the docking bays to synthesize a launch-ready production build.
              </p>
              <div class="foundry-modules">
                <button type="button" class="foundry-chip" data-idx="0">
                  <span class="chip-icon">UI</span>
                  <span>UI Glass Tokens</span>
                </button>
                <button type="button" class="foundry-chip" data-idx="1">
                  <span class="chip-icon">FL</span>
                  <span>Flutter 3 Engine</span>
                </button>
                <button type="button" class="foundry-chip" data-idx="2">
                  <span class="chip-icon">ST</span>
                  <span>State Sync Bus</span>
                </button>
                <button type="button" class="foundry-chip" data-idx="3">
                  <span class="chip-icon">AI</span>
                  <span>On-Device Edge ML</span>
                </button>
              </div>
              <div style="display:flex;gap:12px;align-items:center;">
                <span class="mono-label" id="foundry-progress" style="font-size:0.8rem;color:var(--accent-text);">0 of 4 Modules Assembled</span>
                <button type="button" class="btn sm" id="foundry-auto">Auto-Assemble</button>
              </div>
              <div class="foundry-assembly-result" id="foundry-result">
                <b style="color:#34d399;display:block;margin-bottom:6px;">✦ Build Successfully Synthesized!</b>
                <p style="font-size:0.88rem;color:#e8e9f3;margin-bottom:12px;">
                  Ready to engineer apps of this caliber? Join the guild or register for <strong>${esc(nextOpen.name)}</strong>.
                </p>
                <a class="btn sm primary" href="event.html?e=${encodeURIComponent(nextOpen.slug)}">
                  Register for Next Flagship →
                </a>
              </div>
            </div>
            <div class="foundry-stage">
              <span class="mono-label" style="font-size:0.75rem;color:var(--muted);margin-bottom:16px;">MODULAR COMPILATION BAYS</span>
              <div class="foundry-bays">
                <div class="foundry-bay">Bay 01</div>
                <div class="foundry-bay">Bay 02</div>
                <div class="foundry-bay">Bay 03</div>
                <div class="foundry-bay">Bay 04</div>
              </div>
            </div>
          </div>
        </section>

        <!-- Editorial Highlights -->
        <section class="wrap">
          <p class="eyebrow">Engineering Standards</p>
          <h2>How we build at New Horizon</h2>
          <div class="big-list">${highlightsHtml}</div>
        </section>

        <!-- Flagship Events Showcase -->
        <section class="wrap">
          <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px;flex-wrap:wrap;gap:16px;">
            <div>
              <p class="eyebrow">Flagship Arenas</p>
              <h2>End-to-End Competitions</h2>
            </div>
            <a class="btn" href="events.html">View All ${events.length} Events →</a>
          </div>
          <div class="events-grid">${flagshipCardsHtml}</div>
        </section>

        <!-- Final Call to Action -->
        <section class="wrap" style="padding-bottom: clamp(60px, 8vw, 100px);">
          <div class="cta reveal">
            <h2>${esc(site.cta_title)}</h2>
            <p class="lead">${esc(site.cta_text)}</p>
            <div style="display:flex;gap:16px;flex-wrap:wrap;">
              <a class="btn primary" href="contact.html">Join MAD Club</a>
              <a class="btn" href="${esc(site.instagram)}" target="_blank" rel="noopener">Follow on Instagram</a>
            </div>
          </div>
        </section>
      `;
    },

    // 02 / EVENTS ARENA
    async events(site, events) {
      const years = [...new Set(events.map(e => semYear(e.semester)).filter(Boolean))].sort().reverse();
      const params = new URLSearchParams(location.search);
      const initialYear = years.includes(params.get("y")) ? params.get("y") : "all";

      window.__eventState = {
        events,
        year: initialYear,
        status: "all",
        query: ""
      };

      return `
        <div class="page-head wrap">
          <p class="eyebrow">Event Arena</p>
          <h1 class="reveal">Competitions & Hackathons.</h1>
          <p class="lead reveal">
            Explore 4 semesters of verified hackathons, design sprints, and upcoming registration gates.
          </p>
        </div>
        <div class="wrap tools-bar">
          <div class="search-wrap">
            <svg class="search-icon" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" fill="none" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input id="q" type="search" placeholder="Search events by title, keyword, or technology..." autocomplete="off">
          </div>
          <div class="filter-pills" id="status-filters" role="group" aria-label="Status Filter">
            <span class="mono-label" style="font-size:0.75rem;color:var(--muted);margin-right:4px;">STATUS:</span>
            <button class="chip active" data-status="all">All</button>
            <button class="chip" data-status="open">Live Registration</button>
            <button class="chip" data-status="upcoming">Upcoming</button>
            <button class="chip" data-status="completed">Completed</button>
          </div>
          <div class="filter-pills" id="year-filters" role="group" aria-label="Year Filter">
            <span class="mono-label" style="font-size:0.75rem;color:var(--muted);margin-right:4px;">SEMESTER:</span>
            <button class="chip ${initialYear === "all" ? "active" : ""}" data-y="all">All Semesters</button>
            ${years.map(y => `<button class="chip ${initialYear === y ? "active" : ""}" data-y="${y}">20${y.replace("-", "-20")}</button>`).join("")}
          </div>
          <p class="mono-label" id="event-count" style="font-size:0.85rem;color:var(--accent-text);" aria-live="polite"></p>
        </div>
        <div class="wrap" id="events-container"></div>
      `;
    },

    // 03 / EVENT DETAIL
    async event(site, events) {
      const slug = new URLSearchParams(location.search).get("e");
      const ev = events.find(x => x.slug === slug);

      if (!ev) {
        document.title = "Event Not Found | MAD Club";
        return `
          <div class="page-head wrap">
            <p class="eyebrow">404 Error</p>
            <h1>Event Not Found</h1>
            <p class="lead">The event record could not be found in our published catalogue.</p>
            <p style="margin-top:24px;"><a class="btn primary" href="events.html">Return to Event Arena</a></p>
          </div>`;
      }

      document.title = `${ev.name} | MAD Club NHCE`;
      const photos = ev.photos || [];
      const cover = photos[0] ? photoSrc(photos[0]) : (ev.poster ? photoSrc(ev.poster) : "");

      const roundsHtml = (ev.rounds && ev.rounds.length) ? `
        <div style="margin: 40px 0;">
          <p class="eyebrow">Rounds & Schedule</p>
          <h3>Competition Architecture</h3>
          <div class="timeline">
            ${ev.rounds.map(r => `
              <div class="timeline-item reveal">
                <div class="timeline-dot">${esc(r.round)}</div>
                <div class="timeline-content">
                  <div class="timeline-time">${esc(r.time || "Scheduled")}</div>
                  <h4>${esc(r.title)}</h4>
                  <p>${esc(r.summary)}</p>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      ` : "";

      const prizesHtml = (ev.prizes && ev.prizes.length) ? `
        <div style="margin: 40px 0;">
          <p class="eyebrow">Rewards & Honors</p>
          <h3>Prize Pool & Recognition</h3>
          <div class="grid" style="margin-top:20px;">
            ${ev.prizes.map(p => `
              <div class="card reveal">
                <span class="mono-label" style="color:var(--accent-text);font-size:0.8rem;text-transform:uppercase;">${esc(p.position)}</span>
                <h4 style="font-size:1.15rem;margin:8px 0;">${esc(p.reward)}</h4>
              </div>
            `).join("")}
          </div>
        </div>
      ` : "";

      const faqHtml = (ev.faq && ev.faq.length) ? `
        <div style="margin: 40px 0;">
          <p class="eyebrow">Common Queries</p>
          <h3>Frequently Asked Questions</h3>
          <div class="grid" style="margin-top:20px;">
            ${ev.faq.map(item => `
              <div class="card reveal">
                <h4 style="font-size:1.1rem;margin-bottom:8px;">${esc(item.q)}</h4>
                <p>${esc(item.a)}</p>
              </div>
            `).join("")}
          </div>
        </div>
      ` : "";

      const galleryHtml = photos.length ? `
        <div style="margin: 50px 0;">
          <p class="eyebrow">Verified Photo Documentation</p>
          <h3>Event Gallery (${photos.length} Captured Shots)</h3>
          <div class="gallery">
            ${photos.map((p, idx) => `
              <button type="button" class="shot reveal" data-src="${esc(photoSrc(p))}" data-idx="${idx}" aria-label="Expand photo ${idx + 1}">
                <img loading="lazy" decoding="async" src="${esc(photoSrc(p))}" alt="${esc(ev.name)} photo ${idx + 1}">
              </button>
            `).join("")}
          </div>
        </div>
      ` : `<div class="empty" style="margin: 40px 0;">No official photos uploaded yet for this event archive.</div>`;

      const sorted = [...events].sort((a, b) => semKey(b.semester) - semKey(a.semester));
      const curIdx = sorted.findIndex(x => x.slug === ev.slug);
      const prev = sorted[curIdx + 1];
      const next = sorted[curIdx - 1];

      return `
        <div class="wrap event-hero">
          <div class="event-hero-grid">
            <div>
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                <span class="status-badge ${ev.status}">${ev.status === "open" ? "Registration Open" : ev.status}</span>
                <span class="mono-label" style="color:var(--accent-text);">${esc(ev.semester)}</span>
              </div>
              <h1 class="reveal">${esc(ev.name)}</h1>
              <p class="lead reveal">${esc(ev.description)}</p>

              <div class="event-quick-info reveal">
                <div class="info-box">
                  <small>VENUE</small>
                  <span>${esc(ev.venue || "Falcon Auditorium / CS Labs")}</span>
                </div>
                <div class="info-box">
                  <small>CATEGORY</small>
                  <span>${esc(ev.category || "Flagship Competition")}</span>
                </div>
                <div class="info-box">
                  <small>TEAM SIZE</small>
                  <span>${esc(ev.team_size || "Solo or Teams")}</span>
                </div>
                <div class="info-box">
                  <small>ELIGIBILITY</small>
                  <span>${esc(ev.eligibility || "All NHCE Students")}</span>
                </div>
              </div>

              <div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:28px;">
                ${ev.registration_url ? `
                  <a class="btn primary" href="${esc(ev.registration_url)}">
                    Register for ${esc(ev.name)} →
                  </a>
                ` : ""}
                <a class="btn" href="events.html">← Back to All Events</a>
                <button type="button" class="btn" id="share-btn">Share Event</button>
                <span class="sr" id="share-status" aria-live="polite"></span>
              </div>
            </div>

            <div class="reveal">
              ${cover ? `
                <div style="border-radius:var(--r-card);overflow:hidden;border:1px solid var(--line);box-shadow:var(--shadow-card);">
                  <img src="${esc(cover)}" alt="${esc(ev.name)} banner" style="width:100%;height:auto;">
                </div>
              ` : `
                <div class="event-cover-art" style="border-radius:var(--r-card);aspect-ratio:16/10;border:1px solid var(--line);">
                  <div class="art-pattern"></div>
                  <span class="art-glyph">${esc(ev.name.slice(0, 2))}</span>
                </div>
              `}
            </div>
          </div>

          ${roundsHtml}
          ${prizesHtml}
          ${faqHtml}
          ${galleryHtml}

          <!-- Pagination -->
          <nav style="display:flex;justify-content:space-between;margin:50px 0 20px;border-top:1px solid var(--line);padding-top:24px;">
            ${prev ? `<a class="btn sm" href="event.html?e=${encodeURIComponent(prev.slug)}">← Older: ${esc(prev.name)}</a>` : `<span></span>`}
            ${next ? `<a class="btn sm" href="event.html?e=${encodeURIComponent(next.slug)}">Newer: ${esc(next.name)} →</a>` : `<span></span>`}
          </nav>
        </div>

        <!-- Lightbox Dialog -->
        <dialog id="lb" aria-label="Photo Viewer">
          <img src="" alt="">
          <form method="dialog" style="display:flex;justify-content:space-between;align-items:center;">
            <span id="lb-caption" style="font-family:var(--font-mono);font-size:0.8rem;color:var(--muted);"></span>
            <button class="btn sm primary">Close Viewer</button>
          </form>
        </dialog>
      `;
    },

    // 04 / ABOUT - THE MANIFESTO
    async about(site) {
      const a = site.about;
      return `
        <div class="page-head wrap">
          <p class="eyebrow">Guild Manifesto</p>
          <h1 class="reveal">Building the Builders.</h1>
          <p class="lead reveal">
            We are the Mobile App Development Club at New Horizon College of Engineering. Founded in ${esc(site.established)} to cultivate world-class software craftsmanship.
          </p>
        </div>

        <section class="wrap">
          <div class="cta reveal" style="margin-bottom:60px;">
            <p class="mono-label" style="color:var(--accent-secondary);margin-bottom:12px;">OUR CREED</p>
            <h2 style="font-size:clamp(1.6rem, 3.2vw, 2.4rem);line-height:1.3;">
              &ldquo;${esc(a.manifesto_quote || "Software is the tactile surface through which billions experience reality. We exist to master that surface.")}&rdquo;
            </h2>
          </div>

          <div class="grid">
            <div class="card reveal">
              <span class="idx">01</span>
              <h3>Who We Are</h3>
              <p>${esc(a.who)}</p>
            </div>
            <div class="card reveal">
              <span class="idx">02</span>
              <h3>Core Objective</h3>
              <p>${esc(a.objective)}</p>
            </div>
            <div class="card reveal">
              <span class="idx">03</span>
              <h3>Verified Outcomes</h3>
              <p>${esc(a.outcomes)}</p>
            </div>
          </div>
        </section>

        <!-- Learning Pipeline Workbench -->
        <section class="wrap">
          <p class="eyebrow">The 5-Phase Pipeline</p>
          <h2>How students evolve in MAD</h2>
          <div class="pipeline-workbench reveal">
            <div class="pipeline-stepper" role="tablist" aria-label="Learning Pipeline Phases">
              ${(site.learning_pipeline || []).map((p, idx) => `
                <button type="button" class="pipeline-step-btn ${idx === 0 ? "active" : ""}" role="tab" aria-selected="${idx === 0 ? "true" : "false"}" data-step="${esc(p.step)}">
                  Phase ${esc(p.step)}: ${esc(p.name)}
                </button>
              `).join("")}
            </div>
            <div class="pipeline-stage-view">
              <div class="pipeline-stage-info">
                <span id="pipeline-active-tag" class="mono-label" style="color:var(--accent-secondary);font-size:0.85rem;">${esc(site.learning_pipeline?.[0]?.tag || "Ideation & Market")}</span>
                <h3 id="pipeline-active-name" style="font-size:clamp(1.5rem, 2.5vw, 2rem);margin:10px 0 16px;">
                  01. ${esc(site.learning_pipeline?.[0]?.name || "Discover")}
                </h3>
                <p id="pipeline-active-desc" class="lead" style="font-size:1.05rem;line-height:1.65;color:var(--muted-bright);">
                  ${esc(site.learning_pipeline?.[0]?.desc || "")}
                </p>
                <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;">
                  <span class="chip" style="font-size:0.75rem;">Verified Syllabus</span>
                  <span class="chip" style="font-size:0.75rem;">Sprint-Based</span>
                  <span class="chip" style="font-size:0.75rem;">Industry Mentors</span>
                </div>
              </div>
              <div class="screen-preview" id="pipeline-preview-content">
                <!-- Injected dynamically by wireAboutPage -->
              </div>
            </div>
          </div>
        </section>

        <!-- Timeline -->
        <section class="wrap">
          <p class="eyebrow">Verifiable Milestones</p>
          <h2>Our Journey from 2023</h2>
          <div class="timeline" style="margin-top:36px;">
            ${(a.timeline || []).map(t => `
              <div class="timeline-item reveal">
                <div class="timeline-dot">✦</div>
                <div class="timeline-content">
                  <div class="timeline-time">${esc(t.year)}</div>
                  <h4>${esc(t.title)}</h4>
                  <p>${esc(t.desc)}</p>
                </div>
              </div>
            `).join("")}
          </div>
        </section>

        <!-- Committees -->
        <section class="wrap" style="padding-bottom:clamp(60px, 8vw, 100px);">
          <p class="eyebrow">Guild Governance</p>
          <h2>The Four Committees</h2>
          <div class="grid" style="margin-top:32px;">
            ${(a.committees || []).map((c, i) => `
              <div class="card reveal">
                <span class="idx">0${i + 1}</span>
                <span class="mono-label" style="color:var(--accent-text);font-size:0.75rem;display:block;margin-bottom:8px;">${esc(c.role)}</span>
                <h3>${esc(c.name)}</h3>
                <p>${esc(c.desc)}</p>
              </div>
            `).join("")}
          </div>
        </section>
      `;
    },

    // 05 / ACHIEVEMENTS - PROOF OF WORK
    async achievements() {
      const a = await loadData("achievements");
      const { events } = await loadData("events");
      const flagships = events.filter(e => e.flagship);

      return `
        <div class="page-head wrap">
          <p class="eyebrow">Proof of Work</p>
          <h1 class="reveal">Shipped Software & Impact.</h1>
          <p class="lead reveal">
            We measure our worth by installed applications, running servers, and student builders empowered.
          </p>
        </div>

        <section class="wrap">
          <div class="stats">
            ${a.stats.map(s => `
              <div class="stat reveal">
                <b data-count>${esc(s.value)}</b>
                <span>${esc(s.label)}</span>
              </div>
            `).join("")}
          </div>
        </section>

        <!-- Member Built App Case Studies -->
        <section class="wrap">
          <p class="eyebrow">Production Applications</p>
          <h2>Apps Engineered by Members</h2>
          <div style="margin-top:36px;">
            ${a.apps.map(app => `
              <div class="case-study reveal">
                <div>
                  <span class="mono-label" style="color:var(--accent-secondary);font-size:0.8rem;text-transform:uppercase;">
                    ${esc(app.category)} · ${esc(app.status)}
                  </span>
                  <h3>${esc(app.name)}</h3>
                  <p class="tagline">${esc(app.tagline || "")}</p>
                  <p style="color:var(--fg);margin-bottom:16px;">${esc(app.text)}</p>
                  <div class="tech-tags">
                    ${(app.tech || []).map(t => `<span class="tech-tag">${esc(t)}</span>`).join("")}
                  </div>
                  <ul class="feature-list">
                    ${(app.features || []).map(f => `<li>${esc(f)}</li>`).join("")}
                  </ul>
                  ${app.metrics ? `<p style="font-family:var(--font-mono);font-size:0.85rem;color:var(--accent-text);margin-top:14px;"><strong>Telemetry:</strong> ${esc(app.metrics)}</p>` : ""}
                  ${app.link ? `
                    <div style="margin-top:24px;">
                      <a class="btn sm primary" href="${esc(app.link)}" target="_blank" rel="noopener">Explore Codebase →</a>
                    </div>
                  ` : ""}
                </div>
                <div class="app-mockup-frame">
                  <div class="screen-art">
                    <span style="font-family:var(--font-mono);font-size:0.75rem;color:var(--muted);">${esc(app.name.toUpperCase())} INTERFACE</span>
                    <div style="width:80px;height:80px;border-radius:20px;background:var(--grad);display:grid;place-items:center;font-weight:800;font-size:1.6rem;color:#fff;box-shadow:0 0 30px var(--glow);">
                      ${esc(app.name.slice(0, 2))}
                    </div>
                    <span class="mono-label" style="font-size:0.75rem;color:#34d399;">● Operational Telemetry</span>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        </section>

        <!-- Flagship Events Shipped -->
        <section class="wrap" style="padding-bottom:clamp(60px, 8vw, 100px);">
          <p class="eyebrow">Flagship Milestones</p>
          <h2>Executed Campus Arenas</h2>
          <div class="events-grid" style="margin-top:32px;">
            ${flagships.map(e => `
              <div class="card reveal">
                <span class="mono-label" style="color:var(--accent-text);font-size:0.8rem;">${esc(e.semester)}</span>
                <h3 style="margin:10px 0;">${esc(e.name)}</h3>
                <p style="margin-bottom:18px;">${esc(e.description)}</p>
                <a class="btn sm" href="event.html?e=${encodeURIComponent(e.slug)}">View Recap & Photos →</a>
              </div>
            `).join("")}
          </div>
        </section>
      `;
    },

    // 06 / TEAM - THE COLLECTIVE
    async team() {
      const t = await loadData("team");
      const committees = ["All", "Leadership", "Program", "Project", "Marketing", "Review"];

      const getInitials = name =>
        name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();

      return `
        <div class="page-head wrap">
          <p class="eyebrow">The Collective</p>
          <h1 class="reveal">Architects & Leaders.</h1>
          <p class="lead reveal">
            Meet the student engineers, designers, and organizers powering the Mobile App Development Club for tenure ${esc(t.current_year)}.
          </p>
        </div>

        <div class="wrap tools-bar">
          <div class="filter-pills" id="team-filters" role="group" aria-label="Filter by Committee">
            ${committees.map(c => `
              <button class="chip ${c === "All" ? "active" : ""}" data-comm="${c.toLowerCase()}">${c}</button>
            `).join("")}
          </div>
        </div>

        <section class="wrap">
          <h2 style="font-size:1.5rem;margin-bottom:24px;">Core Team (${esc(t.current_year)})</h2>
          <div class="team-grid" id="team-members">
            ${t.current.map(p => `
              <div class="person-card reveal" data-comm="${(p.committee || "leadership").toLowerCase()}">
                <div class="person-avatar">${esc(getInitials(p.name))}</div>
                <h4>${esc(p.name)}</h4>
                <span class="p-role">${esc(p.role)}</span>
                <p class="p-bio">${esc(p.bio || "Active guild lead driving mobile software innovation at NHCE.")}</p>
                <div class="person-socials">
                  ${p.github ? `<a href="${esc(p.github)}" target="_blank" rel="noopener">GitHub</a>` : ""}
                  ${p.linkedin ? `<a href="${esc(p.linkedin)}" target="_blank" rel="noopener">LinkedIn</a>` : ""}
                </div>
              </div>
            `).join("")}
          </div>
        </section>

        <!-- Earlier Leadership Alumni -->
        <section class="wrap" style="padding-bottom:clamp(60px, 8vw, 100px);margin-top:60px;">
          <h2 style="font-size:1.5rem;margin-bottom:24px;">Founding Leadership & Alumni</h2>
          <div class="team-grid">
            ${t.earlier.map(p => `
              <div class="person-card reveal" data-comm="all">
                <div class="person-avatar" style="background:#1e293b;border-color:var(--line);">${esc(getInitials(p.name))}</div>
                <h4>${esc(p.name)}</h4>
                <span class="p-role">${esc(p.role)} (${esc(p.year)})</span>
                <p class="p-bio">${esc(p.bio || "Founding alumni member who established core club traditions.")}</p>
              </div>
            `).join("")}
          </div>
        </section>
      `;
    },

    // 07 / CONTACT & ONBOARDING
    async contact(site) {
      const c = site.contact;
      const endpoint = (c.form_endpoint || "").trim();

      return `
        <div class="page-head wrap">
          <p class="eyebrow">Connect & Onboarding</p>
          <h1 class="reveal">Join the Guild.</h1>
          <p class="lead reveal">
            Registrations open every semester for builders, designers, and project managers. Ready to build software that scales?
          </p>
        </div>

        <section class="wrap" style="padding-bottom:clamp(60px, 8vw, 100px);">
          <div class="contact-layout">
            <div>
              <div class="intent-selector" id="intent-selector">
                <button type="button" class="intent-btn active" data-intent="join">Join MAD Club</button>
                <button type="button" class="intent-btn" data-intent="register">Event Registration</button>
                <button type="button" class="intent-btn" data-intent="collaborate">Club Collaboration</button>
                <button type="button" class="intent-btn" data-intent="general">General Query</button>
              </div>

              <form action="${esc(endpoint)}" method="POST" class="form" id="contact-form">
                <input type="hidden" name="intent" id="intent-input" value="join">
                <label>
                  <span>Your Full Name</span>
                  <input name="name" required placeholder="e.g. Alex Morgan" autocomplete="name">
                </label>
                <label>
                  <span>College Email Address</span>
                  <input name="email" type="email" required placeholder="alex.cs22@nhce.edu.in" autocomplete="email">
                </label>
                <label>
                  <span>Branch & Semester / Year</span>
                  <input name="department" placeholder="e.g. CSE, 5th Semester" required>
                </label>
                <label>
                  <span>What mobile tech or ideas are you eager to build?</span>
                  <textarea name="message" rows="4" placeholder="Flutter, Kotlin, React Native, UI Design, Hackathons, or projects you'd love to ship..." required></textarea>
                </label>
                <button class="btn primary" type="submit" id="contact-submit">
                  <span>Transmit Application →</span>
                </button>
                <div class="form-feedback" id="contact-feedback"></div>
              </form>
            </div>

            <div>
              <div class="card reveal" style="margin-bottom:20px;">
                <p class="mono-label" style="color:var(--accent-text);">OFFICIAL INSTAGRAM</p>
                <h3 style="margin:8px 0;"><a href="${esc(site.instagram)}" target="_blank" rel="noopener">${esc(site.instagram_handle)}</a></h3>
                <p>Follow for live competition announcements, hackathon streams, and workshop dates.</p>
              </div>

              <div class="card reveal" style="margin-bottom:20px;">
                <p class="mono-label" style="color:var(--accent-text);">COORDINATORS</p>
                <h3 style="margin:8px 0;">Executive Desk</h3>
                <p>${esc(c.coordinators)}</p>
                ${c.email ? `<p style="margin-top:8px;"><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>` : ""}
              </div>

              <div class="card reveal">
                <p class="mono-label" style="color:var(--accent-text);">PHYSICAL BASE</p>
                <h3 style="margin:8px 0;">Campus Location</h3>
                <p>${esc(c.location || `${site.college}, Bengaluru`)}</p>
              </div>
            </div>
          </div>
        </section>
      `;
    },

    // 08 / 404 NOT FOUND
    async notfound() {
      return `
        <div class="page-head wrap">
          <p class="eyebrow">404 Error</p>
          <h1>Route Lost in Null Space.</h1>
          <p class="lead">The page or resource you requested could not be located in our navigation graph.</p>
          <div style="margin-top:32px;display:flex;gap:14px;">
            <a class="btn primary" href="index.html">Return to Home</a>
            <a class="btn" href="events.html">Browse Events</a>
          </div>
        </div>
      `;
    }
  };
  pages.index = pages.home;

  // --- Shell Setup (NavGlass & DockGlass) ---
  function shell(site, events) {
    const years = [...new Set(events.map(e => semYear(e.semester)).filter(Boolean))].sort().reverse();
    const cur = location.pathname.split("/").filter(Boolean).pop() || "index.html";
    const curRoute = normalizeRoute(cur);

    const navLinksHtml = NAV.map(([h, t]) => {
      const isCur = normalizeRoute(h) === curRoute;
      return `<li><a href="${h}"${isCur ? ' aria-current="page"' : ""}>${t}</a></li>`;
    }).join("");

    const themeBtnsHtml = SKINS.map(([k, t]) =>
      `<button type="button" data-skin="${k}" aria-pressed="${root.dataset.skin === k}">${t}</button>`
    ).join("");

    document.body.insertAdjacentHTML(
      "afterbegin",
      `<a class="skip" href="#main">Skip to content</a>
       <div class="progress" id="progress"></div>
       <canvas class="particle-canvas" id="particles" aria-hidden="true"></canvas>
       <svg style="position:absolute;width:0;height:0;overflow:hidden;" aria-hidden="true">
         <defs>
           <linearGradient id="trace-grad" x1="0%" y1="0%" x2="100%" y2="100%">
             <stop offset="0%" stop-color="#38bdf8" />
             <stop offset="50%" stop-color="#818cf8" />
             <stop offset="100%" stop-color="#c084fc" />
           </linearGradient>
         </defs>
       </svg>
       <header class="nav">
         <div class="wrap">
           <a class="brand" href="index.html">
             <img class="brand-emblem-svg" src="assets/brand/mad-emblem.svg" alt="MAD Emblem" width="32" height="32">
             <span>${esc(site.name)}</span>
             <small>${esc(site.college_short)}</small>
           </a>
           <nav class="nav-center" aria-label="Main Navigation">
             <ul class="links" id="links">${navLinksHtml}</ul>
           </nav>
           <div class="nav-actions">
             <button class="kbtn" id="open-pal" type="button" aria-label="Open Command Palette">
               <span>Search</span><kbd>Ctrl K</kbd>
             </button>
             <div class="theme-selector" role="group" aria-label="Color Theme">${themeBtnsHtml}</div>
             <button class="burger" id="burger" type="button" aria-expanded="false" aria-controls="links">Menu</button>
           </div>
         </div>
       </header>`
    );

    document.body.insertAdjacentHTML(
      "beforeend",
      `<footer>
         <div class="wrap">
           <div class="cols">
             <div>
               <p class="foot-brand">${esc(site.full_name)}</p>
               <p>${esc(site.college)} (${esc(site.college_short)}). Est. ${esc(site.established)}.</p>
               <p style="margin-top: 10px;">
                 <a href="${esc(site.instagram)}" target="_blank" rel="noopener">Instagram: ${esc(site.instagram_handle)}</a>
               </p>
               ${site.github ? `<p><a href="${esc(site.github)}" target="_blank" rel="noopener">GitHub: ${esc(site.github.replace("https://github.com/", ""))}</a></p>` : ""}
             </div>
             <div>
               <b>Explore</b>
               <ul>${NAV.map(([h, t]) => `<li><a href="${h}">${t}</a></li>`).join("")}</ul>
             </div>
             <div>
               <b>Event Archives</b>
               <ul>${years.map(y => `<li><a href="events.html?y=${esc(y)}">20${y.replace("-", "-20")}</a></li>`).join("")}</ul>
             </div>
           </div>
           <div class="legal">
             <p>&copy; ${new Date().getFullYear()} ${esc(site.full_name)}, ${esc(site.college_short)}. Code..Fun..Repeat.</p>
             <p><a href="#" id="toggle-dev-footer">Developer HUD</a> · <a href="admin/">CMS Admin</a></p>
           </div>
         </div>
       </footer>`
    );

    // Staging draft alert
    const drafts = draftKeys().map(k => k.slice(12));
    if (drafts.length) {
      document.body.insertAdjacentHTML(
        "afterbegin",
        `<div class="draft-banner" role="status">
           Viewing unpublished drafts: ${esc(drafts.join(", "))}.
           <button type="button" id="discard-drafts">Discard</button>
           <a href="admin/">Open Editor</a>
         </div>`
      );
      $("#discard-drafts")?.addEventListener("click", () => {
        draftKeys().forEach(k => { try { localStorage.removeItem(k); } catch {} });
        location.reload();
      });
    }

    // Mobile menu toggle
    const links = $("#links"), burger = $("#burger");
    const setMenu = open => {
      links.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.textContent = open ? "Close" : "Menu";
    };
    burger.onclick = () => setMenu(!links.classList.contains("open"));
    links.onclick = e => e.target.closest("a") && setMenu(false);
    document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

    $$(".theme-selector button").forEach(b => {
      b.onclick = () => setSkin(b.dataset.skin);
    });

    const prog = $("#progress");
    window.addEventListener("scroll", () => {
      const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
      prog.style.transform = `scaleX(${window.scrollY / maxScroll})`;
    }, { passive: true });

    $("#toggle-dev-footer")?.addEventListener("click", e => {
      e.preventDefault();
      toggleDevDrawer();
    });
  }

  // --- Floating Dock (DockGlass) ---
  function wireDock(site) {
    const cur = location.pathname.split("/").pop() || "index.html";
    const dockQuick = [
      ["index.html", "Home"],
      ["events.html", "Events"],
      ["about.html", "About"],
      ["team.html", "Team"],
      ["contact.html", "Join"]
    ];

    const dock = document.createElement("nav");
    dock.className = "dock";
    dock.setAttribute("aria-label", "Quick Dock Navigation");
    dock.innerHTML = `
      ${dockQuick.map(([h, t]) => `<a href="${h}"${(h === cur || (cur === "" && h === "index.html")) ? ' aria-current="page"' : ""}>${t}</a>`).join("")}
      <span class="sep" aria-hidden="true"></span>
      <button type="button" id="dock-pal" aria-label="Command Menu">Search</button>
      <button type="button" id="dock-skin" aria-label="Cycle Theme">Theme</button>
      <button type="button" id="dock-sound" aria-label="Toggle Sound Effects">${sound.enabled ? "Sound: On" : "Sound: Off"}</button>
      <button type="button" id="dock-dev" aria-label="Open Developer Mode">Dev</button>
    `;
    document.body.append(dock);

    $("#dock-pal").onclick = () => $("#open-pal")?.click();
    $("#dock-skin").onclick = () => {
      const keys = SKINS.map(s => s[0]);
      const next = keys[(keys.indexOf(root.dataset.skin) + 1) % keys.length];
      setSkin(next);
    };
    $("#dock-sound").onclick = () => {
      const on = sound.toggle();
      $("#dock-sound").textContent = on ? "Sound: On" : "Sound: Off";
    };
    $("#dock-dev").onclick = () => toggleDevDrawer();

    let lastY = window.scrollY;
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      dock.classList.toggle("tuck", y > lastY + 8 && y > 350);
      if (Math.abs(y - lastY) > 8) lastY = y;
    }, { passive: true });
  }

  // --- Command Palette (Ctrl+K / Slash) ---
  function wirePalette(site, events) {
    const d = document.createElement("dialog");
    d.className = "pal";
    d.setAttribute("aria-label", "Command Menu");
    d.innerHTML = `
      <input id="pal-input" type="text" role="combobox" aria-expanded="true" aria-controls="pal-results"
             placeholder="Type a page, flagship event, skin, or action..." autocomplete="off">
      <ul id="pal-results" role="listbox"></ul>
      <div class="pal-hint">
        <span>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate, <kbd>Enter</kbd> to select</span>
        <span><kbd>Esc</kbd> to close</span>
      </div>`;
    document.body.append(d);

    const items = [
      ...NAV.map(([h, t]) => ({ group: "Page", title: t, action: () => TransitionDirector.navigateTo(h, site, events) })),
      ...[...events].sort((a, b) => semKey(b.semester) - semKey(a.semester)).map(e => ({
        group: "Event",
        title: e.name,
        sub: `${e.semester} · ${e.category || "Event"}`,
        action: () => TransitionDirector.navigateTo(`event.html?e=${encodeURIComponent(e.slug)}`, site, events)
      })),
      ...SKINS.map(([k, t]) => ({
        group: "Theme",
        title: `Switch to ${t} Atmosphere`,
        action: () => setSkin(k)
      })),
      {
        group: "Feature",
        title: "Toggle Developer Mode HUD",
        action: () => toggleDevDrawer()
      },
      {
        group: "Audio",
        title: "Toggle Sound Microfeedback",
        action: () => {
          const on = sound.toggle();
          const btn = $("#dock-sound");
          if (btn) btn.textContent = on ? "Sound: On" : "Sound: Off";
        }
      },
      {
        group: "Social",
        title: `Visit Instagram ${site.instagram_handle}`,
        action: () => window.open(site.instagram, "_blank", "noopener")
      }
    ];

    const input = $("#pal-input", d);
    const results = $("#pal-results", d);
    let sel = 0, filtered = [];

    function renderList() {
      const q = input.value.trim().toLowerCase();
      filtered = items.filter(it => !q || `${it.title} ${it.sub || ""} ${it.group}`.toLowerCase().includes(q)).slice(0, 9);
      sel = Math.min(sel, Math.max(0, filtered.length - 1));

      results.innerHTML = filtered.map((it, idx) => `
        <li role="option" aria-selected="${idx === sel}" data-idx="${idx}">
          <div>
            <b>${esc(it.title)}</b>
            ${it.sub ? ` <small style="color:var(--muted);">${esc(it.sub)}</small>` : ""}
          </div>
          <kbd>${it.group}</kbd>
        </li>
      `).join("") || `<li class="none" style="padding:16px;color:var(--muted);">No matching commands or events</li>`;
    }

    function execute(idx) {
      const it = filtered[idx];
      if (!it) return;
      d.close();
      it.action();
    }

    input.oninput = () => { sel = 0; renderList(); };
    input.onkeydown = e => {
      if (e.key === "ArrowDown") {
        sel = (sel + 1) % Math.max(1, filtered.length);
        renderList();
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        sel = (sel - 1 + filtered.length) % Math.max(1, filtered.length);
        renderList();
        e.preventDefault();
      } else if (e.key === "Enter") {
        execute(sel);
      }
    };

    results.onclick = e => {
      const li = e.target.closest("li[data-idx]");
      if (li) execute(+li.dataset.idx);
    };

    d.addEventListener("click", e => { if (e.target === d) d.close(); });

    const openPal = () => {
      input.value = "";
      sel = 0;
      renderList();
      d.showModal();
      input.focus();
      sound.playTone(550, 0.05);
    };

    $("#open-pal")?.addEventListener("click", openPal);

    document.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        d.open ? d.close() : openPal();
      } else if (e.key === "/" && !/input|textarea/i.test(document.activeElement.tagName) && !d.open) {
        e.preventDefault();
        const searchInput = $("#q");
        if (searchInput) searchInput.focus();
        else openPal();
      } else if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        toggleDevDrawer();
      }
    });
  }

  // --- Developer Mode HUD Drawer ---
  let devDrawerEl = null;
  function initDevDrawer() {
    if (devDrawerEl) return;
    devDrawerEl = document.createElement("aside");
    devDrawerEl.className = "dev-drawer";
    devDrawerEl.setAttribute("aria-label", "Developer HUD");
    devDrawerEl.innerHTML = `
      <div class="dev-drawer-header">
        <h3>✦ MAD Developer HUD</h3>
        <button type="button" class="btn sm" id="close-dev">Close</button>
      </div>
      <div class="dev-stat-grid">
        <div class="dev-stat-box"><small>ACTIVE ROUTE</small><span id="dev-route">${document.body.dataset.page || "home"}</span></div>
        <div class="dev-stat-box"><small>ATMOSPHERE</small><span id="dev-skin">${root.dataset.skin}</span></div>
        <div class="dev-stat-box"><small>FRAME BUDGET</small><span id="dev-fps">60 FPS</span></div>
        <div class="dev-stat-box"><small>AUDIO SYNTH</small><span id="dev-sound">${sound.enabled ? "ON" : "OFF"}</span></div>
      </div>
      <h4 style="font-size:0.85rem;margin-bottom:12px;color:var(--fg-bright);">DESIGN PLAYGROUND</h4>
      <div class="dev-slider-control">
        <label><span>Glass Specular Sheen</span><span id="val-sheen">1.0</span></label>
        <input type="range" id="slide-sheen" min="0.2" max="2" step="0.1" value="1">
      </div>
      <div class="dev-slider-control">
        <label><span>Atmosphere Glow Radius</span><span id="val-glow">1.0</span></label>
        <input type="range" id="slide-glow" min="0.4" max="2.2" step="0.1" value="1">
      </div>
      <div style="margin-top:20px;display:flex;gap:10px;">
        <button type="button" class="btn sm primary" id="dev-reset">Reset Controls</button>
        <button type="button" class="btn sm" id="dev-open-cms">Decap CMS</button>
      </div>
    `;
    document.body.append(devDrawerEl);

    $("#close-dev", devDrawerEl).onclick = () => devDrawerEl.classList.remove("open");
    $("#dev-open-cms", devDrawerEl).onclick = () => (location.href = "admin/");

    const slideSheen = $("#slide-sheen", devDrawerEl);
    const slideGlow = $("#slide-glow", devDrawerEl);
    slideSheen.oninput = e => {
      $("#val-sheen").textContent = e.target.value;
      root.style.setProperty("--glass-intensity", e.target.value);
    };
    slideGlow.oninput = e => {
      $("#val-glow").textContent = e.target.value;
      root.style.setProperty("--glow-mult", e.target.value);
    };
    $("#dev-reset", devDrawerEl).onclick = () => {
      slideSheen.value = 1;
      slideGlow.value = 1;
      $("#val-sheen").textContent = "1.0";
      $("#val-glow").textContent = "1.0";
      root.style.removeProperty("--glass-intensity");
      root.style.removeProperty("--glow-mult");
    };

    let frames = 0, lastCheck = performance.now();
    function checkFps(now) {
      frames++;
      if (now > lastCheck + 1000) {
        const fps = Math.round((frames * 1000) / (now - lastCheck));
        const fpsEl = $("#dev-fps", devDrawerEl);
        if (fpsEl) fpsEl.textContent = `${fps} FPS`;
        frames = 0;
        lastCheck = now;
      }
      requestAnimationFrame(checkFps);
    }
    requestAnimationFrame(checkFps);
  }

  function toggleDevDrawer() {
    initDevDrawer();
    devDrawerEl.classList.toggle("open");
    sound.playTone(600, 0.05);
    $("#dev-skin").textContent = root.dataset.skin;
    $("#dev-sound").textContent = sound.enabled ? "ON" : "OFF";
    $("#dev-route").textContent = document.body.dataset.page || "home";
  }

  // --- Pointer Follower & Magnetic Physics ---
  function wireMotion() {
    if (reduced || !isFinePointer) return;

    document.addEventListener("pointermove", e => {
      const card = e.target.closest?.(".card, .stat, .pipeline-card, .event-card");
      if (card) {
        const r = card.getBoundingClientRect();
        const rx = ((0.5 - (e.clientY - r.top) / r.height) * 8).toFixed(2);
        const ry = (((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2);
        card.style.setProperty("--rx", `${rx}deg`);
        card.style.setProperty("--ry", `${ry}deg`);
      }

      const btn = e.target.closest?.(".btn");
      if (btn) {
        const r = btn.getBoundingClientRect();
        const tx = ((e.clientX - r.left - r.width / 2) * 0.16).toFixed(1);
        const ty = ((e.clientY - r.top - r.height / 2) * 0.22).toFixed(1);
        btn.style.setProperty("--tx", `${tx}px`);
        btn.style.setProperty("--ty", `${ty}px`);
      }
    }, { passive: true });

    document.addEventListener("pointerout", e => {
      const el = e.target.closest?.(".card, .stat, .btn, .pipeline-card, .event-card");
      if (el && !el.contains(e.relatedTarget)) {
        ["--rx", "--ry", "--tx", "--ty"].forEach(p => el.style.removeProperty(p));
      }
    });

    const dot = document.createElement("div");
    dot.className = "cursor";
    document.body.append(dot);

    let cx = 0, cy = 0, tx = 0, ty = 0, isHover = false;
    window.addEventListener("pointermove", e => {
      tx = e.clientX;
      ty = e.clientY;
      dot.classList.add("on");
      isHover = !!e.target.closest("a, button, input, textarea, select, .chip, .shot, .s-list li, .foundry-chip");
      dot.classList.toggle("big", isHover);
    }, { passive: true });

    document.addEventListener("pointerleave", () => dot.classList.remove("on"));

    function animCursor() {
      cx += (tx - cx) * 0.22;
      cy += (ty - cy) * 0.22;
      dot.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(animCursor);
    }
    requestAnimationFrame(animCursor);
  }

  // --- Main Application Bootstrapper ---
  (async function init() {
    const main = $("#main");
    try {
      const site = await loadData("site");
      const { events } = await loadData("events");

      shell(site, events);
      syncThemeColor();

      const curUrl = location.pathname.split("/").filter(Boolean).pop() || "index.html";
      const pageName = normalizeRoute(curUrl);
      document.body.dataset.page = pageName;

      const renderer = pages[pageName] || pages.notfound;
      main.innerHTML = await renderer(site, events);

      // Lightbox Handlers
      main.addEventListener("click", async e => {
        const shotBtn = e.target.closest(".shot");
        if (shotBtn) {
          const lb = $("#lb");
          if (!lb) return;
          const img = $("img", lb);
          const cap = $("#lb-caption", lb);
          img.src = shotBtn.dataset.src;
          if (cap) cap.textContent = `Photo ${+shotBtn.dataset.idx + 1}`;
          lb.showModal();
          sound.playTone(500, 0.04);
          return;
        }

        const shareBtn = e.target.closest("#share-btn");
        if (shareBtn) {
          const statusSpan = $("#share-status");
          try {
            if (navigator.share) {
              await navigator.share({ title: document.title, url: location.href });
            } else {
              await navigator.clipboard.writeText(location.href);
              if (statusSpan) statusSpan.textContent = "Link copied";
              shareBtn.textContent = "Link Copied!";
              setTimeout(() => { shareBtn.textContent = "Share Event"; }, 2000);
            }
          } catch {}
        }
      });

      // Keyboard navigation for Lightbox
      document.addEventListener("keydown", e => {
        const lb = $("#lb");
        if (!lb?.open) return;
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          const shots = $$(".shot", main);
          if (!shots.length) return;
          const currentSrc = $("img", lb).src;
          let idx = shots.findIndex(s => s.dataset.src === currentSrc);
          if (idx === -1) idx = 0;
          const nextIdx = (idx + (e.key === "ArrowRight" ? 1 : -1) + shots.length) % shots.length;
          $("img", lb).src = shots[nextIdx].dataset.src;
          const cap = $("#lb-caption", lb);
          if (cap) cap.textContent = `Photo ${nextIdx + 1} of ${shots.length}`;
        }
      });

      // Wire engines
      particleEngine.init();
      wireMotion();
      wirePalette(site, events);
      wireDock(site);
      TransitionDirector.init(site, events);

      if (pageName === "home") {
        wireLivingPhone(events);
        wireCollaborativeSwarm();
        wireTheFoundry(events);
        PhoneBuilder.init(events);
        ContainerTracer.initHomepageTraces();
      } else if (pageName === "events") {
        wireEventsArena();
      } else if (pageName === "about") {
        wireAboutPage(site);
      } else if (pageName === "team") {
        wireTeamPage();
      } else if (pageName === "contact") {
        wireContactPortal();
      }

      activateCountersAndReveals();
    } catch (err) {
      console.error("Initialization error:", err);
      const isFile = location.protocol === "file:";
      main.innerHTML = `
        <div class="wrap page-head">
          <h1>Initialization Notice</h1>
          <p class="lead">
            ${isFile ? "Please view via local server (http://localhost:3000) so that JSON content files load properly." : "An error occurred while loading content."}
          </p>
          <p style="margin-top:20px;"><button class="btn primary" onclick="location.reload()">Reload Application</button></p>
        </div>
      `;
    }
  })();
})();
