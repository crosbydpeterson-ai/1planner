// Paw & Spell - Core Chess Logic

export function parsePiece(cell) {
  if (!cell) return null;
  return { color: cell[0], type: cell[1].toLowerCase() };
}

export function cloneBoard(board) {
  return board.map(row => [...row]);
}

export function isInBounds(r, c) {
  return r >= 0 && r < 8 && c >= 0 && c < 8;
}

export function getValidMoves(board, row, col, lastMove = null, castlingRights = null) {
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
      if (target) {
        if (target[0] !== color) moves.push([r, c]);
        break;
      }
      moves.push([r, c]);
      r += dr; c += dc;
    }
  };

  switch (type) {
    case 'p': {
      const dir = color === 'w' ? -1 : 1;
      const startRow = color === 'w' ? 6 : 1;
      // Forward
      if (isInBounds(row + dir, col) && !board[row + dir][col]) {
        moves.push([row + dir, col]);
        if (row === startRow && !board[row + 2 * dir][col]) {
          moves.push([row + 2 * dir, col]);
        }
      }
      // Captures
      for (const dc of [-1, 1]) {
        const r = row + dir, c = col + dc;
        if (isInBounds(r, c)) {
          if (board[r][c] && board[r][c][0] !== color) moves.push([r, c]);
          // En passant
          if (lastMove && lastMove.piece?.[1]?.toLowerCase() === 'p' &&
              Math.abs(lastMove.from[0] - lastMove.to[0]) === 2 &&
              lastMove.to[0] === row && lastMove.to[1] === c) {
            moves.push([r, c]);
          }
        }
      }
      break;
    }
    case 'r':
      for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) slide(dr, dc);
      break;
    case 'n':
      for (const [dr, dc] of [[2,1],[2,-1],[-2,1],[-2,-1],[1,2],[1,-2],[-1,2],[-1,-2]]) {
        addMove(row + dr, col + dc);
      }
      break;
    case 'b':
      for (const [dr, dc] of [[1,1],[1,-1],[-1,1],[-1,-1]]) slide(dr, dc);
      break;
    case 'q':
      for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) slide(dr, dc);
      break;
    case 'k': {
      for (const [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]) {
        addMove(row + dr, col + dc);
      }
      // Castling
      if (castlingRights) {
        const side = color === 'w' ? 'white' : 'black';
        const kingRow = color === 'w' ? 7 : 0;
        if (row === kingRow && col === 4) {
          if (castlingRights[side]?.kingSide &&
              !board[kingRow][5] && !board[kingRow][6] &&
              board[kingRow][7] === (color + 'R')) {
            moves.push([kingRow, 6]);
          }
          if (castlingRights[side]?.queenSide &&
              !board[kingRow][3] && !board[kingRow][2] && !board[kingRow][1] &&
              board[kingRow][0] === (color + 'R')) {
            moves.push([kingRow, 2]);
          }
        }
      }
      break;
    }
    default: break;
  }

  return moves;
}

export function isKingInCheck(board, color) {
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
        const moves = getValidMoves(board, r, c);
        if (moves.some(([mr, mc]) => mr === kingPos[0] && mc === kingPos[1])) return true;
      }
    }
  }
  return false;
}

export function getLegalMoves(board, row, col, lastMove = null, castlingRights = null) {
  const cell = board[row][col];
  if (!cell) return [];
  const { color } = parsePiece(cell);
  const candidates = getValidMoves(board, row, col, lastMove, castlingRights);
  return candidates.filter(([tr, tc]) => {
    const newBoard = cloneBoard(board);
    newBoard[tr][tc] = newBoard[row][col];
    newBoard[row][col] = null;
    return !isKingInCheck(newBoard, color);
  });
}

