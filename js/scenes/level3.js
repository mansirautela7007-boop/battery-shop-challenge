/* Level 3 — Comparing fractions.
   Learn (Level 3_Draft 1: same pieces first) then Play (tutorial T1–T7, rounds G1–G10, G7a screens-off, G11 end). */
(function (BSC) {
  'use strict';
  const { UI, Cast, Anim, Parts, Battery, F, Game, Levels, Learn } = BSC;
  const gridCols = (shape, d) => (shape === 'circle' || shape === 'triangle' ? null : d); // strips: pieces added one at a time, left to right

  // ------------------------------------------------------------ Learn
  BSC.Scenes.l3learn = async function (ctx, params) {
    UI.setBg(null, { tint: 'plain' });
    const pair = (a, bf) => {
      const area = Learn.area(130);
      const r = Learn.row(area, 60);
      const A = Learn.big(r, { shape: 'rect', d: a[1], n: a[0], cols: a[1], width: 300 });
      const B = Learn.big(r, { shape: 'rect', d: bf[1], n: bf[0], cols: bf[1], width: 300 });
      A.insertAdjacentHTML('afterbegin', '<div class="label-plate dim" style="font-size:20px">Zip</div>');
      B.insertAdjacentHTML('afterbegin', '<div class="label-plate dim" style="font-size:20px">Bolt</div>');
      return { area, A, B };
    };
    const steps = [
      async (ctx) => {
        Cast.add('ira', { char: 'ira', pose: 'talk', x: 1150, bottom: 150, h: 380 }); Cast.enter('ira', 'right'); Cast.idle('ira');
        Cast.add('byte', { char: 'byte', pose: 'confused', x: 130, bottom: 430, h: 140 }); Cast.enter('byte', 'up');
        const { A, B } = pair([3, 5], [6, 10]);
        await ctx.say('Byte', '6/10 has bigger numbers. Does Bolt have more charge?', { actor: 'byte' });
        const tb = Learn.toolbox(A, 'Cut Zip’s pieces', null, ['×2']);
        const stop = Parts.tapHint(tb._btns[0]);
        await ctx.say('Ira', 'Let’s check. Tap ×2.', { wait: false, actor: 'ira' });
        await ctx.tap(tb._btns[0]); stop(); tb.remove();
        await ctx.lock(() => BSC.L1Anim.cutAnim(ctx, A._b, { d: 10, n: 6, cols: 10 }));
        Learn.relabel(A, 6, 10); Parts.badge(A, 'ok'); Parts.badge(B, 'ok');
        UI.feedback('ok', '3/5 = 6/10. Same charge!');
        await ctx.say('Ira', '3/5 is the same as 6/10. They have the same charge.', { actor: 'ira' });
        await ctx.say('Ira', 'So both bots take the trip!', { actor: 'ira', pose: 'cheer' });
      },
      async (ctx) => {
        const { A, B } = pair([5, 6], [11, 12]);
        await ctx.say('Ira', 'These pieces are different sizes. Let’s make them the same size first.', { actor: 'ira', pose: 'point' });
        const tb = Learn.toolbox(A, 'Cut Zip’s pieces', null, ['×2']);
        const stop = Parts.tapHint(tb._btns[0]);
        await ctx.say('Ira', 'Tap ×2.', { wait: false, actor: 'ira' });
        await ctx.tap(tb._btns[0]); stop(); tb.remove();
        await ctx.lock(async () => {
          await BSC.L1Anim.cutAnim(ctx, A._b, { d: 12, n: 10, cols: 12 });
          Learn.relabel(A, 10, 12);
          await ctx.play(Battery.count(A._b, 'charged'));
          await ctx.play(Battery.count(B._b, 'charged'));
        });
        Parts.badge(B, 'ok');
        UI.feedback('ok', '10 twelfths vs 11 twelfths: 11/12 is more.');
        await ctx.say('Ira', 'Zip has 10 charged pieces. Bolt has 11.', { actor: 'ira', pose: 'talk' });
        await ctx.say('Ira', '11 is more, so Bolt has more charge!', { actor: 'ira', pose: 'point' });
      },
      async (ctx) => {
        const a = Learn.area(140);
        const card = UI.el('div', 'rule-card', '<small>The rule</small>Make the pieces the same size.<br>Then compare the charged pieces.'); a.appendChild(card); Anim.pop(card);
        a.insertAdjacentHTML('beforeend', `<div class="chain">${UI.frac(3, 5, 'lg')}<span class="op">×2</span>${UI.frac(6, 10, 'lg')}<span class="eq">=</span>${UI.frac(6, 10, 'lg')}<span style="width:40px"></span>${UI.frac(5, 6, 'lg')}<span class="op">×2</span>${UI.frac(10, 12, 'lg')}<span class="eq">&lt;</span>${UI.frac(11, 12, 'lg')}</div>`);
        await ctx.say('Ira', 'First, make the pieces the same size. Then compare the charged pieces.', { actor: 'ira' });
        Cast.pose('byte', 'nod');
        await ctx.say('Byte', 'So I make the pieces the same size first. Got it!', { actor: 'byte', next: 'Let’s try' });
      },
    ];
    await Learn.run(ctx, steps, params.step || 0);
    ctx.next();
  };

  // ------------------------------------------------------------ Play
  BSC.Scenes.l3game = async function (ctx, params) {
    UI.setBg(null, { tint: 'plain' });
    const S = BSC.Store.get();
    const rounds = Levels.L3;
    for (let i = params.step || 0; i < rounds.length; i++) {
      ctx.save(i); UI.hud.progress(i, rounds.length);
      if (rounds[i].numbers && !(rounds[i - 1] && rounds[i - 1].numbers)) await screensOff(ctx);
      const first = await playRound(ctx, rounds[i], i);
      if (!rounds[i].tutorial) { S.firstTry[i] = first; BSC.Store.save(); }
      if (rounds[i].tutorial) { UI.world().innerHTML = ''; await ctx.say('Byte', 'More deliveries! Help me pick each time.', { next: 'Start' }); }
    }
    UI.hud.progress(rounds.length, rounds.length);
    UI.world().innerHTML = ''; UI.feedback(null);
    const n = Object.values(S.firstTry).filter(Boolean).length;
    const card = UI.el('div', 'panel'); card.style.cssText = 'left:50%;top:150px;transform:translateX(-50%);text-align:center;width:640px;';
    card.innerHTML = `<div class="title-card" style="display:inline-block">Every delivery is sorted!</div><p style="font-size:24px;margin:16px 0 0">Picked right on the first try: <b>${n} of 10</b> rounds</p>`;
    UI.world().appendChild(card); Anim.pop(card);
    Cast.add('byte', { char: 'byte', pose: 'cheer', x: 640, bottom: 150, h: 210 }); Cast.enter('byte', 'up'); Cast.idle('byte');
    await ctx.say('Byte', 'Bigger numbers don’t always mean more charge. Make the pieces the same, then compare!', { actor: 'byte', next: 'Continue' });
    await BSC.levelDone(ctx, 3);
  };

  async function screensOff(ctx) {
    UI.world().innerHTML = ''; UI.feedback(null); UI.actions([]);
    const box = UI.el('div', 'panel'); box.style.cssText = 'left:50%;top:170px;transform:translateX(-50%);display:flex;gap:40px;align-items:center;';
    box.innerHTML = '<div class="label-plate dim" style="font-size:22px;padding:18px">BATTERY SCREEN OFF</div><div class="label-plate dim" style="font-size:22px;padding:18px">BATTERY SCREEN OFF</div>';
    UI.world().appendChild(box);
    await ctx.play(Anim.fromTo(box.children, { opacity: 1 }, { opacity: 0.3, duration: 0.12, repeat: 5, yoyo: true }));
    Cast.add('byte', { char: 'byte', pose: 'worried', x: 640, bottom: 150, h: 190 }); Cast.enter('byte', 'up');
    await ctx.say('Byte', 'Uh oh! The battery screens are off!', { actor: 'byte' });
    await ctx.say('Ira', 'You don’t need them. Make the pieces the same in your head. Stuck? The batteries come back as a hint.');
  }

  /** One round. Resolves true if the first choice was right. */
  function playRound(ctx, R, idx) {
    return new Promise((resolve, reject) => {
      const w = UI.world(); w.innerHTML = ''; UI.feedback(null); UI.actions([]);
      let phase = 'spin', wrong = 0, recut = false;
      const st = { a: 0, b: 0 };
      const sides = {};
      const BW = Battery.wide(R.shape) ? 240 : 170;
      ['a', 'b'].forEach((k) => {
        const [name, n, d] = R[k];
        const s = UI.el('div', 'duel-side'); s.style.left = k === 'a' ? '170px' : '810px'; s.style.width = '300px'; s.style.top = '96px';
        s.innerHTML = `<div class="nm">${name}</div>`;
        w.appendChild(s);
        const bot = name.toLowerCase();
        Cast.add('bot' + k, { char: bot, pose: 'neutral', x: k === 'a' ? 80 : 1200, bottom: 300, h: 230, flip: k === 'b' && false, cls: 'small' });
        const wheel = UI.el('div', 'wheel-wrap'); wheel.innerHTML = '<img class="wheel" src="assets/props/l3_charge_wheel.webp" alt=""><div class="pointer"></div><div class="wfr"><span class="label-plate dim">?</span></div>';
        s.appendChild(wheel);
        const holder = UI.el('div'); holder.style.cssText = 'display:grid;justify-items:center;gap:8px;min-height:20px;'; s.appendChild(holder);
        sides[k] = { el: s, name, n, d, bot, wheel, holder, batt: null };
      });
      const choices = UI.el('div', 'choices'); w.appendChild(choices);
      const track = UI.el('div'); w.appendChild(track);

      BSC.sayLines(ctx, R.tutorial ? [['Byte', 'New delivery! Which bot should I send?'], ['Ira', 'Tap Spin! to see their charge.']]
        : [['Byte', 'Which bot should I send?'], ['Ira', 'Tap Spin!']], () => phase === 'spin');

      // ---------- spin ----------
      const spinBtn = UI.button('🎡 Spin!', { variant: 'primary', onClick: () => doSpin() });
      UI.actions([spinBtn]);
      async function doSpin() {
        if (phase !== 'spin') return; phase = 'spinning'; UI.actions([]);
        BSC.Audio.play('spin');
        await ctx.lock(() => ctx.play(Anim.to([sides.a.wheel.querySelector('img'), sides.b.wheel.querySelector('img')], { rotation: (i) => 1080 + i * 140, duration: 1.5, ease: 'power3.out' })));
        ['a', 'b'].forEach((k) => { const S = sides[k]; S.wheel.querySelector('.wfr').innerHTML = `<span class="label-plate">${UI.frac(S.n, S.d)}</span>`; Anim.pop(S.wheel.querySelector('.wfr')); Cast.screen('bot' + k, UI.frac(S.n, S.d)); });
        if (R.numbers) { toChoose(); return; }
        ctx.say('Ira', R.tutorial ? `${R.a[0]} has ${R.a[1]}/${R.a[2]}. ${R.b[0]} has ${R.b[1]}/${R.b[2]}.` : `${R.a[0]} has ${R.a[1]}/${R.a[2]}. ${R.b[0]} has ${R.b[1]}/${R.b[2]}. Charge both batteries.`, { wait: false });
        phase = 'charge'; buildCharge();
      }

      // ---------- charge both batteries piece by piece ----------
      function buildCharge() {
        ['a', 'b'].forEach((k) => {
          const S = sides[k];
          S.holder.innerHTML = '';
          S.batt = Battery.create({ shape: R.shape, d: S.d, n: 0, cols: gridCols(R.shape, S.d), width: BW });
          S.batt.classList.add('selectable'); S.batt.setAttribute('title', 'Tap the battery to take a piece off');
          const plus = UI.el('button', 'plus', `+ ${UI.frac(1, S.d, 'in')} piece`); plus.type = 'button'; plus.setAttribute('aria-label', `Add one ${S.d}th piece to ${S.name}`);
          const minus = UI.el('button', 'plus', '−'); minus.type = 'button'; minus.setAttribute('aria-label', `Take a piece off ${S.name}`); minus.style.borderColor = 'var(--glass-line)';
          const row = UI.el('div'); row.style.cssText = 'display:flex;gap:8px;'; row.append(minus, plus);
          S.holder.append(S.batt, row); S.row = row;
          const upd = (delta) => { if (phase !== 'charge') return; st[k] = Math.max(0, Math.min(S.d, st[k] + delta)); BSC.Audio.play('tap'); UI.feedback(null); Parts.badge(S.wheel, null); Battery.set(S.batt, { n: st[k] }, { anim: delta > 0 ? 'fill' : 'none' }); };
          plus.addEventListener('click', () => upd(1)); minus.addEventListener('click', () => upd(-1));
          S.batt.addEventListener('click', () => upd(-1));
          Anim.from(S.holder, { y: 20, opacity: 0, duration: 0.4 });
        });
        UI.actions([{ label: 'Check batteries', variant: 'primary', onClick: check }]);
        UI.hud.setHint(() => UI.feedback('hint', `The top number tells you how many pieces to charge: ${R.a[1]} for ${R.a[0]}, ${R.b[1]} for ${R.b[0]}.`));
      }
      function check() {
        for (const k of ['a', 'b']) {
          const S = sides[k];
          if (st[k] !== S.n) { Anim.wiggle(S.batt); Parts.badge(S.wheel, 'bad'); UI.feedback('bad', `Oops! ${S.name} needs ${S.n}/${S.d}: ${S.n} charged piece${S.n > 1 ? 's' : ''}. You charged ${st[k]}.`); return; }
        }
        ['a', 'b'].forEach((k) => Parts.badge(sides[k].wheel, null));
        UI.feedback('ok', 'Both batteries are right!');
        ['a', 'b'].forEach((k) => { sides[k].row.remove(); sides[k].batt.classList.remove('selectable'); });
        if (R.tutorial) { tutorialTool(); return; }
        toChoose();
      }
      // T5: the ×6 tool on Zip
      function tutorialTool() {
        phase = 'tool'; UI.actions([]);
        const k = R.hintDen / R.a[2];
        const tool = UI.el('button', 'tool', '×' + k); tool.type = 'button'; sides.a.holder.appendChild(tool);
        const stop = Parts.tapHint(tool);
        ctx.say('Byte', 'Bolt has bigger numbers. Is it Bolt?', { wait: false });
        setTimeout(() => { if (ctx.alive && phase === 'tool') ctx.say('Ira', `Same pieces first! Tap ×${k}.`, { wait: false }); }, 1600);
        tool.addEventListener('click', () => ctx.lock(async () => {
          if (phase !== 'tool') return; stop(); tool.remove();
          await BSC.L1Anim.cutAnim(ctx, sides.a.batt, { d: R.hintDen, n: R.a[1] * k, cols: gridCols(R.shape, R.hintDen) });
          sides.a.wheel.querySelector('.wfr').innerHTML = `<span class="label-plate">${UI.frac(R.a[1] * k, R.hintDen)}</span>`;
          await ctx.play(Battery.count(sides.a.batt, 'charged')); await ctx.play(Battery.count(sides.b.batt, 'charged'));
          ctx.say('Ira', `${R.a[1] * k} pieces and ${R.b[1]} pieces. Who has more charge, or is it the same?`, { wait: false });
          toChoose(true);
        }));
      }
      // ---------- choose ----------
      function toChoose(keepTalk) {
        phase = 'choose'; UI.actions([]);
        if (!keepTalk) ctx.say('Ira', R.numbers ? `${R.a[0]}: ${R.a[1]}/${R.a[2]}. ${R.b[0]}: ${R.b[1]}/${R.b[2]}. Who has more charge, or is it the same?` : 'Both right! Look at the charge. Who has more, or is it the same?', { wait: false });
        choices.innerHTML = '';
        [['a', `◂ ${R.a[0]}`], ['=', '= Same charge'], ['b', `${R.b[0]} ▸`]].forEach(([key, label]) => {
          const b = UI.el('button', 'choice', label); b.type = 'button'; b.dataset.k = key; choices.appendChild(b);
          b.addEventListener('click', () => { if (!ctx.alive || Game.busy || phase !== 'choose') return; BSC.Audio.play('tap'); choose(key, b); });
        });
        Anim.from(choices.children, { y: 20, opacity: 0, stagger: 0.08, duration: 0.35 });
        UI.hud.setHint(() => { showHintPanel(); });
      }
      function showHintPanel() {
        if (recut) return; recut = true;
        const p = UI.el('div', 'panel'); p.style.cssText = 'left:50%;top:438px;transform:translateX(-50%);display:flex;gap:26px;align-items:center;z-index:8;padding:8px 16px;';
        ['a', 'b'].forEach((k) => {
          const [name, n, d] = R[k]; const m = n * R.hintDen / d;
          const col = UI.el('div'); col.style.cssText = 'display:grid;justify-items:center;gap:4px;';
          col.innerHTML = `<b style="font-family:var(--f-display)">${name}: ${UI.frac(m, R.hintDen, 'in')}</b>`;
          col.appendChild(Battery.create({ shape: R.shape, d: R.hintDen, n: m, cols: gridCols(R.shape, R.hintDen), width: Battery.wide(R.shape) ? 150 : 96, num: 'charged' }));
          p.appendChild(col);
        });
        p.insertAdjacentHTML('beforeend', `<div style="max-width:260px;font-size:19px;font-weight:800">${UI.fmt(R.why)}</div>`);
        w.appendChild(p); Anim.pop(p);
        ctx.say('Ira', 'Now both batteries have the same number of pieces. Compare the charged pieces.', { wait: false });
      }
      async function choose(key, btn) {
        if (key === R.ans) {
          phase = 'done'; UI.hud.setHint(null);
          btn.classList.add('is-ok');
          await ctx.lock(async () => {
            BSC.Audio.play('ok');
            ['a', 'b'].forEach((k) => { if (R.ans === k || R.ans === '=') { Parts.badge(sides[k].wheel, 'ok'); Cast.pose('bot' + k, 'happy'); Cast.hop('bot' + k); } });
            UI.feedback('ok', R.win);
            choices.style.display = 'none';
            const hp = w.querySelector('.panel'); if (hp) hp.remove();
            // race: distance ∝ actual charge
            track.innerHTML = ['a', 'b'].map((k) => `<div class="track" style="top:${k === 'a' ? 452 : 528}px;height:70px"><div class="tick" style="left:25%"></div><div class="tick" style="left:50%"></div><div class="tick" style="left:75%"></div><div class="finish"></div><div class="runner" data-k="${k}"><img src="${Cast.src(sides[k].bot, 'neutral')}" alt="" style="height:66px"><span class="tag" style="opacity:0">${R.ans === '=' ? 'Same charge' : R.ans === k ? 'Takes the trip!' : ''}</span></div></div>`).join('');
            track.querySelectorAll('.tag').forEach((t) => { if (!t.textContent) t.remove(); });
            BSC.Audio.play('roll');
            const trackW = 1200 - 160;
            await ctx.play(gsap.timeline()
              .to(track.querySelectorAll('.runner'), { x: (i, el) => { const S = sides[el.dataset.k]; return (S.n / S.d) * trackW; }, duration: Anim.reduced ? 0.01 : 1.6, ease: 'power2.out' })
              .to(track.querySelectorAll('.tag'), { opacity: 1, duration: 0.3 }));
          });
          ctx.say('Ira', R.win, { wait: false });
          const next = UI.button(idx < Levels.L3.length - 1 ? 'Next ▸' : 'Finish ▸', { variant: 'primary' });
          UI.actions([next]); ctx.tap(next).then(() => resolve(wrong === 0), reject);
          return;
        }
        wrong++;
        btn.classList.add('is-bad'); Anim.wiggle(btn); setTimeout(() => btn.classList.remove('is-bad'), 900);
        if (key !== '=') Anim.wiggle(sides[key].wheel);
        if (wrong === 1) UI.feedback('bad', key === '=' ? 'Oops! They’re not the same. Make the pieces the same size, then count.' : R.ans === '=' ? 'Oops! Look closely: maybe they match. Bigger numbers don’t always mean more charge.' : 'Oops! Try again. Bigger numbers don’t always mean more charge.');
        else { UI.feedback('bad', 'Look at the re-cut batteries. Same number of pieces? Count the charged ones.'); showHintPanel(); }
      }
    });
  }
})(window.BSC = window.BSC || {});
