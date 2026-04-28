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

// Simple AI: pick best move using basic heuristics
export function getAIMoveSimple(board, color, lastMove = null, castlingRights = null) {
  const pieceValues = { p: 1, r: 5, n: 3, b: 3, q: 9, k: 100 };
  let bestScore = -Infinity;
  let bestMove = null;

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const cell = board[r][c];
      if (!cell || cell[0] !== color) continue;
      const moves = getLegalMoves(board, r, c, lastMove, castlingRights);
      for (const [tr, tc] of moves) {
        const newBoard = applyMove(board, [r, c], [tr, tc]);
        let score = 0;
        const target = board[tr][tc];
        if (target) score += (pieceValues[target[1].toLowerCase()] || 0) * 10;
        // Prefer center
        score += (3.5 - Math.abs(tc - 3.5)) + (3.5 - Math.abs(tr - 3.5));
        // Check bonus
        const opp = color === 'w' ? 'b' : 'w';
        if (isKingInCheck(newBoard, opp)) score += 5;
        if (score > bestScore) { bestScore = score; bestMove = { from: [r, c], to: [tr, tc] }; }
      }
    }
  }
  return bestMove;
}