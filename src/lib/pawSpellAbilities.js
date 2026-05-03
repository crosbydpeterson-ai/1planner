// PawSpell — All 60 ability implementations.
// executeAbility(ctx) returns { newBoard, newAbilityEffects, newGems, newGemsCollected, message, winConditionOverride? }

import { cloneBoard, parsePiece } from './pawSpellLogic';
import { PIECE_TO_PET, PET_TYPES } from './pawSpellConstants';

const opp = (s) => (s === 'w' ? 'b' : 'w');

// ─────────────────── Helpers ───────────────────

export function findPieces(board, color, type = null) {
  const out = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const cell = board[r][c];
    if (!cell || cell[0] !== color) continue;
    if (type && cell[1].toLowerCase() !== type) continue;
    out.push({ row: r, col: c, piece: cell });
  }
  return out;
}

export function emptySquares(board) {
  const out = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    if (!board[r][c]) out.push({ row: r, col: c });
  }
  return out;
}

export function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickRandomEmpty(board, count = 1) {
  const empties = emptySquares(board);
  const out = [];
  while (out.length < count && empties.length > 0) {
    const i = Math.floor(Math.random() * empties.length);
    out.push(empties.splice(i, 1)[0]);
  }
  return out;
}

export function manhattanDist(a, b) {
  return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

function nearestEnemy(board, fromRow, fromCol, side) {
  let best = null, bestDist = Infinity;
  const enemy = opp(side);
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const cell = board[r][c];
    if (!cell || cell[0] !== enemy) continue;
    const d = Math.abs(r - fromRow) + Math.abs(c - fromCol);
    if (d < bestDist) { bestDist = d; best = { row: r, col: c }; }
  }
  return best;
}

// Apply effect — append, dedupe key effects when needed
function pushEffect(effects, eff) {
  return [...(effects || []), eff];
}

// Mark a square as frozen
function freezeSquare(effects, row, col, turnsLeft = 1) {
  return pushEffect(effects, { type: 'frozen', row, col, turnsLeft });
}

// ─────────────────── Effects API exposed to game ───────────────────

/** Decrement all effect timers, drop expired ones. Call at start of each turn for the side whose turn just started. */
export function tickEffects(abilityEffects) {
  if (!abilityEffects) return [];
  return abilityEffects
    .map(e => {
      if (typeof e.turnsLeft === 'number') return { ...e, turnsLeft: e.turnsLeft - 1 };
      return e;
    })
    .filter(e => {
      if (typeof e.turnsLeft === 'number' && e.turnsLeft <= 0) return false;
      return true;
    });
}

/** Returns true if the given square is currently frozen. */
export function isSquareFrozen(abilityEffects, row, col) {
  return (abilityEffects || []).some(e => e.type === 'frozen' && e.row === row && e.col === col);
}

/** Returns true if a movement crosses or enters a lava-walled file. */
export function isFileBlockedByLava(abilityEffects, fromCol, toCol) {
  for (const e of (abilityEffects || [])) {
    if (e.type !== 'lavaWall') continue;
    const minC = Math.min(fromCol, toCol);
    const maxC = Math.max(fromCol, toCol);
    if (e.file >= minC && e.file <= maxC) return true;
  }
  return false;
}

/** Returns true if a side currently has a glacier debuff (movement limited to 1 square). */
export function hasGlacier(abilityEffects, side) {
  return (abilityEffects || []).some(e => e.type === 'glacier' && e.side === side);
}

/** Returns true if a side has slow (half range). */
export function hasSlow(abilityEffects, side) {
  return (abilityEffects || []).some(e => e.type === 'slow' && e.side === side);
}

/** Returns true if a side's bishops are static-locked. */
export function bishopsLocked(abilityEffects, side) {
  return (abilityEffects || []).some(e => e.type === 'staticField' && e.side === side);
}

/** Returns true if a side's rooks are rooted. */
export function rooksRooted(abilityEffects, side) {
  return (abilityEffects || []).some(e => e.type === 'root' && e.targetType === 'r' && e.side === side);
}

/** Returns blocked-square effects (overgrowth/frostPath) at row,col. */
export function isSquareBlocked(abilityEffects, row, col) {
  return (abilityEffects || []).some(e =>
    (e.type === 'blocked' && e.row === row && e.col === col) ||
    (e.type === 'frostPath' && e.row === row && e.col === col)
  );
}

