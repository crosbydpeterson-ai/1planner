import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search, Gamepad2, Heart, Play, Plus, Sparkles, Pencil, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import GamePlayDialog from '@/components/games/GamePlayDialog';
import LockedOverlay from '@/components/common/LockedOverlay';
import GameCreationToggle from '@/components/games/GameCreationToggle';

export default function Games() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [profile, setProfile] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [locks, setLocks] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [creationDisabled, setCreationDisabled] = useState(false);
  const [creationSettingId, setCreationSettingId] = useState(null);

  const profileId = localStorage.getItem('quest_profile_id');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [activeGames, myDrafts, profiles, settings] = await Promise.all([
      base44.entities.MiniGame.filter({ isActive: true }),
      base44.entities.MiniGame.filter({ createdByProfileId: profileId, isActive: false }),
      base44.entities.UserProfile.filter({ id: profileId }),
      base44.entities.AppSetting.list(),
    ]);
    // Combine active games + user's drafts (deduped)
    const activeIds = new Set(activeGames.map(g => g.id));
    const combined = [...activeGames, ...myDrafts.filter(d => !activeIds.has(d.id))];
    setGames(combined);
    const fl = settings.find(s => s.key === 'feature_locks');
    setLocks(fl ? fl.value : null);
    const creationSetting = settings.find(s => s.key === 'games_creation_disabled');
    setCreationDisabled(!!creationSetting?.value);
    setCreationSettingId(creationSetting?.id || null);
    if (profiles.length > 0) {
      const p = profiles[0];
      setProfile(p);
      const nameIsCrosby = typeof p.username === 'string' && p.username.toLowerCase() === 'crosby';
      setIsAdmin(p.rank === 'admin' || p.rank === 'super_admin');
      setIsSuperAdmin(p.rank === 'super_admin' || nameIsCrosby);
      setIsCreator(
        p.isGameCreator ||
        p.rank === 'admin' ||
        p.rank === 'super_admin'
      );
    }
    setLoading(false);
  };

  const handleDelete = async (game) => {
    if (!isAdmin) return;
    if (!confirm(`Delete "${game.name}"? This cannot be undone.`)) return;
    await base44.entities.MiniGame.delete(game.id);
    setGames(prev => prev.filter(g => g.id !== game.id));
  };

  const handleRegenerateThumbnail = async (game) => {
    try {
      const res = await base44.functions.invoke('generateGameCode', {
        action: 'generateThumbnail',
        gameName: game.name,
        gameDescriptionForThumb: game.description,
        colorTheme: game.colorTheme,
      });
      const url = res.data?.thumbnailUrl;
      if (url) {
        await base44.entities.MiniGame.update(game.id, { thumbnailUrl: url });
        setGames(prev => prev.map(g => g.id === game.id ? { ...g, thumbnailUrl: url } : g));
      } else {
        alert('Thumbnail generation failed: ' + (res.data?.error || 'unknown'));
      }
    } catch (e) {
      alert('Thumbnail error: ' + e.message);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      // JSON format: single object or array of {name, gameCode, ...}
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (!item.gameCode || !item.name) { alert(`Skipping item: requires "name" and "gameCode"`); continue; }
          await base44.entities.MiniGame.create({
            name: item.name,
            description: item.description || '',
            gameCode: item.gameCode,
            gamePrompt: item.gamePrompt || '',
            thumbnailUrl: item.thumbnailUrl || '',
            colorTheme: item.colorTheme || 'Electric Blue',
            font: item.font || 'Inter',
            questionIntegration: item.questionIntegration || 'periodic',
            gameVibe: item.gameVibe || '',
            createdByProfileId: profileId,
            createdByUsername: profile?.username || 'Creator',
            isActive: !!item.isActive,
            isApproved: true,
          });
        }
        await loadData();
        alert(`Imported ${items.length} game(s)!`);
      } else {
        // Raw code (.js/.jsx/.txt) — must contain a GameComponent function
        if (!/function\s+GameComponent\s*\(/.test(text)) {
          alert('Code must contain: function GameComponent({ questions, onGameEnd, onAnswerResult }) { ... }');
          e.target.value = '';
          return;
        }
        const name = prompt('Game name:', file.name.replace(/\.(jsx?|txt)$/, '')) || 'Imported Game';
        const description = prompt('Short description (optional):', '') || '';
        await base44.entities.MiniGame.create({
          name,
          description,
          gameCode: text,
          gamePrompt: 'Imported from code file',
          colorTheme: 'Electric Blue',
          font: 'Inter',
          questionIntegration: 'periodic',
          gameVibe: '',
          createdByProfileId: profileId,
          createdByUsername: profile?.username || 'Creator',
          isActive: true,
          isApproved: true,
        });
        await loadData();
        alert(`Imported "${name}"!`);
      }
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
    e.target.value = '';
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

  const userLock = locks?.users?.[profileId]?.games;
  const globalLock = locks?.global?.games;
  const mathLock = profile ? locks?.classes?.math?.[profile.mathTeacher]?.games : false;
  const readingLock = profile ? locks?.classes?.reading?.[profile.readingTeacher]?.games : false;
  const isLocked = !isAdmin && (
    (typeof userLock === 'object' ? userLock.locked : !!userLock) ||
    !!globalLock || !!mathLock || !!readingLock
  );
  const lockMsg = typeof userLock === 'object' ? (userLock.message || '') : '';
  if (isLocked) {
    return <LockedOverlay featureLabel="Game Studio" message={lockMsg || "An Admin or Mod has locked this feature."} />;
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
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {isSuperAdmin && (
            <GameCreationToggle
              disabled={creationDisabled}
              settingId={creationSettingId}
              onChange={(val, id) => { setCreationDisabled(val); setCreationSettingId(id); }}
            />
          )}
          {isAdmin && (
            <>
              <input
                type="file"
                accept=".json,.js,.jsx,.txt,application/json,text/javascript"
                onChange={handleImport}
                id="game-import-input"
                className="hidden"
              />
              <Button
                onClick={() => document.getElementById('game-import-input').click()}
                variant="outline"
                className="rounded-xl gap-2"
              >
                <Upload className="w-4 h-4" /> Import
              </Button>
            </>
          )}
          {isCreator && !(creationDisabled && !isSuperAdmin) && (
            <Button
              onClick={() => navigate('/Games/Build')}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl gap-2"
              disabled={creationDisabled && !isSuperAdmin}
            >
              <Plus className="w-4 h-4" /> Create
            </Button>
          )}
        </div>
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
        <TabsList className="w-full justify-center">
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
                isAdmin={isAdmin}
                onLike={() => handleLike(game)}
                onPlay={() => setSelectedGame(game)}
                onEdit={() => navigate(`/Games/Build?edit=${game.id}`)}
                onDelete={() => handleDelete(game)}
                onRegenerateThumbnail={() => handleRegenerateThumbnail(game)}
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
          isAdmin={isAdmin}
          onClose={() => { setSelectedGame(null); loadData(); }}
        />
      )}
    </div>
  );
}

function GameCard({ game, index, profileId, isAdmin, onLike, onPlay, onEdit, onDelete, onRegenerateThumbnail }) {
  const liked = (game.likedBy || []).includes(profileId);
  const canEdit = game.createdByProfileId === profileId || isAdmin;
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
        {!game.isActive && game.createdByProfileId === profileId && (
          <span className="absolute top-2 left-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Draft</span>
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
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); onRegenerateThumbnail(); }}
                variant="outline"
                title="Regenerate thumbnail"
                className="h-7 text-xs rounded-lg gap-1 px-2"
              >
                <ImageIcon className="w-3 h-3" />
              </Button>
            )}
            {isAdmin && (
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                variant="outline"
                title="Delete game"
                className="h-7 text-xs rounded-lg gap-1 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
            {canEdit && (
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                variant="outline"
                className="h-7 text-xs rounded-lg gap-1 px-2"
              >
                <Pencil className="w-3 h-3" />
              </Button>
            )}
            <Button
              size="sm"
              onClick={onPlay}
              className="h-7 text-xs rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white gap-1"
            >
              <Sparkles className="w-3 h-3" /> Play
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}