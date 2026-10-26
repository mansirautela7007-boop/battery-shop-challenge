/* Progress + settings persisted to localStorage (wrapped: storage can be blocked). */
(function (BSC) {
  'use strict';
  const KEY = 'battery-shop-challenge.v1';
  const fresh = () => ({
    version: 1,
    unlocked: 1,            // highest level the player may start (1–3)
    completed: [],          // level numbers finished
    resume: null,           // { scene, step } where to continue
    stars: {},              // level-2 orders: best stars per order index
    firstTry: {},           // level-3 rounds right on first try
    settings: { sound: true, music: true },
  });
  let data = fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const parsed = JSON.parse(raw); if (parsed && parsed.version === 1) data = Object.assign(fresh(), parsed); }
  } catch (e) { /* private mode or blocked storage: play without saving */ }

  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ } };

  BSC.Store = {
    get: () => data,
    save,
    setResume(scene, step) { data.resume = { scene, step: step || 0 }; save(); },
    completeLevel(n) {
      if (!data.completed.includes(n)) data.completed.push(n);
      data.unlocked = Math.max(data.unlocked, Math.min(3, n + 1));
      save();
    },
    reset() { const s = data.settings; data = fresh(); data.settings = s; save(); },
  };
})(window.BSC = window.BSC || {});
