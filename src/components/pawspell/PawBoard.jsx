import React, { useState, useMemo } from 'react';
import { getLegalMoves, parsePiece } from '@/lib/pawSpellLogic';
import { PIECE_TO_PET, PET_EMOJIS, PET_TO_CHESS_NAME, PET_DESCRIPTIONS } from '@/lib/pawSpellConstants';

function PieceCard({ cell, equippedSkins, skinImages }) {
  if (!cell) return null;
  const { color, type } = parsePiece(cell);
  const petType = PIECE_TO_PET[type];
  const skinId = equippedSkins?.[color]?.[petType];
  const skinUrl = skinId ? skinImages?.[skinId] : null;
  const emoji = PET_EMOJIS[petType];
  const isWhite = color === 'w';

  return (
    <div className={`w-full h-full flex items-center justify-center relative select-none`}>
      {skinUrl ? (
        <img src={skinUrl} alt={petType} className="w-4/5 h-4/5 object-contain rounded-full" />
      ) : (
        <span className={`text-2xl drop-shadow-md ${isWhite ? '' : 'opacity-80'}`}
          style={{ filter: isWhite ? 'none' : 'hue-rotate(180deg) brightness(0.7)' }}>
          {emoji}
        </span>
      )}
      {!isWhite && (
        <div className="absolute inset-0 rounded-full" style={{ background: 'rgba(100,0,200,0.15)' }} />
      )}
    </div>
  );
}

