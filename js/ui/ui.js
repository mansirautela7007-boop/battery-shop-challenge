/* Shared UI: stage scaling, HUD, buttons, feedback strip, fraction entry, modals. All text is HTML (editable, readable). */
(function (BSC) {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const W = 1280, H = 720;
  let k = 1;

  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  const frac = (n, d, cls = '') => `<span class="fr ${cls}" role="math" aria-label="${n} over ${d}"><b>${n}</b><i>${d}</i></span>`;
  /** Turn "3/4" inside a sentence into stacked fractions. */
  const fmt = (s) => String(s).replace(/(\d+|\?)\/(\d+|\?)/g, (m, a, b) => frac(a, b, 'in'));

  function fit() {
    const vw = window.innerWidth, vh = window.innerHeight;
    k = Math.min(vw / W, vh / H);
    const stage = $('#stage');
    stage.style.transform = `translate(-50%, -50%) scale(${k})`;
    document.body.classList.toggle('portrait', vh > vw && vw < 820);
  }

  const UI = {
    $, $$, el, frac, fmt, W, H,
    scale: () => k,
    fit,
    world: () => $('#world'),
    setBg(name, { tint = null } = {}) {
      const bg = $('#bg');
      bg.style.backgroundImage = name ? `url(assets/bg/${name}.webp)` : 'none';
      bg.dataset.tint = tint || '';
      gsap.fromTo(bg, { opacity: 0.4 }, { opacity: 1, duration: BSC.Anim.reduced ? 0.1 : 0.6 });
    },
    resetStage() {
      $('#world').innerHTML = '';
      $('#fx').innerHTML = '';
      UI.feedback(null);
      UI.actions([]);
      UI.hud.setHint(null);
      UI.hud.progress(0, 0);
      BSC.Dialog.hide();
      UI.closeModal();
    },

    /** One button. variant: primary | secondary | ghost | tool | choice */
    button(label, { variant = 'secondary', onClick, id, aria, disabled } = {}) {
      const b = el('button', `btn ${variant}`, label);
      b.type = 'button';
      if (id) b.id = id;
      if (aria) b.setAttribute('aria-label', aria);
      if (disabled) b.disabled = true;
      if (onClick) b.addEventListener('click', (e) => { if (BSC.Game.busy || BSC.Game.paused) return; BSC.Audio.play('tap'); BSC.Anim.press(b); onClick(e); });
      return b;
    },
    /** Bottom-right action bar: keep ONE primary. */
    actions(list) {
      const bar = $('#actions'); bar.innerHTML = '';
      list.forEach((spec) => bar.appendChild(spec instanceof HTMLElement ? spec : UI.button(spec.label, spec)));
      return bar;
    },
    /** Transient feedback strip at the top of the task area (separate from the standing question). */
    feedback(kind, html) {
      const f = $('#feedback');
      if (!kind) { f.innerHTML = ''; f.className = ''; return; }
      const icon = { ok: '✓', bad: '!', hint: '?', info: 'i', warn: '!' }[kind] || '';
      f.className = 'show ' + kind;
      f.innerHTML = `<span class="ic" aria-hidden="true">${icon}</span><span class="tx">${fmt(html)}</span>`;
      BSC.Anim.fromTo(f, { y: -12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
      if (kind === 'ok') BSC.Audio.play('ok');
      if (kind === 'bad') BSC.Audio.play('wrong');
    },

    /** Fraction entry: two boxes + number tiles. onCheck(top, bottom, api). Changing anything clears feedback. */
    entry(host, { max = 12, onCheck, label = '', checkLabel = 'Check' }) {
      let v = [null, null], f = 0, locked = false;
      host.innerHTML = '';
      const wrap = el('div', 'entry');
      wrap.innerHTML = `${label ? `<div class="entry-label">${fmt(label)}</div>` : ''}
        <div class="entry-row"><div class="ebox"><button type="button" class="eb" data-k="0" aria-label="Top number (charged parts)">?</button><span class="ebar"></span><button type="button" class="eb" data-k="1" aria-label="Bottom number (all parts)">?</button></div>
        <div class="tiles">${Array.from({ length: max }, (_, i) => `<button type="button" class="tile" data-t="${i + 1}">${i + 1}</button>`).join('')}</div></div>`;
      host.appendChild(wrap);
      const boxes = $$('.eb', wrap);
      const paint = () => {
        boxes.forEach((b, i) => { b.textContent = v[i] == null ? '?' : v[i]; b.classList.toggle('filled', v[i] != null); b.classList.toggle('focus', i === f && !locked); b.classList.remove('bad'); });
        UI.actions([{ label: checkLabel, variant: 'primary', disabled: locked || v[0] == null || v[1] == null, onClick: () => onCheck(v[0], v[1], api) }]);
      };
      boxes.forEach((b) => b.addEventListener('click', () => { if (locked) return; f = +b.dataset.k; BSC.Audio.play('tap'); paint(); }));
      $$('.tile', wrap).forEach((t) => t.addEventListener('click', () => {
        if (locked || BSC.Game.busy) return;
        BSC.Audio.play('tap'); BSC.Anim.press(t);
        v[f] = +t.dataset.t; UI.feedback(null);
        f = v[0] == null ? 0 : v[1] == null ? 1 : f; paint();
      }));
      const api = {
        mark(i) { boxes[i].classList.add('bad'); BSC.Anim.wiggle(boxes[i]); },
        clear(i) { v[i] = null; f = i; paint(); },
        done() { locked = true; boxes.forEach((b) => b.classList.add('good')); $$('.tile', wrap).forEach((t) => (t.disabled = true)); UI.actions([]); },
        el: wrap,
      };
      paint();
      return api;
    },

    modal(html, buttons = []) {
      const m = $('#modal');
      m.innerHTML = `<div class="card" role="dialog" aria-modal="true">${html}<div class="modal-actions"></div></div>`;
      const bar = $('.modal-actions', m);
      buttons.forEach((b) => { const btn = el('button', `btn ${b.variant || 'secondary'}`, b.label); btn.type = 'button'; btn.addEventListener('click', () => { BSC.Audio.play('tap'); b.onClick(); }); bar.appendChild(btn); });
      m.hidden = false;
      const first = $('.btn.primary', m) || $('.btn', m); if (first) first.focus();
      return m;
    },
    closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; },

    hud: {
      build() {
        const hud = $('#hud');
        hud.innerHTML = `<button type="button" class="hbtn" id="hud-home" aria-label="Levels">☰ <span>Levels</span></button>
          <div class="hud-title"><span class="chip" id="hud-level"></span><span id="hud-name"></span></div>
          <div class="hud-progress" id="hud-progress" aria-label="Progress"></div>
          <button type="button" class="hbtn hint" id="hud-hint" hidden aria-label="Hint">💡 <span>Hint</span></button>
          <button type="button" class="hbtn icon" id="hud-sound" aria-label="Sound"></button>
          <button type="button" class="hbtn icon" id="hud-pause" aria-label="Pause">❚❚</button>`;
        $('#hud-home').addEventListener('click', () => { BSC.Audio.play('tap'); BSC.Game.go('levels'); });
        $('#hud-pause').addEventListener('click', () => { BSC.Audio.play('tap'); BSC.Pause.open(); });
        $('#hud-sound').addEventListener('click', () => { const s = BSC.Store.get().settings; BSC.Audio.setSound(!s.sound); UI.hud.sound(); BSC.Audio.play('tap'); });
        $('#hud-hint').addEventListener('click', () => { if (UI.hud._hint && !BSC.Game.busy) { BSC.Audio.play('tap'); UI.hud._hint(); } });
        UI.hud.sound();
      },
      sound() { const on = BSC.Store.get().settings.sound; const b = $('#hud-sound'); b.textContent = on ? '🔊' : '🔇'; b.setAttribute('aria-label', on ? 'Sound on' : 'Sound off'); },
      update(id) {
        const hud = $('#hud');
        const flow = BSC.Game.FLOW.find((f) => f.id === id);
        hud.hidden = !flow;
        if (!flow) return;
        $('#hud-level').textContent = `Level ${flow.level}`;
        $('#hud-name').textContent = flow.label;
      },
      progress(i, n) {
        const p = $('#hud-progress'); if (!p) return;
        p.innerHTML = n ? Array.from({ length: n }, (_, j) => `<i class="${j < i ? 'on' : ''}${j === i ? ' cur' : ''}"></i>`).join('') + `<span class="sr">${i} of ${n} done</span>` : '';
      },
      setHint(fn) { UI.hud._hint = fn; const b = $('#hud-hint'); if (b) b.hidden = !fn; },
    },
  };
  BSC.UI = UI;
})(window.BSC = window.BSC || {});
