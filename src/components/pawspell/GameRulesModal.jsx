import React from 'react';
import { X, Gem, Crown, Swords, Zap } from 'lucide-react';
import { PET_EMOJIS, PET_TYPES, PET_TO_CHESS_NAME, PET_DESCRIPTIONS } from '@/lib/pawSpellConstants';

export default function GameRulesModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 p-4">
      <div className="bg-gradient-to-b from-slate-900 to-purple-950 border border-purple-700 rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-2xl shadow-purple-900/50">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/90 backdrop-blur border-b border-purple-800 p-4 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📖</span>
            <h2 className="text-lg font-bold text-purple-200">How to Play</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-purple-900/50 hover:bg-purple-800 text-purple-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Goal */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-yellow-400" />
              <h3 className="text-yellow-300 font-bold text-sm uppercase tracking-wider">Goal — Win by doing either:</h3>
            </div>
            <div className="space-y-2">
              <div className="bg-purple-900/40 border border-purple-800 rounded-xl p-3 flex items-start gap-3">
                <span className="text-lg">🦄</span>
                <div>
                  <p className="text-purple-200 font-semibold text-sm">Capture the Unicorn (King)</p>
                  <p className="text-purple-400 text-xs">Move any piece onto the enemy's Unicorn to win instantly.</p>
                </div>
              </div>
              <div className="bg-purple-900/40 border border-purple-800 rounded-xl p-3 flex items-start gap-3">
                <span className="text-lg">💎</span>
                <div>
                  <p className="text-purple-200 font-semibold text-sm">Collect 3 Crystal Gems</p>
                  <p className="text-purple-400 text-xs">Claim 3 gems before your opponent to claim victory.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Gem Rules */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Gem className="w-4 h-4 text-cyan-400" />
              <h3 className="text-cyan-300 font-bold text-sm uppercase tracking-wider">Crystal Gem Rules</h3>
            </div>
            <div className="bg-cyan-950/40 border border-cyan-800 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold text-sm mt-0.5">1.</span>
                <p className="text-cyan-200 text-sm">💎 Crystal Gems appear randomly on the board at the start.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold text-sm mt-0.5">2.</span>
                <p className="text-cyan-200 text-sm">Move any of your pieces <span className="text-yellow-300 font-bold">onto a gem</span> to begin claiming it.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold text-sm mt-0.5">3.</span>
                <p className="text-cyan-200 text-sm"><span className="text-yellow-300 font-bold">Stay on the gem for 3 full turns</span> — your piece must remain on that square for 3 consecutive turns to collect it. The gem shows a countdown!</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold text-sm mt-0.5">4.</span>
                <p className="text-cyan-200 text-sm">If your piece moves away or is captured before 3 turns, the progress <span className="text-red-400 font-bold">resets</span>.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-bold text-sm mt-0.5">5.</span>
                <p className="text-cyan-200 text-sm">After a gem is collected, a new gem spawns elsewhere. Always 2-3 gems on the board.</p>
              </div>
            </div>
          </section>

          {/* Movement */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Swords className="w-4 h-4 text-purple-400" />
              <h3 className="text-purple-300 font-bold text-sm uppercase tracking-wider">Piece Movement</h3>
            </div>
            <div className="space-y-2">
              {Object.values(PET_TYPES).map(pt => (
                <div key={pt} className="flex items-start gap-3 bg-purple-950/40 border border-purple-900 rounded-xl p-3">
                  <span className="text-2xl w-8 text-center flex-shrink-0">{PET_EMOJIS[pt]}</span>
                  <div>
                    <p className="text-purple-200 font-semibold text-sm">
                      {pt.charAt(0).toUpperCase() + pt.slice(1)}
                      <span className="text-purple-500 font-normal ml-1">({PET_TO_CHESS_NAME[pt]})</span>
                    </p>
                    <p className="text-purple-400 text-xs mt-0.5">{PET_DESCRIPTIONS[pt]}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Special Rules */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h3 className="text-amber-300 font-bold text-sm uppercase tracking-wider">Special Rules</h3>
            </div>
            <div className="space-y-2">
              {[
                { emoji: '🏰', title: 'Castling', desc: "The Unicorn (King) can castle with a Golem (Rook) if neither has moved and there's a clear path between them." },
                { emoji: '👻', title: 'En Passant', desc: 'If a Sprite (Pawn) advances two squares, an adjacent enemy Sprite can capture it as if it only moved one.' },
                { emoji: '👑', title: 'Pawn Promotion', desc: 'When a Sprite reaches the opposite end of the board, it transforms into a Dragon (Queen).' },
                { emoji: '🤝', title: 'Stalemate', desc: "If the current player has no legal moves but isn't in check, the game ends in a draw." },
              ].map(r => (
                <div key={r.title} className="flex items-start gap-3 bg-amber-950/30 border border-amber-900/50 rounded-xl p-3">
                  <span className="text-lg">{r.emoji}</span>
                  <div>
                    <p className="text-amber-200 font-semibold text-sm">{r.title}</p>
                    <p className="text-amber-400/80 text-xs mt-0.5">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Tokens */}
          <section>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">🪙</span>
              <h3 className="text-yellow-300 font-bold text-sm uppercase tracking-wider">Tokens & Skins</h3>
            </div>
            <div className="bg-yellow-950/30 border border-yellow-900/50 rounded-xl p-4 text-yellow-200/80 text-sm space-y-1">
              <p>🏆 Win a game → earn <span className="text-yellow-300 font-bold">25 tokens</span></p>
              <p>💀 Lose a game → earn <span className="text-yellow-300 font-bold">5 tokens</span></p>
              <p>✨ Use tokens in the <span className="text-yellow-300 font-bold">Skin Shop</span> to generate or buy custom pet skins for your pieces!</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}