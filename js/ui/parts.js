/* Reusable composed pieces: charging slot units, label plates, hand-pointer demo, counting helpers. */
(function (BSC) {
  'use strict';
  const UI = () => BSC.UI;

  const Parts = {
    /** A charging slot: battery on top of the charger art, plus a fraction label plate. */
    slot({ shape, d, n, width = 150, label = true, cols, base = true }) {
      const wrap = UI().el('div', 'slot');
      const b = BSC.Battery.create({ shape, d, n, cols, width });
      wrap.appendChild(b);
      // The fraction plate sits inside the charger's opening (as in the station artwork).
      let dock = wrap;
      if (base) {
        const cw = Math.round(width * 1.05);
        dock = UI().el('div', 'slot-dock'); dock.style.width = cw + 'px'; dock.style.setProperty('--cw', cw + 'px');
        const img = UI().el('img', 'slot-base'); img.src = 'assets/batteries/slot_charger.webp'; img.alt = ''; dock.appendChild(img);
        wrap.appendChild(dock);
      }
      const lab = UI().el('div', 'label-plate' + (label ? '' : ' dim'), label ? UI().frac(n, d) : '?');
      if (label !== null) dock.appendChild(lab);
      wrap._batt = b; wrap._label = lab;
      return wrap;
    },
    setLabel(slotEl, n, d) { slotEl._label.className = 'label-plate'; slotEl._label.innerHTML = UI().frac(n, d); BSC.Anim.pop(slotEl._label); },

    /** Animated hand that demonstrates a drag from one element towards another (not onto it). */
    async handDemo(ctx, fromEl, toEl, { reach = 0.6, times = 2 } = {}) {
      const hand = UI().el('div', 'hand', '👆'); hand.setAttribute('aria-hidden', 'true');
      document.getElementById('fx').appendChild(hand);
      const [x0, y0] = BSC.Anim.centre(fromEl), [x1, y1] = BSC.Anim.centre(toEl);
      const tx = x0 + (x1 - x0) * reach, ty = y0 + (y1 - y0) * reach;
      try {
        for (let i = 0; i < times; i++) {
          gsap.set(hand, { left: x0 - 20, top: y0 - 10, opacity: 0, scale: 1 });
          await ctx.play(gsap.timeline().to(hand, { opacity: 1, duration: 0.25 }).to(hand, { scale: 0.85, duration: 0.15 }).to(hand, { left: tx - 20, top: ty - 10, duration: 0.9, ease: 'power2.inOut' }).to(hand, { opacity: 0, duration: 0.3 }));
        }
      } finally { hand.remove(); }
    },
    /** Pulse a ring on an element to show "tap here". */
    tapHint(el) {
      el.classList.add('demo');
      const t = BSC.Anim.pulse(el);
      return () => { el.classList.remove('demo'); if (t) { t.kill(); gsap.set(el, { scale: 1 }); } };
    },
    badge(el, kind) {
      el.querySelectorAll(':scope > .badge').forEach((b) => b.remove());
      if (!kind) return;
      const b = UI().el('span', 'badge ' + kind, kind === 'ok' ? '✓' : kind === 'bad' ? '!' : '🔒');
      b.setAttribute('aria-hidden', 'true');
      el.appendChild(b); BSC.Anim.pop(b);
    },
    /** Chain like 1/2 →×2→ 2/4 */
    chain(items) {
      return `<div class="chain">${items.map((it, i) => (i ? (it.op ? `<span class="op">${it.op}</span>` : '<span class="eq">=</span>') : '') + UI().frac(it.n, it.d, 'lg')).join('')}</div>`;
    },
  };
  BSC.Parts = Parts;
})(window.BSC = window.BSC || {});
