/* Dialogue panel (bottom of the stage) + on-stage actors with pose swaps. */
(function (BSC) {
  'use strict';
  const UI = () => BSC.UI;

  // Which image + crop to use for the round portrait in the dialogue panel.
  const PORTRAIT = {
    Ira: { img: 'chars/ira_talk', size: '330%', pos: '50% 3%' },
    Byte: { img: 'chars/byte_hover', size: '150%', pos: '50% 18%' },
    Duster: { img: 'chars/duster_explain', size: '320%', pos: '52% 2%', holo: true },
    Zip: { img: 'chars/bot_zip_neutral', size: '260%', pos: '50% 4%' },
    Bolt: { img: 'chars/bot_bolt_neutral', size: '230%', pos: '50% 10%' },
    Volt: { img: 'chars/bot_volt_neutral', size: '230%', pos: '50% 8%' },
    Pixel: { img: 'chars/bot_pixel_neutral', size: '260%', pos: '50% 4%' },
    Spark: { img: 'chars/bot_spark_neutral', size: '260%', pos: '50% 4%' },
    Gizmo: { img: 'chars/bot_gizmo_neutral', size: '250%', pos: '50% 5%' },
    Rivet: { img: 'chars/bot_rivet_neutral', size: '250%', pos: '50% 5%' },
    Nova: { img: 'chars/bot_nova_neutral', size: '260%', pos: '50% 4%' },
    Bot: { img: 'chars/bot_gizmo_neutral', size: '250%', pos: '50% 5%' },
  };
  const NAMES = { Duster: 'Professor Duster', Narrator: 'Narrator' };

  let resolver = null;
  const Dialog = {
    /** Show a line. wait:false → instruction mode (no Next button). Returns a promise for Next. */
    say(who, text, { wait = true, next = 'Next', actor = null, pose = null } = {}) {
      const d = document.getElementById('dialog');
      const p = PORTRAIT[who];
      d.hidden = false;
      d.className = 'who-' + who.toLowerCase() + (wait ? '' : ' instr');
      d.innerHTML = `<div class="portrait${p && p.holo ? ' holo' : ''}" aria-hidden="true" style="${p ? `background-image:url(assets/${p.img}.webp);background-size:${p.size};background-position:${p.pos}` : ''}">${p ? '' : '<span class="narr">✦</span>'}</div>
        <div class="bubble"><div class="name">${NAMES[who] || who}</div><div class="text" aria-live="polite">${UI().fmt(text)}</div></div>
        ${wait ? `<button type="button" class="btn primary next" id="dlg-next">${next} ▸</button>` : ''}`;
      BSC.Anim.fromTo(d.querySelector('.bubble'), { y: 10, opacity: 0.2 }, { y: 0, opacity: 1, duration: 0.28 });
      if (actor) BSC.Cast.talk(actor, pose);
      BSC.Audio.voice(who, text);
      if (resolver) { const r = resolver; resolver = null; r(); }
      if (!wait) return Promise.resolve();
      return new Promise((res) => {
        resolver = res;
        const b = document.getElementById('dlg-next');
        b.addEventListener('click', () => { if (BSC.Game.paused) return; BSC.Audio.play('tap'); const r = resolver; resolver = null; if (r) r(); });
        if (!BSC.Anim.reduced) BSC.Anim.fromTo(b, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, delay: 0.25, ease: 'back.out(2)' });
        setTimeout(() => { if (document.activeElement === document.body || !document.activeElement) b.focus({ preventScroll: true }); }, 50);
      });
    },
    hide() { const d = document.getElementById('dialog'); d.hidden = true; d.innerHTML = ''; resolver = null; BSC.Audio.stopVoice(); },
  };

  // ---------------- Cast: actors on stage ----------------
  // Poses that exist as files. Missing combos fall back gracefully (e.g. Zip/Volt have no "happy" image).
  const POSES = {
    ira: ['idle', 'talk', 'point', 'think', 'console', 'handover', 'cheer', 'wave'],
    byte: ['hover', 'scan', 'whistle', 'worried', 'confused', 'nod', 'point', 'cheer', 'oops'],
    duster: ['explain', 'point', 'wave'],
  };
  const BOTS = ['zip', 'bolt', 'volt', 'pixel', 'spark', 'gizmo', 'rivet', 'nova'];
  const BOT_HAPPY = ['bolt', 'pixel', 'spark', 'gizmo', 'rivet', 'nova'];
  function src(char, pose) {
    if (BOTS.includes(char)) return `assets/chars/bot_${char}_${pose === 'happy' && BOT_HAPPY.includes(char) ? 'happy' : 'neutral'}.webp`;
    const list = POSES[char] || []; const p = list.includes(pose) ? pose : list[0];
    return `assets/chars/${char}_${p}.webp`;
  }
  // Fraction of the bot image (cropped art) where the blank chest screen sits: [x0,y0,x1,y1] (from pixel analysis).
  const SCREEN = {
    zip: { neutral: [0.318, 0.293, 0.727, 0.579] },
    bolt: { neutral: [0.323, 0.36, 0.733, 0.663], happy: [0.361, 0.359, 0.689, 0.647] },
    volt: { neutral: [0.304, 0.394, 0.721, 0.691] },
    pixel: { neutral: [0.34, 0.296, 0.718, 0.569], happy: [0.381, 0.296, 0.656, 0.569] },
    spark: { neutral: [0.337, 0.3, 0.703, 0.56], happy: [0.378, 0.303, 0.655, 0.564] },
    gizmo: { neutral: [0.326, 0.333, 0.72, 0.62], happy: [0.394, 0.333, 0.704, 0.607] },
    rivet: { neutral: [0.332, 0.329, 0.698, 0.609], happy: [0.35, 0.327, 0.674, 0.601] },
    nova: { neutral: [0.346, 0.327, 0.693, 0.569], happy: [0.378, 0.326, 0.642, 0.561] },
  };
  function placeChest(a) {
    const c = a.el.querySelector('.chest'); if (!c) return;
    const set = SCREEN[a.char]; const sc = (a.pose === 'happy' && set.happy) || set.neutral;
    c.style.cssText = `left:${sc[0] * 100}%;top:${sc[1] * 100}%;width:${(sc[2] - sc[0]) * 100}%;height:${(sc[3] - sc[1]) * 100}%`;
  }

  const actors = {};
  const Cast = {
    BOTS, src,
    /** Place an actor. x = centre in stage px, bottom = px from stage bottom, h = height px. */
    add(id, { char, pose, x, bottom = 150, h = 420, flip = false, holo = false, parent = null, cls = '' }) {
      const a = document.createElement('div');
      a.className = `actor ${holo || char === 'duster' ? 'holo' : ''} ${cls}`;
      a.style.cssText = `left:${x}px;bottom:${bottom}px;height:${h}px;`;
      a.innerHTML = `<div class="flip"${flip ? ' style="transform:scaleX(-1)"' : ''}><img alt="" src="${src(char, pose)}"></div>`;
      if (BOTS.includes(char)) {
        const s = document.createElement('div'); s.className = 'chest';
        a.querySelector('.flip').appendChild(s);
        a.classList.add('bot');
      }
      (parent || BSC.UI.world()).appendChild(a);
      gsap.set(a, { xPercent: -50 });
      actors[id] = { el: a, char, pose };
      placeChest(actors[id]);
      return a;
    },
    get(id) { return actors[id] && actors[id].el; },
    /** Write an order on a bot's chest screen (HTML, e.g. a fraction). */
    screen(id, html) { const a = actors[id]; if (!a) return; const c = a.el.querySelector('.chest'); if (c) c.innerHTML = html; },
    pose(id, pose) {
      const a = actors[id]; if (!a || a.pose === pose) return null;
      a.pose = pose; const img = a.el.querySelector('img');
      if (BSC.Anim.reduced) { img.src = src(a.char, pose); placeChest(a); return null; }
      return gsap.timeline()
        .to(img, { scaleY: 0.94, scaleX: 1.04, transformOrigin: '50% 100%', duration: 0.08 })
        .add(() => { img.src = src(a.char, pose); placeChest(a); })
        .to(img, { scaleY: 1, scaleX: 1, duration: 0.35, ease: 'back.out(3)' });
    },
    enter(id, from = 'fade') {
      const a = actors[id]; if (!a) return null; const el = a.el;
      if (from === 'holo') { BSC.Audio.play('holo'); return BSC.Anim.fromTo(el, { opacity: 0, scaleY: 0.2, transformOrigin: '50% 100%' }, { opacity: 1, scaleY: 1, duration: 0.7, ease: 'back.out(1.4)' }); }
      if (from === 'left' || from === 'right') return BSC.Anim.from(el, { x: from === 'left' ? -500 : 500, opacity: 0, duration: 0.7, ease: 'power3.out' });
      if (from === 'up') return BSC.Anim.from(el, { y: 60, opacity: 0, duration: 0.5, ease: 'back.out(2)' });
      return BSC.Anim.from(el, { opacity: 0, duration: 0.4 });
    },
    exit(id, to = 'fade') {
      const a = actors[id]; if (!a) return null; const el = a.el;
      const vars = to === 'holo' ? { opacity: 0, scaleY: 0.1, transformOrigin: '50% 100%', duration: 0.5 } : to === 'right' ? { x: 600, opacity: 0, duration: 0.7, ease: 'power2.in' } : to === 'left' ? { x: -600, opacity: 0, duration: 0.7, ease: 'power2.in' } : { opacity: 0, duration: 0.35 };
      delete actors[id];
      return BSC.Anim.to(el, Object.assign(vars, { onComplete: () => el.remove() }));
    },
    /** Short reaction while speaking, optionally switching pose. */
    talk(id, pose) { if (pose) Cast.pose(id, pose); const a = actors[id]; if (!a || BSC.Anim.reduced) return; gsap.fromTo(a.el.querySelector('.flip'), { y: 0 }, { y: -6, duration: 0.18, yoyo: true, repeat: 1, ease: 'sine.out' }); },
    hop(id) { const a = actors[id]; if (!a || BSC.Anim.reduced) return null; return gsap.fromTo(a.el.querySelector('.flip'), { y: 0 }, { y: -26, duration: 0.22, yoyo: true, repeat: 1, ease: 'power2.out' }); },
    idle(id) { const a = actors[id]; if (!a) return; if (a.char === 'byte' || a.char === 'duster' || a.char === 'rivet') BSC.Anim.bob(a.el.querySelector('img'), 7, 1.6); else BSC.Anim.breathe(a.el.querySelector('img')); },
    clear() { Object.keys(actors).forEach((k) => delete actors[k]); },
  };

  BSC.Dialog = Dialog;
  BSC.Cast = Cast;
})(window.BSC = window.BSC || {});
