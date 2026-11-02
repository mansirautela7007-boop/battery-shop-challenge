/* Boot: scale the stage, build the HUD, preload art, wire global keys, open the title screen. */
(function (BSC) {
  'use strict';
  const IMG = [
    'bg/bg_station_morning', 'bg/bg_level1_bright', 'bg/bg_console', 'bg/bg_learning_bench', 'bg/bg_battery_shop', 'bg/bg_maze_floor', 'bg/bg_delivery_gate', 'bg/bg_endcard',
    'batteries/battery_circle', 'batteries/battery_square', 'batteries/battery_triangle', 'batteries/battery_hexagon', 'batteries/slot_charger', 'batteries/slot_lock', 'batteries/shelf_cradle',
    'batteries/tool_cutter', 'batteries/tool_merger', 'batteries/charge_bar_frame',
    'props/l1_platform_rail', 'props/l1_queue_barrier', 'props/l1_stack_tray', 'props/l2_record_board', 'props/l2_gate_closed', 'props/l2_gate_open', 'props/l2_shop_entrance', 'props/l3_charge_wheel', 'props/l3_wheel_stand',
    'chars/ira_idle', 'chars/ira_talk', 'chars/ira_point', 'chars/ira_think', 'chars/ira_handover', 'chars/ira_cheer', 'chars/ira_wave',
    'chars/byte_hover', 'chars/byte_scan', 'chars/byte_whistle', 'chars/byte_worried', 'chars/byte_confused', 'chars/byte_nod', 'chars/byte_point', 'chars/byte_cheer', 'chars/byte_oops',
    ...['zip', 'bolt', 'volt', 'pixel', 'spark', 'gizmo', 'rivet', 'nova'].map((b) => `chars/bot_${b}_neutral`),
    ...['bolt', 'pixel', 'spark', 'gizmo', 'rivet', 'nova'].map((b) => `chars/bot_${b}_happy`),
  ].map((p) => `assets/${p}.webp`);

  BSC.preload = function (onProgress) {
    let done = 0;
    return Promise.all(IMG.map((src) => new Promise((res) => {
      const im = new Image();
      im.onload = im.onerror = () => { done++; onProgress && onProgress(done / IMG.length); if (!im.naturalWidth) console.warn('Missing image', src); res(); };
      im.src = src;
    })));
  };

  // ---------- Pause ----------
  BSC.Pause = {
    open() {
      if (BSC.Game.paused || BSC.Game.state !== 'scene') return;
      BSC.Game.paused = true; BSC.Anim.pause(); BSC.Audio.suspend();
      BSC.Pause.render();
    },
    render() {
      const s = BSC.Store.get().settings;
      BSC.UI.modal(`<h2>Paused</h2><p>Your progress is saved. Pick up right where you left off.</p>
        <div class="toggle-row"><button type="button" class="btn ghost" id="p-sound">${s.sound ? '🔊 Sound on' : '🔇 Sound off'}</button><button type="button" class="btn ghost" id="p-music">${s.music ? '🎵 Music on' : '🎵 Music off'}</button><button type="button" class="btn ghost" id="p-motion">${document.body.classList.contains('reduce-motion') ? 'Calm motion: on' : 'Calm motion: off'}</button></div>`, [
        { label: 'Resume', variant: 'primary', onClick: BSC.Pause.close },
        { label: 'Replay this part', onClick: () => { BSC.Pause.close(); BSC.Game.go(BSC.Game.sceneId); } },
        { label: 'Levels', onClick: () => { BSC.Pause.close(); BSC.Game.go('levels'); } },
      ]);
      document.getElementById('p-sound').onclick = () => { BSC.Audio.setSound(!s.sound); BSC.UI.hud.sound(); BSC.Pause.render(); };
      document.getElementById('p-music').onclick = () => { BSC.Audio.setMusic(!s.music); BSC.Pause.render(); };
      document.getElementById('p-motion').onclick = () => { document.body.classList.toggle('reduce-motion'); s.reduceMotion = document.body.classList.contains('reduce-motion'); BSC.Store.save(); BSC.Pause.render(); };
    },
    close() { BSC.UI.closeModal(); BSC.Game.paused = false; BSC.Anim.resume(); BSC.Audio.resume(); },
  };

  function boot() {
    if (BSC.Store.get().settings.reduceMotion) document.body.classList.add('reduce-motion');
    BSC.UI.fit();
    window.addEventListener('resize', BSC.UI.fit);
    // Art that hangs off the stage (Ira's half body in the lesson) makes it scrollable; never let it scroll (backup for overflow: clip).
    const stage = document.getElementById('stage');
    stage.addEventListener('scroll', () => { stage.scrollTop = 0; stage.scrollLeft = 0; });
    BSC.UI.hud.build();
    document.addEventListener('pointerdown', () => BSC.Audio.unlock(), { once: true });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { if (BSC.Game.paused) BSC.Pause.close(); else BSC.Pause.open(); }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) BSC.Pause.open(); });
    BSC.Game.go('title');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window.BSC = window.BSC || {});
