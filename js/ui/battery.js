/* Battery renderer.
   The casing is artwork (circle, square, triangle PNGs) or code (rectangle with a 2:1 window, rhombus).
   The mathematical region is ALWAYS our own exact geometry, inset inside the painted window,
   so equal parts are truly equal: grids for rectangles/squares, a parallelogram grid for the
   rhombus, wedges for circles, and fan slices from the apex for triangles. */
(function (BSC) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const F = () => BSC.F;

  // Casings: natural pixel size of the (optimised) image and the exact region inside its window.
  const CASINGS = {
    circle: { img: 'assets/batteries/battery_circle.webp', w: 848, h: 900, region: { type: 'circle', cx: 424.5, cy: 484.5, r: 306 } },
    square: { img: 'assets/batteries/battery_square.webp', w: 869, h: 900, region: { type: 'grid', x: 124, y: 176.5, w: 620, h: 620 } },
    triangle: { img: 'assets/batteries/battery_triangle.webp', w: 900, h: 773, region: { type: 'fan', apex: [450.5, 178], left: [128, 694], right: [773, 694] } },
    rect: { code: 'rect', w: 900, h: 500, region: { type: 'grid', x: 125, y: 110, w: 650, h: 325 } },
    diamond: { code: 'diamond', w: 900, h: 600, region: { type: 'rhombus', L: [128, 330], T: [450, 144], B: [450, 516] } },
  };
  const SHAPE_NAMES = { rect: 'rectangle', square: 'square', circle: 'circle', triangle: 'triangle', diamond: 'diamond (rhombus)' };

  /** Choose a grid layout: columns = denominator ÷ HCF so equivalent fractions line up column for column. */
  function layout(d, n, cols) {
    if (!cols) cols = n === 0 || n === d ? d : d / F().gcd(n, d);
    let rows = d / cols;
    if (!Number.isInteger(rows)) { cols = d; rows = 1; }
    return { cols, rows };
  }

  // ---------- geometry helpers ----------
  const pt = (p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  function gridPoint(R, u, v) {
    if (R.type === 'grid') return [R.x + u * R.w, R.y + v * R.h];
    // rhombus: L + u(T-L) + v(B-L)
    return [R.L[0] + u * (R.T[0] - R.L[0]) + v * (R.B[0] - R.L[0]), R.L[1] + u * (R.T[1] - R.L[1]) + v * (R.B[1] - R.L[1])];
  }
  const quad = (R, u0, v0, u1, v1) => [gridPoint(R, u0, v0), gridPoint(R, u1, v0), gridPoint(R, u1, v1), gridPoint(R, u0, v1)];
  function circlePoint(R, t, rr) { const a = -Math.PI / 2 + 2 * Math.PI * t; const r = rr == null ? R.r : rr; return [R.cx + r * Math.cos(a), R.cy + r * Math.sin(a)]; }
  function wedgePath(R, t0, t1) {
    if (t1 - t0 >= 0.99999) return `M${R.cx - R.r},${R.cy}a${R.r},${R.r} 0 1,0 ${2 * R.r},0a${R.r},${R.r} 0 1,0 ${-2 * R.r},0Z`;
    const a = circlePoint(R, t0), b = circlePoint(R, t1);
    return `M${R.cx},${R.cy}L${pt(a)}A${R.r},${R.r} 0 ${t1 - t0 > 0.5 ? 1 : 0},1 ${pt(b)}Z`;
  }
  const basePoint = (R, t) => [R.left[0] + (R.right[0] - R.left[0]) * t, R.left[1]];

  /** Path of the region covering value v (0..1) — used for the "bot's charge" overlay. */
  function regionPath(R, v) {
    if (R.type === 'circle') return wedgePath(R, 0, v);
    if (R.type === 'fan') return `M${pt(R.apex)}L${pt(basePoint(R, 0))}L${pt(basePoint(R, v))}Z`;
    return 'M' + quad(R, 0, 0, v, 1).map(pt).join('L') + 'Z';
  }
  const outlinePath = (R) => regionPath(R, 1);

  /** Cells + partition lines for d parts. */
  function build(R, d, n, opt) {
    const cells = [], lines = [];
    const onSet = opt.on ? new Set(opt.on) : null;
    const isOn = (i) => (onSet ? onSet.has(i) : i < n);
    if (R.type === 'circle') {
      for (let k = 0; k < d; k++) cells.push({ i: k, d: wedgePath(R, k / d, (k + 1) / d), on: isOn(k), c: circlePoint(R, (k + 0.5) / d, R.r * (d > 10 ? 0.74 : 0.62)) });
      if (d > 1) for (let k = 0; k < d; k++) { const t = k / d; lines.push({ key: 'a' + t.toFixed(5), d: `M${R.cx},${R.cy}L${pt(circlePoint(R, t))}` }); }
    } else if (R.type === 'fan') {
      for (let k = 0; k < d; k++) {
        const a = basePoint(R, k / d), b = basePoint(R, (k + 1) / d);
        cells.push({ i: k, d: `M${pt(R.apex)}L${pt(a)}L${pt(b)}Z`, on: isOn(k), c: [(R.apex[0] + a[0] + b[0]) / 3, (R.apex[1] + 2 * R.left[1]) / 3 + 40] });
      }
      for (let k = 1; k < d; k++) { const t = k / d; lines.push({ key: 'f' + t.toFixed(5), d: `M${pt(R.apex)}L${pt(basePoint(R, t))}` }); }
    } else {
      const { cols, rows } = layout(d, n, opt.cols);
      for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
        const i = c * rows + r; const q = quad(R, c / cols, r / rows, (c + 1) / cols, (r + 1) / rows);
        const ctr = gridPoint(R, (c + 0.5) / cols, (r + 0.5) / rows);
        cells.push({ i, d: 'M' + q.map(pt).join('L') + 'Z', on: isOn(i), c: ctr, cw: R.type === 'grid' ? R.w / cols : 0, ch: R.type === 'grid' ? R.h / rows : 0 });
      }
      for (let c = 1; c < cols; c++) { const u = c / cols; lines.push({ key: 'u' + u.toFixed(5), d: 'M' + pt(gridPoint(R, u, 0)) + 'L' + pt(gridPoint(R, u, 1)) }); }
      for (let r = 1; r < rows; r++) { const v = r / rows; lines.push({ key: 'v' + v.toFixed(5), d: 'M' + pt(gridPoint(R, 0, v)) + 'L' + pt(gridPoint(R, 1, v)) }); }
    }
    cells.sort((a, b) => a.i - b.i);
    return { cells, lines };
  }

  // ---------- code-drawn casings (match the white/purple artwork) ----------
  function codeCasing(kind) {
    if (kind === 'rect') {
      return `<g class="casing"><rect x="400" y="14" width="100" height="52" rx="16" fill="url(#bsc-metal)" stroke="#5a3fd0" stroke-width="5"/>
        <rect x="58" y="44" width="784" height="446" rx="72" fill="url(#bsc-metal)" stroke="#2a2470" stroke-width="5"/>
        <rect x="84" y="70" width="732" height="394" rx="52" fill="#6a3cf0" />
        <rect x="100" y="86" width="700" height="362" rx="38" fill="#0e1533" stroke="#3b2fa8" stroke-width="4"/>
        <circle cx="110" cy="96" r="9" fill="#c9cde6"/><circle cx="790" cy="96" r="9" fill="#c9cde6"/><circle cx="110" cy="438" r="9" fill="#c9cde6"/><circle cx="790" cy="438" r="9" fill="#c9cde6"/></g>`;
    }
    // rhombus casing: three concentric rhombi
    const C = [450, 330];
    const rh = (hw, hh) => `M${C[0] - hw},${C[1]}L${C[0]},${C[1] - hh}L${C[0] + hw},${C[1]}L${C[0]},${C[1] + hh}Z`;
    return `<g class="casing"><rect x="410" y="6" width="80" height="50" rx="14" fill="url(#bsc-metal)" stroke="#5a3fd0" stroke-width="5"/>
      <path d="${rh(420, 290)}" fill="url(#bsc-metal)" stroke="#2a2470" stroke-width="6" stroke-linejoin="round"/>
      <path d="${rh(380, 240)}" fill="#6a3cf0" stroke-linejoin="round"/>
      <path d="${rh(352, 210)}" fill="#0e1533" stroke="#3b2fa8" stroke-width="4" stroke-linejoin="round"/></g>`;
  }

  // ---------- public API ----------
  /**
   * Create a battery element.
   * opts: shape, d, n, cols, on (indices), width (px), label (bool), num ('charged'|'all'), ghost (0..1), tap (bool)
   */
  function create(opts) {
    const el = document.createElement('div');
    el.className = 'batt';
    el.dataset.shape = opts.shape;
    const C = CASINGS[opts.shape];
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${C.w} ${C.h}`);
    svg.setAttribute('role', 'img');
    svg.innerHTML = (C.img ? `<image href="${C.img}" x="0" y="0" width="${C.w}" height="${C.h}" preserveAspectRatio="none"/>` : codeCasing(C.code)) +
      `<path class="b-window" d="${outlinePath(C.region)}"/><g class="b-cells"></g><g class="b-lines"></g><path class="b-outline" d="${outlinePath(C.region)}"/><g class="b-ghost"></g><g class="b-nums"></g>`;
    el.appendChild(svg);
    if (opts.width) el.style.width = opts.width + 'px';
    el._st = {};
    set(el, opts, { anim: 'none' });
    return el;
  }

  /** Update parts/charge. anim: 'none' | 'split' | 'join' | 'fill' */
  function set(el, opts, { anim = 'none' } = {}) {
    const st = Object.assign({}, el._st, opts);
    const C = CASINGS[st.shape], R = C.region;
    const svg = el.querySelector('svg');
    const { cells, lines } = build(R, st.d, st.n || 0, st);
    const oldKeys = new Set([...svg.querySelectorAll('.b-lines path')].map((p) => p.dataset.key));
    const oldLines = [...svg.querySelectorAll('.b-lines path')].map((p) => ({ key: p.dataset.key, d: p.getAttribute('d') }));
    const gC = svg.querySelector('.b-cells'), gL = svg.querySelector('.b-lines');
    gC.innerHTML = cells.map((c) => `<path class="cell${c.on ? ' on' : ''}${st.tap ? ' tap' : ''}" data-i="${c.i}" d="${c.d}"/>`).join('');
    gL.innerHTML = lines.map((l) => `<path data-key="${l.key}" d="${l.d}"/>`).join('');
    el._st = st; el._cells = cells;
    const charged = cells.filter((c) => c.on).length;
    svg.setAttribute('aria-label', `${SHAPE_NAMES[st.shape]} battery: ${charged} of ${st.d} equal parts charged`);
    renderNums(el, st.num || null);
    ghost(el, st.ghost == null ? null : st.ghost);
    const A = BSC.Anim;
    if (!A || anim === 'none') return null;
    const tl = A.timeline();
    if (anim === 'split') {
      const added = [...gL.querySelectorAll('path')].filter((p) => !oldKeys.has(p.dataset.key));
      added.forEach((p) => { const len = p.getTotalLength ? p.getTotalLength() : 600; p.style.strokeDasharray = len; p.style.strokeDashoffset = len; });
      tl.to(added, { strokeDashoffset: 0, duration: 0.45, stagger: 0.04, ease: 'power2.out' })
        .fromTo(gC.querySelectorAll('.cell.on'), { opacity: 0.55 }, { opacity: 1, duration: 0.25 }, '-=0.15');
    } else if (anim === 'join') {
      const newKeys = new Set(lines.map((l) => l.key));
      const gone = oldLines.filter((l) => !newKeys.has(l.key));
      gone.forEach((l) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', l.d); p.classList.add('leaving'); gL.appendChild(p); });
      const leaving = gL.querySelectorAll('.leaving');
      tl.to(leaving, { opacity: 0, duration: 0.4, ease: 'power1.in', onComplete: () => leaving.forEach((p) => p.remove()) })
        .fromTo(svg.querySelector('.b-cells'), { scale: 0.96, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.35, ease: 'back.out(3)' }, '-=0.1');
    } else if (anim === 'fill') {
      tl.fromTo(gC.querySelectorAll('.cell.on'), { opacity: 0.15 }, { opacity: 1, duration: 0.3, stagger: 0.07 });
    }
    return tl;
  }

  function renderNums(el, mode) {
    const g = el.querySelector('.b-nums'); g.innerHTML = '';
    if (!mode) return;
    const st = el._st; const C = CASINGS[st.shape];
    const big = Math.min(C.w, C.h);
    let count = 0;
    el._cells.forEach((c) => {
      if (mode === 'charged' && !c.on) return;
      count++;
      const size = Math.max(26, Math.min(64, big / (Math.sqrt(st.d) * 2.6), c.ch ? c.ch * 0.6 : 99, c.cw ? c.cw * 0.6 : 99));
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', c.c[0]); t.setAttribute('y', c.c[1]);
      t.setAttribute('font-size', size.toFixed(0));
      t.setAttribute('class', c.on ? 'num on' : 'num');
      t.textContent = mode === 'all' ? c.i + 1 : count;
      g.appendChild(t);
    });
  }
  /** Animated counting (charged first, then all). Returns a timeline. */
  function count(el, mode) {
    renderNums(el, mode);
    const nums = el.querySelectorAll('.b-nums text');
    return BSC.Anim.timeline().from(nums, { opacity: 0, scale: 0.3, transformOrigin: '50% 50%', duration: 0.22, stagger: 0.18, ease: 'back.out(3)' });
  }
  function ghost(el, v) {
    const g = el.querySelector('.b-ghost'); g.innerHTML = '';
    if (v == null) return;
    const R = CASINGS[el._st.shape].region;
    g.innerHTML = `<path class="ghost" d="${regionPath(R, v)}"/>`;
  }

  BSC.Battery = { create, set, count, ghost, layout, CASINGS, SHAPE_NAMES, regionPath };
})(window.BSC = window.BSC || {});
