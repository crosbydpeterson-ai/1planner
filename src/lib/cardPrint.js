// Physical sizes for the printed Magic Card sheet, in inches.
// CARD_IN is a standard wallet card (85.6 x 54 mm); PAGE_IN is US Letter.
export const CARD_IN = { w: 3.375, h: 2.125 };
export const PAGE_IN = { w: 8.5, h: 11 };

// One fixed grid — two cards across, three down — so a card lands in exactly the
// same place on every page and six cards fill a sheet with almost no waste.
// Card art is drawn 520px wide and 1in = 96px at print time, so this scale
// renders it at exactly CARD_IN.w on paper.
export const GRID_COLS = 2;
export const GRID_ROWS = 3;
export const CARDS_PER_PAGE = GRID_COLS * GRID_ROWS;
export const GUTTER_IN = 0.25;
export const PRINT_SCALE = (CARD_IN.w * 96) / 520;

const GRID_W = GRID_COLS * CARD_IN.w + (GRID_COLS - 1) * GUTTER_IN;
const GRID_H = GRID_ROWS * CARD_IN.h + (GRID_ROWS - 1) * GUTTER_IN;

// The grid is centred on the page, which keeps every card clear of the strip
// most printers cannot reach (~0.25in) even if the printer pulls the sheet a
// little off-centre.
export const gridLeftIn = (col) => (PAGE_IN.w - GRID_W) / 2 + col * (CARD_IN.w + GUTTER_IN);
export const gridTopIn = (row) => (PAGE_IN.h - GRID_H) / 2 + row * (CARD_IN.h + GUTTER_IN);

// Fronts read left to right, top to bottom. A back sits mirrored left-to-right
// inside its own row, so flipping the sheet on its long edge puts it exactly
// behind the front.
export const slotPos = (index, side = 'front') => {
  const col = index % GRID_COLS;
  const row = Math.floor(index / GRID_COLS);
  const frontLeft = gridLeftIn(col);
  return {
    left: side === 'back' ? PAGE_IN.w - frontLeft - CARD_IN.w : frontLeft,
    top: gridTopIn(row),
  };
};

export const chunkCards = (list, size = CARDS_PER_PAGE) => {
  const pages = [];
  for (let i = 0; i < list.length; i += size) pages.push(list.slice(i, i + size));
  return pages;
};