/* Level 2 — Simplest form.
   Learn (Level 2_Draft 2, beats 1–17: the Merger, HCF, shading) then Play (8 orders: gate maze → battery shop). */
(function (BSC) {
  'use strict';
  const { UI, Cast, Anim, Parts, Battery, F, Game, Levels, Learn } = BSC;

  /** Vertical charge bar (artwork frame, exact fill drawn in code). */
  function chargeBar(value, label) {
    const w = UI.el('div'); w.style.cssText = 'position:relative;width:62px;height:198px;display:grid;justify-items:center;';
    w.innerHTML = `<img src="assets/batteries/charge_bar_frame.webp" alt="" style="width:62px;height:198px;position:absolute;inset:0">
      <div class="cbfill" style="position:absolute;left:23.8%;right:24.1%;bottom:10.2%;height:78.2%;transform-origin:50% 100%;transform:scaleY(${value});background:linear-gradient(180deg,#9ef6ff,#45e3ff 55%,#1fb6e6);border-radius:6px;box-shadow:0 0 12px rgba(69,227,255,.6)"></div>
      ${label ? `<div style="position:absolute;top:204px;white-space:nowrap;font-family:var(--f-display);font-weight:700;font-size:17px;color:var(--muted)">${label}</div>` : ''}`;
    w._set = (v) => Anim.to(w.querySelector('.cbfill'), { scaleY: v, duration: 0.5 });
    return w;
  }

  // ------------------------------------------------------------ Level 2 Learn
  BSC.Scenes.l2learn = async function (ctx, params) {
    ctx.auto = true; // no Next buttons in the lesson: lines move on after the voice
    UI.setBg('bg_level2', { tint: 'faded' });
    Learn.teacher();
    const steps = [
      // Beats 1–7: the Merger on 8/12
      async (ctx) => {
        const a = Learn.area(130); const r = Learn.row(a, 30);
        const box = Learn.big(r, { shape: 'rect', d: 12, n: 8, width: 300 });
        const tb = Learn.toolbox(r, 'The Merger', 'tool_merger', ['÷2']);
        const shop = UI.el('div'); shop.style.cssText = 'display:grid;justify-items:center;gap:6px;min-width:250px;'; r.appendChild(shop);
        await ctx.say('Ira', 'Let’s join the small pieces into bigger ones. Tap ÷2.', { wait: false, actor: 'ira', pose: 'point' });
        let stop = Parts.tapHint(tb._btns[0]);
        await ctx.tap(tb._btns[0]); stop();
        await ctx.lock(() => BSC.L1Anim.joinAnim(ctx, box._b, { d: 6, n: 4 }));
        Learn.relabel(box, 4, 6);
        shop.innerHTML = '<span class="chip">Shop battery: 6 pieces</span>';
        const s6 = Battery.create({ shape: 'rect', d: 6, n: 4, width: 220 }); shop.appendChild(s6);
        await ctx.play(Anim.from(shop, { x: 160, opacity: 0, duration: 0.5 })); Parts.badge(shop, 'ok'); BSC.Audio.play('ok');
        await ctx.say('Ira', 'The pieces are bigger now, but the charge is the same. 4/6 matches! But can the pieces get even bigger?', { wait: false, actor: 'ira' });
        stop = Parts.tapHint(tb._btns[0]);
        await ctx.tap(tb._btns[0]); stop();
        await ctx.lock(() => BSC.L1Anim.joinAnim(ctx, box._b, { d: 3, n: 2 }));
        Learn.relabel(box, 2, 3);
        // ÷2 and ÷3 both fail on 2/3
        const t3 = UI.el('button', 'tool', '÷3'); t3.type = 'button'; tb._btns[0].after(t3);
        await ctx.say('Ira', 'Look! The pieces are even bigger now. Can we join them again? Try ÷2 or ÷3.', { wait: false, actor: 'ira' });
        const k = await Promise.race([ctx.tap(tb._btns[0]).then(() => 2), ctx.tap(t3).then(() => 3)]);
        [tb._btns[0], t3].forEach((b) => { b.classList.add('red'); Anim.wiggle(b); });
        UI.feedback('bad', `No. No number can divide both 2 and 3. (${F.divisionLine(2, k)} · ${F.divisionLine(3, k)})`);
        ctx.say('Ira', 'No. No number can divide both 2 and 3.', { wait: false, actor: 'ira' });
        await ctx.wait(2.4);
        tb._btns[0].disabled = t3.disabled = true;
        const title = UI.el('div', 'title-card', 'Simplest form'); a.prepend(title); Anim.pop(title);
        shop.innerHTML = '<span class="chip">Shop battery: 3 pieces</span>';
        shop.appendChild(Battery.create({ shape: 'rect', d: 3, n: 2, width: 220 })); Parts.badge(shop, 'ok');
        UI.feedback('ok', '2/3 is the simplest form of 8/12: the biggest pieces, the same charge.');
        await ctx.say('Ira', 'This is called the simplest form. It has the biggest pieces, and the charge is still the same.', { actor: 'ira', pose: 'talk' });
        await ctx.say('Ira', 'The shop has 2/3!', { actor: 'ira' });
      },
      // Beats 8–10: HCF in one step
      async (ctx) => {
        const a = Learn.area(130); const r = Learn.row(a, 40);
        const list = UI.el('div', 'panel'); list.style.cssText = 'position:relative;display:grid;gap:12px;padding:16px 20px;';
        const line = (x) => `<div style="display:flex;gap:8px;align-items:center"><b style="font-family:var(--f-display);font-size:30px;width:48px;text-align:right">${x}</b>${F.divisors(x).map((k) => `<span class="dv" data-k="${k}" data-x="${x}" style="width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-family:var(--f-display);font-weight:800;font-size:22px;background:#26306a">${k}</span>`).join('')}</div>`;
        list.innerHTML = `<div style="font-family:var(--f-display);font-weight:800;color:var(--cyan);letter-spacing:.06em;text-transform:uppercase;font-size:16px">Numbers that divide…</div>${line(8)}${line(12)}<div id="hcf" style="font-family:var(--f-display);font-weight:800;font-size:30px;text-align:center;min-height:44px"></div>`;
        r.appendChild(list);
        const box = Learn.big(r, { shape: 'rect', d: 12, n: 8, width: 300 });
        await ctx.say('Ira', 'Can we do it in one step?', { actor: 'ira', pose: 'point' });
        await ctx.lock(async () => {
          const common = [...list.querySelectorAll('.dv')].filter((s) => +s.dataset.k > 1 && 8 % s.dataset.k === 0 && 12 % s.dataset.k === 0);
          await ctx.play(Anim.to(common, { backgroundColor: '#ffb547', color: '#0b1030', duration: 0.3, stagger: 0.12 }));
          const four = common.filter((s) => s.dataset.k === '4');
          await ctx.play(Anim.to(four, { scale: 1.25, boxShadow: '0 0 18px #ffb547', duration: 0.3 }));
          document.getElementById('hcf').innerHTML = 'HCF = 4<div style="font-size:16px;color:var(--muted)">Highest Common Factor</div>';
          Anim.pop(document.getElementById('hcf'));
        });
        await ctx.say('Ira', 'Both 2 and 4 divide 8 and 12. The biggest one is 4.', { actor: 'ira' });
        await ctx.say('Ira', 'The biggest number that divides both is called the HCF.', { actor: 'ira', pose: 'talk' });
        const tb = Learn.toolbox(r, 'One step', null, ['÷4']);
        const stop = Parts.tapHint(tb._btns[0]);
        await ctx.say('Ira', 'Tap ÷4.', { wait: false, actor: 'ira' });
        await ctx.tap(tb._btns[0]); stop(); tb._btns[0].disabled = true;
        await ctx.lock(() => BSC.L1Anim.joinAnim(ctx, box._b, { d: 3, n: 2 }));
        Learn.relabel(box, 2, 3);
        const eq = UI.el('div', '', Parts.chain([{ n: 8, d: 12 }, { n: 4, d: 6, op: '÷2' }, { n: 2, d: 3, op: '÷2' }]) + `<div class="chain" style="font-size:24px;margin-top:6px"><span class="eq">÷2 then ÷2 is the same as ÷4 (2 × 2 = 4)</span></div>`);
        a.appendChild(eq); Anim.pop(eq);
        await ctx.say('Ira', 'We divided by 4 and got the simplest form in one step!', { actor: 'ira' });
      },
      // Beat 11: shading demo
      async (ctx) => {
        const a = Learn.area(130); const r = Learn.row(a, 40);
        const left = Learn.big(r, { shape: 'rect', d: 12, n: 8, width: 260 });
        const barA = chargeBar(8 / 12, 'bot: 8/12'); r.appendChild(barA);
        const right = Learn.big(r, { shape: 'rect', d: 3, n: 0, cols: 3, width: 260 }, false);
        right._lab.innerHTML = 'empty 3-piece';
        const barB = chargeBar(0, 'shaded'); r.appendChild(barB);
        await ctx.say('Ira', 'Now let’s charge an empty battery. I shade 2 of the 3 pieces.', { actor: 'ira', pose: 'point' });
        await ctx.lock(async () => {
          for (let i = 1; i <= 2; i++) { Battery.set(right._b, { on: [...Array(i).keys()] }, { anim: 'fill' }); BSC.Audio.play('tap'); await ctx.play(barB._set((i / 3))); await ctx.wait(0.3); }
          Learn.relabel(right, 2, 3);
        });
        UI.feedback('ok', 'The charge bars are level: 8/12 = 2/3.');
        await ctx.say('Ira', 'The charge is the same!', { actor: 'ira', pose: 'talk' });
      },
      // Beats 12–17: guided try on 6/8
      async (ctx) => {
        const a = Learn.area(130); const r = Learn.row(a, 30);
        a.insertAdjacentHTML('afterbegin', `<div class="chip" style="font-size:18px">New order: ${UI.frac(6, 8, 'in')}</div>`);
        const box = Learn.big(r, { shape: 'rect', d: 8, n: 6, width: 260 });
        const tb = Learn.toolbox(r, 'The Merger', null, ['÷2', '÷3', '÷4']);
        const host = UI.el('div'); r.appendChild(host);
        await ctx.say('Ira', 'Now it’s your turn. Find the biggest number that divides both.', { wait: false, actor: 'ira', pose: 'point' });
        let wrongs = 0;
        UI.hud.setHint(() => UI.feedback('hint', `Numbers that divide 6: ${F.divisors(6).filter((k) => k > 1).join(', ')}. Numbers that divide 8: ${F.divisors(8).filter((k) => k > 1).join(', ')}. Which is in both lists?`));
        await new Promise((resolve) => tb._btns.forEach((b, i) => ctx.on(b, 'click', () => {
          const k = i + 2;
          if (!F.dividesBoth(k, [6, 8])) {
            wrongs++; b.classList.add('red'); Anim.wiggle(b); BSC.Audio.play('wrong');
            UI.feedback('bad', `That number does not divide both. Try another one. ${F.divisionLine(6, k)} ${6 % k ? '✗' : '✓'} · ${F.divisionLine(8, k)} ${8 % k ? '✗' : '✓'}`);
            setTimeout(() => b.classList.remove('red'), 900);
            return;
          }
          tb._btns.forEach((x) => (x.disabled = true)); resolve();
        })));
        UI.feedback(null);
        await ctx.lock(() => BSC.L1Anim.joinAnim(ctx, box._b, { d: 4, n: 3 }));
        tb.remove();
        box._lab.innerHTML = '?';
        await ctx.say('Ira', 'What is the simplest form?', { wait: false, actor: 'ira' });
        await Learn.ask(ctx, host, [3, 4], { batt: box._b, label: 'Simplest form' });
        Learn.relabel(box, 3, 4); host.innerHTML = '';
        // shade an empty 4-piece battery to match
        const shadeBox = Learn.big(host, { shape: 'rect', d: 4, n: 0, cols: 4, width: 240, tap: true }, false);
        shadeBox._lab.innerHTML = 'Tap pieces to shade'; shadeBox._lab.style.fontSize = '18px';
        const bars = UI.el('div'); bars.style.cssText = 'display:flex;gap:16px;margin-top:8px;';
        const bA = chargeBar(6 / 8, 'bot'), bB = chargeBar(0, 'yours'); bars.append(bA, bB); host.appendChild(bars);
        bars.style.transform = 'scale(.7)'; bars.style.transformOrigin = '50% 0'; bars.style.marginBottom = '-60px';
        await ctx.say('Ira', 'Now shade the battery to match.', { wait: false, actor: 'ira' });
        const shaded = new Set();
        shadeBox._b.addEventListener('click', (e) => {
          const c = e.target.closest('.cell'); if (!c || Game.busy) return;
          const i = +c.dataset.i; shaded.has(i) ? shaded.delete(i) : shaded.add(i);
          BSC.Audio.play('tap'); UI.feedback(null);
          Battery.set(shadeBox._b, { on: [...shaded] }); bB._set(shaded.size / 4);
        });
        UI.hud.setHint(() => UI.feedback('hint', 'The bot has 3 of 4 big pieces charged. Shade the same number of pieces.'));
        await new Promise((resolve) => {
          const chk = UI.button('Check', { variant: 'primary', onClick: () => {
            if (shaded.size === 3) { resolve(); return; }
            UI.feedback('bad', shaded.size > 3 ? 'That is too much. Match the bot’s charge.' : 'That is too little. Match the bot’s charge.');
          } });
          UI.actions([chk]);
        });
        UI.actions([]); UI.hud.setHint(null);
        Learn.relabel(shadeBox, 3, 4); Parts.badge(shadeBox, 'ok');
        UI.feedback('ok', 'Well done! 6/8 is the same as 3/4. The bars are level.');
        await ctx.say('Ira', 'Well done! 6/8 is the same as 3/4.', { actor: 'ira' });
      },
      async (ctx) => {
        Learn.area().innerHTML = '';
        Learn.teacher('talk', { x: 560, bottom: 150, h: 400 }); // Ira steps to the centre for the hand-off
        await ctx.say('Ira', 'Orders are waiting! Steer each bot through a gate that divides its top and bottom numbers, then pick the battery in the shop.', { actor: 'ira', next: 'Start' });
      },
    ];
    await Learn.run(ctx, steps, params.step || 0);
    ctx.next();
  };

  // ------------------------------------------------------------ Level 2 Play: gate maze
  const TILE = 60;
  function parseMaze() {
    const M = Levels.MAZE; const cells = {}; let start, shop; const gates = [];
    M.forEach((row, r) => [...row].forEach((ch, c) => {
      if (ch === '#') return;
      cells[`${r},${c}`] = ch;
      if (ch === 'S') start = [r, c];
      if (ch === 'E') shop = [r, c];
      if ('abcd'.includes(ch)) gates['abcd'.indexOf(ch)] = [r, c];
    }));
    return { cells, start, shop, gates, rows: M.length, cols: M[0].length };
  }

  BSC.Scenes.l2game = async function (ctx, params) {
    UI.setBg('bg_level2', { tint: 'hazy' });
    const S = BSC.Store.get();
    for (let i = params.step || 0; i < Levels.L2.length; i++) {
      ctx.save(i); UI.hud.progress(i, Levels.L2.length);
      const stars = await playOrder(ctx, Levels.L2[i], i);
      S.stars[i] = Math.max(S.stars[i] || 0, stars); BSC.Store.save();
    }
    UI.hud.progress(Levels.L2.length, Levels.L2.length);
    UI.world().innerHTML = ''; UI.feedback(null);
    const total = Object.values(S.stars).reduce((a, b) => a + b, 0);
    Cast.add('ira', { char: 'ira', pose: 'cheer', x: 380, bottom: 40, h: 340 }); Cast.enter('ira', 'left'); Cast.idle('ira');
    Cast.add('byte', { char: 'byte', pose: 'cheer', x: 900, bottom: 60, h: 220 }); Cast.enter('byte', 'right'); Cast.idle('byte');
    const card = UI.el('div', 'panel'); card.style.cssText = 'left:50%;top:130px;transform:translateX(-50%);text-align:center;width:560px;';
    card.innerHTML = `<div class="title-card" style="display:inline-block">Level 2 complete!</div><p style="font-size:24px;margin:16px 0 0">You earned <b>${total} of 24</b> stars ★</p>`;
    UI.world().appendChild(card); Anim.pop(card); BSC.Audio.play('ok'); // the star total stays on screen while they talk
    await ctx.say('Byte', 'Different numbers. Same charge. Biggest pieces!', { actor: 'byte' });
    await ctx.say('Ira', 'Every bot left with its battery. Level 2 complete!', { actor: 'ira', next: 'Continue' });
    await BSC.levelDone(ctx, 2);
  };

  function tokenSvg(bot) {
    const col = { zip: '#7c4dff', bolt: '#ff8a2a', volt: '#8f6cff', pixel: '#5a5fe0', spark: '#ff7a5c', gizmo: '#9a7cff', rivet: '#3d63d8', nova: '#e0399b' }[bot] || '#7c4dff';
    return `<svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><circle cx="32" cy="36" r="24" fill="rgba(40,30,110,.25)"/>
      <circle cx="32" cy="32" r="23" fill="#f4f5ff" stroke="${col}" stroke-width="5"/><circle cx="32" cy="31" r="12" fill="#151b3f"/><circle cx="27" cy="29" r="3" fill="#45e3ff"/><circle cx="37" cy="29" r="3" fill="#45e3ff"/><path d="M32 4l6 8h-12z" fill="${col}"/></svg>`;
  }

  function playOrder(ctx, L, idx) {
    return new Promise((resolve, reject) => {
      const w = UI.world(); w.innerHTML = ''; UI.feedback(null); UI.actions([]);
      const Mz = parseMaze();
      let cur = L.order.slice(), pos = Mz.start.slice(), prev = null;
      let used = new Set(), bumps = 0, passed = 0, mistakes = 0, hintRung = 0, route = [], history = [], busyPanel = false, done = false;
      const liveStars = () => Math.max(1, 3 - bumps - Math.max(0, passed - 1));
      const fits = (k) => F.dividesBoth(k, cur);

      // --- maze board ---
      const board = UI.el('div', 'maze'); board.setAttribute('aria-label', 'Gate maze. Use the arrow buttons or arrow keys, or tap a path.');
      const svgRows = [];
      Levels.MAZE.forEach((row, r) => [...row].forEach((ch, c) => {
        const x = c * TILE, y = r * TILE;
        if (ch === '#') svgRows.push(`<rect class="wall" x="${x + 5}" y="${y + 5}" width="${TILE - 10}" height="${TILE - 10}" rx="11"/>`);
        else svgRows.push(`<rect class="path" x="${x + 5}" y="${y + 5}" width="${TILE - 10}" height="${TILE - 10}" rx="11"/><rect class="tile-hit" data-r="${r}" data-c="${c}" x="${x}" y="${y}" width="${TILE}" height="${TILE}"/>`);
      }));
      board.innerHTML = `<svg viewBox="0 0 ${Mz.cols * TILE} ${Mz.rows * TILE}">${svgRows.join('')}</svg>`;
      UI.$('#stage').dataset.layout = 'maze'; // Ira's line moves to the top of the screen (see CSS)
      w.appendChild(board);
      const at = (r, c) => [c * TILE + TILE / 2, r * TILE + TILE / 2];
      // start pad + shop + gates
      const startPad = UI.el('div', 'start-shadow'); const [sx, sy] = at(...Mz.start); startPad.style.left = sx + 'px'; startPad.style.top = (sy + 22) + 'px';
      board.appendChild(startPad);
      const shopEl = UI.el('div', 'shop-el', '<span class="ic">🏪</span>SHOP'); const [ex, ey] = at(...Mz.shop); shopEl.style.left = ex + 'px'; shopEl.style.top = ey + 'px'; board.appendChild(shopEl);
      const gateEls = L.gates.map((k, i) => { const g = UI.el('div', 'gate-el', '÷' + k); const [gx, gy] = at(...Mz.gates[i]); g.style.left = gx + 'px'; g.style.top = gy + 'px'; g.setAttribute('aria-label', 'Gate divide by ' + k); board.appendChild(g); return g; });
      const token = UI.el('div', 'mtoken', tokenSvg(L.bot)); board.appendChild(token);
      const place = (anim = true) => { const [x, y] = at(...pos); return anim ? Anim.to(token, { left: x, top: y, duration: 0.16, ease: 'power1.inOut' }) : gsap.set(token, { left: x, top: y }); };
      place(false);

      // --- right column: order, current charge, arrows ---
      const side = UI.el('div', 'order-pill'); w.appendChild(side);
      side.innerHTML = `<span class="lbl">Order:</span>${UI.frac(L.order[0], L.order[1])}`;
      side.prepend(Battery.create({ shape: L.shape, d: L.order[1], n: L.order[0], width: Battery.wide(L.shape) ? 92 : 64 }));
      const now = UI.el('div', 'frac-card'); now.setAttribute('aria-live', 'polite'); w.appendChild(now);
      const dpad = UI.el('div', 'dpad');
      dpad.innerHTML = `<span></span><button type="button" data-d="up" aria-label="Up">▲</button><span></span><button type="button" data-d="left" aria-label="Left">◀</button><span class="hub">${tokenSvg(L.bot)}</span><button type="button" data-d="right" aria-label="Right">▶</button><span></span><button type="button" data-d="down" aria-label="Down">▼</button><span></span>`;
      w.appendChild(dpad);
      const paint = () => {
        BSC.__cur = cur; // test hook (read-only)
        now.innerHTML = UI.frac(cur[0], cur[1]); now.setAttribute('aria-label', `Charge now: ${cur[0]} over ${cur[1]}`);
        gateEls.forEach((g, i) => { g.classList.toggle('used', used.has(i)); g.classList.toggle('fits', !used.has(i) && (mistakes >= 3 || hintRung >= 2) && fits(L.gates[i])); });
      };
      paint();
      Anim.from([board, side, now, dpad], { y: 20, opacity: 0, duration: 0.5, stagger: 0.08 });

      // --- talk ---
      const [o1, o2] = L.order;
      const botName = L.bot[0].toUpperCase() + L.bot.slice(1), beat = `Byte used ${L.record} gate${L.record > 1 ? 's' : ''}. Can you beat him?`;
      const NEW = { circle: 'Round ones this time.', square: 'Square ones now.', hexagon: 'Hexagons this time.', diamond: 'Diamonds this time.', triangle: 'Triangles this time.' };
      BSC.sayLines(ctx, L.nudge ? [[botName, `I need ${o1}/${o2}, please!`], ['Ira', 'The shop only sells batteries with bigger pieces. Steer through a gate. It must divide the top and the bottom.', { mark: 'divide' }]]
        : L.newShape ? [['Ira', `New batteries! ${NEW[L.shape] || ''}`.trim()], [botName, `I need ${o1}/${o2}! ${beat}`]]
        : [[botName, `I need ${o1}/${o2}! ${beat}`]], () => !done && !passed && !bumps);
      if (L.nudge) setTimeout(() => { if (ctx.alive) { const stop = Parts.tapHint(dpad.querySelector('[data-d="right"]')); setTimeout(stop, 3500); } }, 500);

      const showHint = (force) => {
        hintRung = Math.max(hintRung + 1, force || 0);
        const cf = F.commonFactors(cur);
        if (F.isSimplest(cur)) UI.feedback('hint', `${cur[0]}/${cur[1]} can’t be divided any more. Head to the shop!`);
        else if (hintRung === 1) UI.feedback('hint', `A gate must divide both ${cur[0]} and ${cur[1]} with nothing left over.`);
        else if (hintRung === 2) UI.feedback('hint', 'The glowing gates divide both numbers. Which one is the biggest?');
        else UI.feedback('hint', `Numbers that divide ${cur[0]} and ${cur[1]}: ${cf.join(', ')}. The biggest is ${cf[cf.length - 1]} — the HCF.`);
        paint();
      };
      UI.hud.setHint(() => showHint());
      const mistake = () => { mistakes++; if (mistakes === 2 && hintRung < 3) showHint(3); if (mistakes === 3) { ctx.say('Ira', 'The glowing gates divide both numbers. Which is the biggest?', { wait: false }); } paint(); };

      // --- movement ---
      const key = (p) => `${p[0]},${p[1]}`;
      const isPath = (p) => !!Mz.cells[key(p)];
      const gateAt = (p) => Mz.gates.findIndex((g) => g[0] === p[0] && g[1] === p[1]);
      let walking = false;
      async function step(dir) {
        if (done || busyPanel || Game.busy || Game.paused) return false;
        const d = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[dir];
        const np = [pos[0] + d[0], pos[1] + d[1]];
        if (!isPath(np)) { Anim.shake(token, 4); return false; }
        const gi = gateAt(np);
        if (gi >= 0 && !used.has(gi)) { await atGate(gi, np); return false; }
        prev = pos; pos = np; await ctx.play(place());
        if (np[0] === Mz.shop[0] && np[1] === Mz.shop[1]) { await atShop(); return false; }
        return true;
      }
      async function walkTo(target) {
        if (walking) return; walking = true;
        try {
          // BFS that may end on a gate/shop tile but never passes through an unused gate
          const q = [pos], from = { [key(pos)]: null };
          while (q.length) {
            const p = q.shift(); if (key(p) === key(target)) break;
            const gi = gateAt(p); if (gi >= 0 && !used.has(gi) && key(p) !== key(pos)) continue;
            for (const d of [[-1, 0], [1, 0], [0, -1], [0, 1]]) { const n = [p[0] + d[0], p[1] + d[1]]; if (isPath(n) && !(key(n) in from)) { from[key(n)] = p; q.push(n); } }
          }
          if (!(key(target) in from)) return;
          const path = []; for (let p = target; p && key(p) !== key(pos); p = from[key(p)]) path.unshift(p);
          for (const p of path) {
            const dir = p[0] < pos[0] ? 'up' : p[0] > pos[0] ? 'down' : p[1] < pos[1] ? 'left' : 'right';
            const ok = await step(dir); if (!ok) break;
          }
        } finally { walking = false; }
      }
      async function atGate(gi, np) {
        const k = L.gates[gi], g = gateEls[gi];
        if (!fits(k)) {
          bumps++; BSC.Audio.play('wrong');
          await ctx.lock(async () => {
            g.classList.add('locked'); Anim.wiggle(g); Anim.shake(board, 5);
            const [gx, gy] = at(...np); const [px, py] = at(...pos);
            await ctx.play(gsap.timeline().to(token, { left: (gx + px) / 2, top: (gy + py) / 2, duration: 0.12 }).to(token, { left: px, top: py, duration: 0.25, ease: 'back.out(3)' }));
          });
          const bad = cur[0] % k ? cur[0] : cur[1], good = cur[0] % k ? cur[1] : cur[0];
          UI.feedback('bad', `Oops! Try again. ${k} fits ${good}, but not ${bad}. A gate must divide both. (${F.divisionLine(cur[0], k)} · ${F.divisionLine(cur[1], k)}, −1 star)`);
          setTimeout(() => g.classList.remove('locked'), 900);
          mistake(); return;
        }
        // gate opens → write the new fraction
        busyPanel = true;
        await ctx.lock(async () => {
          BSC.Audio.play('gate'); g.classList.add('fits');
          await ctx.play(Anim.to(g, { scale: 1.2, duration: 0.15, yoyo: true, repeat: 1 }));
          prev = pos; pos = np; await ctx.play(place());
        });
        const target = [cur[0] / k, cur[1] / k];
        const panel = UI.el('div', 'panel'); panel.style.cssText = 'left:120px;top:150px;width:720px;z-index:20;display:grid;justify-items:center;gap:8px;';
        panel.innerHTML = `<h3>The ÷${k} gate fits! ${UI.frac(cur[0], cur[1], 'md')} ÷ ${k} = ?</h3>`;
        const host = UI.el('div'); panel.appendChild(host); w.appendChild(panel); Anim.pop(panel);
        ctx.say('Ira', `The ÷${k} gate fits! Now write the new fraction. Divide the top by ${k}, then the bottom by ${k}.`, { wait: false });
        let wrong = 0;
        BSC.__target = target; // test hook (read-only)
        await new Promise((res) => UI.entry(host, { max: 12, label: 'Write the new fraction', onCheck: (t, b, api) => {
          if (t === target[0] && b === target[1]) { api.done(); res(); return; }
          wrong++; const which = t !== target[0] ? 0 : 1, x = which ? cur[1] : cur[0];
          api.mark(which);
          if (wrong === 1) UI.feedback('bad', `Oops! Try again. Check the ${which ? 'bottom' : 'top'}: what is ${x} ÷ ${k}?`);
          else if (wrong === 2) UI.feedback('hint', `Hint: Each group of ${k} ${L.shape === 'circle' ? 'slices' : 'rows'} joins into one. Count the pieces after joining.`);
          else UI.feedback('hint', `${x} ÷ ${k} = ${x / k}`);
          setTimeout(() => api.clear(which), 600);
        } }));
        ctx.check();
        history.push({ cur: cur.slice(), used: new Set(used), pos: prev.slice(), passed, route: route.slice() });
        used.add(gi); passed++; route.push({ k, n: target[0], d: target[1] }); cur = target;
        // show the pieces joining before the panel closes
        host.innerHTML = ''; UI.actions([]);
        const batt = Battery.create({ shape: L.shape, d: target[1] * k, n: target[0] * k, width: Battery.wide(L.shape) ? 230 : 170 });
        host.appendChild(batt);
        await ctx.lock(() => BSC.L1Anim.joinAnim(ctx, batt, { d: cur[1], n: cur[0] }));
        await ctx.wait(0.5);
        panel.remove();
        UI.feedback('ok', `Yes! ${cur[0]}/${cur[1]}. The pieces got bigger.`);
        ctx.say('Ira', `Yes! ${cur[0]}/${cur[1]}. The pieces got bigger.` + (F.isSimplest(cur) ? ' Nothing else divides both. Go to the shop!' : ' Can they get bigger still?'), { wait: false });
        busyPanel = false; paint();
        // dead end?
        if (!F.isSimplest(cur) && !L.gates.some((kk, j) => !used.has(j) && F.dividesBoth(kk, cur))) deadEnd();
      }
      function deadEnd() {
        busyPanel = true;
        const panel = UI.el('div', 'panel'); panel.style.cssText = 'left:120px;top:170px;width:720px;z-index:20;display:grid;justify-items:center;gap:10px;border-color:var(--warn-ink);';
        panel.innerHTML = `<h3 style="color:var(--warn-ink)">No gate left fits ${UI.frac(cur[0], cur[1], 'in')}</h3><div style="font-size:19px;display:flex;gap:16px;flex-wrap:wrap;justify-content:center">${L.gates.map((k, j) => used.has(j) ? '' : `<span>÷${k}: ${cur[0]} ${cur[0] % k ? '✗' : '✓'} · ${cur[1]} ${cur[1] % k ? '✗' : '✓'}</span>`).join('')}</div><p style="margin:0;font-size:19px;color:var(--muted)">Tip: a bigger gate first can save you a step.</p>`;
        w.appendChild(panel); Anim.pop(panel);
        ctx.say('Ira', 'No gate left fits. Press Start over and try a bigger gate first.', { wait: false });
        UI.actions([
          { label: 'Start over', variant: 'secondary', onClick: () => { panel.remove(); restore(history[0], true); } },
          { label: 'Undo last gate', variant: 'primary', onClick: () => { panel.remove(); restore(history[history.length - 1]); } },
        ]);
      }
      function restore(h, toStart) {
        const i = history.indexOf(h); history = history.slice(0, i);
        cur = h.cur.slice(); used = new Set(h.used); pos = toStart ? Mz.start.slice() : h.pos.slice(); passed = h.passed; route = h.route.slice();
        place(false); busyPanel = false; UI.actions([]); UI.feedback(null); paint();
      }
      async function atShop() {
        if (!F.isSimplest(cur)) {
          const c = F.commonFactors(cur)[0];
          UI.feedback('warn', `Oops! Same charge, but ${cur[0]} and ${cur[1]} can still both be divided by ${c}. Simplify first.`);
          BSC.Audio.play('wrong'); mistake();
          await ctx.lock(async () => { pos = prev || Mz.start.slice(); await ctx.play(place()); });
          return;
        }
        busyPanel = true;
        const panel = UI.el('div', 'panel'); panel.style.cssText = 'left:120px;top:150px;width:720px;z-index:20;display:grid;justify-items:center;gap:12px;';
        panel.innerHTML = `<h3>Battery shop: which battery matches ${UI.frac(cur[0], cur[1], 'md')}?</h3>`;
        const shelf = UI.el('div'); shelf.style.cssText = 'display:flex;gap:18px;';
        const opts = L.shelf.map(([a, b]) => {
          const o = UI.el('button'); o.type = 'button'; o.className = 'selectable'; o.style.cssText = 'position:relative;background:none;border:0;cursor:pointer;display:grid;justify-items:center;gap:0;padding:6px;border-radius:16px;';
          o.setAttribute('aria-label', `Battery ${a} over ${b}`);
          o.appendChild(Battery.create({ shape: L.shape, d: b, n: a, width: Battery.wide(L.shape) ? 190 : 150 }));
          const cr = UI.el('img'); cr.src = 'assets/batteries/shelf_cradle.webp'; cr.alt = ''; cr.style.cssText = 'width:170px;margin-top:-14px'; o.appendChild(cr);
          o.appendChild(UI.el('div', 'label-plate', UI.frac(a, b)));
          shelf.appendChild(o); return o;
        });
        panel.appendChild(shelf); w.appendChild(panel); Anim.pop(panel);
        ctx.say('Ira', 'Which battery matches your bot? Tap it.', { wait: false });
        const back = UI.button('◂ Back to the maze', { variant: 'ghost', onClick: async () => { panel.remove(); busyPanel = false; UI.actions([]); pos = prev; place(); } });
        UI.actions([back]);
        opts.forEach((o, i) => o.addEventListener('click', () => {
          if (Game.busy || done) return;
          const f = L.shelf[i];
          if (F.equal(f, cur)) { o.classList.add('is-ok'); Parts.badge(o, 'ok'); win(panel); }
          else { o.classList.add('is-bad'); Anim.wiggle(o); BSC.Audio.play('wrong'); UI.feedback('bad', `Oops! That’s a different charge (${f[0]}/${f[1]}, not ${cur[0]}/${cur[1]}). Look at the pieces again.`); mistake(); setTimeout(() => o.classList.remove('is-bad'), 900); }
        }));
      }
      function win(panel) {
        done = true; UI.hud.setHint(null); UI.feedback(null);
        const s = liveStars(); const g = F.hcf(L.order);
        BSC.Audio.play('charge'); for (let i = 0; i < s; i++) setTimeout(() => BSC.Audio.play('star'), 400 + i * 250);
        const [cx, cy] = Anim.centre(panel); Anim.burst(cx, cy, 'star', 12);
        let extra = '';
        if (route.length > 1) extra = `<p style="margin:4px 0 0;font-size:19px">${route.map((r) => '÷' + r.k).join(' then ')} = ÷${route.reduce((p, r) => p * r.k, 1)}. One ÷${g} gate does the same job: ${g} is the HCF of ${L.order[0]} and ${L.order[1]}.</p>`;
        panel.innerHTML = `<h3 style="color:var(--ok)">Here’s your battery!</h3><div style="font-size:24px;font-weight:800">${UI.frac(L.order[0], L.order[1], 'md')} in simplest form is ${UI.frac(L.order[0] / g, L.order[1] / g, 'md')}</div><div class="stars" aria-label="${s} stars">${'★'.repeat(s)}<span class="off">${'★'.repeat(3 - s)}</span></div>${extra}`;
        Anim.pop(panel);
        const msg = s === 3 ? (passed < L.record ? 'You beat my record!' : 'You matched my record!') : bumps ? `${passed === 1 ? 'One gate! ' : ''}But the bumps cost you. Check before you steer!` : `÷${g} is the biggest number that divides both. That’s the HCF!`;
        ctx.say('Byte', msg, { wait: false });
        UI.actions([
          { label: 'Try for 3 stars', variant: 'secondary', onClick: () => { playOrder(ctx, L, idx).then(resolve, reject); } },
          { label: idx < Levels.L2.length - 1 ? 'Next order ▸' : 'Finish ▸', variant: 'primary', onClick: () => resolve(s) },
        ]);
      }

      // --- input bindings ---
      dpad.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { if (!ctx.alive || walking) return; BSC.Audio.play('tap'); UI.feedback(null); step(b.dataset.d); }));
      const onKey = (e) => {
        if (!ctx.alive || done) { window.removeEventListener('keydown', onKey); return; }
        const m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.key];
        if (m && !busyPanel) { e.preventDefault(); if (!walking) step(m); }
      };
      window.addEventListener('keydown', onKey);
      let swiped = false;
      board.addEventListener('click', (e) => {
        if (swiped) { swiped = false; return; }
        if (!ctx.alive || busyPanel || Game.busy) return;
        const t = e.target.closest('[data-r]'); const gEl = e.target.closest('.gate-el'); const shopHit = e.target.closest('.shop-el');
        let target = null;
        if (t) target = [+t.dataset.r, +t.dataset.c];
        else if (gEl) target = Mz.gates[gateEls.indexOf(gEl)];
        else if (shopHit) target = Mz.shop;
        if (target) { UI.feedback(null); walkTo(target); }
      });
      let sw = null;
      board.addEventListener('pointerdown', (e) => { sw = [e.clientX, e.clientY]; });
      board.addEventListener('pointerup', (e) => {
        if (!sw) return; const dx = e.clientX - sw[0], dy = e.clientY - sw[1]; sw = null;
        if (Math.hypot(dx, dy) < 40 || busyPanel) return;
        swiped = true;
        step(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
      });
    });
  }
})(window.BSC = window.BSC || {});