export default function PawBoard({
  board, currentTurn, myColor, gems = [],
  gemProgress = {},
  equippedSkins = {}, skinImages = {},
  oppAbilities = {}, // abilities indexed by pieceType for opponent
  onMove, lastMove = null, castlingRights = null,
  disabled = false,
  abilityEffects = [],
  abilityTargetMode = false,
  onAbilityTarget = null,
  abilityTargetSquares = null,
}) {
  const [selected, setSelected] = useState(null);
  const [hoveredPiece, setHoveredPiece] = useState(null);
  const [hoveredOppMoves, setHoveredOppMoves] = useState([]); // legal moves of hovered opp piece
  const [legalMoves, setLegalMoves] = useState([]);

  const handleSquareClick = (row, col) => {
    if (abilityTargetMode) {
      if (onAbilityTarget) onAbilityTarget(row, col);
      return;
    }
    if (disabled) return;
    const cell = board[row][col];

    if (selected) {
      const isLegal = legalMoves.some(([r, c]) => r === row && c === col);
      if (isLegal) {
        onMove(selected, [row, col]);
        setSelected(null);
        setLegalMoves([]);
        return;
      }
    }

    if (cell && cell[0] === myColor && cell[0] === currentTurn) {
      setSelected([row, col]);
      setLegalMoves(getLegalMoves(board, row, col, lastMove, castlingRights, abilityEffects));
    } else {
      setSelected(null);
      setLegalMoves([]);
    }
  };

  const isAbilityTargetSquare = (row, col) =>
    abilityTargetSquares && abilityTargetSquares.some(([r, c]) => r === row && c === col);

  const getEffectsAt = (row, col) => (abilityEffects || []).filter(e =>
    (e.row === row && e.col === col) ||
    (e.type === 'lavaWall' && e.file === col)
  );

  const oppColor = myColor === 'w' ? 'b' : 'w';

  const handleHover = (row, col) => {
    const cell = board[row][col];
    if (cell) {
      const { color, type } = parsePiece(cell);
      const petType = PIECE_TO_PET[type];
      const isOpp = color === oppColor;
      const ability = isOpp ? (oppAbilities[petType] || null) : null;
      setHoveredPiece({ petType, cell, row, col, isOpp, ability });
      // Show where the opponent piece can move
      if (isOpp) {
        const moves = getLegalMoves(board, row, col, lastMove, castlingRights, abilityEffects);
        setHoveredOppMoves(moves);
      } else {
        setHoveredOppMoves([]);
      }
    } else {
      setHoveredPiece(null);
      setHoveredOppMoves([]);
    }
  };

  const isLegalTarget = (row, col) => legalMoves.some(([r, c]) => r === row && c === col);
  const isOppMove = (row, col) => hoveredOppMoves.some(([r, c]) => r === row && c === col);
  const isSelected = (row, col) => selected && selected[0] === row && selected[1] === col;
  const isLastMove = (row, col) => lastMove && (
    (lastMove.from[0] === row && lastMove.from[1] === col) ||
    (lastMove.to[0] === row && lastMove.to[1] === col)
  );
  const getGem = (row, col) => gems.find(g => g.row === row && g.col === col);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Hover tooltip */}
      <div className="min-h-10 flex items-center justify-center mb-1">
        {hoveredPiece && (
          <div className="bg-purple-900/90 backdrop-blur text-white rounded-xl px-4 py-2 text-xs text-center border border-purple-500/40 max-w-xs">
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="font-bold text-purple-200">{PET_TO_CHESS_NAME[hoveredPiece.petType]}</span>
              <span className="text-purple-400">·</span>
              <span className="text-purple-300">{PET_DESCRIPTIONS[hoveredPiece.petType]}</span>
            </div>
            {hoveredPiece.isOpp && hoveredPiece.ability && (
              <div className="mt-1 pt-1 border-t border-purple-700/50">
                <span className="text-red-300 font-semibold">
                  {hoveredPiece.ability.icon || '⚡'} {hoveredPiece.ability.name}
                </span>
                <span className="text-purple-400 ml-1">· {hoveredPiece.ability.description}</span>
              </div>
            )}
            {hoveredPiece.isOpp && hoveredOppMoves.length > 0 && (
              <div className="mt-0.5 text-orange-300 text-[10px]">
                {hoveredOppMoves.length} possible move{hoveredOppMoves.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Board */}
      <div className="rounded-2xl overflow-hidden border-2 border-purple-700 shadow-2xl shadow-purple-900/60"
        style={{ background: '#1a0f2e' }}>
        {board.map((row, ri) => (
          <div key={ri} className="flex">
            {row.map((cell, ci) => {
              const isLight = (ri + ci) % 2 === 0;
              const gem = getGem(ri, ci);
              const selected_ = isSelected(ri, ci);
              const legal = isLegalTarget(ri, ci);
              const lastMv = isLastMove(ri, ci);

              let bg = isLight ? '#2d1b4e' : '#1a0f2e';
              if (lastMv) bg = isLight ? '#4c1d6e' : '#3b1558';
              if (selected_) bg = '#7c3aed';

              const effects = getEffectsAt(ri, ci);
              const isFrozen = effects.some(e => e.type === 'frozen');
              const isLavaWall = effects.some(e => e.type === 'lavaWall');
              const isBurnTrap = effects.some(e => e.type === 'burnTrap');
              const isFrostPath = effects.some(e => e.type === 'frostPath');
              const isBlocked = effects.some(e => e.type === 'blocked');
              const isBlessing = effects.some(e => e.type === 'blessing');
              const isVanish = effects.some(e => e.type === 'vanish');
              const isGemLock = effects.some(e => e.type === 'gemLock');
              const isAbTarget = isAbilityTargetSquare(ri, ci);
              const isOppThreat = isOppMove(ri, ci);

              if (isLavaWall) bg = '#7c2d12';
              if (isFrostPath) bg = '#0e7490';
              if (isOppThreat) bg = isLight ? '#7c2020' : '#5c1010';
              if (isAbTarget) bg = '#facc15';

              return (
                <div
                  key={ci}
                  className={`relative cursor-pointer transition-colors ${isAbTarget ? 'ring-2 ring-yellow-300 z-10' : ''} ${isOppThreat && !isAbTarget ? 'ring-1 ring-red-500/60' : ''}`}
                  style={{ width: 52, height: 52, background: bg }}
                  onClick={() => handleSquareClick(ri, ci)}
                  onMouseEnter={() => handleHover(ri, ci)}
                  onMouseLeave={() => setHoveredPiece(null)}
                >
                  {/* Ability effect overlays */}
                  {isFrozen && <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-lg z-15" style={{ background: 'rgba(56,189,248,0.25)' }}>❄️</div>}
                  {isBurnTrap && <div className="absolute bottom-0 right-0 text-xs z-15 pointer-events-none">🔥</div>}
                  {isBlocked && <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-base z-15" style={{ background: 'rgba(34,197,94,0.25)' }}>🌿</div>}
                  {isBlessing && <div className="absolute top-0 left-0 text-xs z-15 pointer-events-none">✨</div>}
                  {isVanish && <div className="absolute inset-0 pointer-events-none z-15" style={{ background: 'rgba(0,0,0,0.4)' }} />}
                  {isGemLock && <div className="absolute top-0 left-0 text-[10px] z-15 pointer-events-none">🔒</div>}
                  {/* Legal move indicator */}
                  {legal && (
                    <div className={`absolute inset-0 flex items-center justify-center z-10 pointer-events-none`}>
                      {cell ? (
                        <div className="absolute inset-0 border-2 border-purple-400 rounded-sm opacity-80" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-purple-400 opacity-70" />
                      )}
                    </div>
                  )}

                  {/* Gem */}
                  {gem && (() => {
                    const key = `${ri},${ci}`;
                    const prog = gemProgress[key];
                    const turns = prog ? prog.turns : 0;
                    return (
                      <div className="absolute top-0 right-0 z-20 pointer-events-none flex flex-col items-end">
                        <span className="text-sm leading-none">💎</span>
                        {turns > 0 && (
                          <span className={`text-[9px] font-bold leading-none px-0.5 rounded ${prog.side === 'w' ? 'text-yellow-300' : 'text-purple-300'}`}>
                            {turns}/3
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Piece */}
                  {cell && (
                    <PieceCard
                      cell={cell}
                      equippedSkins={equippedSkins}
                      skinImages={skinImages}
                    />
                  )}

                  {/* Coords */}
                  {ci === 0 && (
                    <span className="absolute bottom-0 left-0.5 text-[9px] text-purple-400/50 pointer-events-none">
                      {8 - ri}
                    </span>
                  )}
                  {ri === 7 && (
                    <span className="absolute bottom-0 right-0.5 text-[9px] text-purple-400/50 pointer-events-none">
                      {String.fromCharCode(97 + ci)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}