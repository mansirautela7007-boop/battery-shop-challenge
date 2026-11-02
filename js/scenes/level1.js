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
    duster(pose = 'explain', { x = 1150, bottom = 150, h = 360 } = {}) {
      if (!Cast.get('duster')) { Cast.add('duster', { char: 'duster', pose, x, bottom, h }); Cast.enter('duster', 'holo'); Cast.idle('duster'); }
      else { Object.assign(Cast.get('duster').style, { left: x + 'px', bottom: bottom + 'px', height: h + 'px' }); Cast.pose('duster', pose); }
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

  // ------------------------------------------------------------ "Cut and join" intro (9-frame storyboard)
  // Layout follows the storyboard image (1280×720 stage), at a calmer size. Duster stays half-body in the corner and
  // talks in a speech bubble; the circle, the cut tools and the panels move between fixed spots.
  // Frames 1, 6, 9 wait for the round arrow; 2, 7, 8 wait for the highlighted tool; 3–5 play by themselves.
  const plain = (s) => String(s).replace(/\*\*/g, '').replace(/\|/g, ' ');
  const rich = (s) => String(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').split('|').map((p, i) => `<p class="${i ? 'sub' : /\*\*/.test(s) ? 'mixed' : 'lead'}">${p}</p>`).join('');
  const CF = {
    duster: { x: 150, h: 640, bottom: -300 }, // half body: waist at the bottom edge, same spot in every frame
    bubble: { left: 34, bottom: 352, width: 380 }, // sits on Duster's head (bottom-anchored, grows upward), tail points down at him
    circle: { right: { x: 640, top: 150, w: 320 }, left: { x: 640, top: 150, w: 320 }, mid: { x: 640, top: 150, w: 290 } }, // battery stays centred
    tools: { side: { left: 850, top: 330, width: 300, height: 160 } }, // always right beside the battery (below the cutter's path)
  };

  async function cutFlow(ctx) {
    BSC.Dialog.hide();
    const w = UI.world();
    const old = document.getElementById('cutflow'); if (old) old.remove();
    const root = UI.el('div'); root.id = 'cutflow'; w.appendChild(root);

    // Duster: solid (no hologram), half body in the bottom-left corner for the whole intro.
    if (!Cast.get('duster')) Cast.add('duster', { char: 'duster', pose: 'point', x: CF.duster.x, bottom: CF.duster.bottom, h: CF.duster.h });
    const dEl = Cast.get('duster'); dEl.classList.remove('holo'); dEl.classList.add('cf-duster');
    gsap.set(dEl, { left: CF.duster.x, bottom: CF.duster.bottom, height: CF.duster.h, opacity: 0 });
    Cast.pose('duster', 'point'); Cast.idle('duster');

    const bubble = UI.el('div', 'sbubble'); bubble.hidden = true; root.appendChild(bubble);
    const circ = UI.el('div', 'cf-circle'); root.appendChild(circ);
    const batt = Battery.create({ shape: 'circle', d: 2, n: 1, width: 320 }); circ.appendChild(batt);
    const plate = UI.el('div', 'label-plate cf-plate', UI.frac(1, 2)); circ.appendChild(plate);
    const tools = UI.el('div', 'panel cf-tools'); tools.hidden = true;
    tools.innerHTML = '<div class="cf-title">Cut each part into</div>';
    const trow = UI.el('div', 'cf-row'); tools.appendChild(trow);
    const btns = ['×2', '×3', '×4'].map((t) => { const b = UI.el('button', 'tool', t); b.type = 'button'; trow.appendChild(b); return b; });
    root.appendChild(tools);

    const dur = () => (Anim.reduced ? 0.01 : 0.45);
    const placeCircle = (k) => { const p = CF.circle[k]; return gsap.to(circ, { left: p.x - p.w / 2, top: p.top, width: p.w, duration: dur(), ease: 'power2.inOut' }); };
    const placeTools = () => gsap.to(tools, Object.assign({ opacity: 1, duration: dur(), ease: 'power2.inOut' }, CF.tools.side));
    const placeBubble = (k) => { Object.assign(bubble.style, { left: CF.bubble.left + 'px', top: 'auto', bottom: CF.bubble.bottom + 'px', width: CF.bubble.width + 'px' }); bubble.dataset.size = k; };
    const relabel = (n, d) => { plate.innerHTML = UI.frac(n, d); Anim.pop(plate); };
    gsap.set(circ, { left: CF.circle.right.x - CF.circle.right.w / 2, top: CF.circle.right.top, width: CF.circle.right.w });
    gsap.set(tools, CF.tools.side); tools.dataset.size = 'md'; tools.hidden = false;

    // Speak a line in the bubble. mode: 'arrow' (wait for ›), 'auto' (move on after the voice / reading time), 'none' (return at once)
    async function line(text, { mode = 'auto', pose = null, at = 'intro', show = true, hl = null } = {}) {
      ctx.check();
      if (pose) Cast.pose('duster', pose);
      bubble.hidden = !show;
      if (show) { placeBubble(at); bubble.innerHTML = rich(text) + (hl ? `<p class="hl">${hl}</p>` : ''); Anim.fromTo(bubble, { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 }); }
      Cast.talk('duster');
      const spoken = BSC.Audio.voice('Duster', plain(text) + (hl ? ' ' + hl : ''));
      if (mode === 'none') return;
      if (mode === 'arrow') return arrow();
      const ok = await spoken; ctx.check();
      await ctx.hold(ok ? 0.5 : Math.max(2, 1 + plain(text).split(/\s+/).length * 0.3));
    }
    async function arrow() {
      const b = UI.button('›', { variant: 'arrow', aria: 'Next' });
      UI.actions([b]); await ctx.tap(b); UI.actions([]); BSC.Audio.stopVoice(); ctx.check();
    }
    // Ring one tool (dashed) and wait for it; the others just nudge.
    function tapTool(k) {
      btns.forEach((b, i) => { b.classList.toggle('demo', i === k - 2); b.classList.remove('picked'); });
      return new Promise((resolve) => btns.forEach((b, i) => ctx.on(b, 'click', () => {
        if (i !== k - 2) { UI.feedback('hint', `Tap ×${k} this time.`); Anim.shake(b, 6); return; }
        UI.feedback(null); if (k === 2) { b.classList.remove('demo'); b.classList.add('picked'); } BSC.Audio.play('tap'); resolve();
      })));
    }
    // Frame 3: the cutter fires a laser at the circle; the new cut lines glow, then the parts split.
    async function laser(k) {
      const R = Battery.CASINGS.circle.region, C = Battery.CASINGS.circle;
      const cw = parseFloat(circ.style.width), cl = parseFloat(circ.style.left), ct = parseFloat(circ.style.top);
      const s = cw / C.w, cx = cl + R.cx * s, cy = ct + R.cy * s, r = R.r * s;
      const gun = UI.el('img'); gun.src = 'assets/batteries/tool_cutter.webp'; gun.alt = ''; gun.className = 'cf-gun';
      const gw = 200, gx = cx + r * 1.12, gy = cy - r * 1.05;
      gun.style.cssText = `left:${gx}px;top:${gy}px;width:${gw}px;`;
      root.appendChild(gun);
      const mx = gx + 8, my = gy + gw * 0.52 * 0.3; // muzzle (left end of the barrel)
      const beam = UI.el('div', 'cf-beam'); const len = Math.hypot(mx - cx, my - cy), ang = Math.atan2(cy - my, cx - mx);
      beam.style.cssText = `left:${mx}px;top:${my}px;width:${len}px;`;
      root.appendChild(beam); gsap.set(beam, { rotation: (ang * 180) / Math.PI, scaleX: 0.001, transformOrigin: '0% 50%' });
      const svg = batt.querySelector('svg'), d = 2 * k;
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g'); g.setAttribute('class', 'b-laser');
      for (let i = 0; i < d; i++) { const a = -Math.PI / 2 + (2 * Math.PI * i) / d; g.innerHTML += `<path d="M${R.cx},${R.cy}L${(R.cx + R.r * Math.cos(a)).toFixed(1)},${(R.cy + R.r * Math.sin(a)).toFixed(1)}"/>`; }
      svg.appendChild(g);
      BSC.Audio.play('cut');
      await ctx.play(gsap.timeline()
        .fromTo(gun, { x: 60, opacity: 0, rotation: -18 }, { x: 0, opacity: 1, rotation: -18, duration: Anim.reduced ? 0.01 : 0.35, ease: 'power2.out' })
        .to(beam, { scaleX: 1, duration: Anim.reduced ? 0.01 : 0.25, ease: 'power1.in' })
        .fromTo(g, { opacity: 0 }, { opacity: 1, duration: 0.2 }, '<0.15'));
      Anim.burst(cx, cy, 'spark', 12);
      await ctx.play(Battery.set(batt, { d, n: k }, { anim: 'split' }));
      await ctx.play(gsap.timeline().to([beam, g], { opacity: 0, duration: 0.3 }).to(gun, { opacity: 0, x: 40, duration: 0.3 }, '<0.1'));
      gun.remove(); beam.remove(); g.remove();
    }
    const reset = () => { Battery.set(batt, { d: 2, n: 1 }); relabel(1, 2); };

    // 1. Introduction
    await ctx.play(gsap.to(dEl, { opacity: 1, duration: dur() }));
    Anim.from(tools, { x: 40, opacity: 0, duration: 0.4 });
    await line('This circle shows **1 out of 2 equal parts,** which we write as **1/2**.', { pose: 'point', at: 'intro' });
    // 2. Instruction: tap the highlighted tool beside the battery
    line('Let’s cut each part into 2 equal pieces.|Choose how many pieces to make from each part.', { mode: 'none', pose: 'explain', at: 'tools' });
    await tapTool(2);
    // 3. Action: laser cut (battery and tools stay where they are)
    bubble.hidden = true; BSC.Audio.stopVoice();
    await ctx.lock(() => laser(2));
    relabel(2, 4);
    await ctx.hold(0.4);
    // 4. Pieces created
    await line('Great! Each half is now cut into 2 pieces.|Now we have 4 equal parts.', { pose: 'point', at: 'intro' });
    // 5. Concept
    await line('Two out of four parts are shaded.', { pose: 'explain', at: 'intro', hl: 'The shaded amount is the same!' });
    // 6. Equation
    bubble.hidden = true; gsap.to([circ, tools], { opacity: 0, duration: 0.25 });
    const eq = UI.el('div', 'panel cf-panel cf-eqpanel');
    eq.innerHTML = `<div class="cf-head">These fractions are equivalent.</div>
      <div class="cf-eq">${UI.frac(1, 2)}<span class="cf-sign">=</span>
      <span class="fr cf-mul"><b><em>1</em> × <u>2</u></b><i><em>2</em> × <u>2</u></i></span><span class="cf-sign">=</span>${UI.frac(2, 4)}</div>`;
    root.appendChild(eq); Anim.pop(eq);
    await line('These fractions are equivalent. 1/2 equals 1 times 2 over 2 times 2, which is 2/4.', { pose: 'explain', show: false });
    eq.remove();
    // 7–8. Try ×3, then ×4: bubble, circle and tools side by side
    for (const [k, txt, pose] of [[3, 'Let’s try ×3.|Each half will be cut into 3 pieces.', 'explain'], [4, 'Now try ×4.|Each half will be cut into 4 pieces.', 'point']]) {
      reset();
      tools.hidden = false;
      await ctx.play(gsap.timeline().add(placeCircle('mid')).to(circ, { opacity: 1, duration: 0.3 }, '<').add(placeTools(), '<'));
      line(txt, { mode: 'none', pose, at: 'small' });
      await tapTool(k);
      await ctx.lock(() => laser(k));
      relabel(k, 2 * k);
      await ctx.hold(1.2);
    }
    // 9. Summary
    bubble.hidden = true; gsap.to([circ, tools], { opacity: 0, duration: 0.25 });
    const sum = UI.el('div', 'panel cf-panel cf-sumpanel');
    sum.innerHTML = '<div class="cf-head">Summary</div>';
    const srow = UI.el('div', 'cf-sum'); sum.appendChild(srow);
    [[1, 2], [2, 4], [3, 6], [4, 8]].forEach(([n, d], i) => {
      if (i) srow.appendChild(UI.el('span', 'cf-sign', '='));
      const cell = UI.el('div', 'cf-sumcell'); cell.appendChild(Battery.create({ shape: 'circle', d, n, width: 118 }));
      cell.appendChild(UI.el('div', 'label-plate', UI.frac(n, d))); srow.appendChild(cell);
    });
    sum.appendChild(UI.el('div', 'cf-banner', 'When we cut each part into equal pieces,<br>the shaded amount stays the same.'));
    root.appendChild(sum); Anim.pop(sum);
    await line('When we cut each part into equal pieces, the shaded amount stays the same.', { pose: 'explain', show: false });
    root.remove();
    // Back to the usual hologram Duster on the right for the rest of the lesson.
    dEl.classList.remove('cf-duster'); dEl.classList.add('holo'); gsap.set(dEl, { opacity: 1 });
    Learn.duster('explain');
  }

  // ------------------------------------------------------------ Level 1 Learn
  BSC.Scenes.l1learn = async function (ctx, params) {
    ctx.auto = true; ctx.float = false; // no Next/arrow buttons: lines move on after the voice; keep the bottom dialogue
    ctx.auto = true; ctx.float = false; // no Next/arrow buttons: lines move on after the voice; keep the bottom dialogue
    UI.setBg('bg_learning_bench');
    if ((params.step || 0) > 0) Learn.duster(); // step 0 (the cut intro) places Duster itself
    const steps = [
      // Beats 1–4: cut each part of 1/2 with ×2, ×3, ×4 (9-frame storyboard: speech bubble, round arrow, summary)
      cutFlow,
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

  /** Stage-space box of an element (the stage is scaled to fit the window). */
  function box(el) {
    const st = document.getElementById('stage').getBoundingClientRect(), r = el.getBoundingClientRect(), k = UI.scale();
    return { x: (r.left - st.left) / k, y: (r.top - st.top) / k, w: r.width / k, h: r.height / k };
  }
  /** Right slot: the bot hops over to the charger, the charger's cable plugs into it and it charges up. */
  async function plugIn(ctx, { card, slot, bot, n, d }) {
    const w = UI.world(), dock = box(slot.querySelector('.slot-dock')), from = box(card), botH = 120;
    BSC.Dialog.hide(); // clear the floor: the old instruction would cover the bot
    // 1. The bot leaves its card and hops in an arc to stand in front of its charger.
    const sx = dock.x + dock.w * 0.58, groundY = dock.y + dock.h + 94; // just in front of its own charger, below its label
    const a = Cast.add('plugged', { char: bot, pose: 'neutral', x: sx, bottom: 720 - groundY, h: botH, cls: 'plugged', parent: w });
    Cast.screen('plugged', UI.frac(n, d));
    const inCard = Cast.get('bot'); if (inCard) gsap.to(inCard, { opacity: 0, duration: 0.2 });
    card.classList.add('emptied');
    const dx = from.x + from.w / 2 - sx, dy = from.y + from.h * 0.62 - (groundY - botH / 2), apex = Math.min(dy, 0) - 90;
    BSC.Audio.play('pick');
    await ctx.play(gsap.timeline()
      .fromTo(a, { x: dx }, { x: 0, duration: Anim.reduced ? 0.01 : 0.75, ease: 'power1.inOut' }, 0)
      .fromTo(a, { y: dy }, { y: apex, duration: Anim.reduced ? 0.01 : 0.38, ease: 'power2.out' }, 0)
      .to(a, { y: 0, duration: Anim.reduced ? 0.01 : 0.37, ease: 'power2.in' }, Anim.reduced ? 0.01 : 0.38));
    BSC.Audio.play('drop');
    if (!Anim.reduced) await ctx.play(gsap.fromTo(a.querySelector('img'), { scaleY: 0.82, scaleX: 1.12, transformOrigin: '50% 100%' }, { scaleY: 1, scaleX: 1, duration: 0.4, ease: 'elastic.out(1.2, 0.4)' }));

    // 2. The cable runs from the charger's plug to the port on the bot's side and clicks in.
    const plug = [dock.x + dock.w * 0.04, dock.y + dock.h * 0.84], bb = box(a.querySelector('img'));
    const port = [bb.x + bb.w * 0.2, bb.y + bb.h * 0.6]; // port on the bot's left side, facing the plug
    const sag = [Math.min(plug[0], port[0]) - 26, Math.max(plug[1], port[1]) + 18];
    const path = `M${plug[0]},${plug[1]} Q${sag[0]},${sag[1]} ${port[0]},${port[1]}`;
    const cable = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    cable.setAttribute('class', 'plug-cable'); cable.setAttribute('viewBox', '0 0 1280 720');
    cable.innerHTML = `<path class="wire" d="${path}"/><path class="flow" d="${path}"/><circle class="jack" cx="${port[0]}" cy="${port[1]}" r="9"/>`;
    w.appendChild(cable);
    const wire = cable.querySelector('.wire'), flow = cable.querySelector('.flow'), jack = cable.querySelector('.jack'), len = wire.getTotalLength();
    gsap.set(wire, { strokeDasharray: len, strokeDashoffset: len }); gsap.set([flow, jack], { opacity: 0 });
    await ctx.play(Anim.to(wire, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.inOut' }));
    gsap.set(jack, { opacity: 1 }); Anim.pop(jack); BSC.Audio.play('clunk'); Anim.burst(port[0], port[1], 'spark', 10);

    // 3. Charging: energy pulses along the cable, the slot's charge flashes, the bot glows and its meter fills.
    const meter = UI.el('div', 'charge-meter', '<span class="cm-ic">⚡</span><span class="cm-bar"><b></b></span>');
    meter.style.left = (sx + 112) + 'px'; meter.style.top = (groundY - botH * 0.62) + 'px'; w.appendChild(meter); // beside the bot
    Anim.pop(meter);
    gsap.set(flow, { opacity: 1 });
    if (!Anim.reduced) {
      gsap.fromTo(flow, { strokeDashoffset: 0 }, { strokeDashoffset: -60, duration: 0.5, ease: 'none', repeat: -1 }); // keeps flowing while plugged
      gsap.to(a.querySelector('img'), { filter: 'drop-shadow(0 0 18px rgba(69,227,255,.95)) drop-shadow(0 12px 12px rgba(30,34,82,.3))', duration: 0.35, yoyo: true, repeat: 5 });
    }
    a.classList.add('charging');
    BSC.Audio.play('charge');
    Battery.set(slot._batt, {}, { anim: 'fill' });
    const sparks = Anim.reduced ? null : gsap.to({}, { duration: 0.22, repeat: 6, onRepeat: () => Anim.burst(bb.x + bb.w / 2, bb.y + bb.h * 0.45, 'cyan', 3) });
    await ctx.play(Anim.fromTo(meter.querySelector('b'), { width: '0%' }, { width: '100%', duration: 1.5, ease: 'power1.inOut' }));
    if (sparks) sparks.kill();

    // 4. Full: the meter goes green, the bot cheers.
    meter.classList.add('full'); meter.querySelector('.cm-ic').textContent = '✓';
    a.classList.remove('charging');
    BSC.Audio.play('star'); Anim.burst(sx + 112, groundY - botH * 0.55, 'star', 10);
    Cast.pose('plugged', 'happy'); await ctx.play(Cast.hop('plugged'));
  }

  /** One A-item. Resolves when the bot is charged and the learner presses Next. */
  function playItem(ctx, L, idx) {
    return new Promise((resolve, reject) => {
      const w = UI.world(); w.innerHTML = ''; UI.feedback(null); UI.actions([]);
      const [n, d] = L.need;
      let tries = 0, hintRung = 0, solved = false, picked = false, idleT = null;

      // Charging platform: the bot waits on the first pad, the four chargers stand on the others
      const plat = UI.el('div', 'l1-platform', '<div class="deck"></div>' + [0, 1, 2, 3, 4].map((i) => `<i class="pad" style="left:${108 + 216 * i}px"></i>`).join('') + '<b class="glow c" style="left:240px"></b><b class="glow p" style="left:470px"></b><b class="glow c" style="left:700px"></b><b class="glow p" style="left:930px"></b>');
      w.appendChild(plat);
      // The bot (drag handle) on pad 1, with a small "Needs" tag showing its charge
      const card = UI.el('div', 'botcard selectable'); card.tabIndex = 0; card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `Bot needing ${n} over ${d}. Drag to a slot, or press to pick up and then choose a slot.`);
      w.appendChild(card);
      Cast.add('bot', { char: L.bot, pose: 'neutral', x: 100, bottom: 10, h: 215, parent: card });
      Cast.screen('bot', UI.frac(n, d));
      const tag = UI.el('div', 'label-plate need-tag', `<span>Needs</span>${UI.frac(n, d)}`); card.appendChild(tag);
      tag.appendChild(Battery.create({ shape: L.shape, d, n, width: L.shape === 'rect' || L.shape === 'diamond' ? 76 : 52 }));

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
            s.classList.add('is-ok'); Parts.badge(s, 'ok');
            await plugIn(ctx, { card, slot: s, bot: L.bot, n, d });
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
