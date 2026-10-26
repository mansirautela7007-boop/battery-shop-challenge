/* Level 1 — Equivalent fractions.
   Learn (Level 1_Draft 2 beats 1–24) then Play (A1–A15: drag the bot to the slot with the same charge). */
(function (BSC) {
  'use strict';
  const { UI, Cast, Anim, Parts, Battery, F, Game, Levels } = BSC;

  // ------------------------------------------------------------ shared learning helpers (also used by L2/L3)
  const Learn = {
    area(top = 150) {
      const old = document.getElementById('learn'); if (old) old.remove();
      const a = UI.el('div'); a.id = 'learn';
      a.style.cssText = `position:absolute;left:40px;right:300px;top:${top}px;bottom:150px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;z-index:6;`;
      UI.world().appendChild(a); return a;
    },
    row(parent, gap = 34) { const r = UI.el('div'); r.style.cssText = `display:flex;align-items:center;justify-content:center;gap:${gap}px;`; parent.appendChild(r); return r; },
    big(parent, opts, label = true) {
      const box = UI.el('div'); box.style.cssText = 'display:grid;justify-items:center;gap:10px;position:relative;';
      const b = Battery.create(opts); box.appendChild(b);
      const lab = UI.el('div', 'label-plate', label ? UI.frac(opts.n, opts.d) : '?'); box.appendChild(lab);
      parent.appendChild(box); box._b = b; box._lab = lab;
      return box;
    },
    relabel(box, n, d) { box._lab.innerHTML = UI.frac(n, d); Anim.pop(box._lab); },
    toolbox(parent, title, img, buttons) {
      const t = UI.el('div', 'panel'); t.style.cssText = 'position:relative;display:grid;justify-items:center;gap:10px;padding:14px 18px;';
      t.innerHTML = `<div style="font-family:var(--f-display);font-weight:800;font-size:18px;letter-spacing:.06em;text-transform:uppercase;color:var(--cyan)">${title}</div>${img ? `<img src="assets/batteries/${img}.webp" alt="" style="width:160px">` : ''}`;
      const r = UI.el('div'); r.style.cssText = 'display:flex;gap:10px;';
      const btns = buttons.map((b) => { const el = UI.el('button', 'tool', b); el.type = 'button'; r.appendChild(el); return el; });
      t.appendChild(r); parent.appendChild(t); t._btns = btns; return t;
    },
    duster(pose = 'explain') {
      if (!Cast.get('duster')) { Cast.add('duster', { char: 'duster', pose, x: 1150, bottom: 150, h: 360 }); Cast.enter('duster', 'holo'); Cast.idle('duster'); }
      else Cast.pose('duster', pose);
    },
    /** Wait until the learner writes [n,d]. Feedback follows the storyboard (scenes 19–21). */
    ask(ctx, host, target, { label = 'What is the new fraction?', batt = null } = {}) {
      return new Promise((resolve, reject) => {
        let wrong = 0;
        const hint = () => { if (batt) ctx.lock(() => ctx.play(Battery.count(batt, 'charged').then(() => ctx.wait(0.5)).then(() => Battery.count(batt, 'all')))); UI.feedback('hint', 'Count the charged parts for the top. Count all the parts for the bottom.'); };
        UI.hud.setHint(hint);
        BSC.__target = target; // test hook (read-only)
        UI.entry(host, { max: 12, label, onCheck: (t, b, api) => {
          if (!ctx.alive) return reject(new Game.Abort());
          if (t === target[0] && b === target[1]) { api.done(); UI.hud.setHint(null); BSC.Audio.play('ok'); return resolve(); }
          wrong++;
          if (t === target[1] && b === target[0]) { UI.feedback('bad', 'Swapped! Charged parts go on top. All the parts go at the bottom.'); api.mark(0); api.mark(1); }
          else if (t !== target[0]) { UI.feedback('bad', 'Check the top number: count the charged parts.'); api.mark(0); }
          else { UI.feedback('bad', 'Check the bottom number: count all the parts.'); api.mark(1); }
          if (wrong >= 2) hint();
        } });
      });
    },
    async yesNo(ctx, host, question) {
      const r = UI.el('div', 'panel'); r.style.cssText = 'position:relative;display:grid;justify-items:center;gap:12px;';
      r.innerHTML = `<div style="font-family:var(--f-display);font-weight:800;font-size:26px">${UI.fmt(question)}</div>`;
      const row = UI.el('div'); row.style.cssText = 'display:flex;gap:14px';
      const yes = UI.button('Yes', { variant: 'secondary' }), no = UI.button('No', { variant: 'secondary' });
      row.append(yes, no); r.appendChild(row); host.appendChild(r);
      const ans = await Promise.race([ctx.tap(yes).then(() => true), ctx.tap(no).then(() => false)]);
      r.remove(); return ans;
    },
    async run(ctx, steps, start = 0) {
      for (let i = Math.min(start, steps.length - 1); i < steps.length; i++) {
        ctx.check(); ctx.save(i);
        UI.hud.progress(i, steps.length); UI.hud.setHint(null); UI.feedback(null); UI.actions([]);
        await steps[i](ctx);
      }
    },
    async next(ctx, label = 'Next') { const b = UI.button(label + ' ▸', { variant: 'primary' }); UI.actions([b]); await ctx.tap(b); UI.actions([]); },
  };
  BSC.Learn = Learn;

  /** Cutter sweep over a battery, then split. */
  async function cutAnim(ctx, battEl, newOpts) {
    const img = UI.el('img'); img.src = 'assets/batteries/tool_cutter.webp'; img.alt = '';
    img.style.cssText = 'position:absolute;width:170px;z-index:30;pointer-events:none;';
    UI.world().appendChild(img);
    const [cx, cy] = Anim.centre(battEl);
    BSC.Audio.play('cut');
    await ctx.play(Anim.fromTo(img, { left: cx - 260, top: cy - 90, rotation: -12, opacity: 0 }, { left: cx + 60, top: cy - 70, rotation: 6, opacity: 1, duration: 0.55, ease: 'power2.inOut' }));
    gsap.to(img, { opacity: 0, duration: 0.2, onComplete: () => img.remove() });
    await ctx.play(Battery.set(battEl, newOpts, { anim: 'split' }));
  }
  async function joinAnim(ctx, battEl, newOpts) {
    const img = UI.el('img'); img.src = 'assets/batteries/tool_merger.webp'; img.alt = '';
    img.style.cssText = 'position:absolute;width:190px;z-index:30;pointer-events:none;';
    UI.world().appendChild(img);
    const [cx, cy] = Anim.centre(battEl);
    await ctx.play(Anim.fromTo(img, { left: cx - 95, top: cy - 230, opacity: 0, scale: 0.8 }, { top: cy - 170, opacity: 1, scale: 1, duration: 0.35 }));
    BSC.Audio.play('clunk'); Anim.shake(battEl, 4);
    gsap.to(img, { opacity: 0, duration: 0.25, delay: 0.1, onComplete: () => img.remove() });
    await ctx.play(Battery.set(battEl, newOpts, { anim: 'join' }));
  }
  BSC.L1Anim = { cutAnim, joinAnim };

  // ------------------------------------------------------------ Level 1 Learn
  BSC.Scenes.l1learn = async function (ctx, params) {
    UI.setBg('bg_learning_bench');
    Learn.duster();
    const steps = [
      // Beats 1–4: cut each part of 1/2 with ×2, ×3, ×4
      async (ctx) => {
        const a = Learn.area();
        const r = Learn.row(a);
        const box = Learn.big(r, { shape: 'circle', d: 2, n: 1, width: 230 });
        const tb = Learn.toolbox(r, 'Cut each part', 'tool_cutter', ['×2', '×3', '×4']);
        const chain = UI.el('div'); a.appendChild(chain);
        const found = [];
        const drawChain = () => { chain.innerHTML = Parts.chain([{ n: 1, d: 2 }, ...found.sort((x, y) => x - y).map((k) => ({ n: k, d: 2 * k, op: '×' + k }))]); };
        drawChain();
        await ctx.say('Duster', 'Let’s see why they match. Tap ×2 to cut every part into 2.', { wait: false, actor: 'duster', pose: 'point' });
        const stop = Parts.tapHint(tb._btns[0]);
        await new Promise((resolve) => {
          tb._btns.forEach((btn, i) => ctx.on(btn, 'click', () => ctx.lock(async () => {
            stop();
            const k = i + 2; if (found.includes(k)) return;
            await cutAnim(ctx, box._b, { d: 2 * k, n: k });
            Learn.relabel(box, k, 2 * k); found.push(k); btn.classList.add('used'); drawChain();
            if (found.length === 1) await ctx.say('Duster', `More pieces. Same charge: ${k}/${2 * k} covers the same part as 1/2. Try the other cuts.`, { wait: false, actor: 'duster' });
            else if (found.length === 2) await ctx.say('Duster', 'Count the pieces each time. The charged part never moves.', { wait: false, actor: 'duster' });
            else resolve();
          })));
        });
        await ctx.say('Duster', '×2 gives 2/4. ×3 gives 3/6. ×4 gives 4/8. The same number multiplies the top and the bottom.', { actor: 'duster', pose: 'explain' });
      },
      // Beats 5–7: join 4/8 → 2/4 → 1/2
      async (ctx) => {
        const a = Learn.area(); const r = Learn.row(a);
        const box = Learn.big(r, { shape: 'circle', d: 8, n: 4, width: 230 });
        const tb = Learn.toolbox(r, 'Join the pieces', 'tool_merger', ['÷2']);
        const chain = UI.el('div'); a.appendChild(chain);
        const hist = [{ n: 4, d: 8 }]; chain.innerHTML = Parts.chain(hist);
        await ctx.say('Duster', 'Now join the pieces. Tap ÷2 to join every 2 pieces into 1.', { wait: false, actor: 'duster', pose: 'point' });
        const stop = Parts.tapHint(tb._btns[0]);
        let cur = [4, 8];
        await new Promise((resolve) => ctx.on(tb._btns[0], 'click', () => ctx.lock(async () => {
          stop(); if (cur[1] === 2) return;
          cur = [cur[0] / 2, cur[1] / 2];
          await joinAnim(ctx, box._b, { d: cur[1], n: cur[0] });
          Learn.relabel(box, cur[0], cur[1]); hist.push({ n: cur[0], d: cur[1], op: '÷2' }); chain.innerHTML = Parts.chain(hist);
          if (cur[1] === 4) await ctx.say('Duster', 'Fewer pieces. Same charge. Tap ÷2 again.', { wait: false, actor: 'duster' });
          else { tb._btns[0].disabled = true; resolve(); }
        })));
        await ctx.say('Duster', '÷2 gives 2/4. ÷2 again gives 1/2. The same number divides the top and the bottom.', { actor: 'duster', pose: 'explain' });
      },
      // Beat 8: name it
      async (ctx) => {
        const a = Learn.area();
        const t = UI.el('div', 'title-card', 'Equivalent fractions'); a.appendChild(t); Anim.pop(t);
        const c1 = UI.el('div', '', Parts.chain([{ n: 1, d: 2 }, { n: 2, d: 4, op: '×2' }, { n: 3, d: 6, op: '×3' }, { n: 4, d: 8, op: '×4' }]));
        const c2 = UI.el('div', '', Parts.chain([{ n: 4, d: 8 }, { n: 2, d: 4, op: '÷2' }, { n: 1, d: 2, op: '÷2' }]));
        a.append(c1, c2); Anim.from([c1, c2], { y: 20, opacity: 0, stagger: 0.25, duration: 0.5 });
        await ctx.say('Duster', 'These are equivalent fractions: they show the same amount. Multiply or divide the top and bottom by the same number.', { actor: 'duster' });
      },
      // Beats 9–11: guided multiply 1/3 ×2
      async (ctx) => {
        const a = Learn.area(130); const r = Learn.row(a);
        const box = Learn.big(r, { shape: 'square', d: 3, n: 1, cols: 3, width: 210 });
        const tb = Learn.toolbox(r, 'Your turn', 'tool_cutter', ['×2']);
        const host = UI.el('div'); r.appendChild(host);
        await ctx.say('Duster', 'Now you try. Tap ×2.', { wait: false, actor: 'duster', pose: 'point' });
        const stop = Parts.tapHint(tb._btns[0]);
        await ctx.tap(tb._btns[0]); stop(); tb._btns[0].disabled = true;
        await ctx.lock(() => cutAnim(ctx, box._b, { d: 6, n: 2, cols: 3 }));
        box._lab.innerHTML = '?';
        await ctx.say('Duster', 'Each strip split in 2. What is the new fraction?', { wait: false, actor: 'duster' });
        await Learn.ask(ctx, host, [2, 6], { batt: box._b });
        Learn.relabel(box, 2, 6); UI.feedback('ok', 'Yes! 1/3 = 2/6. Twice as many pieces, same charge.');
        await ctx.say('Duster', 'Yes! 1/3 = 2/6.', { actor: 'duster' });
      },
      // Beats 12–14: guided divide 2/8 ÷2
      async (ctx) => {
        const a = Learn.area(130); const r = Learn.row(a);
        const box = Learn.big(r, { shape: 'square', d: 8, n: 2, width: 210 });
        const tb = Learn.toolbox(r, 'Your turn', 'tool_merger', ['÷2']);
        const host = UI.el('div'); r.appendChild(host);
        await ctx.say('Duster', 'Now tap ÷2 to join each pair of cells.', { wait: false, actor: 'duster', pose: 'point' });
        const stop = Parts.tapHint(tb._btns[0]);
        await ctx.tap(tb._btns[0]); stop(); tb._btns[0].disabled = true;
        await ctx.lock(() => joinAnim(ctx, box._b, { d: 4, n: 1 }));
        box._lab.innerHTML = '?';
        await ctx.say('Duster', 'What is the new fraction?', { wait: false, actor: 'duster' });
        await Learn.ask(ctx, host, [1, 4], { batt: box._b });
        Learn.relabel(box, 1, 4); UI.feedback('ok', 'Yes! 2/8 = 1/4. Half as many pieces, same charge.');
        await ctx.say('Duster', 'Yes! 2/8 = 1/4.', { actor: 'duster' });
      },
      // Beats 15–23: three locked slots 2/3, 4/6, 6/9
      async (ctx) => {
        const a = Learn.area(120);
        const r = Learn.row(a, 30);
        const data = [[2, 3, 1], [4, 6, 2], [6, 9, 3]];
        const boxes = data.map(([n, d], i) => {
          const box = Learn.big(r, { shape: 'square', d, n, cols: 3, width: 165 }, i === 0);
          if (i) { const lk = UI.el('img'); lk.src = 'assets/batteries/slot_lock.webp'; lk.alt = 'locked'; lk.style.cssText = 'position:absolute;width:62px;left:50%;bottom:-6px;transform:translateX(-50%);'; box.appendChild(lk); box._lock = lk; box._lab.style.visibility = 'hidden'; }
          return box;
        });
        const host = UI.el('div'); a.appendChild(host);
        Cast.add('byte', { char: 'byte', pose: 'point', x: 990, bottom: 440, h: 140 }); Cast.enter('byte', 'up');
        await ctx.say('Byte', '6/9 has bigger numbers. It must have more charge!', { actor: 'byte' });
        await ctx.say('Duster', 'Let’s check. Write each charge to unlock its slot.', { actor: 'duster', pose: 'explain' });
        for (let i = 1; i < 3; i++) {
          const box = boxes[i]; box.classList.add('demo');
          if (i === 1) {
            await ctx.say('Duster', 'How many parts are charged?', { wait: false, actor: 'duster', pose: 'point' });
            await ctx.lock(() => ctx.play(Battery.count(box._b, 'charged')));
            await ctx.wait(0.4);
            await ctx.say('Duster', 'How many parts in all? Write the fraction for slot 2.', { wait: false, actor: 'duster' });
            await ctx.lock(() => ctx.play(Battery.count(box._b, 'all')));
          } else {
            Battery.set(box._b, { num: null });
            await ctx.say('Duster', 'Your turn. No counting help this time: slot 3.', { wait: false, actor: 'duster' });
          }
          await Learn.ask(ctx, host, data[i].slice(0, 2), { label: `Slot ${i + 1}`, batt: box._b });
          box.classList.remove('demo');
          box._lock.remove(); box._lab.style.visibility = ''; Battery.set(box._b, { num: null });
          Parts.badge(box, 'ok'); UI.feedback('ok', `Yes! ${data[i][0]}/${data[i][1]}. The slot opens.`);
          host.innerHTML = '';
          await ctx.wait(0.8);
        }
        UI.feedback(null);
        const same = await Learn.yesNo(ctx, host, 'Is the charge the same in all three?');
        // stack them on the tray: the proof is the same either way
        await ctx.lock(async () => {
          const tray = UI.el('img'); tray.src = 'assets/props/l1_stack_tray.webp'; tray.alt = '';
          r.style.position = 'relative'; r.style.isolation = 'isolate';
          tray.style.cssText = `position:absolute;width:250px;z-index:-1;left:${boxes[1].offsetLeft + boxes[1].offsetWidth / 2 - 125}px;top:${boxes[1].offsetTop + boxes[1]._b.offsetHeight * 0.62}px;`;
          r.appendChild(tray); Anim.from(tray, { opacity: 0, y: 20, duration: 0.3 });
          const [xm] = Anim.centre(boxes[1]._b);
          await ctx.play(gsap.timeline()
            .to(boxes[0], { x: xm - Anim.centre(boxes[0]._b)[0], duration: Anim.reduced ? 0.01 : 0.7, ease: 'power2.inOut' })
            .to(boxes[2], { x: xm - Anim.centre(boxes[2]._b)[0], duration: Anim.reduced ? 0.01 : 0.7, ease: 'power2.inOut' }, '<0.15')
            .to([boxes[1]._b, boxes[2]._b], { opacity: 0.55, duration: 0.3 }, '<0.4')
            .to([boxes[0]._lab, boxes[1]._lab, boxes[2]._lab, boxes[0].querySelector('.badge'), boxes[1].querySelector('.badge'), boxes[2].querySelector('.badge')].filter(Boolean), { opacity: 0, duration: 0.2 }, '<'));
          host.innerHTML = Parts.chain([{ n: 2, d: 3 }, { n: 4, d: 6 }, { n: 6, d: 9 }]);
          Anim.pop(host); BSC.Audio.play('ok');
        });
        await ctx.say('Duster', same ? 'Right! They match.' : 'Look: stacked up, they match exactly.', { actor: 'duster' });
        Cast.pose('byte', 'nod');
        await ctx.say('Byte', 'The number looks bigger, but it carries the same charge!', { actor: 'byte' });
        Cast.exit('byte');
      },
      // Beat 24: hand-off
      async (ctx) => {
        const a = Learn.area(); a.innerHTML = '';
        Cast.exit('duster', 'holo');
        Cast.add('ira', { char: 'ira', pose: 'talk', x: 560, bottom: 150, h: 400 }); Cast.enter('ira', 'up');
        await ctx.say('Ira', 'Now let’s charge the bots! Find a slot with the same charge as each bot.', { actor: 'ira', next: 'Start' });
      },
    ];
    await Learn.run(ctx, steps, params.step || 0);
    ctx.next();
  };

  // ------------------------------------------------------------ Level 1 Play
  BSC.Scenes.l1game = async function (ctx, params) {
    UI.setBg('bg_station_morning', { tint: 'soft' });
    const items = Levels.L1;
    for (let i = params.step || 0; i < items.length; i++) {
      ctx.save(i);
      UI.hud.progress(i, items.length);
      await playItem(ctx, items[i], i);
    }
    // A16: end
    UI.hud.progress(items.length, items.length);
    UI.world().innerHTML = ''; UI.feedback(null);
    const row = UI.el('div'); row.style.cssText = 'position:absolute;left:300px;top:180px;width:680px;display:grid;grid-template-columns:repeat(4,1fr);gap:20px;';
    [[1, 2], [2, 4], [3, 6], [4, 8]].forEach(([n, d]) => row.appendChild(Parts.slot({ shape: 'circle', d, n, width: 120 })));
    UI.world().appendChild(row);
    Cast.add('byte', { char: 'byte', pose: 'cheer', x: 1090, bottom: 300, h: 190 }); Cast.enter('byte', 'right'); Cast.idle('byte');
    await ctx.say('Byte', 'Bigger numbers. Same charge.', { actor: 'byte' });
    await ctx.say('Ira', 'Every bot is charged! Level 1 complete.', { next: 'Continue' });
    await levelDone(ctx, 1);
  };

  async function levelDone(ctx, n) {
    BSC.Store.completeLevel(n);
    BSC.Audio.play('win'); Anim.confetti();
    const titles = { 1: 'Equivalent fractions', 2: 'Simplest form', 3: 'Comparing fractions' };
    await new Promise((resolve) => UI.modal(`<h2>Level ${n} complete!</h2><p>${titles[n]}: mastered. Station power is rising.</p>`, [
      { label: 'Continue', variant: 'primary', onClick: () => { UI.closeModal(); resolve(); } },
      { label: 'Levels', onClick: () => { UI.closeModal(); Game.go('levels'); } },
    ]));
    ctx.next();
  }
  BSC.levelDone = levelDone;

  /** One A-item. Resolves when the bot is charged and the learner presses Next. */
  function playItem(ctx, L, idx) {
    return new Promise((resolve, reject) => {
      const w = UI.world(); w.innerHTML = ''; UI.feedback(null); UI.actions([]);
      const [n, d] = L.need;
      let tries = 0, hintRung = 0, solved = false, picked = false, idleT = null;

      // Bot card (left)
      const card = UI.el('div', 'botcard selectable'); card.tabIndex = 0; card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Bot needing ${n} over ${d}. Drag to a slot, or press to pick up and then choose a slot.`);
      w.appendChild(card);
      Cast.add('bot', { char: L.bot, pose: 'neutral', x: 135, bottom: 175, h: 220, parent: card });
      Cast.screen('bot', UI.frac(n, d));
      const need = Battery.create({ shape: L.shape, d, n, width: 150 }); need.style.cssText += 'position:absolute;left:60px;bottom:16px;';
      card.appendChild(need);
      const tag = UI.el('div', 'label-plate', `Needs ${UI.frac(n, d)}`); tag.style.cssText = 'position:absolute;left:50%;top:-22px;transform:translateX(-50%);font-size:24px;white-space:nowrap;'; card.appendChild(tag);

      // Slots (right)
      const order = [0, 1, 2, 3].sort((a, b) => ((a * 7 + idx * 3) % 5) - ((b * 7 + idx * 3) % 5));
      const slotsData = order.map((k) => L.slots[k]);
      const row = UI.el('div', 'slots-row'); w.appendChild(row);
      const slots = slotsData.map(([sn, sd]) => {
        const s = Parts.slot({ shape: L.shape, d: sd, n: sn, width: 150 });
        s.classList.add('selectable'); s.tabIndex = 0; s.setAttribute('role', 'button'); s.setAttribute('aria-label', `Slot with ${sn} over ${sd}`);
        row.appendChild(s); return s;
      });
      Anim.from(slots, { y: 30, opacity: 0, stagger: 0.08, duration: 0.4 });
      Anim.from(card, { x: -80, opacity: 0, duration: 0.5 });

      // Instructions (standing question stays in the bot tag; dialogue explains)
      if (L.nudge) ctx.say('Ira', `This bot needs ${n}/${d}. Look at the charged part, then drag the bot to the slot with the same charge.`, { wait: false });
      else if (L.newShape) ctx.say('Ira', `New batteries! This bot needs ${n}/${d}. Find the same charge.`, { wait: false });
      else if (L.fewer) ctx.say('Ira', `This bot needs ${n}/${d}. This time, look for fewer, bigger pieces.`, { wait: false });
      else ctx.say(L.bot[0].toUpperCase() + L.bot.slice(1), `I need ${n}/${d} charge, please!`, { wait: false });

      const showHint = (force) => {
        hintRung = Math.max(hintRung + 1, force || 0);
        const [x, y] = L.answer;
        if (hintRung === 1) UI.feedback('hint', 'Look at how much of the battery is charged, not how big the numbers are.');
        else if (hintRung === 2) UI.feedback('hint', `${L.op[0] === '×' ? 'Multiply' : 'Divide'} the top and bottom by the same number: ${n}/${d} → ?/${y}  (${L.op.join('')} on top and bottom)`);
        else { UI.feedback('hint', 'The dashed outline on every slot shows the bot’s charge. Which charged part fits it exactly?'); slots.forEach((s) => Battery.ghost(s._batt, n / d)); }
      };
      UI.hud.setHint(() => showHint());

      // Idle help
      const armIdle = () => { clearTimeout(idleT); if (solved) return; idleT = setTimeout(() => { if (!ctx.alive || solved || Game.paused) return; Parts.handDemo(ctx, card, row).catch(() => {}); ctx.say('Ira', 'Drag the bot to a slot.', { wait: false }); }, 9000); };
      armIdle();
      if (L.nudge) setTimeout(() => { if (ctx.alive && !solved) Parts.handDemo(ctx, card, row).catch(() => {}); }, 700);

      const select = (on) => { picked = on; card.classList.toggle('selected', on); if (on) { BSC.Audio.play('pick'); UI.feedback('info', 'Now tap the slot with the same charge.'); } };

      async function drop(k) {
        if (solved || Game.busy) return;
        clearTimeout(idleT);
        select(false); UI.feedback(null);
        const s = slots[k], [sn, sd] = slotsData[k];
        slots.forEach((x) => { x.classList.remove('is-bad'); Parts.badge(x, null); if (hintRung < 3) Battery.ghost(x._batt, null); });
        if (F.equal([sn, sd], L.need)) {
          solved = true; UI.hud.setHint(null);
          await ctx.lock(async () => {
            const ghost = card.cloneNode(true); ghost.classList.add('drag-ghost'); ghost.style.left = ghost.style.top = '';
            const [cx, cy] = Anim.centre(card), [tx, ty] = Anim.centre(s._batt);
            ghost.style.cssText += `left:${cx}px;top:${cy}px;width:270px;height:420px;`;
            w.appendChild(ghost); card.style.opacity = 0.2;
            await ctx.play(Anim.to(ghost, { left: tx, top: ty, scale: 0.35, opacity: 0.0, duration: 0.6, ease: 'power2.in' }));
            ghost.remove();
            s.classList.add('is-ok'); Parts.badge(s, 'ok');
            BSC.Audio.play('charge'); Anim.burst(tx, ty, 'cyan', 14);
            await ctx.play(Battery.set(s._batt, {}, { anim: 'fill' }));
            card.style.opacity = 1; Cast.pose('bot', 'happy'); Cast.hop('bot');
            const why = sd > d ? `each piece of ${n}/${d} is cut into ${sd / d}` : `every ${d / sd} pieces of ${n}/${d} are joined into 1`;
            UI.feedback('ok', `Right slot! ${n}/${d} = ${sn}/${sd}: ${why}.`);
          });
          clearTimeout(idleT);
          ctx.say('Ira', `Right slot! ${n}/${d} = ${sn}/${sd}.`, { wait: false });
          const b = UI.button(idx < Levels.L1.length - 1 ? 'Next bot ▸' : 'Finish ▸', { variant: 'primary' });
          UI.actions([b]);
          ctx.tap(b).then(resolve, reject);
          return;
        }
        // wrong slot: proportional, explained feedback
        tries++;
        await ctx.lock(async () => {
          s.classList.add('is-bad'); Parts.badge(s, 'bad');
          Battery.ghost(s._batt, n / d);
          const [tx, ty] = Anim.centre(s._batt); Anim.burst(tx, ty, 'spark', 10); Anim.wiggle(s);
          Anim.shake(card, 10);
          const cmp = F.compare([sn, sd], L.need);
          let msg;
          if (sn === n && sd !== d) msg = `Same top number, but the pieces are a different size. ${sn}/${sd} is ${cmp > 0 ? 'more' : 'less'} charge than ${n}/${d}.`;
          else if (cmp > 0) msg = `Too much charge: ${sn}/${sd} goes past the bot’s ${n}/${d} (dashed outline).`;
          else msg = `Not enough charge: ${sn}/${sd} doesn’t reach the bot’s ${n}/${d} (dashed outline).`;
          UI.feedback('bad', msg);
          await ctx.wait(0.4);
        });
        if (tries >= 2 && hintRung < 2) showHint(2);
        armIdle();
      }

      // ---- input: drag, or tap-then-tap, or keyboard ----
      let drag = null;
      // Stop the browser's own image drag (it swallows pointerup and leaves a stuck ghost + copy of the bot).
      card.addEventListener('dragstart', (e) => e.preventDefault());
      card.querySelectorAll('img').forEach((im) => { im.draggable = false; });
      const clearDrag = () => {
        if (drag && drag.g) drag.g.remove();
        drag = null; card.classList.remove('dragging');
        w.querySelectorAll('.drag-ghost').forEach((g) => { if (g !== card) g.remove(); });
        slots.forEach((s) => s.classList.remove('over'));
      };
      card.addEventListener('pointerdown', (e) => {
        if (!ctx.alive || solved || Game.busy || Game.paused) return;
        if (e.button > 0) return; // ignore right/middle clicks
        e.preventDefault();
        clearDrag();
        armIdle();
        drag = { x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
        try { card.setPointerCapture(e.pointerId); } catch (err) { /* pointer already released */ }
      });
      card.addEventListener('pointermove', (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        if (!drag.moved && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) {
          drag.moved = true; BSC.Audio.play('pick'); UI.feedback(null);
          const g = UI.el('div', 'drag-ghost');
          const img = UI.el('img'); img.src = Cast.src(L.bot, 'neutral'); img.style.height = '200px'; img.alt = ''; img.draggable = false;
          g.appendChild(img); w.appendChild(g); drag.g = g; card.classList.add('dragging');
        }
        if (drag.g) {
          const sr = document.getElementById('stage').getBoundingClientRect(), k = UI.scale();
          drag.g.style.left = (e.clientX - sr.left) / k + 'px'; drag.g.style.top = (e.clientY - sr.top) / k + 'px';
          slots.forEach((s) => s.classList.remove('over'));
          const over = document.elementFromPoint(e.clientX, e.clientY); const sl = over && over.closest('.slot');
          if (sl) sl.classList.add('over');
        }
      });
      const end = (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const dd = drag; drag = null; card.classList.remove('dragging');
        slots.forEach((s) => s.classList.remove('over'));
        if (dd.g) {
          dd.g.remove();
          if (e.type !== 'pointerup') return; // cancelled or capture lost: just put the bot back
          const over = document.elementFromPoint(e.clientX, e.clientY); const sl = over && over.closest('.slot');
          if (sl) { BSC.Audio.play('drop'); drop(slots.indexOf(sl)); } else { Anim.shake(card, 6); }
        } else if (e.type === 'pointerup') select(!picked);
      };
      card.addEventListener('pointerup', end); card.addEventListener('pointercancel', end);
      card.addEventListener('lostpointercapture', (e) => { if (drag && e.pointerId === drag.id) end(e); });
      window.addEventListener('blur', () => { if (drag) clearDrag(); });
      card.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !solved) { e.preventDefault(); select(!picked); } });
      slots.forEach((s, k) => {
        const act = () => { if (!ctx.alive || solved || Game.busy || Game.paused) return; armIdle(); if (picked) drop(k); else { UI.feedback('info', 'First pick up the bot: drag it here, or tap the bot and then this slot.'); Anim.shake(card, 6); } };
        s.addEventListener('click', act);
        s.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); } });
      });
    });
  }
})(window.BSC = window.BSC || {});
