/* QA jump menu: a small "QA" tab on the stage that opens every scene (and every play item) directly.
   For testing only. Remove the <script src="js/ui/qa.js"> line in index.html to ship without it. */
(function (BSC) {
  'use strict';
  const { UI, Game, Levels } = BSC;

  // Play scenes accept params.step = which item to start on.
  const ITEMS = {
    l1game: () => Levels.L1.map((it) => it.id),
    l2game: () => Levels.L2.map((_, i) => `Order ${i + 1}`),
    l3game: () => Levels.L3.map((it) => it.id),
  };

  function jump(id, step) {
    UI.closeModal();
    if (Game.paused) { Game.paused = false; BSC.Anim.resume(); BSC.Audio.resume(); }
    const s = BSC.Store.get(); s.unlocked = 3; BSC.Store.save(); // so the Levels screen matches what QA opened
    Game.go(id, step ? { step } : {});
  }

  function open() {
    if (Game.paused === false && Game.state === 'scene') { Game.paused = true; BSC.Anim.pause(); BSC.Audio.suspend(); }
    const levels = [1, 2, 3].map((n) => {
      const rows = Game.FLOW.filter((f) => f.level === n).map((f) => {
        const items = ITEMS[f.id] ? ITEMS[f.id]() : null;
        const chips = items ? `<div class="qa-chips">${items.map((t, i) => `<button type="button" class="qa-chip" data-id="${f.id}" data-step="${i}">${t}</button>`).join('')}</div>` : '';
        return `<div class="qa-row"><button type="button" class="qa-scene${f.id === Game.sceneId ? ' on' : ''}" data-id="${f.id}">${f.label}</button>${chips}</div>`;
      }).join('');
      return `<section class="qa-level"><h3>Level ${n}</h3>${rows}</section>`;
    }).join('');
    const m = UI.modal(`<h2>QA: jump to</h2><div class="qa-grid">${levels}</div>
      <div class="qa-row qa-extra"><button type="button" class="qa-scene" data-id="title">Title screen</button><button type="button" class="qa-scene" data-id="levels">Levels screen</button></div>`, [
      { label: 'Close', variant: 'primary', onClick: close },
    ]);
    m.querySelector('.card').classList.add('qa-card');
    m.querySelectorAll('[data-id]').forEach((b) => b.addEventListener('click', () => { BSC.Audio.play('tap'); jump(b.dataset.id, +b.dataset.step || 0); }));
  }
  function close() {
    UI.closeModal();
    if (Game.paused) { Game.paused = false; BSC.Anim.resume(); BSC.Audio.resume(); }
  }

  function init() {
    const b = document.createElement('button');
    b.type = 'button'; b.id = 'qa-btn'; b.textContent = 'QA'; b.setAttribute('aria-label', 'QA: jump to any level');
    b.addEventListener('click', () => { BSC.Audio.play('tap'); open(); });
    document.getElementById('stage').appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  BSC.QA = { open, jump };
})(window.BSC = window.BSC || {});
