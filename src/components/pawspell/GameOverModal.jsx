import React from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Skull, Gem } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GameOverModal({ winner, winReason, myColor, onPlayAgain, onExit, tokensEarned = 0 }) {
  const isWin = winner === myColor;
  const isDraw = winner === 'draw';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-gradient-to-b from-purple-950 to-slate-950 border border-purple-600 rounded-3xl p-8 text-center max-w-sm w-full shadow-2xl shadow-purple-900/50"
      >
        <div className="text-6xl mb-4">
          {isDraw ? '🤝' : isWin ? '🏆' : '💀'}
        </div>
        <h2 className={`text-2xl font-bold mb-2 ${isWin ? 'text-yellow-300' : isDraw ? 'text-purple-300' : 'text-red-400'}`}>
          {isDraw ? 'Draw!' : isWin ? 'Victory!' : 'Defeated!'}
        </h2>
        <p className="text-purple-300 text-sm mb-2">{winReason}</p>
        {tokensEarned > 0 && (
          <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-xl px-4 py-2 mb-4">
            <p className="text-yellow-300 text-sm font-bold">+{tokensEarned} 🪙 tokens earned!</p>
          </div>
        )}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onExit} className="flex-1 border-purple-600 text-purple-300 hover:bg-purple-900">
            Exit
          </Button>
          <Button onClick={onPlayAgain} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
            Play Again
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}