export function applyMove(board, from, to, promotionPiece = null) {
  const newBoard = cloneBoard(board);
  const piece = newBoard[from[0]][from[1]];
  const { color, type } = parsePiece(piece);

  // En passant capture
  if (type === 'p' && from[1] !== to[1] && !newBoard[to[0]][to[1]]) {
    newBoard[from[0]][to[1]] = null;
  }

  // Castling rook move
  if (type === 'k' && Math.abs(from[1] - to[1]) === 2) {
    if (to[1] === 6) { newBoard[from[0]][5] = color + 'R'; newBoard[from[0]][7] = null; }
    else if (to[1] === 2) { newBoard[from[0]][3] = color + 'R'; newBoard[from[0]][0] = null; }
  }

  newBoard[to[0]][to[1]] = piece;
  newBoard[from[0]][from[1]] = null;

  // Pawn promotion
  if (type === 'p' && (to[0] === 0 || to[0] === 7)) {
    newBoard[to[0]][to[1]] = color + (promotionPiece || 'Q');
  }

  return newBoard;
}

export function hasAnyLegalMoves(board, color, lastMove = null, castlingRights = null) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (cell && cell[0] === color) {
        if (getLegalMoves(board, r, c, lastMove, castlingRights).length > 0) return true;
      }
    }
  }
  return false;
}

export function generateGemPositions(count = 3) {
  const gems = [];
  const used = new Set();
  // Avoid center and edges
  while (gems.length < count) {
    const r = Math.floor(Math.random() * 4) + 2;
    const c = Math.floor(Math.random() * 6) + 1;
    const key = `${r},${c}`;
    if (!used.has(key)) {
      used.add(key);
      gems.push({ row: r, col: c, collected: { w: false, b: false } });
    }
  }
  return gems;
}

// ── AI: Minimax with alpha-beta pruning ─────────────────────────────────────

const PIECE_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };

// Piece-square tables (from white's perspective, row 0 = rank 8)
const PST = {
  p: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [50, 50, 50, 50, 50, 50, 50, 50],
    [10, 10, 20, 30, 30, 20, 10, 10],
    [5,  5, 10, 25, 25, 10,  5,  5],
    [0,  0,  0, 20, 20,  0,  0,  0],
    [5, -5,-10,  0,  0,-10, -5,  5],
    [5, 10, 10,-20,-20, 10, 10,  5],
    [0,  0,  0,  0,  0,  0,  0,  0],
  ],
  n: [
    [-50,-40,-30,-30,-30,-30,-40,-50],
    [-40,-20,  0,  0,  0,  0,-20,-40],
    [-30,  0, 10, 15, 15, 10,  0,-30],
    [-30,  5, 15, 20, 20, 15,  5,-30],
    [-30,  0, 15, 20, 20, 15,  0,-30],
    [-30,  5, 10, 15, 15, 10,  5,-30],
    [-40,-20,  0,  5,  5,  0,-20,-40],
    [-50,-40,-30,-30,-30,-30,-40,-50],
  ],
  b: [
    [-20,-10,-10,-10,-10,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5, 10, 10,  5,  0,-10],
    [-10,  5,  5, 10, 10,  5,  5,-10],
    [-10,  0, 10, 10, 10, 10,  0,-10],
    [-10, 10, 10, 10, 10, 10, 10,-10],
    [-10,  5,  0,  0,  0,  0,  5,-10],
    [-20,-10,-10,-10,-10,-10,-10,-20],
  ],
  r: [
    [0,  0,  0,  0,  0,  0,  0,  0],
    [5, 10, 10, 10, 10, 10, 10,  5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [-5,  0,  0,  0,  0,  0,  0, -5],
    [0,  0,  0,  5,  5,  0,  0,  0],
  ],
  q: [
    [-20,-10,-10, -5, -5,-10,-10,-20],
    [-10,  0,  0,  0,  0,  0,  0,-10],
    [-10,  0,  5,  5,  5,  5,  0,-10],
    [-5,  0,  5,  5,  5,  5,  0, -5],
    [0,  0,  5,  5,  5,  5,  0, -5],
    [-10,  5,  5,  5,  5,  5,  0,-10],
    [-10,  0,  5,  0,  0,  0,  0,-10],
    [-20,-10,-10, -5, -5,-10,-10,-20],
  ],
  k: [
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-30,-40,-40,-50,-50,-40,-40,-30],
    [-20,-30,-30,-40,-40,-30,-30,-20],
    [-10,-20,-20,-20,-20,-20,-20,-10],
    [20, 20,  0,  0,  0,  0, 20, 20],
    [20, 30, 10,  0,  0, 10, 30, 20],
  ],
};

