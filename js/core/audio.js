/* Small Web Audio synth: sound effects + a soft ambient pad. No audio files to load or break. */
(function (BSC) {
  'use strict';
  let ctx = null, master = null, musicGain = null, musicNodes = [];
  const settings = () => BSC.Store.get().settings;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0; musicGain.connect(master);
    return ctx;
  }
  function tone(freq, dur, { type = 'sine', when = 0, vol = 0.12, slideTo = null } = {}) {
    if (!settings().sound || !ensure()) return;
    const t = ctx.currentTime + when, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol = 0.05, when = 0) {
    if (!settings().sound || !ensure()) return;
    const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = 1800; s.buffer = buf; g.gain.value = vol;
    s.connect(f).connect(g).connect(master); s.start(ctx.currentTime + when);
  }

  const sfx = {
    tap: () => tone(620, 0.06, { type: 'triangle', vol: 0.06 }),
    pick: () => tone(440, 0.12, { type: 'sine', slideTo: 760, vol: 0.08 }),
    drop: () => tone(300, 0.1, { type: 'triangle', vol: 0.08 }),
    cut: () => { noise(0.14, 0.05); tone(1200, 0.12, { type: 'sine', slideTo: 500, vol: 0.05 }); },
    clunk: () => { tone(140, 0.16, { type: 'square', vol: 0.06 }); noise(0.08, 0.04); },
    ok: () => { tone(660, 0.14, { vol: 0.1 }); tone(880, 0.22, { when: 0.1, vol: 0.1 }); },
    charge: () => { for (let i = 0; i < 7; i++) tone(320 + i * 80, 0.09, { when: i * 0.06, vol: 0.06 }); tone(1046, 0.3, { when: 0.45, vol: 0.08 }); },
    wrong: () => { tone(220, 0.16, { type: 'sawtooth', vol: 0.045 }); tone(165, 0.22, { type: 'sawtooth', when: 0.12, vol: 0.04 }); noise(0.15, 0.03); },
    gate: () => { noise(0.25, 0.03); tone(520, 0.3, { slideTo: 880, vol: 0.06 }); },
    spin: () => { for (let i = 0; i < 14; i++) tone(900, 0.03, { type: 'square', when: i * (0.04 + i * 0.008), vol: 0.025 }); },
    holo: () => { for (let i = 0; i < 5; i++) tone(900 + i * 220, 0.18, { when: i * 0.05, vol: 0.035 }); },
    star: () => { tone(1320, 0.2, { vol: 0.07 }); tone(1760, 0.25, { when: 0.08, vol: 0.06 }); },
    win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.28, { type: 'triangle', when: i * 0.12, vol: 0.1 })),
    roll: () => noise(0.4, 0.02),
  };

  function startMusic() {
    if (!settings().music || !ensure() || musicNodes.length) return;
    // A quiet two-chord pad: gentle and non-distracting.
    const chords = [[220, 277.2, 329.6], [196, 246.9, 311.1]];
    const t0 = ctx.currentTime;
    chords[0].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f;
      lfo.frequency.value = 0.07 + i * 0.03; lg.gain.value = 0.012; lfo.connect(lg).connect(g.gain);
      g.gain.value = 0.02; o.connect(g).connect(musicGain); o.start(); lfo.start();
      // alternate chord every 8 s
      for (let k = 1; k < 200; k++) o.frequency.setValueAtTime(chords[k % 2][i], t0 + k * 8);
      musicNodes.push(o, lfo);
    });
    musicGain.gain.setTargetAtTime(0.35, ctx.currentTime, 1.5);
  }
  function stopMusic() {
    if (!ctx) return;
    musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    const nodes = musicNodes; musicNodes = [];
    setTimeout(() => nodes.forEach((n) => { try { n.stop(); } catch (e) { /* already stopped */ } }), 1200);
  }

  // Dialogue voice. Fixed lines play a recorded file (one <audio> element reused, works from file://).
  // Lines built at runtime (level numbers) use the browser's free speech synthesis, matched per character.
  let voiceEl = null;
  const synth = window.speechSynthesis || null;
  const TTS = { // preferred system voices (same as the recorded ones on a Mac), then a fallback pitch/rate
    Ira: { names: ['Tara', 'Veena', 'Samantha'], lang: 'en-IN', pitch: 1.15, rate: 1 },
    Byte: { names: ['Junior', 'Rishi'], lang: 'en', pitch: 1.5, rate: 1.05 },
    Duster: { names: ['Grandpa', 'Daniel'], lang: 'en-GB', pitch: 0.8, rate: 0.9 },
    Narrator: { names: ['Shelley', 'Moira', 'Karen'], lang: 'en-GB', pitch: 1, rate: 0.95 },
    Bot: { names: ['Fred', 'Zarvox'], lang: 'en-US', pitch: 0.6, rate: 0.95 },
  };
  const ORD = { 2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth', 11: 'eleventh', 12: 'twelfth', 15: 'fifteenth', 16: 'sixteenth', 18: 'eighteenth', 20: 'twentieth', 24: 'twenty-fourth' };
  const speakable = (t) => String(t)
    .replace(/(\d+)\/(\d+)/g, (m, n, d) => (ORD[d] ? `${n} ${+n === 1 ? ORD[d] : d === '2' ? 'halves' : ORD[d] + 's'}` : `${n} over ${d}`))
    .replace(/×/g, 'times ').replace(/÷/g, 'divide by ').replace(/ = /g, ' equals ').replace(/HCF/g, 'H C F').replace(/<[^>]*>/g, '');
  function pickVoice(cfg) {
    const all = synth.getVoices();
    for (const n of cfg.names) { const v = all.find((x) => x.name.startsWith(n)); if (v) return v; }
    return all.find((x) => x.lang.replace('_', '-').startsWith(cfg.lang)) || all.find((x) => x.lang.startsWith('en')) || null;
  }
  let voiceDone = null; // resolves the current line's promise: true = spoken to the end, false = none/stopped/failed
  const finish = (ok) => { const r = voiceDone; voiceDone = null; if (r) r(ok); };
  function stopVoice() {
    if (voiceEl) { voiceEl.onended = voiceEl.onerror = null; voiceEl.pause(); voiceEl.removeAttribute('src'); voiceEl.load(); }
    if (synth) synth.cancel();
    finish(false);
  }
  /** Speak a dialogue line. Returns a promise: true once it has been spoken to the end, false if it wasn't voiced. */
  function voice(who, text) {
    stopVoice();
    if (!settings().sound) return Promise.resolve(false);
    const done = new Promise((res) => { voiceDone = res; });
    const file = BSC.Voices && BSC.Voices[who + '|' + text];
    if (file) {
      if (!voiceEl) { voiceEl = new Audio(); voiceEl.preload = 'auto'; }
      voiceEl.onended = () => finish(true);
      voiceEl.onerror = () => finish(false);
      voiceEl.src = `assets/voice/${file}`;
      const p = voiceEl.play();
      if (p && p.catch) p.catch(() => finish(false)); // autoplay blocked or file missing: text still shows
      return done;
    }
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') { finish(false); return done; }
    const cfg = TTS[who] || TTS.Bot; // any other speaker is a named bot (Zip, Bolt…)
    const u = new SpeechSynthesisUtterance(speakable(text));
    const v = pickVoice(cfg);
    if (v) { u.voice = v; u.lang = v.lang; }
    u.pitch = cfg.pitch; u.rate = cfg.rate;
    u.onend = () => finish(true); u.onerror = () => finish(false);
    synth.speak(u);
    return done;
  }

  BSC.Audio = {
    unlock() { if (ensure() && ctx.state === 'suspended') ctx.resume(); if (settings().music) startMusic(); },
    play(name) { try { (sfx[name] || sfx.tap)(); } catch (e) { /* audio is optional */ } },
    voice, stopVoice,
    setSound(on) { settings().sound = on; BSC.Store.save(); if (!on) stopVoice(); },
    setMusic(on) { settings().music = on; BSC.Store.save(); if (on) startMusic(); else stopMusic(); },
    suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); if (voiceEl && voiceEl.src) voiceEl.pause(); if (synth) synth.pause(); },
    resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); if (voiceEl && voiceEl.src && !voiceEl.ended) voiceEl.play().catch(() => {}); if (synth) synth.resume(); },
  };
})(window.BSC = window.BSC || {});
