/* GSAP helpers. Everything animated goes through here so reduced motion and pause work everywhere. */
(function (BSC) {
  'use strict';
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  const A = {
    get reduced() { return mq.matches || document.body.classList.contains('reduce-motion'); },
    timeline(vars) { return gsap.timeline(Object.assign({ defaults: { ease: 'power2.out' } }, vars || {})); },
    delay(t, fn) { return gsap.delayedCall(t, fn); },
    killAll() { gsap.globalTimeline.getChildren(false, true, true).forEach((t) => t.kill()); },
    pause() { gsap.globalTimeline.pause(); },
    resume() { gsap.globalTimeline.resume(); },
    /** tween → promise. Under reduced motion, movement collapses to a near-instant set. */
    to(target, vars) {
      const v = Object.assign({}, vars);
      if (A.reduced) { v.duration = Math.min(v.duration || 0.3, 0.12); delete v.stagger; v.ease = 'none'; }
      return gsap.to(target, v);
    },
    from(target, vars) {
      const v = Object.assign({}, vars);
      if (A.reduced) { v.duration = 0.12; delete v.stagger; ['x', 'y', 'rotation', 'scale'].forEach((k) => delete v[k]); }
      return gsap.from(target, v);
    },
    fromTo(target, a, b) {
      const v = Object.assign({}, b);
      if (A.reduced) { v.duration = 0.12; delete v.stagger; }
      return gsap.fromTo(target, a, v);
    },
    // ---- reusable motions ----
    pop(el) { return A.fromTo(el, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' }); },
    press(el) { if (A.reduced) return null; return gsap.fromTo(el, { scale: 0.92 }, { scale: 1, duration: 0.35, ease: 'back.out(3)' }); },
    wiggle(el) { if (A.reduced) return gsap.fromTo(el, { opacity: 0.5 }, { opacity: 1, duration: 0.2 }); return gsap.fromTo(el, { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1.2, 0.25)' }); },
    shake(el, amt = 5) { if (A.reduced) return null; return gsap.fromTo(el, { x: -amt }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.2)' }); },
    bob(el, amt = 8, dur = 1.8) { if (A.reduced) return null; return gsap.to(el, { y: -amt, duration: dur, yoyo: true, repeat: -1, ease: 'sine.inOut' }); },
    breathe(el) { if (A.reduced) return null; return gsap.to(el, { scaleY: 1.012, transformOrigin: '50% 100%', duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' }); },
    pulse(el) { if (A.reduced) return null; return gsap.to(el, { scale: 1.06, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' }); },
    /** Burst of small particles at a point inside the stage. kind: 'spark' | 'star' | 'cyan' */
    burst(x, y, kind = 'spark', count = 10) {
      if (A.reduced) return;
      const layer = document.getElementById('fx');
      for (let i = 0; i < count; i++) {
        const p = document.createElement('i'); p.className = 'p ' + kind; p.style.left = x + 'px'; p.style.top = y + 'px';
        layer.appendChild(p);
        const ang = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 70;
        gsap.fromTo(p, { x: 0, y: 0, scale: 1, opacity: 1 }, { x: Math.cos(ang) * dist, y: Math.sin(ang) * dist, scale: 0.2, opacity: 0, rotation: Math.random() * 360, duration: 0.6 + Math.random() * 0.3, ease: 'power2.out', onComplete: () => p.remove() });
      }
    },
    confetti() {
      if (A.reduced) return;
      const layer = document.getElementById('fx');
      const cols = ['#45e3ff', '#8b5cff', '#ffb547', '#3ddc97', '#ff6b8a', '#ffffff'];
      for (let i = 0; i < 70; i++) {
        const p = document.createElement('i'); p.className = 'p conf'; p.style.background = cols[i % cols.length];
        p.style.left = Math.random() * 1280 + 'px'; p.style.top = '-20px'; layer.appendChild(p);
        gsap.to(p, { y: 780 + Math.random() * 80, x: (Math.random() - 0.5) * 200, rotation: Math.random() * 720, duration: 2 + Math.random() * 1.5, delay: Math.random() * 0.6, ease: 'power1.in', onComplete: () => p.remove() });
      }
    },
    /** Centre of an element in stage coordinates. */
    centre(el) {
      const s = document.getElementById('stage').getBoundingClientRect(), r = el.getBoundingClientRect(), k = BSC.UI.scale();
      return [(r.left + r.width / 2 - s.left) / k, (r.top + r.height / 2 - s.top) / k];
    },
  };
  BSC.Anim = A;
})(window.BSC = window.BSC || {});
