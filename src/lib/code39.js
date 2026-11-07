// Code 39 barcode encoder. Code 39 is one of the formats the card scanner
// already reads, it needs no font or library, and it keeps digits as text so
// leading zeros stay on the card.
const PATTERNS = {
  '0': 'nnnwwnwnn', '1': 'wnnwnnnnw', '2': 'nnwwnnnnw', '3': 'wnwwnnnnn', '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn', '6': 'nnwwwnnnn', '7': 'nnnwnnwnw', '8': 'wnnwnnwnn', '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw', B: 'nnwnnwnnw', C: 'wnwnnwnnn', D: 'nnnnwwnnw', E: 'wnnnwwnnn',
  F: 'nnwnwwnnn', G: 'nnnnnwwnw', H: 'wnnnnwwnn', I: 'nnwnnwwnn', J: 'nnnnwwwnn',
  K: 'wnnnnnnww', L: 'nnwnnnnww', M: 'wnwnnnnwn', N: 'nnnnwnnww', O: 'wnnnwnnwn',
  P: 'nnwnwnnwn', Q: 'nnnnnnwww', R: 'wnnnnnwwn', S: 'nnwnnnwwn', T: 'nnnnwnwwn',
  U: 'wwnnnnnnw', V: 'nwwnnnnnw', W: 'wwwnnnnnn', X: 'nwnnwnnnw', Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn', '-': 'nwnnnnwnw', '.': 'wwnnnnwnn', ' ': 'nwwnnnwnn', $: 'nwnwnwnnn',
  '/': 'nwnwnnnwn', '+': 'nwnnnwnwn', '%': 'nnnwnwnwn', '*': 'nwnnwnwnn',
};

// Code 39 only carries these characters; anything else is dropped.
export const sanitizeCode39 = (value) =>
  String(value ?? '').toUpperCase().replace(/[^0-9A-Z\-. $/+%]/g, '');

// Returns bars/spaces in modules: { bar: boolean, width: 1 | 3 }
export const encodeCode39 = (value) => {
  const text = sanitizeCode39(value) || '0';
  const modules = [];
  ['*', ...text.split(''), '*'].forEach((char) => {
    const pattern = PATTERNS[char] || PATTERNS['-'];
    pattern.split('').forEach((size, i) => {
      modules.push({ bar: i % 2 === 0, width: size === 'w' ? 3 : 1 });
    });
    modules.push({ bar: false, width: 1 }); // gap between characters
  });
  return modules;
};