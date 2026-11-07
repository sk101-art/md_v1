// Route-scoped lifecycle: everything a page starts is registered here and
// torn down on route exit, so no timers, loops, listeners or timelines leak.
export class Scope {
  constructor(name = "scope") {
    this.name = name;
    this.alive = true;
    this._d = [];
  }
  add(fn) { if (this.alive) this._d.push(fn); else fn(); return fn; }
  timeout(fn, ms) { const id = setTimeout(() => this.alive && fn(), ms); this.add(() => clearTimeout(id)); return id; }
  interval(fn, ms) { const id = setInterval(() => this.alive && fn(), ms); this.add(() => clearInterval(id)); return id; }
  raf(fn) {
    let id = 0;
    const loop = t => { if (!this.alive) return; if (fn(t) !== false) id = requestAnimationFrame(loop); };
    id = requestAnimationFrame(loop);
    this.add(() => cancelAnimationFrame(id));
  }
  on(target, type, fn, opts) { target.addEventListener(type, fn, opts); this.add(() => target.removeEventListener(type, fn, opts)); }
  observe(observer) { this.add(() => observer.disconnect()); return observer; }
  tween(t) { this.add(() => t && t.kill && t.kill()); return t; }
  child(name) { const c = new Scope(name); this.add(() => c.dispose()); return c; }
  dispose() {
    if (!this.alive) return;
    this.alive = false;
    const d = this._d.splice(0).reverse();
    for (const fn of d) { try { fn(); } catch (e) { console.warn("[lifecycle]", this.name, e); } }
  }
}