/** Should the king-capture be cancelled? Returns { cancelled, newEffects, message } or null. */
export function tryInterceptKingCapture(abilityEffects, board, side, kingRow, kingCol) {
  // Phoenix — respawn on starting square if empty
  // Ice Shield — single-use cancel
  // Divine Shield — usesLeft cancel
  // Sanctuary — cancels capture of adjacent friendly (handled separately)
  let effects = [...(abilityEffects || [])];

  const iceShieldIdx = effects.findIndex(e => e.type === 'iceShield' && e.side === side && (e.usesLeft || 0) > 0);
  if (iceShieldIdx >= 0) {
    effects[iceShieldIdx] = { ...effects[iceShieldIdx], usesLeft: effects[iceShieldIdx].usesLeft - 1 };
    if (effects[iceShieldIdx].usesLeft <= 0) effects.splice(iceShieldIdx, 1);
    return { cancelled: true, newEffects: effects, message: '🛡️ Ice Shield blocked the capture!' };
  }

  const divineIdx = effects.findIndex(e => e.type === 'divineShield' && e.side === side && (e.usesLeft || 0) > 0);
  if (divineIdx >= 0) {
    effects[divineIdx] = { ...effects[divineIdx], usesLeft: effects[divineIdx].usesLeft - 1 };
    if (effects[divineIdx].usesLeft <= 0) effects.splice(divineIdx, 1);
    return { cancelled: true, newEffects: effects, message: '🏆 Divine Shield blocked the capture!' };
  }

  const phoenixIdx = effects.findIndex(e => e.type === 'phoenix' && e.side === side);
  if (phoenixIdx >= 0) {
    effects.splice(phoenixIdx, 1);
    const startRow = side === 'w' ? 7 : 0;
    const startCol = 4;
    if (!board[startRow][startCol]) {
      const nb = cloneBoard(board);
      nb[startRow][startCol] = side + 'K';
      return { cancelled: true, newEffects: effects, newBoard: nb, message: '🔥 Phoenix respawned the Unicorn!' };
    }
  }

  return null;
}

// ─────────────────── Per-category execution ───────────────────

function execFire(ctx) {
  const { board, side, pieceType, target, abilityEffects, sourceSquare } = ctx;
  let nb = cloneBoard(board);
  let effects = [...(abilityEffects || [])];

  switch (pieceType) {
    case 'sprite': {
      // Remove target adjacent enemy pawn
      if (!target) return { error: 'Pick an adjacent enemy Sprite (pawn)' };
      const t = nb[target[0]][target[1]];
      if (!t || t[0] === side || t[1].toLowerCase() !== 'p') return { error: 'Must target an enemy pawn' };
      nb[target[0]][target[1]] = null;
      return { newBoard: nb, newAbilityEffects: effects, message: '🔥 Scorched the enemy pawn!' };
    }
    case 'golem': {
      // Lava wall on a file for 2 turns
      if (!target) return { error: 'Pick a file (any square in that column)' };
      effects = pushEffect(effects, { type: 'lavaWall', file: target[1], turnsLeft: 2, side });
      return { newBoard: nb, newAbilityEffects: effects, message: `🌋 Lava Wall on file ${String.fromCharCode(97 + target[1])}!` };
    }
    case 'gryphon': {
      // Move gryphon to any empty square within 3 manhattan steps
      if (!sourceSquare || !target) return { error: 'Pick an empty square within 3 steps' };
      if (nb[target[0]][target[1]]) return { error: 'Target must be empty' };
      if (manhattanDist(sourceSquare, target) > 3) return { error: 'Too far (max 3 steps)' };
      nb[target[0]][target[1]] = nb[sourceSquare[0]][sourceSquare[1]];
      nb[sourceSquare[0]][sourceSquare[1]] = null;
      return { newBoard: nb, newAbilityEffects: effects, message: '🔥 Flame Dash!' };
    }
    case 'wisp': {
      // Burn trap
      if (!target) return { error: 'Pick a square for the burn trap' };
      effects = pushEffect(effects, { type: 'burnTrap', row: target[0], col: target[1], turnsLeft: 3, side });
      return { newBoard: nb, newAbilityEffects: effects, message: '🔥 Ember Trail set!' };
    }
    case 'dragon': {
      // Remove up to 2 enemy pieces (target is array of [row,col])
      const targets = Array.isArray(target?.[0]) ? target : [target];
      let removed = 0;
      for (const t of targets) {
        if (!t) continue;
        const cell = nb[t[0]][t[1]];
        if (cell && cell[0] !== side && cell[1].toLowerCase() !== 'k') {
          nb[t[0]][t[1]] = null; removed++;
        }
      }
      if (removed === 0) return { error: 'Pick enemy pieces (not the king)' };
      return { newBoard: nb, newAbilityEffects: effects, message: `🔥 Inferno removed ${removed} piece(s)!` };
    }
    case 'unicorn': {
      effects = pushEffect(effects, { type: 'phoenix', side });
      return { newBoard: nb, newAbilityEffects: effects, message: '🔥 Phoenix blessing — your Unicorn will respawn once if captured.' };
    }
  }
  return { error: 'Unknown ability' };
}

