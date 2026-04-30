// Web Worker for PawSpell AI — runs minimax off the main thread

// ── Inlined logic (no imports in workers) ───────────────────────────────────

function parsePiece(cell) {
  if (!cell) return null;
  return { color: cell[0], type: cell[1].toLowerCase() };
}

function cloneBoard(board) {
  return board.map(row => [...row]);
}

function isInBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

function getValidMoves(board, row, col, lastMove, castlingRights) {
  const cell = board[row][col];
  if (!cell) return [];
  const { color, type } = parsePiece(cell);
  const moves = [];

  const addMove = (r, c) => {
    if (!isInBounds(r, c)) return false;
    const target = board[r][c];
    if (target && target[0] === color) return false;
    moves.push([r, c]);
    return !target;
  };

  const slide = (dr, dc) => {
    let r = row + dr, c = col + dc;
    while (isInBounds(r, c)) {
      const target = board[r][c];
      if (target) { if (target[0] !== color) moves.push([r, c]); break; }
      moves.push([r, c]);
      r += dr; c += dc;
    }
  };

  switch (type) {
    case 'p': {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      if (isInBounds(row + dir, col) && !board[row + dir][col]) {
        moves.push([row + dir, col]);
        if (row === startRow && !board[row + 2 * dir][col]) moves.push([row + 2 * dir, col]);
      }
      for (const dc of [-1, 1]) {
        const r = row + dir, c = col + dc;
        if (isInBounds(r, c)) {
          if (board[r][c] && board[r][c][0] !== color) moves.push([r, c]);
          if (lastMove && lastMove.piece?.[1]?.toLowerCase() === 'p' &&
              Math.abs(lastMove.from[0] - lastMove.to[0]) === 2 &&
              lastMove.to[0] === row && lastMove.to[1] === c) {
            moves.push([r, c]);
          }
        }
      }
      break;
    }
    case 'r': for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) slide(dr, dc); break;
    case 'n': for (const [dr, dc] of [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]) addMove(row+dr, col+dc); break;
    case 'b': for (const [dr, dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]) slide(dr, dc); break;
    case 'q': for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) slide(dr, dc); break;
    case 'k': {
      for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) addMove(row+dr, col+dc);
      if (castlingRights) {
        const side = color === 'w' ? 'white' : 'black';
        const kingRow = color === 'w' ? 7 : 0;
        if (row === kingRow && col === 4) {
          if (castlingRights[side]?.kingSide && !board[kingRow][5] && !board[kingRow][6] && board[kingRow][7] === (color + 'R')) moves.push([kingRow, 6]);
          if (castlingRights[side]?.queenSide && !board[kingRow][3] && !board[kingRow][2] && !board[kingRow][1] && board[kingRow][0] === (color + 'R')) moves.push([kingRow, 2]);
        }
      }
      break;
    }
  }
  return moves;
}

function isKingInCheck(board, color) {
  let kingPos = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === (color + 'K')) { kingPos = [r, c]; break; }
    }
    if (kingPos) break;
  }
  if (!kingPos) return true;
  const opp = color === 'w' ? 'b' : 'w';
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell && cell[0] === opp) {
        const moves = getValidMoves(board, r, c, null, null);
        if (moves.some(([mr, mc]) => mr === kingPos[0] && mc === kingPos[1])) return true;
      }
    }
  }
  return false;
}

function getLegalMoves(board, row, col, lastMove, castlingRights) {
  const cell = board[row][col];
  if (!cell) return [];
  const { color } = parsePiece(cell);
  return getValidMoves(board, row, col, lastMove, castlingRights).filter(([tr, tc]) => {
    const nb = cloneBoard(board);
    nb[tr][tc] = nb[row][col];
    nb[row][col] = null;
    return !isKingInCheck(nb, color);
  });
}

function applyMove(board, from, to) {
  const nb = cloneBoard(board);
  const piece = nb[from[0]][from[1]];
  const { color, type } = parsePiece(piece);
  if (type === 'p' && from[1] !== to[1] && !nb[to[0]][to[1]]) nb[from[0]][to[1]] = null;
  if (type === 'k' && Math.abs(from[1] - to[1]) === 2) {
    if (to[1] === 6) { nb[from[0]][5] = color + 'R'; nb[from[0]][7] = null; }
    else if (to[1] === 2) { nb[from[0]][3] = color + 'R'; nb[from[0]][0] = null; }
  }
  nb[to[0]][to[1]] = piece;
  nb[from[0]][from[1]] = null;
  if (type === 'p' && (to[0] === 0 || to[0] === 7)) nb[to[0]][to[1]] = color + 'Q';
  return nb;
}

