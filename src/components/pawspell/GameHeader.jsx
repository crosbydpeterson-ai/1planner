import React from 'react';
import { Gem, Crown, Swords } from 'lucide-react';

export default function GameHeader({ myUsername, oppUsername, myColor, currentTurn, gemsCollected = {}, isCheck, myTokens }) {
  const myGems = gemsCollected[myColor] || 0;
  const oppColor = myColor === 'w' ? 'b' : 'w';
  const oppGems = gemsCollected[oppColor] || 0;
  const isMyTurn = currentTurn === myColor;

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-purple-950/60 backdrop-blur rounded-2xl border border-purple-800/40 mb-4">
      {/* Opponent */}
      <div className={`flex flex-col items-center gap-1 ${!isMyTurn ? 'opacity-100' : 'opacity-50'}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 ${!isMyTurn ? 'border-purple-400 bg-purple-800' : 'border-purple-700 bg-purple-900'}`}>
          {oppColor === 'b' ? '🟣' : '⬜'}
        </div>
        <span className="text-xs text-purple-200 font-medium truncate max-w-20">{oppUsername || 'Opponent'}</span>
        <div className="flex gap-0.5">{Array.from({ length: oppGems }).map((_, i) => <span key={i}>💎</span>)}</div>
      </div>

      {/* Center */}
      <div className="flex flex-col items-center gap-1">
        {isCheck && (
          <span className="text-red-400 text-xs font-bold animate-pulse">⚠️ CHECK!</span>
        )}
        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${isMyTurn ? 'bg-purple-600 border-purple-400 text-white' : 'bg-purple-900 border-purple-700 text-purple-300'}`}>
          {isMyTurn ? '⚔️ Your Turn' : '⏳ Waiting...'}
        </div>
        <div className="flex items-center gap-1 text-xs text-purple-400">
          <Gem className="w-3 h-3" />
          <span>3 gems = win</span>
        </div>
      </div>

      {/* Me */}
      <div className={`flex flex-col items-center gap-1 ${isMyTurn ? 'opacity-100' : 'opacity-50'}`}>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 ${isMyTurn ? 'border-purple-400 bg-purple-800' : 'border-purple-700 bg-purple-900'}`}>
          {myColor === 'w' ? '⬜' : '🟣'}
        </div>
        <span className="text-xs text-purple-200 font-medium truncate max-w-20">{myUsername || 'You'}</span>
        <div className="flex gap-0.5">{Array.from({ length: myGems }).map((_, i) => <span key={i}>💎</span>)}</div>
      </div>
    </div>
  );
}