function execIce(ctx) {
  const { board, side, pieceType, target, abilityEffects, sourceSquare } = ctx;
  let nb = cloneBoard(board);
  let effects = [...(abilityEffects || [])];

  switch (pieceType) {
    case 'sprite': {
      if (!target) return { error: 'Pick a target piece to freeze' };
      effects = freezeSquare(effects, target[0], target[1], 2); // ticks at start of next turn → effectively 1
      return { newBoard: nb, newAbilityEffects: effects, message: '❄️ Frozen!' };
    }
    case 'golem': {
      effects = pushEffect(effects, { type: 'glacier', side: opp(side), turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '🧊 Glacier — opponent moves only 1 square next turn!' };
    }
    case 'gryphon': {
      // Freeze nearest enemy piece (no movement here — effect only)
      if (!sourceSquare) return { error: 'Source missing' };
      const ne = nearestEnemy(nb, sourceSquare[0], sourceSquare[1], side);
      if (!ne) return { error: 'No enemy pieces found' };
      effects = freezeSquare(effects, ne.row, ne.col, 2);
      return { newBoard: nb, newAbilityEffects: effects, message: '❄️ Ice Blitz froze the nearest enemy!' };
    }
    case 'wisp': {
      if (!target) return { error: 'Pick a center square for the frost path' };
      effects = pushEffect(effects, { type: 'frostPath', row: target[0], col: target[1], turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '❄️ Frost Path laid!' };
    }
    case 'dragon': {
      // Freeze ALL enemy pieces for 1 turn
      const enemy = opp(side);
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const cell = nb[r][c];
        if (cell && cell[0] === enemy) effects = freezeSquare(effects, r, c, 2);
      }
      return { newBoard: nb, newAbilityEffects: effects, message: '❄️ Blizzard froze every enemy piece!' };
    }
    case 'unicorn': {
      effects = pushEffect(effects, { type: 'iceShield', side, usesLeft: 1 });
      return { newBoard: nb, newAbilityEffects: effects, message: '🛡️ Ice Shield ready — next king capture cancelled!' };
    }
  }
  return { error: 'Unknown ability' };
}

function execStorm(ctx) {
  const { board, side, pieceType, target, abilityEffects, sourceSquare } = ctx;
  let nb = cloneBoard(board);
  let effects = [...(abilityEffects || [])];

  switch (pieceType) {
    case 'sprite': {
      if (!target) return { error: 'Pick a diagonal neighbor' };
      effects = freezeSquare(effects, target[0], target[1], 2);
      return { newBoard: nb, newAbilityEffects: effects, message: '⚡ Zapped!' };
    }
    case 'golem': {
      if (!target || !sourceSquare) return { error: 'Pick an enemy piece' };
      const dr = Math.sign(target[0] - sourceSquare[0]);
      const dc = Math.sign(target[1] - sourceSquare[1]);
      let nr = target[0] + dr * 2, nc = target[1] + dc * 2;
      // clamp to board
      nr = Math.max(0, Math.min(7, nr)); nc = Math.max(0, Math.min(7, nc));
      if (nb[nr][nc]) return { error: 'Push destination blocked' };
      nb[nr][nc] = nb[target[0]][target[1]];
      nb[target[0]][target[1]] = null;
      return { newBoard: nb, newAbilityEffects: effects, message: '⚡ Thunder pushed them back!' };
    }
    case 'gryphon': {
      if (!sourceSquare || !target) return { error: 'Pick any empty square' };
      if (nb[target[0]][target[1]]) return { error: 'Target must be empty' };
      nb[target[0]][target[1]] = nb[sourceSquare[0]][sourceSquare[1]];
      nb[sourceSquare[0]][sourceSquare[1]] = null;
      return { newBoard: nb, newAbilityEffects: effects, message: '⚡ Lightning Jump!' };
    }
    case 'wisp': {
      effects = pushEffect(effects, { type: 'staticField', side: opp(side), turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '⚡ Static Field — enemy bishops paralysed!' };
    }
    case 'dragon': {
      if (!target) return { error: 'Pick any enemy piece (not king)' };
      const cell = nb[target[0]][target[1]];
      if (!cell || cell[0] === side || cell[1].toLowerCase() === 'k') return { error: 'Must be enemy piece (not king)' };
      nb[target[0]][target[1]] = null;
      return { newBoard: nb, newAbilityEffects: effects, message: '⚡ Thunderstrike!' };
    }
    case 'unicorn': {
      effects = pushEffect(effects, { type: 'stormEye', side, turnsLeft: 4 });
      return { newBoard: nb, newAbilityEffects: effects, message: '⚡ Storm Eye — your Unicorn cannot be checked for 2 turns!' };
    }
  }
  return { error: 'Unknown ability' };
}

function execNature(ctx) {
  const { board, side, pieceType, target, abilityEffects, sourceSquare } = ctx;
  let nb = cloneBoard(board);
  let effects = [...(abilityEffects || [])];

  switch (pieceType) {
    case 'sprite': {
      if (!target) return { error: 'Pick adjacent piece' };
      effects = freezeSquare(effects, target[0], target[1], 2);
      return { newBoard: nb, newAbilityEffects: effects, message: '🌿 Vine Trap!' };
    }
    case 'golem': {
      effects = pushEffect(effects, { type: 'root', targetType: 'r', side: opp(side), turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '🌳 Roots — enemy rooks rooted!' };
    }
    case 'gryphon': {
      if (!target) return { error: 'Pick an enemy piece' };
      const cell = nb[target[0]][target[1]];
      if (!cell || cell[0] === side || cell[1].toLowerCase() === 'k') return { error: 'Must be enemy piece (not king)' };
      nb[target[0]][target[1]] = null;
      return { newBoard: nb, newAbilityEffects: effects, message: '🐾 Pounce!' };
    }
    case 'wisp': {
      if (!target) return { error: 'Pick an empty square' };
      if (nb[target[0]][target[1]]) return { error: 'Target must be empty' };
      nb[target[0]][target[1]] = side + 'P';
      return { newBoard: nb, newAbilityEffects: effects, message: '🌸 Bloom — new Sprite born!' };
    }
    case 'dragon': {
      // 3 random enemy-occupied adjacent squares blocked
      const enemy = opp(side);
      const enemySquares = findPieces(nb, enemy);
      const sq = enemySquares.sort(() => Math.random() - 0.5).slice(0, 3);
      for (const s of sq) effects = pushEffect(effects, { type: 'blocked', row: s.row, col: s.col, turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '🌳 Overgrowth — enemies blocked in!' };
    }
    case 'unicorn': {
      effects = pushEffect(effects, { type: 'sanctuary', side, turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '🌿 Sanctuary protects allies near your king!' };
    }
  }
  return { error: 'Unknown ability' };
}

function execShadow(ctx) {
  const { board, side, pieceType, target, abilityEffects, sourceSquare } = ctx;
  let nb = cloneBoard(board);
  let effects = [...(abilityEffects || [])];

  switch (pieceType) {
    case 'sprite': {
      if (!target) return { error: 'Pick a friendly piece to vanish' };
      effects = pushEffect(effects, { type: 'vanish', row: target[0], col: target[1], side, turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '🌑 Vanished!' };
    }
    case 'golem': {
      effects = pushEffect(effects, { type: 'phase', side, turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '🌑 Phase — your rook can pass through pieces!' };
    }
    case 'gryphon': {
      // Place a decoy on adjacent empty square
      if (!sourceSquare) return { error: 'Source missing' };
      const adj = [];
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = sourceSquare[0] + dr, c = sourceSquare[1] + dc;
        if (r >= 0 && r < 8 && c >= 0 && c < 8 && !nb[r][c]) adj.push([r, c]);
      }
      if (adj.length === 0) return { error: 'No empty adjacent square' };
      const [dr, dc] = randomFrom(adj);
      nb[dr][dc] = side + 'N';
      effects = pushEffect(effects, { type: 'decoy', row: dr, col: dc, side });
      return { newBoard: nb, newAbilityEffects: effects, message: '🌑 Shadow Clone summoned!' };
    }
    case 'wisp': {
      effects = pushEffect(effects, { type: 'umbra', side: opp(side), turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '🌑 Umbra — enemy bishops will move randomly!' };
    }
    case 'dragon': {
      if (!target) return { error: 'Pick an enemy piece' };
      const cell = nb[target[0]][target[1]];
      if (!cell || cell[0] === side || cell[1].toLowerCase() === 'k') return { error: 'Must be enemy piece (not king)' };
      const empties = emptySquares(nb);
      if (empties.length === 0) return { error: 'Board is full' };
      const dst = randomFrom(empties);
      nb[dst.row][dst.col] = cell;
      nb[target[0]][target[1]] = null;
      return { newBoard: nb, newAbilityEffects: effects, message: '🌑 Voided to a random square!' };
    }
    case 'unicorn': {
      effects = pushEffect(effects, { type: 'darkShroud', side, turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '🌑 Dark Shroud cloaks your king!' };
    }
  }
  return { error: 'Unknown ability' };
}

function execLight(ctx) {
  const { board, side, pieceType, target, abilityEffects, sourceSquare } = ctx;
  let nb = cloneBoard(board);
  let effects = [...(abilityEffects || [])];

  switch (pieceType) {
    case 'sprite': {
      effects = pushEffect(effects, { type: 'illuminate', side, turnsLeft: 1 });
      return { newBoard: nb, newAbilityEffects: effects, message: '💡 Illuminated! Opponent moves revealed.' };
    }
    case 'golem': {
      effects = pushEffect(effects, { type: 'beacon', side, turnsLeft: 1 });
      return { newBoard: nb, newAbilityEffects: effects, message: '☀️ Beacon — your pieces get +1 range this turn!' };
    }
    case 'gryphon': {
      if (!sourceSquare || !target) return { error: 'Pick any empty square' };
      if (nb[target[0]][target[1]]) return { error: 'Target must be empty' };
      nb[target[0]][target[1]] = nb[sourceSquare[0]][sourceSquare[1]];
      nb[sourceSquare[0]][sourceSquare[1]] = null;
      return { newBoard: nb, newAbilityEffects: effects, message: '😇 Holy Leap!' };
    }
    case 'wisp': {
      if (!target) return { error: 'Pick a friendly piece' };
      effects = pushEffect(effects, { type: 'blessing', row: target[0], col: target[1], turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '✨ Blessed!' };
    }
    case 'dragon': {
      // Stun all enemies (freeze)
      const enemy = opp(side);
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const cell = nb[r][c];
        if (cell && cell[0] === enemy) effects = freezeSquare(effects, r, c, 2);
      }
      return { newBoard: nb, newAbilityEffects: effects, message: '☀️ Radiance stuns all enemies!' };
    }
    case 'unicorn': {
      effects = pushEffect(effects, { type: 'divineShield', side, usesLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '🏆 Divine Shield (2 charges) active!' };
    }
  }
  return { error: 'Unknown ability' };
}

function execOcean(ctx) {
  const { board, side, pieceType, target, abilityEffects, sourceSquare } = ctx;
  let nb = cloneBoard(board);
  let effects = [...(abilityEffects || [])];

  switch (pieceType) {
    case 'sprite': {
      if (!target || !sourceSquare) return { error: 'Pick adjacent enemy piece' };
      const dr = Math.sign(sourceSquare[0] - target[0]);
      const dc = Math.sign(sourceSquare[1] - target[1]);
      const nr = target[0] + dr, nc = target[1] + dc;
      if (nr === sourceSquare[0] && nc === sourceSquare[1]) return { error: 'Cannot pull onto yourself' };
      if (nb[nr][nc]) return { error: 'Path blocked' };
      nb[nr][nc] = nb[target[0]][target[1]];
      nb[target[0]][target[1]] = null;
      return { newBoard: nb, newAbilityEffects: effects, message: '🌊 Tide Pull!' };
    }
    case 'golem': {
      // Swap two enemy pieces (target is array of two squares)
      const targets = Array.isArray(target?.[0]) ? target : null;
      if (!targets || targets.length !== 2) return { error: 'Pick 2 enemy pieces to swap' };
      const a = nb[targets[0][0]][targets[0][1]];
      const b = nb[targets[1][0]][targets[1][1]];
      if (!a || !b || a[0] === side || b[0] === side) return { error: 'Both must be enemy pieces' };
      nb[targets[0][0]][targets[0][1]] = b;
      nb[targets[1][0]][targets[1][1]] = a;
      return { newBoard: nb, newAbilityEffects: effects, message: '🌊 Whirlpool swap!' };
    }
    case 'gryphon': {
      if (!sourceSquare || !target) return { error: 'Pick a board-edge square' };
      const onEdge = target[0] === 0 || target[0] === 7 || target[1] === 0 || target[1] === 7;
      if (!onEdge) return { error: 'Must be on the board edge' };
      if (nb[target[0]][target[1]]) return { error: 'Target must be empty' };
      nb[target[0]][target[1]] = nb[sourceSquare[0]][sourceSquare[1]];
      nb[sourceSquare[0]][sourceSquare[1]] = null;
      return { newBoard: nb, newAbilityEffects: effects, message: '🌊 Current carried you to the edge!' };
    }
    case 'wisp': {
      // Push entire row left or right (target = [row, dir]) — using target.row, fallback dir=1
      if (!target) return { error: 'Pick a row' };
      const row = target[0];
      const dir = target[2] === -1 ? -1 : 1; // optional 3rd component for direction
      const newRow = new Array(8).fill(null);
      for (let c = 0; c < 8; c++) {
        const nc = c + dir;
        if (nc >= 0 && nc < 8) newRow[nc] = nb[row][c];
      }
      // Edge pieces fall off (removed)
      nb[row] = newRow;
      return { newBoard: nb, newAbilityEffects: effects, message: `🌊 Tsunami swept row ${8 - row}!` };
    }
    case 'dragon': {
      // Shuffle all enemy pieces to random empty squares
      const enemy = opp(side);
      const enemyPieces = findPieces(nb, enemy).filter(p => p.piece[1].toLowerCase() !== 'k');
      // Clear them
      for (const p of enemyPieces) nb[p.row][p.col] = null;
      // Re-place randomly
      const empties = emptySquares(nb);
      empties.sort(() => Math.random() - 0.5);
      for (const p of enemyPieces) {
        if (empties.length === 0) break;
        const dst = empties.pop();
        nb[dst.row][dst.col] = p.piece;
      }
      return { newBoard: nb, newAbilityEffects: effects, message: '🌊 Maelstrom scattered the enemy!' };
    }
    case 'unicorn': {
      const types = ['p', 'r', 'n', 'b', 'q'];
      const allowedCapturer = randomFrom(types);
      effects = pushEffect(effects, { type: 'depth', side, allowedCapturer, turnsLeft: 99 });
      return { newBoard: nb, newAbilityEffects: effects, message: `🌊 Depth — only enemy ${allowedCapturer.toUpperCase()} can capture your Unicorn!` };
    }
  }
  return { error: 'Unknown ability' };
}

function execChaos(ctx) {
  const { board, side, pieceType, target, abilityEffects, sourceSquare } = ctx;
  let nb = cloneBoard(board);
  let effects = [...(abilityEffects || [])];

  switch (pieceType) {
    case 'sprite': {
      // Pick a random sprite ability from fire/ice/storm
      const cats = ['fire', 'ice', 'storm'];
      const cat = randomFrom(cats);
      // For simplicity: if it's fire (needs target), require target; else self-cast simplified version
      if (cat === 'ice') { effects = freezeSquare(effects, sourceSquare[0], sourceSquare[1] === 7 ? 6 : sourceSquare[1] + 1, 2); }
      else if (cat === 'storm') { if (target) effects = freezeSquare(effects, target[0], target[1], 2); }
      else if (cat === 'fire') {
        if (target) {
          const t = nb[target[0]][target[1]];
          if (t && t[0] !== side && t[1].toLowerCase() === 'p') nb[target[0]][target[1]] = null;
        }
      }
      return { newBoard: nb, newAbilityEffects: effects, message: `🎲 Wild Card cast a random ${cat} ability!` };
    }
    case 'golem': {
      const enemies = findPieces(nb, opp(side)).filter(p => p.piece[1].toLowerCase() !== 'k');
      if (enemies.length === 0) return { error: 'No enemies' };
      const pick = randomFrom(enemies);
      const empties = emptySquares(nb);
      if (empties.length === 0) return { error: 'No empty squares' };
      const dst = randomFrom(empties);
      nb[dst.row][dst.col] = pick.piece;
      nb[pick.row][pick.col] = null;
      return { newBoard: nb, newAbilityEffects: effects, message: '🎲 Mayhem teleported a random enemy!' };
    }
    case 'gryphon': {
      if (!sourceSquare || !target) return { error: 'Pick an enemy piece' };
      const tCell = nb[target[0]][target[1]];
      if (!tCell || tCell[0] === side) return { error: 'Must be enemy piece' };
      // Both go to random empty squares
      const myPiece = nb[sourceSquare[0]][sourceSquare[1]];
      nb[sourceSquare[0]][sourceSquare[1]] = null;
      nb[target[0]][target[1]] = null;
      const empties = emptySquares(nb);
      empties.sort(() => Math.random() - 0.5);
      if (empties.length < 2) return { error: 'Not enough empty squares' };
      nb[empties[0].row][empties[0].col] = myPiece;
      nb[empties[1].row][empties[1].col] = tCell;
      return { newBoard: nb, newAbilityEffects: effects, message: '🎲 Havoc!' };
    }
    case 'wisp': {
      effects = pushEffect(effects, { type: 'discord', side: opp(side), turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '🎲 Discord — enemy queen will move randomly!' };
    }
    case 'dragon': {
      // Remove 3 random non-king pieces
      const all = [];
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const cell = nb[r][c];
        if (cell && cell[1].toLowerCase() !== 'k') all.push([r, c]);
      }
      all.sort(() => Math.random() - 0.5);
      const removed = all.slice(0, 3);
      for (const [r, c] of removed) nb[r][c] = null;
      return { newBoard: nb, newAbilityEffects: effects, message: `💥 Apocalypse removed ${removed.length} random pieces!` };
    }
    case 'unicorn': {
      const opts = ['gems5', 'checkmate_only'];
      const pick = randomFrom(opts);
      return { newBoard: nb, newAbilityEffects: effects, message: `🎲 Entropy! New rule: ${pick === 'gems5' ? 'need 5 gems' : 'checkmate only'}!`, winConditionOverride: pick };
    }
  }
  return { error: 'Unknown ability' };
}

function execTime(ctx) {
  const { board, side, pieceType, target, abilityEffects, previousBoard } = ctx;
  let nb = cloneBoard(board);
  let effects = [...(abilityEffects || [])];

  switch (pieceType) {
    case 'sprite': {
      if (!previousBoard) return { error: 'No previous state to rewind to' };
      return { newBoard: cloneBoard(previousBoard), newAbilityEffects: effects, message: '⏪ Rewind!' };
    }
    case 'golem': {
      if (!target) return { error: 'Pick a piece to freeze in stasis' };
      effects = freezeSquare(effects, target[0], target[1], 4);
      return { newBoard: nb, newAbilityEffects: effects, message: '⏳ Stasis — frozen for 3 turns!' };
    }
    case 'gryphon': {
      effects = pushEffect(effects, { type: 'haste', side, turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '⏩ Haste — your next move grants a bonus move!' };
    }
    case 'wisp': {
      effects = pushEffect(effects, { type: 'slow', side: opp(side), turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '⏳ Slow!' };
    }
    case 'dragon': {
      effects = pushEffect(effects, { type: 'timeStop', side: opp(side), turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '⏸️ Time Stop — opponent skips next turn!' };
    }
    case 'unicorn': {
      effects = pushEffect(effects, { type: 'foresight', side, turnsLeft: 1 });
      return { newBoard: nb, newAbilityEffects: effects, message: '👁️ Foresight active!' };
    }
  }
  return { error: 'Unknown ability' };
}

function execCrystal(ctx) {
  const { board, side, pieceType, target, abilityEffects, gems, gemsCollected, sourceSquare } = ctx;
  let nb = cloneBoard(board);
  let effects = [...(abilityEffects || [])];
  let newGems = gems ? [...gems] : [];
  let newCollected = { ...(gemsCollected || { w: 0, b: 0 }) };

  switch (pieceType) {
    case 'sprite': {
      effects = pushEffect(effects, { type: 'gemSense', side, turnsLeft: 3 });
      return { newBoard: nb, newAbilityEffects: effects, message: '💎 Gem Sense — gems revealed!' };
    }
    case 'golem': {
      if (!target) return { error: 'Pick a gem' };
      const gem = newGems.find(g => g.row === target[0] && g.col === target[1]);
      if (!gem) return { error: 'Must target a gem' };
      effects = pushEffect(effects, { type: 'gemLock', row: target[0], col: target[1], side: opp(side), turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '💎 Gem Lock!' };
    }
    case 'gryphon': {
      if (!sourceSquare || newGems.length === 0) return { error: 'No gems to collect' };
      let nearest = null, dist = Infinity;
      for (const g of newGems) {
        const d = Math.abs(g.row - sourceSquare[0]) + Math.abs(g.col - sourceSquare[1]);
        if (d < dist) { dist = d; nearest = g; }
      }
      if (!nearest) return { error: 'No gems' };
      newGems = newGems.filter(g => !(g.row === nearest.row && g.col === nearest.col));
      newCollected[side] = (newCollected[side] || 0) + 1;
      return { newBoard: nb, newAbilityEffects: effects, newGems, newGemsCollected: newCollected, message: '💎 Gem Rush — collected the nearest gem!' };
    }
    case 'wisp': {
      effects = pushEffect(effects, { type: 'gemShield', side, turnsLeft: 2 });
      return { newBoard: nb, newAbilityEffects: effects, message: '💎 Gem Shield!' };
    }
    case 'dragon': {
      const enemy = opp(side);
      if ((newCollected[enemy] || 0) > 0) {
        newCollected[enemy] -= 1;
        newCollected[side] = (newCollected[side] || 0) + 1;
        return { newBoard: nb, newAbilityEffects: effects, newGems, newGemsCollected: newCollected, message: '💎 Gem Hoard — stole a gem!' };
      } else {
        return { newBoard: nb, newAbilityEffects: effects, newGems, newGemsCollected: newCollected, message: '💎 Gem Hoard — opponent had no gems, +50 tokens later!', tokenBonus: 50 };
      }
    }
    case 'unicorn': {
      return { newBoard: nb, newAbilityEffects: effects, message: '💎 Crystal Fortress — need 5 gems to win!', winConditionOverride: 'gems5' };
    }
  }
  return { error: 'Unknown ability' };
}

// ─────────────────── Public entry ───────────────────

const EXECUTORS = {
  fire: execFire, ice: execIce, storm: execStorm, nature: execNature,
  shadow: execShadow, light: execLight, ocean: execOcean,
  chaos: execChaos, time: execTime, crystal: execCrystal,
};

/**
 * Execute an ability.
 * ctx: { board, side, category, pieceType, target, abilityEffects, sourceSquare, gems, gemsCollected, previousBoard }
 * Returns: { newBoard?, newAbilityEffects?, newGems?, newGemsCollected?, message?, winConditionOverride?, tokenBonus?, error? }
 */
export function executeAbility(ctx) {
  const fn = EXECUTORS[ctx.category];
  if (!fn) return { error: 'Unknown ability category: ' + ctx.category };
  return fn(ctx);
}