/* Story scenes from the Context_Final tab: Context 1 (prologue, scenes 1–4), Shop intro, Delivery intro, Finale. */
(function (BSC) {
  'use strict';
  const { UI, Cast, Anim, Parts, Battery, Game } = BSC;

  /** Primary in-scene button (e.g. "Help Byte") that the story waits for. */
  async function waitButton(ctx, label) {
    const b = UI.button(label, { variant: 'primary' });
    UI.actions([b]);
    BSC.Dialog.hide();
    await ctx.tap(b); UI.actions([]); ctx.check();
  }

  // ---------------------------------------------------------------- Prologue
  BSC.Scenes.prologue = async function (ctx) {
    ctx.auto = true; // continuous story: lines advance by themselves
    UI.setBg('bg_level1_bright', { tint: 'faded' });
    const w = UI.world();
    const rail = UI.el('img'); rail.src = 'assets/props/l1_platform_rail.webp'; rail.alt = '';
    rail.style.cssText = 'position:absolute;left:340px;top:455px;width:760px;z-index:1;';
    w.appendChild(rail);
    const row = UI.el('div'); row.style.cssText = 'position:absolute;left:360px;top:205px;width:720px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;z-index:2;';
    const fr = [[1, 2], [2, 4], [3, 6], [4, 8]];
    const slots = fr.map(([n, d]) => { const s = Parts.slot({ shape: 'circle', d, n, width: 150, label: false }); row.appendChild(s); return s; });
    w.appendChild(row);
    Cast.add('ira', { char: 'ira', pose: 'idle', x: 180, bottom: 110, h: 430 }); Cast.idle('ira');
    await ctx.play(Anim.from(row.children, { y: 40, opacity: 0, stagger: 0.12, duration: 0.5 }));

    // 1: Ira at the console
    await ctx.say('Ira', 'Welcome to the bot charging station. Today, I’m in charge!', { actor: 'ira', pose: 'talk' });
    await ctx.say('Ira', 'The bots need charging.', { actor: 'ira' });
    // 2: a label lights up above each battery
    slots.forEach((s, i) => Parts.setLabel(s, fr[i][0], fr[i][1]));
    await ctx.say('Ira', 'Each slot shows its charge.', { actor: 'ira', pose: 'point' });
    // 3: a line of bots rolls in, every screen says "Need 1/2"
    const crew = ['zip', 'bolt', 'pixel', 'spark', 'nova'];
    crew.forEach((c, i) => { Cast.add('q' + i, { char: c, pose: 'neutral', x: 1240 + i * 30, bottom: 80, h: 170, cls: 'small' }); Cast.screen('q' + i, UI.frac(1, 2)); });
    BSC.Audio.play('roll');
    await ctx.play(gsap.to(crew.map((_, i) => Cast.get('q' + i)), { left: (i) => 760 + i * 92, duration: Anim.reduced ? 0.01 : 1, stagger: 0.12, ease: 'power2.out' }));
    await ctx.say('Bot', 'Beep! I need half a charge.', { actor: 'q0' });
    await ctx.say('Bot', 'I need half a charge too.', { actor: 'q1' });
    // 4: every bot lines up at the 1/2 slot; the line grows, the other slots sit empty, Byte is worried
    slots.slice(1).forEach((s) => { s.style.opacity = 0.45; });
    const bar = UI.el('img'); bar.src = 'assets/props/l1_queue_barrier.webp'; bar.alt = ''; bar.style.cssText = 'position:absolute;left:390px;top:560px;width:420px;z-index:4;';
    w.appendChild(bar);
    await ctx.play(gsap.to(crew.map((_, i) => Cast.get('q' + i)), { left: (i) => 440 + i * 70, duration: Anim.reduced ? 0.01 : 0.9, stagger: 0.08 }));
    ['gizmo', 'rivet'].forEach((c, k) => { const i = crew.length + k; Cast.add('q' + i, { char: c, pose: 'neutral', x: 1300, bottom: 80, h: 170, cls: 'small' }); Cast.screen('q' + i, UI.frac(1, 2)); });
    BSC.Audio.play('roll');
    const late = gsap.to([Cast.get('q5'), Cast.get('q6')], { left: (i) => 790 + i * 70, duration: Anim.reduced ? 0.01 : 0.9, stagger: 0.15 });
    Cast.add('byte', { char: 'byte', pose: 'worried', x: 1150, bottom: 420, h: 170 });
    await ctx.play(Cast.enter('byte', 'right')); Cast.idle('byte');
    await ctx.play(late);
    await ctx.play(Cast.pose('ira', 'think'));
    // Ira points out the empty slots: they hold 1/2 too
    slots.slice(1).forEach((s) => { s.style.opacity = 1; s.classList.add('demo'); });
    await ctx.say('Ira', 'The other slots have a 1/2 charge too. Let’s move some bots there!', { actor: 'ira', pose: 'point' });
    ctx.next();
  };

  // ---------------------------------------------------------------- Shop intro (before Level 2)
  BSC.Scenes.shopIntro = async function (ctx) {
    ctx.auto = true; // continuous story: lines advance by themselves
    UI.setBg('bg_battery_shop');
    const w = UI.world();
    const shelf = UI.el('div'); shelf.style.cssText = 'position:absolute;left:250px;top:250px;width:640px;display:grid;grid-template-columns:repeat(4,1fr);gap:16px;align-items:end;z-index:2;';
    [2, 3, 4, 6].forEach((d) => {
      const cell = UI.el('div'); cell.style.cssText = 'display:grid;justify-items:center;gap:0;';
      cell.appendChild(Battery.create({ shape: 'rect', d, n: 0, width: 140 }));
      const cr = UI.el('img'); cr.src = 'assets/batteries/shelf_cradle.webp'; cr.alt = ''; cr.style.cssText = 'width:150px;margin-top:-18px;';
      cell.appendChild(cr);
      cell.appendChild(UI.el('div', 'label-plate dim', `${d} pieces`)).style.fontSize = '18px';
      shelf.appendChild(cell);
    });
    w.appendChild(shelf);
    await ctx.play(Anim.from(shelf.children, { y: 30, opacity: 0, stagger: 0.1, duration: 0.4 }));
    await ctx.say('Narrator', 'The battery shop is open.');
    Cast.add('bot', { char: 'gizmo', pose: 'neutral', x: 150, bottom: 140, h: 300 });
    Cast.screen('bot', UI.frac(8, 12));
    BSC.Audio.play('roll');
    await ctx.play(Cast.enter('bot', 'left'));
    const order = UI.el('div', 'panel'); order.style.cssText = 'left:40px;top:90px;display:grid;justify-items:center;gap:6px;padding:10px 14px;';
    order.innerHTML = '<b style="font-family:var(--f-display);font-size:18px">Order</b>';
    order.appendChild(Battery.create({ shape: 'rect', d: 12, n: 8, width: 170 }));
    w.appendChild(order); Anim.pop(order);
    await ctx.say('Bot', 'I need an 8/12 battery, please!');
    Cast.add('byte', { char: 'byte', pose: 'scan', x: 1020, bottom: 300, h: 190 }); await ctx.play(Cast.enter('byte', 'right')); Cast.idle('byte');
    const sign = UI.el('div', 'sign', 'OUT OF STOCK: 12-piece batteries'); sign.style.cssText += 'left:300px;top:468px;'; w.appendChild(sign); Anim.pop(sign); BSC.Audio.play('wrong');
    await ctx.say('Byte', 'No 12-piece batteries. Out of stock! Sorry, bot. We can’t help.', { actor: 'byte', pose: 'oops' });
    await ctx.play(gsap.to(Cast.get('bot'), { x: -60, duration: 0.6 }));
    Cast.add('ira', { char: 'ira', pose: 'point', x: 1110, bottom: 100, h: 430 }); await ctx.play(Cast.enter('ira', 'right'));
    shelf.classList.add('demo');
    await ctx.say('Ira', 'Wait! These batteries have bigger pieces.', { actor: 'ira' });
    await ctx.play(Cast.pose('ira', 'think'));
    await ctx.say('Ira', 'But which one matches 8/12? Let’s see.', { actor: 'ira' });
    shelf.classList.remove('demo');
    ctx.next();
  };

  // ---------------------------------------------------------------- Delivery intro (before Level 3)
  BSC.Scenes.gateIntro = async function (ctx) {
    ctx.auto = true; // continuous story: lines advance by themselves
    UI.setBg('bg_delivery_gate');
    const w = UI.world();
    const crate = UI.el('div', 'crate', 'GREENHOUSE<small>Long trip · fragile seedlings</small>'); crate.style.left = '525px'; crate.style.top = '300px';
    w.appendChild(crate);
    await ctx.play(Anim.from(crate, { y: -60, opacity: 0, duration: 0.6, ease: 'bounce.out' }));
    await ctx.say('Narrator', 'A big delivery is ready.');
    Cast.add('zip', { char: 'zip', pose: 'neutral', x: 330, bottom: 140, h: 290 }); Cast.add('bolt', { char: 'bolt', pose: 'neutral', x: 920, bottom: 140, h: 270 });
    Cast.screen('zip', '<span style="font-size:18px">empty</span>'); Cast.screen('bolt', '<span style="font-size:18px">empty</span>');
    BSC.Audio.play('roll');
    await ctx.play(gsap.timeline().add(Cast.enter('zip', 'left')).add(Cast.enter('bolt', 'right'), '<'));
    Cast.add('ira', { char: 'ira', pose: 'talk', x: 130, bottom: 110, h: 420 }); Cast.enter('ira', 'left');
    await ctx.say('Ira', 'The bot with more charge takes the trip.', { actor: 'ira' });
    await ctx.say('Ira', 'If they have the same charge, both take the trip!', { actor: 'ira' });
    // Byte turns to the child
    Cast.add('byte', { char: 'byte', pose: 'point', x: 1150, bottom: 300, h: 180 }); await ctx.play(Cast.enter('byte', 'right')); Cast.idle('byte');
    await ctx.say('Byte', 'Can you help me pick the right bot?', { actor: 'byte' });
    await waitButton(ctx, 'Help Byte');
    ctx.next();
  };

  // ---------------------------------------------------------------- Finale
  BSC.Scenes.finale = async function (ctx) {
    ctx.auto = true; // continuous story: lines advance by themselves
    UI.setBg('bg_station_morning', { tint: 'evening' });
    const w = UI.world();
    const row = UI.el('div'); row.style.cssText = 'position:absolute;left:370px;top:200px;width:700px;display:grid;grid-template-columns:repeat(4,1fr);gap:20px;';
    [[1, 2], [2, 4], [3, 6], [4, 8]].forEach(([n, d]) => row.appendChild(Parts.slot({ shape: 'circle', d, n, width: 120, label: null })));
    w.appendChild(row);
    ['zip', 'pixel', 'nova', 'spark'].forEach((c, i) => { Cast.add('f' + i, { char: c, pose: 'happy', x: 445 + i * 177, bottom: 120, h: 150, cls: 'small' }); });
    await ctx.play(Anim.from(row.querySelectorAll('.cell.on'), { opacity: 0.2, duration: 0.5, stagger: 0.05 }));
    await ctx.say('Narrator', 'The station is running smoothly.');
    Cast.add('ira', { char: 'ira', pose: 'cheer', x: 170, bottom: 100, h: 420 }); Cast.enter('ira', 'left');
    Cast.add('byte', { char: 'byte', pose: 'cheer', x: 990, bottom: 360, h: 170 }); Cast.enter('byte', 'up'); Cast.idle('byte');
    await ctx.say('Ira', 'Great work today!', { actor: 'ira' });
    await ctx.play(Cast.pose('ira', 'wave'));
    await ctx.say('Ira', 'Thank you for helping us. See you next time!', { actor: 'ira', next: 'Finish' });
    // End card
    BSC.Store.completeLevel(3);
    BSC.Store.get().resume = null; BSC.Store.save();
    UI.setBg('bg_endcard', { tint: 'soft' });
    w.innerHTML = '';
    BSC.Dialog.hide();
    const card = UI.el('div', 'panel'); card.style.cssText = 'left:50%;top:120px;transform:translateX(-50%);width:760px;text-align:center;padding:26px 30px;';
    card.innerHTML = `<div class="title-card" style="display:inline-block">Mission complete</div>
      <p style="font-size:22px;margin:18px 0 6px">You learned three ways to read a battery:</p>
      <ul style="text-align:left;font-size:21px;line-height:1.5;margin:6px auto 0;max-width:600px">
        <li><b>Equivalent fractions</b>: different numbers, same charge (${UI.frac(1, 2, 'in')} = ${UI.frac(4, 8, 'in')}).</li>
        <li><b>Simplest form</b>: divide top and bottom by the HCF for the biggest pieces (${UI.frac(8, 12, 'in')} = ${UI.frac(2, 3, 'in')}).</li>
        <li><b>Comparing</b>: make the pieces the same size, then compare (${UI.frac(1, 2, 'in')} &gt; ${UI.frac(5, 12, 'in')}).</li></ul>`;
    w.appendChild(card);
    BSC.Audio.play('win'); Anim.confetti();
    await ctx.play(Anim.pop(card));
    UI.actions([{ label: 'Play again', variant: 'secondary', onClick: () => Game.go('levels') }, { label: 'Back to title', variant: 'primary', onClick: () => Game.go('title') }]);
  };

  BSC.Story = { waitButton };
})(window.BSC = window.BSC || {});
