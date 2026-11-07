// Physical sizes for the printed Magic Card sheet, in inches.
// CARD_IN is a standard wallet card (85.6 x 54 mm); PAGE_IN is US Letter.
export const CARD_IN = { w: 3.375, h: 2.125 };
export const PAGE_IN = { w: 8.5, h: 11, margin: 0.5 };

// Card art is drawn 520px wide. At print time 1in = 96px, so this renders the
// card at exactly CARD_IN.w on paper instead of leaving it to chance.
export const PRINT_SCALE = (CARD_IN.w * 96) / 520;

// The back sits mirrored left-to-right, so flipping the sheet on its long edge
// puts it exactly behind the front.
export const cardLeftIn = (side) =>
  side === 'back' ? PAGE_IN.w - PAGE_IN.margin - CARD_IN.w : PAGE_IN.margin;