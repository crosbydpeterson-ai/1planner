import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Trophy, Medal, Loader2 } from 'lucide-react';
import { PETS } from '@/components/quest/PetCatalog';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function GameLeaderboard({ gameId, currentProfileId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myBest, setMyBest] = useState(null);

  useEffect(() => {
    if (!gameId) return;
    loadLeaderboard();
  }, [gameId]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const sessions = await base44.entities.GameSession.filter({ miniGameId: gameId });

      // Best score per user
      const bestByUser = {};
      for (const s of sessions) {
        if (!bestByUser[s.userProfileId] || s.score > bestByUser[s.userProfileId].score) {
          bestByUser[s.userProfileId] = s;
        }
      }

      const sorted = Object.values(bestByUser).sort((a, b) => b.score - a.score).slice(0, 10);

      // Fetch profiles for names + pets
      const profileIds = sorted.map(s => s.userProfileId);
      let profiles = [];
      if (profileIds.length > 0) {
        profiles = await Promise.all(
          profileIds.map(id => base44.entities.UserProfile.filter({ id }).then(r => r[0]).catch(() => null))
        );
      }

      const enriched = sorted.map((s, i) => {
        const p = profiles[i];
        return {
          ...s,
          username: p?.username || 'Unknown',
          equippedPetId: p?.equippedPetId || null,
          isMe: s.userProfileId === currentProfileId,
        };
      });

      setEntries(enriched);

      // My best score (may not be in top 10)
      if (currentProfileId) {
        const mine = sessions.filter(s => s.userProfileId === currentProfileId);
        if (mine.length > 0) {
          const best = mine.sort((a, b) => b.score - a.score)[0];
          setMyBest(best);
        }
      }
    } catch (e) {
      console.error('Leaderboard error', e);
    }
    setLoading(false);
  };

  const getPetEmoji = (petId) => {
    if (!petId) return null;
    const cleanId = String(petId).replace('custom_', '');
    const pet = PETS.find(p => p.id === cleanId || p.id === petId);
    return pet?.emoji || null;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-6 text-slate-400 text-sm">
        <Trophy className="w-8 h-8 mx-auto mb-2 opacity-30" />
        No scores yet — be the first!
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {entries.map((entry, i) => (
        <div
          key={entry.userProfileId}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm ${
            entry.isMe
              ? 'bg-indigo-50 border border-indigo-200'
              : 'bg-slate-50'
          }`}
        >
          <span className="w-6 text-center font-bold">
            {i < 3 ? MEDALS[i] : <span className="text-slate-400 text-xs">#{i + 1}</span>}
          </span>
          <span className="text-base leading-none">{getPetEmoji(entry.equippedPetId) || '👤'}</span>
          <span className={`flex-1 font-medium truncate ${entry.isMe ? 'text-indigo-700' : 'text-slate-700'}`}>
            {entry.username}{entry.isMe ? ' (you)' : ''}
          </span>
          <span className="font-bold text-slate-800">{entry.score.toLocaleString()}</span>
        </div>
      ))}

      {myBest && !entries.find(e => e.isMe) && (
        <div className="mt-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-sm">
            <span className="w-6 text-center text-slate-400 text-xs">—</span>
            <span className="text-base">👤</span>
            <span className="flex-1 font-medium text-indigo-700">You (not ranked)</span>
            <span className="font-bold text-slate-800">{myBest.score.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}