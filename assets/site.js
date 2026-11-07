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

  // --- The Particle-to-Product Choreography Engine (Section 03) ---
  // Beats: 0. Initial -> 1. Ignition -> 2. Chassis -> 3. Interface -> 4. Material -> 5. Living -> 6. Transformation
  const particleEngine = {
    canvas: null,
    ctx: null,
    particles: [],
    state: "idle",
    beat: 0,
    width: 0,
    height: 0,
    mouse: { x: -1000, y: -1000, active: false },
    running: true,
    rafId: null,

    init() {
      this.canvas = $("#particles");
      if (!this.canvas || reduced) return;
      this.ctx = this.canvas.getContext("2d");
      if (!this.ctx) return;

      this.resize();
      window.addEventListener("resize", () => this.resize(), { passive: true });
      window.addEventListener("pointermove", e => {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        this.mouse.active = true;
      }, { passive: true });
      window.addEventListener("pointerleave", () => { this.mouse.active = false; });

      document.addEventListener("visibilitychange", () => {
        this.running = !document.hidden;
        if (this.running) this.loop();
      });

      this.createParticles();
      this.startChoreography();
      this.loop();
    },

    resize() {
      this.width = this.canvas.width = window.innerWidth;
      this.height = this.canvas.height = window.innerHeight;
    },

    createParticles() {
      const count = Math.min(260, Math.floor((this.width * this.height) / 10000));
      this.particles = [];
      for (let i = 0; i < count; i++) {
        this.particles.push({
          id: i,
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          targetX: Math.random() * this.width,
          targetY: Math.random() * this.height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          baseRadius: Math.random() * 1.6 + 0.6,
          radius: Math.random() * 1.6 + 0.6,
          alpha: Math.random() * 0.45 + 0.15,
          colorType: Math.random() > 0.4 ? "accent" : "cyan",
          phase: Math.random() * Math.PI * 2
        });
      }
    },

    startChoreography() {
      // Beat 0: Initial frame (quiet cosmic dust)
      this.beat = 0;
      this.state = "idle";

      // Beat 1: Ignition after 600ms
      setTimeout(() => {
        if (this.beat === 0) {
          this.beat = 1;
          this.state = "ignition";
          this.particles.forEach(p => {
            p.vx += (Math.random() - 0.5) * 1.2;
            p.vy += (Math.random() - 0.5) * 1.2;
          });
        }
      }, 600);

      // Beat 2: Device Chassis Tracing (form phone silhouette)
      setTimeout(() => {
        if (this.beat === 1) {
          this.beat = 2;
          this.state = "chassis";
          this.projectToChassis();
        }
      }, 1600);

      // Beat 3: Interface Assembly
      setTimeout(() => {
        if (this.beat === 2) {
          this.beat = 3;
          this.state = "assembly";
          this.projectToInterface();
        }
      }, 2800);

      // Beat 4 & 5: Material Handoff to Living State
      setTimeout(() => {
        if (this.beat === 3) {
          this.beat = 4;
          this.state = "living";
          // Phone element reveals with specular sweep
          const phoneEl = $(".phone");
          if (phoneEl) {
            phoneEl.style.opacity = "1";
            phoneEl.style.filter = "drop-shadow(0 0 30px var(--glow))";
            setTimeout(() => { phoneEl.style.filter = ""; }, 800);
          }
        }
      }, 3800);
    },

    projectToChassis() {
      const stage = $(".stage");
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const pw = 280, ph = 540;
      const px = rect.left + rect.width / 2 - pw / 2;
      const py = rect.top + rect.height / 2 - ph / 2;

      this.particles.forEach((p, idx) => {
        const t = (idx / this.particles.length) * 4;
        let tx = px, ty = py;
        if (t < 1) { tx = px + t * pw; ty = py; }
        else if (t < 2) { tx = px + pw; ty = py + (t - 1) * ph; }
        else if (t < 3) { tx = px + pw - (t - 2) * pw; ty = py + ph; }
        else { tx = px; ty = py + ph - (t - 3) * ph; }

        p.targetX = tx + (Math.random() - 0.5) * 12;
        p.targetY = ty + (Math.random() - 0.5) * 12;
      });
    },

    projectToInterface() {
      const stage = $(".stage");
      if (!stage) return;
      const rect = stage.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      this.particles.forEach((p, idx) => {
        // Grid pattern inside screen
        const col = idx % 6;
        const row = Math.floor(idx / 6) % 10;
        p.targetX = cx - 110 + col * 44 + (Math.random() - 0.5) * 8;
        p.targetY = cy - 200 + row * 40 + (Math.random() - 0.5) * 8;
      });
    },

    loop() {
      if (!this.running) return;
      this.ctx.clearRect(0, 0, this.width, this.height);

      const skin = root.dataset.skin || "nebula";
      const colorAccent = skin === "aurora" ? "16, 185, 129" :
                          skin === "ocean" ? "37, 99, 235" :
                          skin === "solar" ? "245, 158, 11" : "121, 91, 255";
      const colorCyan = "103, 232, 249";

      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];

        if (this.state === "chassis" || this.state === "assembly") {
          // Guided convergence to targets
          p.x += (p.targetX - p.x) * 0.08;
          p.y += (p.targetY - p.y) * 0.08;
        } else {
          // Ambient breathing drift
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = this.width;
          if (p.x > this.width) p.x = 0;
          if (p.y < 0) p.y = this.height;
          if (p.y > this.height) p.y = 0;
        }

        // Bounded & damped pointer repulsion (Section 03)
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

        const col = p.colorType === "cyan" ? colorCyan : colorAccent;
        this.ctx.fillStyle = `rgba(${col}, ${p.alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.rafId = requestAnimationFrame(() => this.loop());
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
          this.navigateTo(href, site, events);
        }
      });

      // Browser History Back/Forward Support
      window.addEventListener("popstate", () => {
        const currentUrl = location.pathname.split("/").pop() || "index.html";
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
      const pageFile = url.split("?")[0].split("/").pop() || "index.html";
      const pageName = pageFile.replace(".html", "") || "home";
      document.body.dataset.page = pageName;

      // Update active links in nav and dock
      $$(".links a, .dock a").forEach(a => {
        const href = a.getAttribute("href");
        const isMatch = href === pageFile || (pageFile === "index.html" && href === "index.html");
        a.toggleAttribute("aria-current", isMatch);
        if (isMatch) a.setAttribute("aria-current", "page");
      });

      const main = $("#main");
      const renderer = pages[pageName] || pages.notfound;
      main.innerHTML = await renderer(site, events);

      if (scrollReset) window.scrollTo({ top: 0, behavior: "instant" });

      // Wire interactive controllers for current page
      if (pageName === "home" || pageName === "index") {
        wireLivingPhone(events);
        wireCollaborativeSwarm();
        wireTheFoundry(events);
      } else if (pageName === "events") {
        wireEventsArena();
      } else if (pageName === "team") {
        wireTeamPage();
      } else if (pageName === "contact") {
        wireContactPortal();
      }

      activateCountersAndReveals();
      syncThemeColor();
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
          </div>

          <!-- Scene B: The Living Phone (Titanium Chassis & Screen Router) -->
          <div class="stage" aria-label="Interactive Product Experience">
            <div class="phone">
              <span class="phone-vol-up"></span>
              <span class="phone-vol-down"></span>
              <span class="phone-power"></span>
              <div class="dynamic-island">
                <span class="sensor"></span>
                <span class="camera"></span>
              </div>
              <div class="screen">
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
                <!-- View 3: Join Mini -->
                <div class="phone-view">
                  <p style="font-size:0.75rem;color:var(--muted);margin-bottom:8px;">Fast-track membership interest:</p>
                  <form class="phone-mini-form" onsubmit="event.preventDefault(); this.innerHTML='<span style=\\'color:#34d399;font-size:0.75rem;\\'>✓ Transmitted to Guild Desk</span>';">
                    <input type="text" placeholder="Your Name" required>
                    <input type="email" placeholder="Student Email" required>
                    <button type="submit">Submit Request</button>
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

        <!-- Learning Pipeline -->
        <section class="wrap">
          <p class="eyebrow">The 5-Phase Pipeline</p>
          <h2>How students evolve in MAD</h2>
          <div class="pipeline-grid">
            ${(site.learning_pipeline || []).map(p => `
              <div class="pipeline-card reveal">
                <div class="p-step">${esc(p.step)}</div>
                <span class="p-tag">${esc(p.tag)}</span>
                <h4>${esc(p.name)}</h4>
                <p>${esc(p.desc)}</p>
              </div>
            `).join("")}
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

  // --- Shell Setup (NavGlass & DockGlass) ---
  function shell(site, events) {
    const years = [...new Set(events.map(e => semYear(e.semester)).filter(Boolean))].sort().reverse();
    const cur = location.pathname.split("/").pop() || "index.html";

    const navLinksHtml = NAV.map(([h, t]) => {
      const isCur = h === cur || (cur === "" && h === "index.html");
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
       <header class="nav">
         <div class="wrap">
           <a class="brand" href="index.html">
             <span class="logo-orb" aria-hidden="true"></span>
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

      const curUrl = location.pathname.split("/").pop() || "index.html";
      const pageName = curUrl.replace(".html", "") || "home";
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

      if (pageName === "home" || pageName === "index") {
        wireLivingPhone(events);
        wireCollaborativeSwarm();
        wireTheFoundry(events);
      } else if (pageName === "events") {
        wireEventsArena();
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
