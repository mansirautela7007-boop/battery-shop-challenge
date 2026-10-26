# The Battery Shop Challenge

A Grade 6 fractions game in HTML, CSS, JavaScript and GSAP.
The player helps Ira run a bot charging station, learns with Professor Duster, and helps Byte make good decisions.

| Level | Skill | Learn | Play |
|---|---|---|---|
| 1 | Equivalent fractions | Cut ×2/×3/×4, join ÷2, write fractions, unlock three slots | Charge 15 bots (A1–A15): drag each bot to the slot with the same charge |
| 2 | Simplest form and HCF | The Merger, HCF in one step, shading to match | 8 orders: steer through gates in a maze, write each new fraction, pick the battery in the shop |
| 3 | Comparing fractions | Same pieces first, then compare | Tutorial + 10 rounds: spin, charge both batteries, choose who takes the trip; rounds 7–10 are numbers-only |

The story runs: Prologue → Level 1 → shop story → Level 2 → delivery story → Level 3 → ending.
All story lines, levels, numbers and feedback come from the storyboard sheet (Context, Level 1_Draft 2, Level 2_Draft 2, Level 3_Draft 1).

## Run it

- **Easiest:** open `index.html` in Chrome, Edge, Firefox or Safari (double-click it). No install, build step or internet needed. Fonts and GSAP are bundled.
- **Local server (optional):** run `python3 -m http.server 8000` in this folder, then open http://localhost:8000.

It works best in landscape. The 1280×720 stage scales to fit any screen.

## Controls

- **Next ▸** continues dialogue. Enter or Space works on a focused button.
- **Level 1:** drag the bot onto a slot, or tap the bot and then tap a slot. With a keyboard, press Enter on the bot, then Enter on a slot.
- **Level 2:** use the arrow buttons, the keyboard arrows, a swipe on the maze, or tap any path tile, gate or the shop (the bot walks there).
- **💡 Hint** gives the next clue for the current task.
- **❚❚ Pause (or Esc)** opens Resume, Replay this part, Levels, Sound, Music and Calm motion.
- **Progress** saves automatically in the browser. The title screen shows **Continue**, and **Levels** lets you replay a level or reset progress.

## QA jump menu

The orange **QA** tab on the right edge of the stage opens a menu that jumps straight to any story, learn or play scene, or to a single play item (A1–A15, Order 1–8, Tutorial and Rounds 1–10). It also unlocks all levels on the Levels screen. To ship without it, delete the `js/ui/qa.js` script line in `index.html`.

## Project structure

```
index.html            page shell + shared SVG gradients
css/style.css         layout, components, highlight states (selectable / selected / demo / ok / bad)
js/vendor/gsap.min.js GSAP 3.12.5
js/core/fraction.js   all fraction maths (equal, compare, simplify, common factors, HCF)
js/core/store.js      saved progress + settings (localStorage)
js/core/audio.js      Web Audio sound effects + soft music pad, plus recorded voice-line playback
js/core/game.js       explicit game states, scene router, abortable scene context, input lock
js/data/levels.js     every level's numbers (A1–A15, 8 maze orders, maze layout, tutorial + G1–G10)
js/data/voices.js     which dialogue lines have a recorded voice clip (assets/voice/)
js/ui/anim.js         GSAP helpers; reduced-motion + pause aware
js/ui/ui.js           stage scaling, HUD, buttons, feedback strip, fraction entry, modals
js/ui/dialog.js       dialogue panel, characters on stage (pose swaps, holograms, bot chest screens)
js/ui/battery.js      battery renderer (exact equal parts for every shape)
js/ui/qa.js           QA jump menu (testing only)
js/ui/parts.js        charging slots, hand-pointer demo, badges, fraction chains
js/scenes/*.js        title/levels, story scenes, level1, level2, level3
assets/               optimised artwork (WebP) + fonts (SIL OFL)
```

## How the maths is kept exact

