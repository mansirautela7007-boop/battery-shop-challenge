/* Scene router + explicit game state. Each scene is an async function that receives a context.
   Changing scene bumps a token: every await inside the old scene rejects with Abort, so
   stale timers and animations can never act on the new screen. */
(function (BSC) {
  'use strict';
  class Abort extends Error { constructor() { super('scene-aborted'); this.abort = true; } }

  // The learner's journey, in order. Level = which of the three levels a scene belongs to.
  const FLOW = [
    { id: 'prologue', level: 1, label: 'Story: the crowded slot' },
    { id: 'l1learn', level: 1, label: 'Learn: cut and join' },
    { id: 'l1game', level: 1, label: 'Play: charge the bots' },
    { id: 'shopIntro', level: 2, label: 'Story: out of stock' },
    { id: 'l2learn', level: 2, label: 'Learn: the Merger' },
    { id: 'l2game', level: 2, label: 'Play: the gate maze' },
    { id: 'gateIntro', level: 3, label: 'Story: the long trip' },
    { id: 'l3learn', level: 3, label: 'Learn: same pieces first' },
    { id: 'l3game', level: 3, label: 'Play: who takes the trip?' },
    { id: 'finale', level: 3, label: 'Ending' },
  ];
  const LEVEL_START = { 1: 'prologue', 2: 'shopIntro', 3: 'gateIntro' };

  const Game = {
    FLOW, LEVEL_START, Abort,
    state: 'boot',        // boot | title | levels | scene | paused
    sceneId: null,
    token: 0,
    busy: false,
    paused: false,

    nextOf(id) { const i = FLOW.findIndex((f) => f.id === id); return i >= 0 && i < FLOW.length - 1 ? FLOW[i + 1].id : null; },
    levelOf(id) { const f = FLOW.find((x) => x.id === id); return f ? f.level : 0; },

    go(id, params = {}) {
      Game.token++;
      Game.busy = false;
      Game.sceneId = id;
      document.body.classList.remove('busy');
      if (BSC.Anim) BSC.Anim.killAll();
      BSC.UI.resetStage();
      BSC.Anim.fromTo('#world', { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power1.out' });
      const scene = BSC.Scenes[id];
      if (!scene) { console.error('Unknown scene', id); return; }
      Game.state = ['title', 'levels'].includes(id) ? id : 'scene';
      if (Game.state === 'scene') BSC.Store.setResume(id, params.step || 0);
      BSC.UI.hud.update(id);
      const ctx = new Context(Game.token, id);
      Promise.resolve()
        .then(() => scene(ctx, params))
        .catch((e) => { if (!(e && e.abort)) console.error(e); });
    },
  };

  class Context {
    constructor(token, id) { this.token = token; this.id = id; }
    get alive() { return this.token === Game.token; }
    check() { if (!this.alive) throw new Abort(); }

    /** Pausable, abortable wait (GSAP clock, so Pause freezes it). */
    wait(seconds) {
      return new Promise((resolve, reject) => {
        if (!this.alive) return reject(new Abort());
        const t = BSC.Anim.reduced ? Math.min(seconds, 0.25) : seconds;
        BSC.Anim.delay(t, () => (this.alive ? resolve() : reject(new Abort())));
      });
    }
    /** Await a GSAP timeline/tween (or a promise) and abort if the scene changed meanwhile. */
    async play(anim) { if (anim && anim.then) await anim; this.check(); }

    /** Dialogue. wait=true shows a Next button and resolves on press. */
    async say(who, text, opts = {}) {
      this.check();
      const auto = this.auto && opts.wait !== false;
      const p = BSC.Dialog.say(who, text, Object.assign({}, opts, auto ? { auto: true, float: !!opts.actor && this.float !== false } : {}));
      if (opts.wait === false) return;
      if (!auto) { await p; this.check(); return; }
      // Continuous scene (ctx.auto, used by the story): no Next. Move on when the voice ends, or after a reading pause.
      const spoken = await BSC.Dialog.voiceDone; this.check();
      const words = String(text).split(/\s+/).length;
      await this.hold(spoken ? 0.6 : Math.max(2.2, 1.2 + words * 0.32));
    }
    /** Like wait(), but never shortened by Calm motion (used for reading time). */
    hold(seconds) {
      return new Promise((resolve, reject) => {
        if (!this.alive) return reject(new Abort());
        BSC.Anim.delay(seconds, () => (this.alive ? resolve() : reject(new Abort())));
      });
    }
    /** Resolve when the user activates el (one time). */
    tap(el) {
      return new Promise((resolve, reject) => {
        const h = (e) => { if (!this.alive) return reject(new Abort()); if (Game.busy) return; el.removeEventListener('click', h); resolve(e); };
        el.addEventListener('click', h);
      });
    }
    /** Click handler that ignores input while an animation holds the lock or the scene has changed. */
    on(el, type, fn) {
      el.addEventListener(type, (e) => { if (!this.alive || Game.busy || Game.paused) return; fn(e); });
    }
    /** Run an animated sequence with input locked; repeated taps are ignored until it ends. */
    async lock(fn) {
      Game.busy = true; document.body.classList.add('busy');
      try { return await fn(); } finally { if (this.alive) { Game.busy = false; document.body.classList.remove('busy'); } }
    }
    save(step) { BSC.Store.setResume(this.id, step); }
    next(params) { this.check(); const n = Game.nextOf(this.id); if (n) Game.go(n, params); }
  }

  BSC.Game = Game;
  BSC.Scenes = BSC.Scenes || {};
})(window.BSC = window.BSC || {});
