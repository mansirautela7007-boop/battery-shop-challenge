/* Title screen, how-to-play onboarding and level select. */
(function (BSC) {
  'use strict';
  const { UI, Store, Game } = BSC;
  let loaded = false;

  BSC.Scenes.title = async function (ctx) {
    UI.setBg('bg_endcard', { tint: 'soft' });
    const w = UI.world();
    w.innerHTML = `<div class="logo"><small>A fractions adventure</small>The Battery Shop<br>Challenge</div><div class="loader" id="loader"><i></i></div>`;
    BSC.Cast.add('ira', { char: 'ira', pose: 'wave', x: 210, bottom: 40, h: 380 });
    BSC.Cast.add('byte', { char: 'byte', pose: 'cheer', x: 1080, bottom: 70, h: 240 });
    BSC.Cast.idle('byte'); BSC.Cast.idle('ira');
    BSC.Anim.from('.logo', { y: -40, opacity: 0, duration: 0.8, ease: 'back.out(1.6)' });
    BSC.Anim.bob(document.querySelector('.logo'), 6, 2.4);
    if (!loaded) {
      await BSC.preload((p) => { const bar = document.querySelector('#loader i'); if (bar) bar.style.width = Math.round(p * 100) + '%'; });
      loaded = true;
    }
    ctx.check();
    const L = document.getElementById('loader'); if (L) L.remove();
    const s = Store.get();
    const box = UI.el('div', 'panel'); box.style.cssText = 'left:50%;top:400px;transform:translateX(-50%);display:flex;gap:16px;padding:18px 22px;';
    // Always start from the story (no "Continue"). Returning players skip the how-to cards and also get Levels.
    const returning = !!(s.resume || s.completed.length);
    box.appendChild(UI.button('▶ Play', { variant: 'primary big', onClick: () => (returning ? Game.go('prologue') : onboarding(() => Game.go('prologue'))) }));
    if (returning) box.appendChild(UI.button('Levels', { variant: 'secondary', onClick: () => Game.go('levels') }));
    w.appendChild(box);
    BSC.Anim.pop(box);
  };

  /** Three short cards on first play: how the game is controlled. */
  function onboarding(done) {
    const cards = [
      ['How to play', 'Read what Ira and Byte say, then press <b>Next ▸</b>.'],
      ['Drag or tap', 'Move things by dragging them. Prefer tapping? Tap the item, then tap where it goes.'],
      ['Stuck?', 'Press <b>💡 Hint</b> for a clue. Press <b>❚❚</b> to pause. Your progress saves by itself.'],
    ];
    let i = 0;
    const show = () => {
      const [h, p] = cards[i];
      UI.modal(`<h2>${h}</h2><p>${p}</p><div class="hud-progress" style="justify-content:center;background:none">${cards.map((_, j) => `<i class="${j <= i ? 'on' : ''}"></i>`).join('')}</div>`, [
        { label: i < cards.length - 1 ? 'Next ▸' : "Let's go!", variant: 'primary', onClick: () => { i++; if (i < cards.length) show(); else { UI.closeModal(); done(); } } },
        ...(i === 0 ? [{ label: 'Skip', variant: 'ghost', onClick: () => { UI.closeModal(); done(); } }] : []),
      ]);
    };
    show();
  }

  BSC.Scenes.levels = async function () {
    UI.setBg(null, { tint: 'plain' });
    const s = Store.get();
    const w = UI.world();
    w.innerHTML = `<div class="logo ink" style="top:40px;font-size:56px"><small>Bot charging station</small>Choose a level</div>`;
    const info = [
      { n: 1, t: 'Equivalent fractions', p: 'Charge each bot from a slot with the same charge.', art: BSC.Battery.create({ shape: 'circle', d: 4, n: 2, width: 120 }) },
      { n: 2, t: 'Simplest form', p: 'Find the biggest pieces in the gate maze and the shop.', art: BSC.Battery.create({ shape: 'rect', d: 3, n: 2, width: 180 }) },
      { n: 3, t: 'Comparing fractions', p: 'Same pieces first, then decide who takes the trip.', art: BSC.Battery.create({ shape: 'square', d: 8, n: 6, width: 120, cols: 8 }) },
    ];
    const grid = UI.el('div', 'level-cards');
    info.forEach((L) => {
      const done = s.completed.includes(L.n), open = L.n <= s.unlocked;
      const c = UI.el('div', 'lcard' + (open ? '' : ' locked')); c.dataset.level = L.n;
      c.innerHTML = `<span class="lnum">Level ${L.n}</span><h3>${L.t}</h3><div class="art"></div><span class="status ${done ? 'done' : open ? 'ready' : 'lock'}">${done ? '✓ Complete' : open ? 'Ready' : '🔒 Finish level ' + (L.n - 1)}</span><p>${L.p}</p>`;
      c.querySelector('.art').appendChild(L.art);
      c.appendChild(UI.button(done ? 'Play again' : open ? 'Play' : 'Locked', { variant: open ? (L.n === s.unlocked && !done ? 'primary' : 'secondary') : 'ghost', disabled: !open, onClick: () => Game.go(Game.LEVEL_START[L.n]) }));
      grid.appendChild(c);
    });
    w.appendChild(grid);
    BSC.Anim.from('.lcard', { y: 40, opacity: 0, rotation: (i) => [-3, 2, -2][i], stagger: 0.12, duration: 0.6, ease: 'back.out(1.6)' });
    document.querySelectorAll('.lcard .art').forEach((a, i) => BSC.Anim.bob(a, 5, 1.8 + i * 0.25));
    const foot = UI.el('div', 'panel'); foot.style.cssText = 'left:50%;bottom:24px;transform:translateX(-50%);display:flex;gap:12px;padding:10px 14px;';
    foot.appendChild(UI.button('◂ Title', { variant: 'ghost', onClick: () => Game.go('title') }));
    const reset = UI.button('Reset progress', { variant: 'ghost', onClick: () => {
      UI.modal('<h2>Reset progress?</h2><p>This clears finished levels and your saved place. Settings stay.</p>', [
        { label: 'Keep my progress', variant: 'primary', onClick: () => UI.closeModal() },
        { label: 'Reset', variant: 'secondary', onClick: () => { Store.reset(); UI.closeModal(); Game.go('levels'); } },
      ]);
    } });
    foot.appendChild(reset);
    w.appendChild(foot);
  };
})(window.BSC = window.BSC || {});
