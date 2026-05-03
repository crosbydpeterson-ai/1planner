import React, { useState } from 'react';
import { PET_EMOJIS, PET_TO_CHESS_NAME } from '@/lib/pawSpellConstants';
import { Sparkles, AlertCircle } from 'lucide-react';

const CATEGORY_COLORS = {
  fire: 'from-orange-700 to-red-800 border-orange-500 text-orange-100',
  ice: 'from-cyan-700 to-blue-800 border-cyan-500 text-cyan-100',
  storm: 'from-yellow-700 to-purple-800 border-yellow-500 text-yellow-100',
  nature: 'from-green-700 to-emerald-800 border-green-500 text-green-100',
  shadow: 'from-slate-700 to-purple-950 border-purple-500 text-purple-200',
  light: 'from-amber-600 to-yellow-700 border-amber-400 text-amber-100',
  ocean: 'from-blue-700 to-teal-800 border-blue-500 text-blue-100',
  chaos: 'from-fuchsia-700 to-pink-800 border-fuchsia-500 text-fuchsia-100',
  time: 'from-indigo-700 to-violet-800 border-indigo-500 text-indigo-100',
  crystal: 'from-purple-700 to-pink-700 border-pink-400 text-pink-100',
};

function CategoryBadge({ category, label = 'Opponent has' }) {
  if (!category) return null;
  const cls = CATEGORY_COLORS[category] || 'from-slate-700 to-slate-800 border-slate-500 text-slate-100';
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-br ${cls} border text-xs font-medium`}>
      <AlertCircle className="w-3 h-3" />
      <span>{label}: <span className="capitalize font-bold">{category}</span></span>
    </div>
  );
}

export default function AbilityPanel({
  myAbilities = {},        // { [pieceType]: { category, name, description, icon, needsTarget } }
  oppAbilities = {},
  abilityUsed = false,
  pendingAbility = null,   // { pieceType, category } when waiting for target
  onActivate,              // (pieceType, ability) => void
  onCancel,
  disabled = false,
}) {
  const [hovered, setHovered] = useState(null);

  const myEntries = Object.entries(myAbilities);
  const oppCategories = Array.from(new Set(Object.values(oppAbilities).map(a => a.category)));

  if (myEntries.length === 0 && oppCategories.length === 0) return null;

  return (
    <div className="mt-4 bg-purple-950/60 border border-purple-700/50 rounded-2xl p-3 backdrop-blur">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2 text-purple-200 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> Abilities
          {abilityUsed && <span className="text-purple-500 font-normal normal-case">— used this game</span>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {oppCategories.map(c => <CategoryBadge key={c} category={c} />)}
        </div>
      </div>

      {/* Pending */}
      {pendingAbility && (
        <div className="mb-2 px-3 py-2 rounded-xl bg-yellow-900/40 border border-yellow-600 text-yellow-100 text-xs flex items-center justify-between gap-2">
          <span>
            🎯 <b>{pendingAbility.name}</b> — pick a target on the board
          </span>
          <button onClick={onCancel} className="text-yellow-300 hover:text-white underline">cancel</button>
        </div>
      )}

      {/* My ability buttons */}
      {myEntries.length === 0 ? (
        <div className="text-purple-500 text-xs italic">No abilities equipped. Add categorized skins from the shop!</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {myEntries.map(([petType, ab]) => {
            const cls = CATEGORY_COLORS[ab.category] || 'from-slate-700 to-slate-800 border-slate-500 text-slate-100';
            const btnDisabled = disabled || abilityUsed || !!pendingAbility;
            return (
              <button
                key={petType}
                onClick={() => !btnDisabled && onActivate(petType, ab)}
                onMouseEnter={() => setHovered(petType)}
                onMouseLeave={() => setHovered(null)}
                disabled={btnDisabled}
                className={`relative text-left p-2 rounded-xl border bg-gradient-to-br ${cls} transition-all
                  ${btnDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.03] hover:shadow-lg cursor-pointer'}`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-base">{ab.icon}</span>
                  <span className="text-xs font-bold truncate">{ab.name}</span>
                </div>
                <div className="text-[10px] opacity-80 flex items-center gap-1">
                  <span>{PET_EMOJIS[petType]}</span>
                  <span>{PET_TO_CHESS_NAME[petType]?.split(' ')[0]}</span>
                  <span className="ml-auto capitalize">{ab.category}</span>
                </div>
                {abilityUsed && (
                  <div className="absolute top-1 right-1 text-[9px] bg-black/60 px-1.5 py-0.5 rounded-full font-bold">
                    USED
                  </div>
                )}
                {hovered === petType && !btnDisabled && (
                  <div className="absolute z-30 left-0 right-0 -top-1 -translate-y-full bg-slate-900 border border-purple-600 rounded-lg p-2 text-[10px] text-purple-100 shadow-xl pointer-events-none">
                    {ab.description}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}