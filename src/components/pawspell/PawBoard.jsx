import React, { useState } from 'react';
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
  onMove, lastMove = null, castlingRights = null,
  disabled = false
}) {
  const [selected, setSelected] = useState(null);
  const [hoveredPiece, setHoveredPiece] = useState(null);
  const [legalMoves, setLegalMoves] = useState([]);

  const handleSquareClick = (row, col) => {
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
      setLegalMoves(getLegalMoves(board, row, col, lastMove, castlingRights));
    } else {
      setSelected(null);
      setLegalMoves([]);
    }
  };

  const handleHover = (row, col) => {
    const cell = board[row][col];
    if (cell) {
      const { type } = parsePiece(cell);
      const petType = PIECE_TO_PET[type];
      setHoveredPiece({ petType, cell, row, col });
    } else {
      setHoveredPiece(null);
    }
  };

  const isLegalTarget = (row, col) => legalMoves.some(([r, c]) => r === row && c === col);
  const isSelected = (row, col) => selected && selected[0] === row && selected[1] === col;
  const isLastMove = (row, col) => lastMove && (
    (lastMove.from[0] === row && lastMove.from[1] === col) ||
    (lastMove.to[0] === row && lastMove.to[1] === col)
  );
  const getGem = (row, col) => gems.find(g => g.row === row && g.col === col);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Hover tooltip */}
      <div className="h-10 flex items-center">
        {hoveredPiece && (
          <div className="bg-purple-900/80 backdrop-blur text-white rounded-xl px-4 py-1 text-xs text-center border border-purple-500/40">
            <span className="font-bold text-purple-200">{PET_TO_CHESS_NAME[hoveredPiece.petType]}</span>
            <span className="mx-2 text-purple-400">·</span>
            <span className="text-purple-300">{PET_DESCRIPTIONS[hoveredPiece.petType]}</span>
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

              return (
                <div
                  key={ci}
                  className="relative cursor-pointer transition-colors"
                  style={{ width: 52, height: 52, background: bg }}
                  onClick={() => handleSquareClick(ri, ci)}
                  onMouseEnter={() => handleHover(ri, ci)}
                  onMouseLeave={() => setHoveredPiece(null)}
                >
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
                          <span className={`text-[9px] font-bold leading-none px-0.5 rounded ${prog.color === 'w' ? 'text-yellow-300' : 'text-purple-300'}`}>
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