// ── Evaluation ───────────────────────────────────────────────────────────────

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

const PST = {
  p: [[0,0,0,0,0,0,0,0],[50,50,50,50,50,50,50,50],[10,10,20,30,30,20,10,10],[5,5,10,25,25,10,5,5],[0,0,0,20,20,0,0,0],[5,-5,-10,0,0,-10,-5,5],[5,10,10,-20,-20,10,10,5],[0,0,0,0,0,0,0,0]],
  n: [[-50,-40,-30,-30,-30,-30,-40,-50],[-40,-20,0,0,0,0,-20,-40],[-30,0,10,15,15,10,0,-30],[-30,5,15,20,20,15,5,-30],[-30,0,15,20,20,15,0,-30],[-30,5,10,15,15,10,5,-30],[-40,-20,0,5,5,0,-20,-40],[-50,-40,-30,-30,-30,-30,-40,-50]],
  b: [[-20,-10,-10,-10,-10,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,10,10,5,0,-10],[-10,5,5,10,10,5,5,-10],[-10,0,10,10,10,10,0,-10],[-10,10,10,10,10,10,10,-10],[-10,5,0,0,0,0,5,-10],[-20,-10,-10,-10,-10,-10,-10,-20]],
  r: [[0,0,0,0,0,0,0,0],[5,10,10,10,10,10,10,5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[-5,0,0,0,0,0,0,-5],[0,0,0,5,5,0,0,0]],
  q: [[-20,-10,-10,-5,-5,-10,-10,-20],[-10,0,0,0,0,0,0,-10],[-10,0,5,5,5,5,0,-10],[-5,0,5,5,5,5,0,-5],[0,0,5,5,5,5,0,-5],[-10,5,5,5,5,5,0,-10],[-10,0,5,0,0,0,0,-10],[-20,-10,-10,-5,-5,-10,-10,-20]],
  k: [[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-30,-40,-40,-50,-50,-40,-40,-30],[-20,-30,-30,-40,-40,-30,-30,-20],[-10,-20,-20,-20,-20,-20,-20,-10],[20,20,0,0,0,0,20,20],[20,30,10,0,0,10,30,20]],
};

function getPST(type, row, col, color) {
  const table = PST[type];
  if (!table) return 0;
  const r = color === 'w' ? row : 7 - row;
  return table[r][col];
}

function evaluate(board) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (!cell) continue;
      const color = cell[0];
      const type = cell[1].toLowerCase();
      const val = (PIECE_VALUES[type] || 0) + getPST(type, r, c, color);
      score += color === 'w' ? val : -val;
    }
  }
  return score;
}

function getAllMoves(board, color, lastMove, castlingRights) {
  const moves = [];
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (!cell || cell[0] !== color) continue;
      for (const [tr, tc] of getLegalMoves(board, r, c, lastMove, castlingRights)) {
        const victim = board[tr][tc];
        const victimVal = victim ? (PIECE_VALUES[victim[1].toLowerCase()] || 0) : 0;
        const attackerVal = PIECE_VALUES[cell[1].toLowerCase()] || 0;
        moves.push({ from: [r, c], to: [tr, tc], priority: victim ? victimVal * 10 - attackerVal : -1 });
      }
    }
  }
  moves.sort((a, b) => b.priority - a.priority);
  return moves;
}

function minimax(board, depth, alpha, beta, maximizing, lastMove, castlingRights) {
  if (depth === 0) return evaluate(board);
  const color = maximizing ? 'w' : 'b';
  const moves = getAllMoves(board, color, lastMove, castlingRights);
  if (moves.length === 0) {
    if (isKingInCheck(board, color)) return maximizing ? -50000 : 50000;
    return 0;
  }
  if (maximizing) {
    let best = -Infinity;
    for (const mv of moves) {
      const nb = applyMove(board, mv.from, mv.to);
      const s = minimax(nb, depth - 1, alpha, beta, false, { from: mv.from, to: mv.to, piece: board[mv.from[0]][mv.from[1]] }, castlingRights);
      if (s > best) best = s;
      if (s > alpha) alpha = s;
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const mv of moves) {
      const nb = applyMove(board, mv.from, mv.to);
      const s = minimax(nb, depth - 1, alpha, beta, true, { from: mv.from, to: mv.to, piece: board[mv.from[0]][mv.from[1]] }, castlingRights);
      if (s < best) best = s;
      if (s < beta) beta = s;
      if (beta <= alpha) break;
    }
    return best;
  }
}

