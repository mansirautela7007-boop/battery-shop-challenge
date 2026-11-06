/* Game audio: recorded sound effects + background music (free CC0 files, see assets/audio/CREDITS.txt),
   with the small Web Audio synth below as a fallback if a file can't play. */
(function (BSC) {
  'use strict';
  let ctx = null, master = null;
  const settings = () => BSC.Store.get().settings;

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
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

  const synthSfx = {
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

  // Recorded effects: a few <audio> copies per sound so quick repeats overlap (works from file://).
  const SFX = ['tap', 'pick', 'drop', 'cut', 'clunk', 'ok', 'wrong', 'charge', 'gate', 'holo', 'star', 'win', 'roll'];
  const SFX_VOL = { tap: 0.5, roll: 0.55, star: 0.7 };
  const pool = {};
  function sfxEl(name) {
    const list = pool[name] || (pool[name] = []);
    let el = list.find((a) => a.paused || a.ended);
    if (!el && list.length < 4) { el = new Audio(`assets/audio/sfx/${name}.wav`); el.preload = 'auto'; el.volume = SFX_VOL[name] || 0.8; list.push(el); }
    return el;
  }
  function playSfx(name) {
    if (!settings().sound) return;
    if (!SFX.includes(name)) return (synthSfx[name] || synthSfx.tap)();
    const el = sfxEl(name);
    if (!el) return;
    el.currentTime = 0;
    const p = el.play();
    if (p && p.catch) p.catch(() => { try { (synthSfx[name] || synthSfx.tap)(); } catch (e) { /* audio is optional */ } });
  }

  // Background music: a cheerful theme for the menu and story, a calm loop for learning and play.
  const TRACKS = { theme: 'assets/audio/music/theme.m4a', play: 'assets/audio/music/play.m4a' };
  const MUSIC_VOL = { theme: 0.32, play: 0.22 };
  const tracks = {};
  let want = null, duck = 1, fadeTimer = null;
  function trackEl(name) {
    if (!tracks[name]) { const a = new Audio(TRACKS[name]); a.loop = true; a.preload = 'auto'; a.volume = 0; tracks[name] = a; }
    return tracks[name];
  }
  function fadeMusic() {
    clearInterval(fadeTimer);
    fadeTimer = setInterval(() => {
      let moving = false;
      Object.entries(tracks).forEach(([name, a]) => {
        const target = settings().music && name === want ? MUSIC_VOL[name] * duck : 0;
        const v = a.volume + Math.max(-0.02, Math.min(0.02, target - a.volume));
        a.volume = Math.max(0, Math.min(1, v));
        if (Math.abs(target - a.volume) > 0.001) moving = true;
        else if (target === 0 && !a.paused) a.pause();
      });
      if (!moving) clearInterval(fadeTimer);
    }, 50);
  }
  function startMusic() {
    if (!settings().music || !want) return;
    const a = trackEl(want);
    if (a.paused) { const p = a.play(); if (p && p.catch) p.catch(() => {}); } // blocked until the first tap: unlock() retries
    fadeMusic();
  }
  function stopMusic() { fadeMusic(); }
  /** Pick the background track ('theme' / 'play'); it cross-fades from the current one. */
  function music(name) {
    if (!TRACKS[name] || want === name) return;
    want = name; startMusic(); fadeMusic();
  }
  function setDuck(d) { if (duck !== d) { duck = d; fadeMusic(); } }

  // Dialogue voice. Fixed lines play a recorded file (one <audio> element reused, works from file://).
  // Lines built at runtime (level numbers) use the browser's free speech synthesis, matched per character.
  let voiceEl = null;
  const synth = window.speechSynthesis || null;
  const TTS = { // preferred system voices (same as the recorded ones on a Mac), then a fallback pitch/rate
    Ira: { names: ['Tara', 'Veena', 'Samantha'], lang: 'en-IN', pitch: 1.15, rate: 1 },
    Byte: { names: ['Junior', 'Rishi'], lang: 'en', pitch: 1.5, rate: 1.05 },
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
  const finish = (ok) => { setDuck(1); const r = voiceDone; voiceDone = null; if (r) r(ok); };
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
    setDuck(0.45); // music dips under speech
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
    unlock() { if (ensure() && ctx.state === 'suspended') ctx.resume(); startMusic(); },
    play(name) { try { playSfx(name); } catch (e) { /* audio is optional */ } },
    music, voice, stopVoice,
    setSound(on) { settings().sound = on; BSC.Store.save(); if (!on) stopVoice(); },
    setMusic(on) { settings().music = on; BSC.Store.save(); if (on) startMusic(); else stopMusic(); },
    suspend() { if (ctx && ctx.state === 'running') ctx.suspend(); Object.values(tracks).forEach((a) => a.pause()); if (voiceEl && voiceEl.src) voiceEl.pause(); if (synth) synth.pause(); },
    resume() { if (ctx && ctx.state === 'suspended') ctx.resume(); startMusic(); if (voiceEl && voiceEl.src && !voiceEl.ended) voiceEl.play().catch(() => {}); if (synth) synth.resume(); },
  };
})(window.BSC = window.BSC || {});
