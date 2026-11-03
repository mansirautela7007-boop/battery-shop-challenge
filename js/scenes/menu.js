/* Title screen, how-to-play onboarding and level select. */
(function (BSC) {
  'use strict';
  const { UI, Store, Game } = BSC;
  let loaded = false;

  BSC.Scenes.title = async function (ctx) {
    UI.setBg('bg_cover');
    const w = UI.world();
    // Cover: logo up top, Ira and Byte on glowing halos, the Play button on the floor ring in the middle.
    w.innerHTML = `<div class="cover">
      <img class="cv-halo cv-halo-ira" src="assets/cover/halo.webp" alt="">
      <img class="cv-halo cv-halo-byte" src="assets/cover/halo.webp" alt="">
      <img class="cv-ira" src="assets/cover/ira_wave.webp" alt="Ira waving">
      <img class="cv-byte" src="assets/cover/byte_cheer.webp" alt="Byte the robot">
      <h1 class="cv-logo"><img src="assets/cover/logo.webp" alt="The Battery Shop Challenge"></h1>
      <div class="loader" id="loader"><i></i></div></div>`;
    const A = BSC.Anim;
    A.from('.cv-logo', { y: -40, opacity: 0, duration: 0.8, ease: 'back.out(1.6)' });
    A.from('.cv-ira', { x: -80, opacity: 0, duration: 0.7, ease: 'power3.out' });
    A.from('.cv-byte', { x: 80, opacity: 0, duration: 0.7, ease: 'power3.out' });
    A.bob(w.querySelector('.cv-logo'), 6, 2.4); A.bob(w.querySelector('.cv-byte'), 10, 1.8); A.breathe(w.querySelector('.cv-ira'));
    if (!loaded) {
      await BSC.preload((p) => { const bar = document.querySelector('#loader i'); if (bar) bar.style.width = Math.round(p * 100) + '%'; });
      loaded = true;
    }
    ctx.check();
    const L = document.getElementById('loader'); if (L) L.remove();
    const s = Store.get();
    // Always start from the story (no "Continue"). Returning players skip the how-to cards.
    const returning = !!(s.resume || s.completed.length);
    const play = UI.button('<img src="assets/cover/play.webp" alt="Play">', { variant: 'cover-play', aria: 'Play', onClick: () => (returning ? Game.go('prologue') : onboarding(() => Game.go('prologue'))) });
    w.querySelector('.cover').appendChild(play);
    A.pop(play);
    play.focus({ preventScroll: true });
  };

  /** Three short cards on first play: how the game is controlled. */
  function onboarding(done) {
    const cards = [
      ['How to play', 'Read what Ira and Byte say, then press <b>Next ▸</b>.'],
      ['Drag or tap', 'Move things by dragging them. Prefer tapping? Tap the item, then tap where it goes.'],
      ['Stuck?', 'Try again: after a wrong answer you get a clue. Press <b>Esc</b> to pause. Your progress saves by itself.'],
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