- Every fraction label, charge fill and partition is drawn in code, never in the artwork.
- **Rectangle and square:** a grid with columns = denominator ÷ HCF. Equivalent fractions therefore line up column for column (2/8 draws as 4 × 2 with one charged column, the same area as 1/4).
- **Circle:** equal wedges, filled clockwise from 12 o'clock.
- **Triangle:** fan slices from the top vertex to equal steps along the base, so every part has equal area.
- **Diamond:** a true four-sided rhombus, divided by lines parallel to its sides.
- In any comparison, all batteries of the same shape use the same casing and window size.
- Checks use exact integer maths: cross-multiplication for equality and comparison, and real common factors for simplifying.

## How the asset pack was used

| Asset | Decision |
|---|---|
| Characters (Ira ×8, Byte ×9, Duster ×3, 8 bots) | Used. Pose swaps and movement with GSAP. Duster gets the hologram look in CSS. Fractions show on the bots' blank chest screens in HTML. |
| `bot_zip_happy`, `bot_volt_happy` (not generated) | Neutral pose plus a hop animation. |
| Backgrounds (7) | Used. Station evening (missing) = the morning station with a CSS evening tint. |
| `battery_circle`, `battery_square`, `battery_triangle` | Used as casings. An exact SVG region sits inside each painted window. |
| `battery_rectangle` | Not used: its window is much wider than 2:1. Replaced by a code casing in the same style with a 2:1 window. |
| `battery_diamond` (needs-review: hexagonal window) | Not used. Code casing with a true rhombus window. |
| Slot charger, slot lock, shelf cradle, cutter, Merger, charge bar frame, platform rail, queue barrier, stack tray, record board, charge wheel | Used. |
| `bot_*_top` (needs-review: not top-down) | Not used. The maze uses a code-drawn top-down bot token. |
| `l2_gate_*`, `l2_shop_entrance` (needs-review: front perspective) | Not used. Maze gates and the shop door are top-down CSS pieces. |
| `l1_plug_cable` (needs-review: includes characters) | Not used. |
| Crate, trip road, route sign (not generated) | CSS crate and race tracks. Not needed elsewhere. |
| `l3_wheel_stand` | Not needed in the final layout. |

If your copy contains `assets/sizes.json`, `battery_rectangle.webp`, `l2_gate_*.webp` or `l2_shop_entrance.webp`, the game does not load them. They are leftovers from optimising the images, and you can delete them.

## Small decisions where the storyboard left gaps

- **Level 1 slots:** the slot order is shuffled per bot. In the sheet the correct slot is always listed first.
- **Level 2 maze:** steering works on a tile grid with four gate loops. A dead end offers **Undo last gate** as well as **Start over**, so no progress is lost.
- **Level 2 stars:** follow the sheet: −1 per locked gate and −1 per gate beyond the first, minimum 1. **Try for 3 stars** replays an order.
- **Hint ladder:** three rungs. The last rung shows a visual comparison (dashed outlines or re-cut batteries) and never completes the task for the child.

## Known limitations

- Characters are single poses (no lip-sync or frame animation).
- Voice-over: every dialogue line is voiced. The prologue (16 lines, `.mp3`) uses ElevenLabs voices. All other fixed lines (72, `.m4a`) were made for free with the macOS `say` voices: Ira = Tara (India), Byte = Junior, Professor Duster = Grandpa (UK), Narrator = Shelley (UK), Bot = Fred. Lines built at runtime with level numbers (bot orders, scores, round set-ups) are spoken by the browser's built-in speech synthesis, so they sound best on a Mac, where the same voices exist, and fall back to a default English voice elsewhere. To change a fixed line, re-record its file in `assets/voice/` and keep the `"Speaker|exact text"` key in `js/data/voices.js` matching the text. Voices follow the Sound toggle, stop on Next and Skip, and pause with the Pause menu.
- Music and sound effects are synthesised in the browser.
- Portrait phones show a smaller, letterboxed stage, so landscape is recommended.
- Tested end-to-end in Chromium (desktop, plus mobile touch emulation). Safari and Firefox on real devices have not been tested yet.
