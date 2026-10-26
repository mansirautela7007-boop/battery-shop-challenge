/* Fraction maths. Pure functions, no DOM. Every check in the game goes through here. */
(function (BSC) {
  'use strict';
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; };
  const lcm = (a, b) => (a / gcd(a, b)) * b;

  const F = {
    gcd, lcm,
    /** Same value? Cross-multiplication avoids floating-point error. */
    equal: (a, b) => a[0] * b[1] === b[0] * a[1],
    /** -1 if a<b, 0 if equal, 1 if a>b (actual values, not numerals). */
    compare: (a, b) => Math.sign(a[0] * b[1] - b[0] * a[1]),
    value: (f) => f[0] / f[1],
    simplify: (f) => { const g = gcd(f[0], f[1]); return [f[0] / g, f[1] / g]; },
    isSimplest: (f) => gcd(f[0], f[1]) === 1,
    /** Does k divide both numerator and denominator? */
    dividesBoth: (k, f) => k > 1 && f[0] % k === 0 && f[1] % k === 0,
    /** Common factors greater than 1, ascending. */
    commonFactors: (f) => { const out = []; const g = gcd(f[0], f[1]); for (let k = 2; k <= g; k++) if (g % k === 0) out.push(k); return out; },
    hcf: (f) => gcd(f[0], f[1]),
    divisors: (x) => { const out = []; for (let k = 1; k <= x; k++) if (x % k === 0) out.push(k); return out; },
    /** Multiply or divide both parts. Returns null if a division would not be exact. */
    scale: (f, k, op) => {
      if (op === '×') return [f[0] * k, f[1] * k];
      if (f[0] % k || f[1] % k) return null;
      return [f[0] / k, f[1] / k];
    },
    str: (f) => `${f[0]}/${f[1]}`,
    /** Explain why k does not divide both, e.g. "8 ÷ 3 = 2 r 2". */
    divisionLine: (x, k) => (x % k === 0 ? `${x} ÷ ${k} = ${x / k}` : `${x} ÷ ${k} = ${Math.floor(x / k)} r ${x % k}`),
  };
  BSC.F = F;
})(window.BSC = window.BSC || {});
