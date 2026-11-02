/* Story scenes from the Context tab: Prologue (scenes 1–12), Shop intro, Delivery intro, Finale. */
(function (BSC) {
  'use strict';
  const { UI, Cast, Anim, Parts, Battery, Game } = BSC;

  /** Story Skip control (top-right under the HUD). */
  function skipButton(ctx, target) {
    const b = UI.button('Skip story ▸▸', { variant: 'ghost', onClick: () => Game.go(target) });
    b.style.cssText = 'position:absolute;right:214px;top:15px;z-index:31;min-height:46px;';
    UI.world().appendChild(b);
  }
  /** Primary in-scene button (e.g. "Call Professor Duster") that the story waits for. */
  async function waitButton(ctx, label) {
    const b = UI.button(label, { variant: 'primary' });
    UI.actions([b]);
    BSC.Dialog.hide();
    await ctx.tap(b); UI.actions([]); ctx.check();
  }

  // ---------------------------------------------------------------- Prologue
  BSC.Scenes.prologue = async function (ctx) {
    ctx.auto = true; // continuous story: lines advance by themselves
    UI.setBg('bg_station_morning');
    skipButton(ctx, 'l1learn');
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

    await ctx.say('Narrator', 'Welcome to the bot charging station.');
    await ctx.play(Cast.pose('ira', 'idle'));
    await ctx.say('Narrator', 'Today, Ira is in charge.');
    // 3: labels light up
    slots.forEach((s, i) => Parts.setLabel(s, fr[i][0], fr[i][1]));
    await ctx.say('Ira', 'Each slot shows its charge. I will make sure every bot gets the right charge.', { actor: 'ira', pose: 'talk' });
    // 4: bots roll in
    const crew = ['zip', 'bolt', 'pixel', 'spark', 'nova'];
    crew.forEach((c, i) => { Cast.add('q' + i, { char: c, pose: 'neutral', x: 1240 + i * 30, bottom: 80, h: 170, cls: 'small' }); Cast.screen('q' + i, UI.frac(1, 2)); });
    BSC.Audio.play('roll');
    await ctx.play(gsap.to(crew.map((_, i) => Cast.get('q' + i)), { left: (i) => 760 + i * 92, duration: Anim.reduced ? 0.01 : 1, stagger: 0.12, ease: 'power2.out' }));
    await ctx.say('Bot', 'Beep! I need half a charge. Everyone here needs 1/2!');
    // 5: Byte scans
    Cast.add('byte', { char: 'byte', pose: 'scan', x: 1150, bottom: 420, h: 170 });
    await ctx.play(Cast.enter('byte', 'right')); Cast.idle('byte');
    slots.forEach((s) => s.classList.add('demo'));
    await ctx.say('Byte', 'Scanning!', { actor: 'byte' });
    slots.forEach((s) => s.classList.remove('demo'));
    // 6: crosses
    slots.slice(1).forEach((s) => Parts.badge(s, 'bad'));
    await ctx.say('Byte', '1/2 matches. The other numbers are bigger. Too much charge!', { actor: 'byte', pose: 'point' });
    // 7–8: everyone queues at slot 1, other slots dim
    await ctx.play(Cast.pose('byte', 'whistle'));
    slots.slice(1).forEach((s) => { s.style.opacity = 0.45; });
    const bar = UI.el('img'); bar.src = 'assets/props/l1_queue_barrier.webp'; bar.alt = ''; bar.style.cssText = 'position:absolute;left:390px;top:560px;width:420px;z-index:4;';
    w.appendChild(bar);
    await ctx.play(gsap.to(crew.map((_, i) => Cast.get('q' + i)), { left: (i) => 440 + i * 70, duration: Anim.reduced ? 0.01 : 0.9, stagger: 0.08 }));
    await ctx.say('Byte', 'Bots! Line up at the 1/2 slot.', { actor: 'byte' });
    ['gizmo', 'rivet'].forEach((c, k) => { const i = crew.length + k; Cast.add('q' + i, { char: c, pose: 'neutral', x: 1300, bottom: 80, h: 170, cls: 'small' }); Cast.screen('q' + i, UI.frac(1, 2)); });
    await ctx.play(gsap.to([Cast.get('q5'), Cast.get('q6')], { left: (i) => 790 + i * 70, duration: Anim.reduced ? 0.01 : 0.9, stagger: 0.15 }));
    await ctx.say('Narrator', 'The line gets longer…');
    await ctx.say('Bot', 'Beep… still waiting.');
    // 9: Ira wonders
    await ctx.play(Cast.pose('ira', 'think'));
    await ctx.say('Ira', 'These batteries look alike. Are they the same?', { actor: 'ira' });
    await waitButton(ctx, '📡 Call Professor Duster');
    // 10: Duster appears
    await ctx.play(gsap.to([...Array(7).keys()].map((i) => Cast.get('q' + i)).filter(Boolean), { opacity: 0, duration: 0.4 }));
    bar.remove(); slots.forEach((s) => { s.style.opacity = 1; Parts.badge(s, null); });
    Cast.exit('byte');
    Cast.add('duster', { char: 'duster', pose: 'explain', x: 1130, bottom: 100, h: 420 });
    await ctx.play(Cast.enter('duster', 'holo')); Cast.idle('duster');
    await ctx.say('Ira', 'Professor, one slot is getting crowded. Is there any other way to charge the bots?', { actor: 'ira', pose: 'talk' });
    slots[0].classList.add('demo'); slots[1].classList.add('demo');
    await ctx.say('Duster', 'Look carefully. Do 1/2 and 2/4 cover the same portion?', { actor: 'duster', pose: 'point' });
    // 11: overlay proof
    await waitButton(ctx, 'Put 2/4 on top of 1/2');
    await ctx.lock(async () => {
      const copy = Battery.create({ shape: 'circle', d: 4, n: 2, width: 150 }); copy.classList.add('see');
      const a = slots[1]._batt.getBoundingClientRect(), b = slots[0]._batt.getBoundingClientRect(), s = document.getElementById('stage').getBoundingClientRect(), k = UI.scale();
      copy.style.cssText = `position:absolute;z-index:20;width:150px;left:${(a.left - s.left) / k}px;top:${(a.top - s.top) / k}px`;
      w.appendChild(copy);
      await ctx.play(Anim.to(copy, { left: (b.left - s.left) / k, top: (b.top - s.top) / k - 60, duration: 0.7, ease: 'power2.inOut' }));
      await ctx.play(Anim.to(copy, { top: (b.top - s.top) / k, duration: 0.45, ease: 'bounce.out' }));
      Parts.badge(slots[0], 'ok'); BSC.Audio.play('ok');
    });
    await ctx.say('Duster', 'See? The charged parts match exactly.', { actor: 'duster' });
    // 12
    Cast.add('byte', { char: 'byte', pose: 'confused', x: 330, bottom: 440, h: 150 }); Cast.enter('byte', 'up');
    await ctx.say('Duster', 'Different numbers. Same charge.', { actor: 'duster', pose: 'explain' });
    await ctx.say('Byte', 'But the numbers are bigger!', { actor: 'byte' });
    await ctx.say('Duster', "Let's find out why. Come to my bench!", { actor: 'duster', pose: 'point', next: 'Start learning' });
    ctx.next();
  };

  // ---------------------------------------------------------------- Shop intro (before Level 2)
  BSC.Scenes.shopIntro = async function (ctx) {
    ctx.auto = true; // continuous story: lines advance by themselves
    UI.setBg('bg_battery_shop');
    skipButton(ctx, 'l2learn');
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
    await ctx.say('Ira', 'But which one matches 8/12? Let’s ask Professor Duster.', { actor: 'ira' });
    shelf.classList.remove('demo');
    await waitButton(ctx, '📡 Call Professor Duster');
    ctx.next();
  };

  // ---------------------------------------------------------------- Delivery intro (before Level 3)
  BSC.Scenes.gateIntro = async function (ctx) {
    ctx.auto = true; // continuous story: lines advance by themselves
    UI.setBg('bg_delivery_gate');
    skipButton(ctx, 'l3learn');
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
    await ctx.say('Ira', 'The bot with more charge takes the trip. If they have the same charge, both go!', { actor: 'ira' });
    await ctx.play(Cast.pose('ira', 'handover'));
    Cast.add('byte', { char: 'byte', pose: 'worried', x: 1150, bottom: 300, h: 180 }); await ctx.play(Cast.enter('byte', 'right')); Cast.idle('byte');
    await ctx.say('Ira', 'Byte, you’re sending the bots today.', { actor: 'ira' });
    await ctx.say('Byte', 'Me? Oh no. Numbers confuse me!', { actor: 'byte' });
    await ctx.play(Cast.pose('byte', 'point'));
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
    await ctx.say('Narrator', 'Evening. Every slot is busy and the station runs smoothly.');
    Cast.add('ira', { char: 'ira', pose: 'cheer', x: 170, bottom: 100, h: 420 }); Cast.enter('ira', 'left');
    Cast.add('duster', { char: 'duster', pose: 'wave', x: 1140, bottom: 100, h: 400 }); await ctx.play(Cast.enter('duster', 'holo')); Cast.idle('duster');
    Cast.add('byte', { char: 'byte', pose: 'cheer', x: 990, bottom: 360, h: 170 }); Cast.enter('byte', 'up'); Cast.idle('byte');
    await ctx.say('Duster', 'Great work today!', { actor: 'duster' });
    await ctx.say('Byte', 'Bigger numbers don’t always mean more charge. I get it now!', { actor: 'byte' });
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

  BSC.Story = { skipButton, waitButton };
})(window.BSC = window.BSC || {});
