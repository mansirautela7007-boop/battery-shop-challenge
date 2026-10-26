/* Level data, transcribed from the storyboard sheet (Level 1_Draft 2, Level 2_Draft 2, Level 3_Draft 1).
   The engine reads these arrays; there are no level-specific numbers in the scene code. */
(function (BSC) {
  'use strict';
  const BOTS = ['zip', 'bolt', 'volt', 'pixel', 'spark', 'gizmo', 'rivet', 'nova'];

  // ---------- Level 1 game: drag the bot to the slot with the same charge ----------
  // need = the bot's order, slots = four slot batteries (first listed = correct one, shuffled at runtime), op = hint operation.
  const L1 = [
    { id: 'A1', shape: 'rect', need: [1, 4], slots: [[2, 8], [1, 8], [3, 8], [2, 6]], op: ['×', 2], nudge: true },
    { id: 'A2', shape: 'rect', need: [2, 6], slots: [[4, 12], [2, 12], [3, 12], [4, 6]], op: ['×', 2] },
    { id: 'A3', shape: 'rect', need: [8, 20], slots: [[4, 10], [4, 20], [8, 10], [5, 10]], op: ['÷', 2], fewer: true },
    { id: 'A4', shape: 'circle', need: [10, 12], slots: [[5, 6], [1, 6], [3, 4], [2, 3]], op: ['÷', 2], newShape: true },
    { id: 'A5', shape: 'circle', need: [2, 4], slots: [[4, 8], [2, 8], [3, 8], [4, 6]], op: ['×', 2] },
    { id: 'A6', shape: 'circle', need: [8, 12], slots: [[4, 6], [4, 8], [5, 6], [2, 6]], op: ['÷', 2] },
    { id: 'A7', shape: 'square', need: [3, 5], slots: [[6, 10], [3, 10], [4, 10], [6, 8]], op: ['×', 2], newShape: true },
    { id: 'A8', shape: 'square', need: [4, 6], slots: [[8, 12], [4, 12], [6, 12], [8, 10]], op: ['×', 2] },
    { id: 'A9', shape: 'square', need: [12, 16], slots: [[6, 8], [6, 16], [4, 8], [6, 10]], op: ['÷', 2] },
    { id: 'A10', shape: 'triangle', need: [6, 8], slots: [[3, 4], [1, 4], [2, 4], [2, 3]], op: ['÷', 2], newShape: true },
    { id: 'A11', shape: 'triangle', need: [3, 6], slots: [[6, 12], [3, 12], [4, 12], [6, 8]], op: ['×', 2] },
    { id: 'A12', shape: 'triangle', need: [4, 12], slots: [[2, 6], [4, 6], [2, 4], [1, 6]], op: ['÷', 2] },
    { id: 'A13', shape: 'diamond', need: [2, 5], slots: [[6, 15], [2, 15], [5, 15], [6, 10]], op: ['×', 3], newShape: true },
    { id: 'A14', shape: 'diamond', need: [2, 8], slots: [[4, 16], [2, 16], [3, 16], [4, 12]], op: ['×', 2] },
    { id: 'A15', shape: 'diamond', need: [12, 18], slots: [[6, 9], [6, 18], [9, 18], [6, 8]], op: ['÷', 2] },
  ].map((l, i) => Object.assign(l, { bot: BOTS[i % BOTS.length], answer: l.slots[0] }));

  // ---------- Level 2 game: gate maze + battery shop ----------
  const L2 = [
    { id: 'Order 1', shape: 'rect', order: [8, 12], gates: [2, 2, 3, 4], shelf: [[2, 3], [3, 4], [1, 2]], record: 2, nudge: true, bot: 'gizmo' },
    { id: 'Order 2', shape: 'rect', order: [6, 15], gates: [3, 5, 2, 5], shelf: [[1, 3], [2, 5], [3, 5]], record: 1, bot: 'pixel' },
    { id: 'Order 3', shape: 'circle', order: [6, 8], gates: [2, 4, 3, 4], shelf: [[3, 4], [2, 3], [1, 2]], record: 1, bot: 'spark', newShape: true },
    { id: 'Order 4', shape: 'circle', order: [4, 12], gates: [2, 2, 3, 4], shelf: [[1, 3], [1, 4], [1, 2]], record: 2, bot: 'rivet' },
    { id: 'Order 5', shape: 'square', order: [12, 18], gates: [2, 3, 6, 4], shelf: [[1, 2], [3, 4], [2, 3]], record: 2, bot: 'nova', newShape: true },
    { id: 'Order 6', shape: 'square', order: [9, 12], gates: [2, 4, 3, 6], shelf: [[2, 3], [1, 3], [3, 4]], record: 1, bot: 'bolt' },
    { id: 'Order 7', shape: 'diamond', order: [10, 20], gates: [5, 2, 4, 10], shelf: [[2, 5], [1, 2], [1, 4]], record: 2, bot: 'volt', newShape: true },
    { id: 'Order 8', shape: 'diamond', order: [16, 24], gates: [4, 2, 2, 8], shelf: [[3, 4], [2, 3], [1, 2]], record: 3, bot: 'zip' },
  ];
  // One maze for every order: start (left) → corridor → shop (right); four gate loops (two above, two below).
  // Grid cells: '#' wall, '.' path, 'S' start, 'E' shop door, 'a'..'d' gate slots (gate i = level.gates[i]).
  const MAZE = [
    '#############',
    '#..a..##..b.#',
    '#.###.##.##.#',
    'S...........E',
    '#.###.##.##.#',
    '#..c..##..d.#',
    '#############',
  ];

  // ---------- Level 3: compare (tutorial + 10 rounds) ----------
  // ans: 'a' | 'b' | '=' ; hintDen = pieces both batteries are re-cut to in the hint; numbers = no battery models (hint only).
  const L3 = [
    { id: 'Tutorial', shape: 'rect', a: ['Zip', 1, 2], b: ['Bolt', 5, 12], ans: 'a', hintDen: 12, tutorial: true,
      win: 'Zip has more charge. 1/2 = 6/12. Zip takes the trip!', why: '6 twelfths is more than 5 twelfths.' },
    { id: 'Round 1', shape: 'rect', a: ['Zip', 3, 4], b: ['Bolt', 6, 8], ans: '=', hintDen: 8, nudge: true,
      win: 'Same charge! 3/4 ×2 = 6/8. Both take the trip!', why: '3/4 ×2 = 6/8. Both have 6 of 8 pieces.' },
    { id: 'Round 2', shape: 'rect', a: ['Volt', 2, 5], b: ['Pixel', 3, 10], ans: 'a', hintDen: 10,
      win: 'Volt has more charge. 2/5 ×2 = 4/10. Volt takes the trip!', why: '2/5 ×2 = 4/10. 4 pieces is more than 3.' },
    { id: 'Round 3', shape: 'circle', a: ['Spark', 5, 8], b: ['Gizmo', 3, 4], ans: 'b', hintDen: 8,
      win: 'Gizmo has more charge. 3/4 ×2 = 6/8. Gizmo takes the trip!', why: '3/4 ×2 = 6/8. 6 pieces is more than 5.' },
    { id: 'Round 4', shape: 'circle', a: ['Rivet', 2, 6], b: ['Nova', 1, 3], ans: '=', hintDen: 3,
      win: 'Same charge! 2/6 ÷2 = 1/3. Both take the trip!', why: '2/6 ÷2 = 1/3. Both have 1 of 3 pieces.' },
    { id: 'Round 5', shape: 'square', a: ['Zip', 4, 6], b: ['Bolt', 7, 12], ans: 'a', hintDen: 12,
      win: 'Zip has more charge. 4/6 ×2 = 8/12. Zip takes the trip!', why: '4/6 ×2 = 8/12. 8 pieces is more than 7.' },
    { id: 'Round 6', shape: 'square', a: ['Volt', 3, 9], b: ['Pixel', 2, 3], ans: 'b', hintDen: 3,
      win: 'Pixel has more charge. 3/9 ÷3 = 1/3. Pixel takes the trip!', why: '3/9 ÷3 = 1/3. 2 pieces is more than 1.' },
    { id: 'Round 7', shape: 'diamond', a: ['Spark', 8, 10], b: ['Gizmo', 4, 5], ans: '=', hintDen: 5, numbers: true,
      win: 'Same charge! 8/10 ÷2 = 4/5. Both take the trip!', why: '8/10 ÷2 = 4/5. Both have 4 of 5 pieces.' },
    { id: 'Round 8', shape: 'diamond', a: ['Rivet', 6, 8], b: ['Nova', 10, 12], ans: 'b', hintDen: 12, numbers: true,
      win: 'Nova has more charge. 6/8 = 3/4 = 9/12. Nova takes the trip!', why: '6/8 = 9/12. 10 pieces is more than 9.' },
    { id: 'Round 9', shape: 'rect', a: ['Zip', 4, 12], b: ['Bolt', 1, 4], ans: 'a', hintDen: 12, numbers: true,
      win: 'Zip has more charge. 1/4 ×3 = 3/12. Zip takes the trip!', why: '1/4 ×3 = 3/12. 4 pieces is more than 3.' },
    { id: 'Round 10', shape: 'circle', a: ['Volt', 3, 6], b: ['Pixel', 4, 8], ans: '=', hintDen: 2, numbers: true,
      win: 'Same charge! 3/6 ÷3 = 1/2 and 4/8 ÷4 = 1/2. Both take the trip!', why: '3/6 = 1/2 and 4/8 = 1/2. Both have 1 of 2 pieces.' },
  ];

  BSC.Levels = { L1, L2, MAZE, L3, BOTS };
})(window.BSC = window.BSC || {});
