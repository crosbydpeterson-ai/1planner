// Code 128 barcode encoder — the format every card is printed in now. It uses
// code set B (ASCII 32–126), which carries the card number exactly as stored:
// leading zeros, spaces, dashes and letters all survive, and it needs no font or
// library, so the bars are drawn directly and print sharp.
//
// Each pattern is the bar/space widths of one symbol in modules, alternating
// bar first: "212222" = bar 2, space 1, bar 2, space 2, bar 2, space 2.
const PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112', // 100-106 (103 start A, 104 start B, 105 start C, 106 stop)
];

const START_B = 104;
const STOP = 106;

// Quiet zone on each side, in modules. Without it a scanner struggles to find
// where the code begins and ends, which is worse on a small printed card.
export const CODE128_QUIET = 10;

// Code set B holds printable ASCII; anything else cannot be encoded.
export const sanitizeCode128 = (value) => String(value ?? '').replace(/[^\x20-\x7E]/g, '');

// Returns bars/spaces in modules: { bar: boolean, width: 1..4 }
export const encodeCode128 = (value) => {
  const text = sanitizeCode128(value) || '0';

  // Start B, then one symbol per character (ASCII - 32), then the weighted
  // checksum and the stop symbol.
  const symbols = [START_B, ...text.split('').map((ch) => ch.charCodeAt(0) - 32)];
  let checksum = START_B;
  for (let i = 1; i < symbols.length; i += 1) checksum += symbols[i] * i;
  symbols.push(checksum % 103, STOP);

  const modules = [];
  symbols.forEach((symbol) => {
    PATTERNS[symbol].split('').forEach((width, i) => {
      modules.push({ bar: i % 2 === 0, width: Number(width) });
    });
  });
  return modules;
};