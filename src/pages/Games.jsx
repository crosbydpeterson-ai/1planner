import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search, Gamepad2, Heart, Play, Plus, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import GamePlayDialog from '@/components/games/GamePlayDialog';

export default function Games() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [profile, setProfile] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);

  const profileId = localStorage.getItem('quest_profile_id');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [allGames, profiles] = await Promise.all([
      base44.entities.MiniGame.filter({ isActive: true }),
      base44.entities.UserProfile.filter({ id: profileId }),
    ]);
    setGames(allGames);
    if (profiles.length > 0) {
      setProfile(profiles[0]);
      setIsCreator(
        profiles[0].isGameCreator ||
        profiles[0].rank === 'admin' ||
        profiles[0].rank === 'super_admin'
      );
    }
    setLoading(false);
  };

  const handleLike = async (game) => {
    const liked = (game.likedBy || []).includes(profileId);
    const newLikedBy = liked
      ? (game.likedBy || []).filter(id => id !== profileId)
      : [...(game.likedBy || []), profileId];
    await base44.entities.MiniGame.update(game.id, {
      likedBy: newLikedBy,
      likes: newLikedBy.length,
    });
    setGames(prev => prev.map(g => g.id === game.id
      ? { ...g, likedBy: newLikedBy, likes: newLikedBy.length }
      : g
    ));
  };

  const filtered = games.filter(g => {
    const matchesSearch = !search || g.name?.toLowerCase().includes(search.toLowerCase()) || g.description?.toLowerCase().includes(search.toLowerCase());
    const matchesTab = tab === 'all' || (tab === 'mine' && g.createdByProfileId === profileId);
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-12">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Gamepad2 className="w-7 h-7 text-indigo-500" />
            Game Studio
          </h1>
          <p className="text-slate-500 text-sm">Play mini-games to earn XP & coins!</p>
        </div>
        {isCreator && (
          <Button
            onClick={() => navigate('/Games/Build')}
            className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl gap-2"
          >
            <Plus className="w-4 h-4" /> Create Game
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search games..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl"
        />
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="w-full">
          <TabsTrigger value="all" className="flex-1">All Games</TabsTrigger>
          <TabsTrigger value="mine" className="flex-1">My Games</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No games found</p>
          {isCreator && <p className="text-sm mt-1">Create the first one!</p>}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((game, i) => (
              <GameCard
                key={game.id}
                game={game}
                index={i}
                profileId={profileId}
                onLike={() => handleLike(game)}
                onPlay={() => setSelectedGame(game)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Play Dialog */}
      {selectedGame && (
        <GamePlayDialog
          game={selectedGame}
          profile={profile}
          onClose={() => { setSelectedGame(null); loadData(); }}
        />
      )}
    </div>
  );
}

function GameCard({ game, index, profileId, onLike, onPlay }) {
  const liked = (game.likedBy || []).includes(profileId);
  const themeColors = {
    'Electric Blue': 'from-blue-500 to-blue-700',
    'Sunset Orange': 'from-orange-500 to-orange-700',
    'Forest Green': 'from-green-500 to-green-700',
    'Royal Purple': 'from-purple-500 to-purple-700',
    'Amber Gold': 'from-amber-500 to-amber-700',
    'Teal Mint': 'from-teal-500 to-teal-700',
    'Rose Pink': 'from-pink-500 to-pink-700',
    'Navy Slate': 'from-slate-500 to-slate-700',
  };
  const gradient = themeColors[game.colorTheme] || 'from-indigo-500 to-purple-700';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Thumbnail */}
      <div className={`h-28 bg-gradient-to-br ${gradient} relative flex items-center justify-center`}>
        {game.thumbnailUrl ? (
          <img src={game.thumbnailUrl} alt={game.name} className="w-full h-full object-cover" />
        ) : (
          <Gamepad2 className="w-10 h-10 text-white/60" />
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onLike(); }}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 backdrop-blur-sm"
        >
          <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-slate-800 text-sm truncate">{game.name}</h3>
        <p className="text-xs text-slate-400 mt-0.5 truncate">{game.description}</p>
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><Play className="w-3 h-3" />{game.playCount || 0}</span>
            <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{game.likes || 0}</span>
          </div>
          <Button
            size="sm"
            onClick={onPlay}
            className="h-7 text-xs rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white gap-1"
          >
            <Sparkles className="w-3 h-3" /> Play
          </Button>
        </div>
      </div>
    </motion.div>
  );
}