function getPSTScore(type, row, col, color) {
  const table = PST[type];
  if (!table) return 0;
  const r = color === 'w' ? row : 7 - row;
  return table[r][col];
}

function evaluateBoard(board) {
  let score = 0;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (!cell) continue;
      const color = cell[0];
      const type = cell[1].toLowerCase();
      const val = (PIECE_VALUES[type] || 0) + getPSTScore(type, r, c, color);
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
      const legal = getLegalMoves(board, r, c, lastMove, castlingRights);
      for (const [tr, tc] of legal) {
        // MVV-LVA ordering: captures first, then by victim value
        const victim = board[tr][tc];
        const victimVal = victim ? (PIECE_VALUES[victim[1].toLowerCase()] || 0) : 0;
        const attackerVal = PIECE_VALUES[cell[1].toLowerCase()] || 0;
        const priority = victim ? (victimVal * 10 - attackerVal) : -1;
        moves.push({ from: [r, c], to: [tr, tc], priority });
      }
    }
  }
  // Sort captures first for better pruning
  moves.sort((a, b) => b.priority - a.priority);
  return moves;
}

function minimax(board, depth, alpha, beta, maximizing, lastMove, castlingRights) {
  if (depth === 0) return evaluateBoard(board);

  const color = maximizing ? 'w' : 'b';
  const moves = getAllMoves(board, color, lastMove, castlingRights);

  if (moves.length === 0) {
    if (isKingInCheck(board, color)) return maximizing ? -50000 : 50000;
    return 0; // stalemate
  }

  if (maximizing) {
    let best = -Infinity;
    for (const mv of moves) {
      const nb = applyMove(board, mv.from, mv.to);
      const score = minimax(nb, depth - 1, alpha, beta, false, { from: mv.from, to: mv.to, piece: board[mv.from[0]][mv.from[1]] }, castlingRights);
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const mv of moves) {
      const nb = applyMove(board, mv.from, mv.to);
      const score = minimax(nb, depth - 1, alpha, beta, true, { from: mv.from, to: mv.to, piece: board[mv.from[0]][mv.from[1]] }, castlingRights);
      if (score < best) best = score;
      if (score < beta) beta = score;
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function getAIMoveSimple(board, color, lastMove = null, castlingRights = null) {
  const depth = 3;
  const maximizing = color === 'w';
  const moves = getAllMoves(board, color, lastMove, castlingRights);
  if (moves.length === 0) return null;

  // Count pieces to detect opening (many pieces still on board = opening)
  let pieceCount = 0;
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (board[r][c]) pieceCount++;
  const isOpening = pieceCount >= 28;

  // In the opening, add randomness to avoid always-same lines
  const jitter = () => (Math.random() - 0.5) * (isOpening ? 30 : 8);

  let bestScore = maximizing ? -Infinity : Infinity;
  let bestMoves = [];

  for (const mv of moves) {
    const nb = applyMove(board, mv.from, mv.to);
    const raw = minimax(nb, depth - 1, -Infinity, Infinity, !maximizing, { from: mv.from, to: mv.to, piece: board[mv.from[0]][mv.from[1]] }, castlingRights);
    const score = raw + jitter();

    if (maximizing) {
      if (score > bestScore) { bestScore = score; bestMoves = [mv]; }
      else if (Math.abs(score - bestScore) < 10) bestMoves.push(mv);
    } else {
      if (score < bestScore) { bestScore = score; bestMoves = [mv]; }
      else if (Math.abs(score - bestScore) < 10) bestMoves.push(mv);
    }
  }

  // Pick randomly among equally good moves to add variety
  return bestMoves[Math.floor(Math.random() * bestMoves.length)] || moves[0];
}