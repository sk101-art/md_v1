// Optional sound: a soft synthesized tick when a builder clicks (off by default, no audio files).
// Each role ticks at its own pitch, so a busy build sounds like a small team at work.
let ctx = null, last = 0;
const KEY = "mad_sound";
export const sound = {
  get on() { try { return localStorage.getItem(KEY) === "on"; } catch { return false; } },
  set on(v) { try { v ? localStorage.setItem(KEY, "on") : localStorage.removeItem(KEY); } catch {} if (v) this.tick(0, 0.5); },
  tick(i = 0, gain = 0.06) {
    if (!this.on || document.hidden) return;
    const now = performance.now();
    if (now - last < 45) return; // never a buzz, even when the whole crew clicks at once
    last = now;
    try {
      ctx ||= new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = "triangle";
      o.frequency.setValueAtTime(1400 + (i % 11) * 85, t);
      o.frequency.exponentialRampToValueAtTime(700 + (i % 11) * 40, t + 0.05);
      f.type = "highpass"; f.frequency.value = 500;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(gain, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      o.connect(f).connect(g).connect(ctx.destination);
      o.start(t); o.stop(t + 0.08);
    } catch {}
  }
};
