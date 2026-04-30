import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import MultiplayerLobby from '@/components/pawspell/MultiplayerLobby';
import SkinShopPanel from '@/components/pawspell/SkinShopPanel';
import { PET_EMOJIS, PET_TYPES, PET_TO_CHESS_NAME } from '@/lib/pawSpellConstants';
import { Swords, Users, ShoppingBag, Trophy, Gem, BookOpen } from 'lucide-react';
import GameRulesModal from '@/components/pawspell/GameRulesModal';

export default function PawSpell() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const joinCodeFromUrl = urlParams.get('join');
  const [view, setView] = useState(joinCodeFromUrl ? 'multi' : 'home'); // 'home' | 'multi' | 'shop'
  const [showRules, setShowRules] = useState(false);
  const [pawProfile, setPawProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const profileId = localStorage.getItem('quest_profile_id');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const profiles = await base44.entities.PawSpellProfile.filter({ profileId });
    if (profiles.length > 0) {
      setPawProfile(profiles[0]);
    } else {
      const userProfiles = await base44.entities.UserProfile.filter({ id: profileId });
      const username = userProfiles[0]?.username || 'Player';
      const pp = await base44.entities.PawSpellProfile.create({ profileId, username, tokens: 100 });
      setPawProfile(pp);
    }
    setLoading(false);
  };

  const handlePlayAI = () => {
    navigate(`/PawSpell/Game?mode=ai&color=w`);
  };

  const handleJoinRoom = (room, color) => {
    navigate(`/PawSpell/Game?mode=multi&room=${room.id}&color=${color}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 p-4 pb-24">
      <div className="max-w-md mx-auto">
        {/* Back to Games */}
        <button onClick={() => navigate('/Games')} className="text-purple-400 hover:text-purple-200 text-sm mb-4 block mt-2">
          ← Game Studio
        </button>

        {view === 'home' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Hero */}
            <div className="text-center mb-8">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-7xl mb-4"
              >
                🦄
              </motion.div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 mb-2">
                Paw & Spell
              </h1>
              <p className="text-purple-400 text-sm">Dark-fantasy pet chess. Capture the Unicorn. Collect Crystal Gems.</p>
            </div>

            {/* Profile Card */}
            {pawProfile && (
              <div className="bg-purple-950/50 border border-purple-800 rounded-2xl p-4 mb-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-800 rounded-full flex items-center justify-center text-2xl">
                  🐾
                </div>
                <div className="flex-1">
                  <p className="text-purple-200 font-bold">{pawProfile.username}</p>
                  <div className="flex gap-4 text-xs text-purple-400 mt-1">
                    <span>🏆 {pawProfile.wins || 0} wins</span>
                    <span>💀 {pawProfile.losses || 0} losses</span>
                    <span>🪙 {pawProfile.tokens || 0} tokens</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 mb-8">
              <Button
                onClick={handlePlayAI}
                className="h-16 text-lg bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 rounded-2xl gap-3 shadow-lg shadow-purple-900/50"
              >
                <Swords className="w-6 h-6" />
                Play vs AI
              </Button>
              <Button
                onClick={() => setView('multi')}
                className="h-16 text-lg bg-gradient-to-r from-slate-800 to-purple-900 hover:from-slate-700 hover:to-purple-800 rounded-2xl gap-3 border border-purple-700"
              >
                <Users className="w-6 h-6" />
                Multiplayer
              </Button>
              <Button
                onClick={() => setView('shop')}
                className="h-16 text-lg bg-gradient-to-r from-amber-900 to-yellow-900 hover:from-amber-800 hover:to-yellow-800 rounded-2xl gap-3 border border-yellow-700"
              >
                <ShoppingBag className="w-6 h-6" />
                Skin Shop
              </Button>
              <Button
                onClick={() => setShowRules(true)}
                variant="ghost"
                className="h-10 text-sm text-purple-400 hover:text-purple-200 hover:bg-purple-900/30 rounded-2xl gap-2"
              >
                <BookOpen className="w-4 h-4" />
                How to Play
              </Button>
            </div>

            {/* Pet Glossary */}
            <div className="bg-purple-950/30 border border-purple-900 rounded-2xl p-4">
              <h3 className="text-purple-300 font-bold text-sm mb-3 flex items-center gap-2">
                <Gem className="w-4 h-4" /> Pet Glossary
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(PET_TYPES).map(pt => (
                  <div key={pt} className="flex items-center gap-2 text-xs">
                    <span className="text-xl">{PET_EMOJIS[pt]}</span>
                    <div>
                      <p className="text-purple-200 font-medium">{pt.charAt(0).toUpperCase() + pt.slice(1)}</p>
                      <p className="text-purple-500">{PET_TO_CHESS_NAME[pt]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {view === 'multi' && (
          <div className="bg-purple-950/50 border border-purple-800 rounded-2xl p-6">
            <MultiplayerLobby
              profile={pawProfile}
              onJoinRoom={handleJoinRoom}
              onBack={() => setView('home')}
            />
          </div>
        )}

        {showRules && <GameRulesModal onClose={() => setShowRules(false)} />}

        {view === 'shop' && pawProfile && (
          <div className="bg-purple-950/50 border border-purple-800 rounded-2xl p-4 min-h-96">
            <SkinShopPanel
              pawProfile={pawProfile}
              onBack={() => setView('home')}
              onProfileUpdate={setPawProfile}
            />
          </div>
        )}
      </div>
    </div>
  );
}