// ── Opening book (black responses, since AI usually plays black) ─────────────
// Format: boardHash -> list of candidate moves [{from,to}]
// We encode by piece positions of interest for the first few moves
const OPENING_BOOK = [
  // e4 responses
  { trigger: { from: [6,4], to: [4,4] }, responses: [
    { from: [1,4], to: [3,4] }, // e5
    { from: [1,2], to: [2,2] }, // c6 Caro-Kann
    { from: [1,3], to: [3,3] }, // d5 Scandinavian
    { from: [1,2], to: [3,2] }, // c5 Sicilian
  ]},
  // d4 responses
  { trigger: { from: [6,3], to: [4,3] }, responses: [
    { from: [1,3], to: [3,3] }, // d5
    { from: [1,5], to: [2,5] }, // f6 King's Indian
    { from: [1,4], to: [2,4] }, // e6 French-style
  ]},
  // Nf3
  { trigger: { from: [7,6], to: [5,5] }, responses: [
    { from: [1,5], to: [2,5] },
    { from: [0,6], to: [2,5] },
  ]},
];

function findOpeningMove(board, color, lastMove) {
  if (!lastMove) return null;
  for (const entry of OPENING_BOOK) {
    const t = entry.trigger;
    if (lastMove.from[0] === t.from[0] && lastMove.from[1] === t.from[1] &&
        lastMove.to[0] === t.to[0] && lastMove.to[1] === t.to[1]) {
      // Shuffle responses for variety
      const shuffled = [...entry.responses].sort(() => Math.random() - 0.5);
      for (const resp of shuffled) {
        const legal = getLegalMoves(board, resp.from[0], resp.from[1], lastMove, null);
        if (legal.some(([r, c]) => r === resp.to[0] && c === resp.to[1])) {
          return { from: resp.from, to: resp.to };
        }
      }
    }
  }
  return null;
}

// ── Main AI entry ─────────────────────────────────────────────────────────────
function getBestMove(board, color, lastMove, castlingRights) {
  const maximizing = color === 'w';

  // Count pieces to gauge game phase
  let pieceCount = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (board[r][c]) pieceCount++;
  const isOpening = pieceCount >= 28;

  // Try opening book first
  if (isOpening && lastMove) {
    const bookMove = findOpeningMove(board, color, lastMove);
    if (bookMove) return bookMove;
  }

  // Depth scales with game phase: deeper in endgame (fewer pieces = faster)
  const depth = pieceCount <= 10 ? 5 : pieceCount <= 20 ? 4 : 3;

  const moves = getAllMoves(board, color, lastMove, castlingRights);
  if (moves.length === 0) return null;

  // Jitter: more in opening to vary play, less in endgame for precision
  const jitterRange = isOpening ? 25 : 5;
  const jitter = () => (Math.random() - 0.5) * jitterRange;

  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMoves = [];

  for (const mv of moves) {
    const nb = applyMove(board, mv.from, mv.to);
    const raw = minimax(nb, depth - 1, -Infinity, Infinity, !maximizing,
      { from: mv.from, to: mv.to, piece: board[mv.from[0]][mv.from[1]] }, castlingRights);
    const score = raw + jitter();

    if (maximizing) {
      if (score > bestScore + 5) { bestScore = score; bestMoves = [mv]; }
      else if (score >= bestScore - 5) bestMoves.push(mv);
    } else {
      if (score < bestScore - 5) { bestScore = score; bestMoves = [mv]; }
      else if (score <= bestScore + 5) bestMoves.push(mv);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)] || moves[0];
}

// ── Worker message handler ────────────────────────────────────────────────────
self.onmessage = (e) => {
  const { board, color, lastMove, castlingRights } = e.data;
  const move = getBestMove(board, color, lastMove, castlingRights);
  self.postMessage({ move });
};