import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ArrowLeft, Search, Users, ClipboardList, Plus, 
  Lock, Unlock, Eye, EyeOff, Key, Zap, Check, X, Edit2, Save,
  Palette, Star, Image, Trash2, Gift, Calendar, Sparkles, Wand2, Loader2, ShoppingBag, Package,
  Ban, Gavel, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MATH_TEACHERS, READING_TEACHERS } from '@/components/quest/TeacherConfig';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import { toast } from 'sonner';
import AdminChatWidget from '@/components/admin/AdminChatWidget';
import CustomizationPanel from '@/components/admin/CustomizationPanel';
import PetAvatar from '@/components/quest/PetAvatar';
import CosmeticGeneratorPanel from '@/components/admin/CosmeticGeneratorPanel';
import BulkPetCreatorPanel from '@/components/admin/BulkPetCreatorPanel';
import EconomyCharts from '@/components/admin/EconomyCharts';
import AdminEmailBroadcast from '@/components/admin/AdminEmailBroadcast';
import DailyRewardsSettings from '@/components/admin/DailyRewardsSettings';
import BoothSkinManager from '@/components/admin/BoothSkinManager';
import SuperAssignmentCreator from '@/components/admin/super/SuperAssignmentCreator';
import SuperAssignmentsAnalytics from '@/components/admin/super/SuperAssignmentsAnalytics';
import PetEditorDialog from '@/components/pets/PetEditorDialog';
import RolesManager from '@/components/admin/RolesManager';
import SeasonFormDialog from '@/components/admin/SeasonFormDialog';

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [profiles, setProfiles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [customPets, setCustomPets] = useState([]);
  const [customThemes, setCustomThemes] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [petCosmetics, setPetCosmetics] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [rewardLinks, setRewardLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [editingShopItem, setEditingShopItem] = useState(null);
  const [editingBundle, setEditingBundle] = useState(null);
  const [showShopItemForm, setShowShopItemForm] = useState(false);
  const [showBundleForm, setShowBundleForm] = useState(false);
  const [showManualPackForm, setShowManualPackForm] = useState(false);
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [showRewardLinkForm, setShowRewardLinkForm] = useState(false);
  const [showCosmeticForm, setShowCosmeticForm] = useState(false);
  const [showThemeForm, setShowThemeForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [giftingProfile, setGiftingProfile] = useState(null);
  const [giftType, setGiftType] = useState('xp');
  const [giftAmount, setGiftAmount] = useState(50);
  const [giftPetId, setGiftPetId] = useState('');
  const [giftThemeId, setGiftThemeId] = useState('');
  const [giftTitle, setGiftTitle] = useState('');
  const [giftCoins, setGiftCoins] = useState(50);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [banForm, setBanForm] = useState({ reason: '', endDate: '' });
  const [flagForm, setFlagForm] = useState({ message: '' });
  const [wheelTokenAmount, setWheelTokenAmount] = useState(1);

  const [shopItemForm, setShopItemForm] = useState({
    name: '', description: '', itemType: 'pet', itemData: {}, price: 50, rarity: 'common',
    isLimited: false, stockLimit: null, stockRemaining: null, startDate: '', endDate: '', isActive: true
  });
  const [bundleForm, setBundleForm] = useState({
    name: '', description: '', itemIds: [], originalPrice: 0, bundlePrice: 0, discountPercent: 20,
    isLimited: true, stockLimit: null, stockRemaining: null, startDate: '', endDate: '', isActive: true
  });
  const [manualPackForm, setManualPackForm] = useState({
    name: '', description: '', imageUrl: '', itemIds: [], originalPrice: 0, bundlePrice: 0,
    discountPercent: 20, isLimited: true, stockLimit: 10, stockRemaining: 10,
    startDate: '', endDate: '', isActive: true
  });
  const [seasonForm, setSeasonForm] = useState({
    name: '', startDate: '', endDate: '', isActive: true, rewards: []
  });
  const [rewardLinkForm, setRewardLinkForm] = useState({
    name: '', rewardType: 'xp', rewardValue: 100, rewardData: {},
    maxUses: 10, usedBy: [], expiresAt: '', isActive: true
  });
  const [cosmeticForm, setCosmeticForm] = useState({
    name: '', description: '', cosmeticType: 'hat', imageUrl: '', price: 50, rarity: 'common', isLimited: false, isActive: true
  });
  const [themeForm, setThemeForm] = useState({
    name: '', rarity: 'common', xpRequired: 0, description: '',
    primaryColor: '#6366f1', secondaryColor: '#8b5cf6', accentColor: '#ec4899', bgColor: '#f8fafc'
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) { navigate(createPageUrl('Home')); return; }
    try {
      const p = await base44.entities.UserProfile.filter({ id: profileId });
      if (!p.length) { navigate(createPageUrl('Home')); return; }
      const profile = p[0];
      setCurrentProfile(profile);
      const nameIsCrosby = typeof profile.username === 'string' && profile.username.toLowerCase() === 'crosby';
      if (profile.rank === 'super_admin' || nameIsCrosby) {
        setIsAdmin(true);
        setIsSuperAdmin(true);
        loadData();
      } else if (profile.rank === 'admin') {
        setIsAdmin(true);
        loadData();
      } else {
        navigate(createPageUrl('Dashboard'));
      }
    } catch (e) {
      navigate(createPageUrl('Home'));
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [profilesData, assignmentsData, customPetsData, customThemesData, shopItemsData, bundlesData, seasonsData, rewardLinksData, petCosmeticsData] = await Promise.all([
        base44.entities.UserProfile.list('-created_date', 200),
        base44.entities.Assignment.list('-created_date', 100),
        base44.entities.CustomPet.list('-created_date', 200),
        base44.entities.CustomTheme.list('-created_date', 100),
        base44.entities.ShopItem.list('-created_date', 100),
        base44.entities.Bundle.list('-created_date', 50),
        base44.entities.Season.list('-created_date', 10),
        base44.entities.RewardLink.list('-created_date', 50),
        base44.entities.PetCosmetic.list('-created_date', 100),
      ]);
      setProfiles(profilesData);
      setAssignments(assignmentsData);
      setCustomPets(customPetsData);
      setCustomThemes(customThemesData);
      setShopItems(shopItemsData);
      setBundles(bundlesData);
      setSeasons(seasonsData);
      setRewardLinks(rewardLinksData);
      setPetCosmetics(petCosmeticsData);
    } catch (e) {
      console.error('Error loading data:', e);
    }
    setLoading(false);
  };

  const handleCreateSeason = async () => {
    try {
      const newSeason = await base44.entities.Season.create(seasonForm);
      setSeasons([newSeason, ...seasons]);
      setShowSeasonForm(false);
      setSeasonForm({ name: '', startDate: '', endDate: '', isActive: true, rewards: [] });
      toast.success('Season created!');
    } catch (e) {
      toast.error('Failed to create season');
    }
  };

  const handleCreateTheme = async () => {
    if (!themeForm.name.trim()) { toast.error('Enter theme name'); return; }
    try {
      const newTheme = await base44.entities.CustomTheme.create(themeForm);
      setCustomThemes([newTheme, ...customThemes]);
      setShowThemeForm(false);
      setThemeForm({ name: '', rarity: 'common', xpRequired: 0, description: '', primaryColor: '#6366f1', secondaryColor: '#8b5cf6', accentColor: '#ec4899', bgColor: '#f8fafc' });
      toast.success('Theme created!');
    } catch (e) {
      toast.error('Failed to create theme');
    }
  };

  const handleGiftItem = async (profile) => {
    try {
      let updates = {};
      if (giftType === 'xp') {
        updates.xp = (profile.xp || 0) + giftAmount;
      } else if (giftType === 'coins') {
        updates.questCoins = (profile.questCoins || 0) + giftCoins;
      } else if (giftType === 'pet' && giftPetId) {
        const already = profile.unlockedPets || [];
        if (!already.includes(giftPetId)) updates.unlockedPets = [...already, giftPetId];
      } else if (giftType === 'theme' && giftThemeId) {
        const already = profile.unlockedThemes || [];
        if (!already.includes(giftThemeId)) updates.unlockedThemes = [...already, giftThemeId];
      } else if (giftType === 'title' && giftTitle) {
        const already = profile.unlockedTitles || [];
        if (!already.includes(giftTitle)) updates.unlockedTitles = [...already, giftTitle];
      } else if (giftType === 'magic_egg') {
        await base44.entities.MagicEgg.create({ userId: profile.userId });
        toast.success(`Magic Egg gifted to ${profile.username}!`);
        setGiftingProfile(null);
        return;
      }
      if (Object.keys(updates).length > 0) {
        await base44.entities.UserProfile.update(profile.id, updates);
        setProfiles(profiles.map(p => p.id === profile.id ? { ...p, ...updates } : p));
        toast.success(`Gifted to ${profile.username}!`);
      } else {
        toast.error('Nothing to gift');
      }
      setGiftingProfile(null);
    } catch (e) {
      toast.error('Gift failed');
    }
  };

  const filteredProfiles = profiles.filter(p =>
    p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.mathTeacher?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.readingTeacher?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('Dashboard')} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Shield className="w-6 h-6 text-red-400" />
            <h1 className="text-2xl font-bold">Admin Panel</h1>
            {isSuperAdmin && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">Super Admin</span>}
          </div>
          <Button onClick={loadData} variant="outline" size="sm" className="border-slate-600 text-slate-300">
            Refresh
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 border-slate-700 flex-wrap h-auto gap-1 mb-6">
            <TabsTrigger value="users" className="data-[state=active]:bg-slate-600">
              <Users className="w-4 h-4 mr-1" /> Users ({profiles.length})
            </TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-slate-600">
              <ClipboardList className="w-4 h-4 mr-1" /> Assignments
            </TabsTrigger>
            <TabsTrigger value="shop" className="data-[state=active]:bg-slate-600">
              <ShoppingBag className="w-4 h-4 mr-1" /> Shop
            </TabsTrigger>
            <TabsTrigger value="season" className="data-[state=active]:bg-slate-600">
              <Sparkles className="w-4 h-4 mr-1" /> Season
            </TabsTrigger>
            <TabsTrigger value="pets" className="data-[state=active]:bg-slate-600">
              <Star className="w-4 h-4 mr-1" /> Pets
            </TabsTrigger>
            <TabsTrigger value="rewards" className="data-[state=active]:bg-slate-600">
              <Gift className="w-4 h-4 mr-1" /> Rewards
            </TabsTrigger>
            <TabsTrigger value="economy" className="data-[state=active]:bg-slate-600">
              <Zap className="w-4 h-4 mr-1" /> Economy
            </TabsTrigger>
            <TabsTrigger value="customize" className="data-[state=active]:bg-slate-600">
              <Palette className="w-4 h-4 mr-1" /> Customize
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="super" className="data-[state=active]:bg-yellow-700">
                <Shield className="w-4 h-4 mr-1" /> Super
              </TabsTrigger>
            )}
          </TabsList>

          {/* USERS TAB */}
          <TabsContent value="users">
            <div className="space-y-4">
              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users..."
                    className="pl-9 bg-slate-800 border-slate-700"
                  />
                </div>
              </div>
              <div className="space-y-2">
                {filteredProfiles.map(profile => (
                  <div key={profile.id} className="bg-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{profile.username}</span>
                            {profile.rank === 'admin' && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Admin</span>}
                            {profile.rank === 'super_admin' && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">Super</span>}
                            {profile.isBanned && <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded-full flex items-center gap-1"><Ban className="w-3 h-3" />Banned</span>}
                            {profile.flagged && !profile.flagAcknowledged && <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Flagged</span>}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            Math: {profile.mathTeacher} • Reading: {profile.readingTeacher}
                          </div>
                          <div className="text-xs text-slate-300 mt-0.5">
                            XP: {profile.xp || 0} • Coins: {profile.questCoins || 0}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <Button size="sm" variant="outline" onClick={() => setGiftingProfile(profile)} className="border-slate-600 text-slate-300">
                          <Gift className="w-3 h-3 mr-1" /> Gift
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setExpandedUserId(expandedUserId === profile.id ? null : profile.id)}
                          className="border-slate-600 text-slate-300"
                        >
                          <Edit2 className="w-3 h-3 mr-1" /> Edit
                        </Button>
                      </div>
                    </div>

                    {expandedUserId === profile.id && (
                      <div className="border-t border-slate-700 pt-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-400">XP</Label>
                            <Input
                              type="number"
                              value={profile.xp || 0}
                              onChange={(e) => setProfiles(profiles.map(p => p.id === profile.id ? { ...p, xp: parseInt(e.target.value) || 0 } : p))}
                              className="bg-slate-700 border-slate-600 h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-slate-400">Quest Coins</Label>
                            <Input
                              type="number"
                              value={profile.questCoins || 0}
                              onChange={(e) => setProfiles(profiles.map(p => p.id === profile.id ? { ...p, questCoins: parseInt(e.target.value) || 0 } : p))}
                              className="bg-slate-700 border-slate-600 h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={async () => {
                              await base44.entities.UserProfile.update(profile.id, { xp: profile.xp, questCoins: profile.questCoins });
                              toast.success('Updated!');
                            }}
                            className="bg-green-700 hover:bg-green-600"
                          >
                            <Save className="w-3 h-3 mr-1" /> Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const newLocked = !profile.isLocked;
                              await base44.entities.UserProfile.update(profile.id, { isLocked: newLocked });
                              setProfiles(profiles.map(p => p.id === profile.id ? { ...p, isLocked: newLocked } : p));
                              toast.success(newLocked ? 'Locked' : 'Unlocked');
                            }}
                            className={profile.isLocked ? 'border-green-600 text-green-400' : 'border-red-600 text-red-400'}
                          >
                            {profile.isLocked ? <Unlock className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
                            {profile.isLocked ? 'Unlock' : 'Lock'}
                          </Button>
                          {isSuperAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                const newRank = profile.rank === 'admin' ? 'user' : 'admin';
                                await base44.entities.UserProfile.update(profile.id, { rank: newRank });
                                setProfiles(profiles.map(p => p.id === profile.id ? { ...p, rank: newRank } : p));
                                toast.success(`Rank set to ${newRank}`);
                              }}
                              className="border-yellow-600 text-yellow-400"
                            >
                              <Shield className="w-3 h-3 mr-1" />
                              {profile.rank === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const newHidden = !profile.hiddenFromLeaderboard;
                              await base44.entities.UserProfile.update(profile.id, { hiddenFromLeaderboard: newHidden });
                              setProfiles(profiles.map(p => p.id === profile.id ? { ...p, hiddenFromLeaderboard: newHidden } : p));
                              toast.success(newHidden ? 'Hidden from leaderboard' : 'Visible on leaderboard');
                            }}
                            className="border-slate-600 text-slate-400"
                          >
                            {profile.hiddenFromLeaderboard ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                            {profile.hiddenFromLeaderboard ? 'Unhide' : 'Hide'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              const newCreator = !profile.isPetCreator;
                              await base44.entities.UserProfile.update(profile.id, { isPetCreator: newCreator });
                              setProfiles(profiles.map(p => p.id === profile.id ? { ...p, isPetCreator: newCreator } : p));
                              toast.success(newCreator ? 'Pet creator enabled' : 'Pet creator disabled');
                            }}
                            className={profile.isPetCreator ? 'border-purple-600 text-purple-400' : 'border-slate-600 text-slate-400'}
                          >
                            <Wand2 className="w-3 h-3 mr-1" />
                            {profile.isPetCreator ? 'Remove Creator' : 'Make Creator'}
                          </Button>
                        </div>
                        {/* Ban section */}
                        <div className="space-y-2 pt-2 border-t border-slate-700">
                          {profile.isBanned ? (
                            <Button
                              size="sm"
                              onClick={async () => {
                                await base44.entities.UserProfile.update(profile.id, { isBanned: false, banReason: '', banEndDate: null });
                                setProfiles(profiles.map(p => p.id === profile.id ? { ...p, isBanned: false } : p));
                                toast.success('User unbanned');
                              }}
                              className="bg-green-700"
                            >
                              <Unlock className="w-3 h-3 mr-1" /> Unban
                            </Button>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                placeholder="Ban reason..."
                                value={banForm.reason}
                                onChange={(e) => setBanForm({ ...banForm, reason: e.target.value })}
                                className="bg-slate-700 border-slate-600 text-sm h-8"
                              />
                              <Button
                                size="sm"
                                onClick={async () => {
                                  await base44.entities.UserProfile.update(profile.id, { isBanned: true, banReason: banForm.reason });
                                  setProfiles(profiles.map(p => p.id === profile.id ? { ...p, isBanned: true, banReason: banForm.reason } : p));
                                  setBanForm({ reason: '', endDate: '' });
                                  toast.success('User banned');
                                }}
                                className="bg-red-700"
                              >
                                <Ban className="w-3 h-3 mr-1" /> Ban User
                              </Button>
                            </div>
                          )}
                          {/* Flag section */}
                          {profile.flagged && !profile.flagAcknowledged ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await base44.entities.UserProfile.update(profile.id, { flagged: false, flagMessage: '', flagAcknowledged: false });
                                setProfiles(profiles.map(p => p.id === profile.id ? { ...p, flagged: false } : p));
                                toast.success('Flag cleared');
                              }}
                              className="border-yellow-600 text-yellow-400"
                            >
                              <X className="w-3 h-3 mr-1" /> Clear Flag
                            </Button>
                          ) : (
                            <div className="flex gap-2">
                              <Input
                                placeholder="Warning message..."
                                value={flagForm.message}
                                onChange={(e) => setFlagForm({ message: e.target.value })}
                                className="bg-slate-700 border-slate-600 text-sm h-8 flex-1"
                              />
                              <Button
                                size="sm"
                                onClick={async () => {
                                  await base44.entities.UserProfile.update(profile.id, { flagged: true, flagMessage: flagForm.message, flagAcknowledged: false });
                                  setProfiles(profiles.map(p => p.id === profile.id ? { ...p, flagged: true, flagMessage: flagForm.message, flagAcknowledged: false } : p));
                                  setFlagForm({ message: '' });
                                  toast.success('Flag set');
                                }}
                                className="bg-yellow-700"
                              >
                                <AlertTriangle className="w-3 h-3 mr-1" /> Flag
                              </Button>
                            </div>
                          )}
                        </div>
                        {/* Wheel tokens */}
                        <div className="flex gap-2 items-center pt-2 border-t border-slate-700">
                          <span className="text-xs text-slate-400">Bonus Wheel Spins:</span>
                          <Input
                            type="number"
                            value={wheelTokenAmount}
                            onChange={(e) => setWheelTokenAmount(parseInt(e.target.value) || 1)}
                            className="bg-slate-700 border-slate-600 h-8 text-sm w-16"
                            min="1"
                          />
                          <Button
                            size="sm"
                            onClick={async () => {
                              const drp = await base44.entities.DailyRewardProgress.filter({ userProfileId: profile.id });
                              if (drp.length > 0) {
                                const cur = drp[0].bonusWheelTokens || 0;
                                await base44.entities.DailyRewardProgress.update(drp[0].id, { bonusWheelTokens: cur + wheelTokenAmount });
                              } else {
                                await base44.entities.DailyRewardProgress.create({ userProfileId: profile.id, bonusWheelTokens: wheelTokenAmount });
                              }
                              toast.success(`Granted ${wheelTokenAmount} wheel spin(s) to ${profile.username}`);
                            }}
                            className="bg-indigo-700"
                          >
                            <Zap className="w-3 h-3 mr-1" /> Grant Spins
                          </Button>
                        </div>
                      </div>
                    )}
                    {/* Gift Dialog inline */}
                    {giftingProfile?.id === profile.id && (
                      <div className="border-t border-slate-700 pt-3 space-y-3">
                        <p className="text-sm font-medium text-slate-300">Gift to {profile.username}</p>
                        <Select value={giftType} onValueChange={setGiftType}>
                          <SelectTrigger className="bg-slate-700 border-slate-600">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xp">XP</SelectItem>
                            <SelectItem value="coins">Quest Coins</SelectItem>
                            <SelectItem value="pet">Pet</SelectItem>
                            <SelectItem value="theme">Theme</SelectItem>
                            <SelectItem value="title">Title</SelectItem>
                            {isSuperAdmin && <SelectItem value="magic_egg">Magic Egg 🥚</SelectItem>}
                          </SelectContent>
                        </Select>
                        {giftType === 'xp' && (
                          <Input type="number" value={giftAmount} onChange={(e) => setGiftAmount(parseInt(e.target.value) || 0)} className="bg-slate-700 border-slate-600" placeholder="XP amount" />
                        )}
                        {giftType === 'coins' && (
                          <Input type="number" value={giftCoins} onChange={(e) => setGiftCoins(parseInt(e.target.value) || 0)} className="bg-slate-700 border-slate-600" placeholder="Coins amount" />
                        )}
                        {giftType === 'pet' && (
                          <Select value={giftPetId} onValueChange={setGiftPetId}>
                            <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Select pet" /></SelectTrigger>
                            <SelectContent>
                              {customPets.map(p => <SelectItem key={p.id} value={`custom_${p.id}`}>{p.emoji || '🐾'} {p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                        {giftType === 'theme' && (
                          <Select value={giftThemeId} onValueChange={setGiftThemeId}>
                            <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Select theme" /></SelectTrigger>
                            <SelectContent>
                              {customThemes.map(t => <SelectItem key={t.id} value={`custom_${t.id}`}>{t.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        )}
                        {giftType === 'title' && (
                          <Input value={giftTitle} onChange={(e) => setGiftTitle(e.target.value)} className="bg-slate-700 border-slate-600" placeholder="Title text" />
                        )}
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleGiftItem(profile)} className="bg-green-700"><Gift className="w-3 h-3 mr-1" /> Send Gift</Button>
                          <Button size="sm" variant="ghost" onClick={() => setGiftingProfile(null)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ASSIGNMENTS TAB */}
          <TabsContent value="assignments">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Assignments ({assignments.length})</h2>
              </div>
              <div className="space-y-2">
                {assignments.map(a => (
                  <div key={a.id} className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{a.title}</div>
                      <div className="text-xs text-slate-400">{a.subject} • {a.target} • {a.xpReward} XP</div>
                      {a.isFlagged && <div className="text-xs text-red-400 mt-1">⚠️ Flagged: {a.flagReason}</div>}
                    </div>
                    <div className="flex gap-2">
                      {a.isFlagged && (
                        <Button size="sm" onClick={async () => {
                          await base44.entities.Assignment.update(a.id, { isFlagged: false, flagReason: '' });
                          setAssignments(assignments.map(x => x.id === a.id ? { ...x, isFlagged: false } : x));
                          toast.success('Assignment approved');
                        }} className="bg-green-700 text-xs">
                          <Check className="w-3 h-3 mr-1" /> Approve
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={async () => {
                        await base44.entities.Assignment.delete(a.id);
                        setAssignments(assignments.filter(x => x.id !== a.id));
                        toast.success('Deleted');
                      }} className="border-red-700 text-red-400 text-xs">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* SHOP TAB */}
          <TabsContent value="shop">
            <div className="space-y-6">
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => setShowShopItemForm(true)} className="bg-purple-600">
                  <Plus className="w-4 h-4 mr-2" /> New Item
                </Button>
                <Button onClick={() => setShowManualPackForm(true)} className="bg-blue-600">
                  <Package className="w-4 h-4 mr-2" /> Create Pack
                </Button>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Shop Items ({shopItems.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {shopItems.map(item => (
                    <div key={item.id} className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-slate-400">{item.itemType} • {item.price} coins • {item.rarity}</div>
                        {!item.isActive && <span className="text-xs text-red-400">Inactive</span>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingShopItem(item)} className="border-slate-600">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={async () => {
                          await base44.entities.ShopItem.delete(item.id);
                          setShopItems(shopItems.filter(i => i.id !== item.id));
                          toast.success('Deleted');
                        }} className="border-red-700 text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Bundles ({bundles.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {bundles.map(bundle => (
                    <div key={bundle.id} className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{bundle.name}</div>
                        <div className="text-xs text-slate-400">{bundle.bundlePrice} coins • {bundle.itemIds?.length} items</div>
                        {!bundle.isActive && <span className="text-xs text-red-400">Inactive</span>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingBundle(bundle)} className="border-slate-600">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={async () => {
                          await base44.entities.Bundle.delete(bundle.id);
                          setBundles(bundles.filter(b => b.id !== bundle.id));
                          toast.success('Deleted');
                        }} className="border-red-700 text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* SEASON TAB */}
          <TabsContent value="season">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Seasons</h2>
                <Button onClick={() => setShowSeasonForm(true)} className="bg-indigo-600">
                  <Plus className="w-4 h-4 mr-2" /> New Season
                </Button>
              </div>
              <div className="space-y-3">
                {seasons.map(season => (
                  <div key={season.id} className="bg-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {season.name}
                          {season.isActive && <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Active</span>}
                        </div>
                        <div className="text-xs text-slate-400">{season.startDate} → {season.endDate}</div>
                        <div className="text-xs text-slate-400">{season.rewards?.length || 0} rewards</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={async () => {
                          await base44.entities.Season.update(season.id, { isActive: !season.isActive });
                          setSeasons(seasons.map(s => s.id === season.id ? { ...s, isActive: !s.isActive } : s));
                        }} className="border-slate-600 text-xs">
                          {season.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={async () => {
                          await base44.entities.Season.delete(season.id);
                          setSeasons(seasons.filter(s => s.id !== season.id));
                          toast.success('Deleted');
                        }} className="border-red-700 text-red-400">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* PETS TAB */}
          <TabsContent value="pets">
            <div className="space-y-6">
              <div className="flex gap-2 flex-wrap">
                <Button onClick={() => setShowThemeForm(true)} className="bg-cyan-600">
                  <Plus className="w-4 h-4 mr-2" /> New Theme
                </Button>
                <Button onClick={() => setShowCosmeticForm(true)} className="bg-pink-600">
                  <Plus className="w-4 h-4 mr-2" /> New Cosmetic
                </Button>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Custom Pets ({customPets.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {customPets.map(pet => (
                    <div key={pet.id} className="bg-slate-800 rounded-xl p-3 text-center relative">
                      <div className="text-3xl mb-2">
                        {pet.imageUrl ? <img src={pet.imageUrl} className="w-12 h-12 mx-auto object-contain rounded-lg" alt={pet.name} /> : pet.emoji || '🐾'}
                      </div>
                      <div className="text-sm font-medium">{pet.name}</div>
                      <div className="text-xs text-slate-400">{pet.rarity}</div>
                      <div className="flex gap-1 mt-2 justify-center">
                        <Button size="sm" variant="ghost" onClick={() => setEditingPet(pet)} className="text-slate-400 hover:text-white h-6 px-2 text-xs">
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={async () => {
                          await base44.entities.CustomPet.delete(pet.id);
                          setCustomPets(customPets.filter(p => p.id !== pet.id));
                          toast.success('Pet deleted');
                        }} className="text-red-400 hover:text-red-300 h-6 px-2 text-xs">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Custom Themes ({customThemes.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {customThemes.map(theme => (
                    <div key={theme.id} className="bg-slate-800 rounded-xl p-3" style={{ borderLeft: `3px solid ${theme.primaryColor}` }}>
                      <div className="font-medium text-sm">{theme.name}</div>
                      <div className="text-xs text-slate-400">{theme.rarity} • {theme.xpRequired} XP</div>
                      <Button size="sm" variant="ghost" onClick={async () => {
                        await base44.entities.CustomTheme.delete(theme.id);
                        setCustomThemes(customThemes.filter(t => t.id !== theme.id));
                      }} className="text-red-400 mt-1 h-6 px-2 text-xs">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Pet Cosmetics ({petCosmetics.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {petCosmetics.map(c => (
                    <div key={c.id} className="bg-slate-800 rounded-xl p-3 text-center">
                      {c.imageUrl && <img src={c.imageUrl} className="w-12 h-12 mx-auto object-contain mb-2" alt={c.name} />}
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.cosmeticType} • {c.price} coins</div>
                      <Button size="sm" variant="ghost" onClick={async () => {
                        await base44.entities.PetCosmetic.delete(c.id);
                        setPetCosmetics(petCosmetics.filter(x => x.id !== c.id));
                      }} className="text-red-400 mt-1 h-6 px-2 text-xs">
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <BulkPetCreatorPanel onPetsCreated={(newPets) => setCustomPets([...newPets, ...customPets])} />
            </div>
          </TabsContent>

          {/* REWARDS TAB */}
          <TabsContent value="rewards">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Reward Links</h2>
                <Button onClick={() => setShowRewardLinkForm(true)} className="bg-pink-600">
                  <Plus className="w-4 h-4 mr-2" /> New Link
                </Button>
              </div>
              <div className="space-y-2">
                {rewardLinks.map(link => {
                  const appUrl = window.location.origin;
                  const rewardUrl = `${appUrl}/?reward=${link.id}`;
                  return (
                    <div key={link.id} className="bg-slate-800 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{link.name}</div>
                          <div className="text-xs text-slate-400">{link.rewardType} {link.rewardValue ? `• ${link.rewardValue}` : ''} • Used: {link.usedBy?.length || 0}/{link.maxUses || '∞'}</div>
                          {!link.isActive && <span className="text-xs text-red-400">Inactive</span>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            navigator.clipboard.writeText(rewardUrl);
                            toast.success('Link copied!');
                          }} className="border-slate-600 text-xs">
                            Copy Link
                          </Button>
                          <Button size="sm" variant="outline" onClick={async () => {
                            await base44.entities.RewardLink.update(link.id, { isActive: !link.isActive });
                            setRewardLinks(rewardLinks.map(l => l.id === link.id ? { ...l, isActive: !l.isActive } : l));
                          }} className="border-slate-600 text-xs">
                            {link.isActive ? 'Disable' : 'Enable'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={async () => {
                            await base44.entities.RewardLink.delete(link.id);
                            setRewardLinks(rewardLinks.filter(l => l.id !== link.id));
                          }} className="border-red-700 text-red-400">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <AdminEmailBroadcast profiles={profiles} />
              <DailyRewardsSettings />
            </div>
          </TabsContent>

          {/* ECONOMY TAB */}
          <TabsContent value="economy">
            <EconomyCharts profiles={profiles} assignments={assignments} />
          </TabsContent>

          {/* CUSTOMIZE TAB */}
          <TabsContent value="customize">
            <div className="space-y-6">
              <CustomizationPanel />
              <BoothSkinManager />
            </div>
          </TabsContent>

          {/* SUPER TAB */}
          {isSuperAdmin && (
            <TabsContent value="super">
              <div className="space-y-6">
                <RolesManager profiles={profiles} onProfilesUpdate={setProfiles} />
                <SuperAssignmentCreator profiles={profiles} />
                <SuperAssignmentsAnalytics />
                <CosmeticGeneratorPanel onCosmeticCreated={(c) => setPetCosmetics([c, ...petCosmetics])} />
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Pet Editor Dialog */}
        {editingPet && (
          <PetEditorDialog
            pet={editingPet}
            onClose={() => setEditingPet(null)}
            onSave={(updatedPet) => {
              setCustomPets(customPets.map(p => p.id === updatedPet.id ? updatedPet : p));
              setEditingPet(null);
            }}
          />
        )}

        {/* Season Form Dialog */}
        <SeasonFormDialog
          open={showSeasonForm}
          onOpenChange={setShowSeasonForm}
          seasonForm={seasonForm}
          setSeasonForm={setSeasonForm}
          onSubmit={handleCreateSeason}
          customPets={customPets}
          customThemes={customThemes}
        />

        {/* New Shop Item Dialog */}
        <Dialog open={showShopItemForm} onOpenChange={setShowShopItemForm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Shop Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={shopItemForm.name}
                    onChange={(e) => setShopItemForm({ ...shopItemForm, name: e.target.value })}
                    placeholder="Winter Fox"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (Quest Coins)</Label>
                  <Input
                    type="number"
                    value={shopItemForm.price}
                    onChange={(e) => setShopItemForm({ ...shopItemForm, price: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={shopItemForm.description}
                  onChange={(e) => setShopItemForm({ ...shopItemForm, description: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Type</Label>
                  <Select value={shopItemForm.itemType} onValueChange={(v) => setShopItemForm({ ...shopItemForm, itemType: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pet">Pet</SelectItem>
                      <SelectItem value="theme">Theme</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                      <SelectItem value="xp_booster">XP Booster</SelectItem>
                      {isSuperAdmin && <SelectItem value="magic_egg">Magic Egg</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Rarity</Label>
                  <Select value={shopItemForm.rarity} onValueChange={(v) => setShopItemForm({ ...shopItemForm, rarity: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="uncommon">Uncommon</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {shopItemForm.itemType === 'pet' && (
                <div className="space-y-2">
                  <Label>Select Pet</Label>
                  <Select
                    value={shopItemForm.itemData?.petId || ''}
                    onValueChange={(v) => setShopItemForm({ ...shopItemForm, itemData: { petId: v } })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Select pet" />
                    </SelectTrigger>
                    <SelectContent>
                      {customPets.map(pet => (
                        <SelectItem key={pet.id} value={`custom_${pet.id}`}>
                          {pet.emoji || '🎁'} {pet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {shopItemForm.itemType === 'theme' && (
                <div className="space-y-2">
                  <Label>Select Theme</Label>
                  <Select
                    value={shopItemForm.itemData?.themeId || ''}
                    onValueChange={(v) => setShopItemForm({ ...shopItemForm, itemData: { themeId: v } })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {customThemes.map(theme => (
                        <SelectItem key={theme.id} value={`custom_${theme.id}`}>
                          {theme.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {shopItemForm.itemType === 'title' && (
                <div className="space-y-2">
                  <Label>Title Text</Label>
                  <Input
                    value={shopItemForm.itemData?.title || ''}
                    onChange={(e) => setShopItemForm({ ...shopItemForm, itemData: { title: e.target.value } })}
                    placeholder="Epic Champion"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              )}
              
              {shopItemForm.itemType === 'xp_booster' && (
                <div className="space-y-2">
                  <Label>XP Boost Amount</Label>
                  <Input
                    type="number"
                    value={shopItemForm.itemData?.xpAmount || ''}
                    onChange={(e) => setShopItemForm({ ...shopItemForm, itemData: { xpAmount: parseInt(e.target.value) || 0 } })}
                    placeholder="100"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isLimited"
                  checked={shopItemForm.isLimited}
                  onChange={(e) => setShopItemForm({ ...shopItemForm, isLimited: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isLimited" className="cursor-pointer">Limited-Time Item</Label>
              </div>

              {shopItemForm.isLimited && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="datetime-local"
                      value={shopItemForm.startDate}
                      onChange={(e) => setShopItemForm({ ...shopItemForm, startDate: e.target.value })}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="datetime-local"
                      value={shopItemForm.endDate}
                      onChange={(e) => setShopItemForm({ ...shopItemForm, endDate: e.target.value })}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Stock Limit (optional)</Label>
                    <Input
                      type="number"
                      value={shopItemForm.stockLimit || ''}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || null;
                        setShopItemForm({ ...shopItemForm, stockLimit: val, stockRemaining: val });
                      }}
                      placeholder="Leave empty for unlimited"
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowShopItemForm(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!shopItemForm.name.trim()) {
                    toast.error('Enter item name');
                    return;
                  }
                  try {
                    const newItem = await base44.entities.ShopItem.create(shopItemForm);
                    setShopItems([newItem, ...shopItems]);
                    setShowShopItemForm(false);
                    setShopItemForm({
                      name: '', description: '', itemType: 'pet', itemData: {}, price: 50, rarity: 'common',
                      isLimited: false, stockLimit: null, stockRemaining: null, startDate: '', endDate: '', isActive: true
                    });
                    toast.success('Shop item created!');
                  } catch (e) {
                    toast.error('Failed to create item');
                  }
                }}
                className="bg-purple-600"
              >
                Create Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Shop Item Dialog */}
        <Dialog open={!!editingShopItem} onOpenChange={() => setEditingShopItem(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Shop Item</DialogTitle>
            </DialogHeader>
            {editingShopItem && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={editingShopItem.name}
                      onChange={(e) => setEditingShopItem({ ...editingShopItem, name: e.target.value })}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      value={editingShopItem.price}
                      onChange={(e) => setEditingShopItem({ ...editingShopItem, price: parseInt(e.target.value) || 0 })}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={editingShopItem.isActive}
                    onChange={(e) => setEditingShopItem({ ...editingShopItem, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="editIsActive" className="cursor-pointer">Active</Label>
                </div>
                {editingShopItem.stockLimit !== null && (
                  <div className="space-y-2">
                    <Label>Stock Remaining</Label>
                    <Input
                      type="number"
                      value={editingShopItem.stockRemaining || 0}
                      onChange={(e) => setEditingShopItem({ ...editingShopItem, stockRemaining: parseInt(e.target.value) || 0 })}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                )}
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditingShopItem(null)}>Cancel</Button>
              <Button
                onClick={async () => {
                  try {
                    await base44.entities.ShopItem.update(editingShopItem.id, editingShopItem);
                    setShopItems(shopItems.map(i => i.id === editingShopItem.id ? editingShopItem : i));
                    setEditingShopItem(null);
                    toast.success('Item updated');
                  } catch (e) {
                    toast.error('Failed to update');
                  }
                }}
                className="bg-purple-600"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manual Pack Builder Dialog */}
        <Dialog open={showManualPackForm} onOpenChange={setShowManualPackForm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Custom Pack</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pack Name</Label>
                  <Input
                    value={manualPackForm.name}
                    onChange={(e) => setManualPackForm({ ...manualPackForm, name: e.target.value })}
                    placeholder="Winter Crew Pack"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pack Image</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setManualPackForm({ ...manualPackForm, imageUrl: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
              
              {manualPackForm.imageUrl && (
                <div className="flex items-center gap-3">
                  <img src={manualPackForm.imageUrl} alt="Pack" className="w-20 h-20 rounded-lg object-cover" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setManualPackForm({ ...manualPackForm, imageUrl: '' })}
                    className="text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={manualPackForm.description}
                  onChange={(e) => setManualPackForm({ ...manualPackForm, description: e.target.value })}
                  placeholder="Limited-time winter bundle with exclusive pets and themes!"
                  className="bg-slate-700 border-slate-600"
                />
              </div>

              <div className="space-y-2">
                <Label>Select Items for Pack</Label>
                <div className="bg-slate-700 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                  {shopItems.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-4">Create shop items first</p>
                  ) : (
                    shopItems.map(item => (
                      <div key={item.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`pack-item-${item.id}`}
                          checked={manualPackForm.itemIds.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setManualPackForm({
                                ...manualPackForm,
                                itemIds: [...manualPackForm.itemIds, item.id]
                              });
                            } else {
                              setManualPackForm({
                                ...manualPackForm,
                                itemIds: manualPackForm.itemIds.filter(id => id !== item.id)
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={`pack-item-${item.id}`} className="cursor-pointer flex-1">
                          {item.name} ({item.itemType}) - {item.price} coins
                        </Label>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-xs text-slate-400">Selected: {manualPackForm.itemIds.length} items</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Original Price</Label>
                  <Input
                    type="number"
                    value={manualPackForm.originalPrice}
                    onChange={(e) => setManualPackForm({ ...manualPackForm, originalPrice: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bundle Price</Label>
                  <Input
                    type="number"
                    value={manualPackForm.bundlePrice}
                    onChange={(e) => setManualPackForm({ ...manualPackForm, bundlePrice: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Limit</Label>
                  <Input
                    type="number"
                    value={manualPackForm.stockLimit || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || null;
                      setManualPackForm({ ...manualPackForm, stockLimit: val, stockRemaining: val });
                    }}
                    placeholder="10"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={manualPackForm.startDate}
                    onChange={(e) => setManualPackForm({ ...manualPackForm, startDate: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={manualPackForm.endDate}
                    onChange={(e) => setManualPackForm({ ...manualPackForm, endDate: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowManualPackForm(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!manualPackForm.name.trim() || manualPackForm.itemIds.length === 0) {
                    toast.error('Enter pack name and select items');
                    return;
                  }
                  try {
                    const newBundle = await base44.entities.Bundle.create(manualPackForm);
                    setBundles([newBundle, ...bundles]);
                    setShowManualPackForm(false);
                    setManualPackForm({
                      name: '', description: '', imageUrl: '', itemIds: [], originalPrice: 0, bundlePrice: 0,
                      discountPercent: 20, isLimited: true, stockLimit: 10, stockRemaining: 10,
                      startDate: '', endDate: '', isActive: true
                    });
                    toast.success('Pack created!');
                  } catch (e) {
                    toast.error('Failed to create pack');
                  }
                }}
                className="bg-blue-600"
              >
                Create Pack
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Bundle Dialog */}
        <Dialog open={showBundleForm} onOpenChange={setShowBundleForm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Bundle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Bundle Name</Label>
                <Input
                  value={bundleForm.name}
                  onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })}
                  placeholder="Winter Crew Pack"
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={bundleForm.description}
                  onChange={(e) => setBundleForm({ ...bundleForm, description: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Original Price</Label>
                  <Input
                    type="number"
                    value={bundleForm.originalPrice}
                    onChange={(e) => setBundleForm({ ...bundleForm, originalPrice: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bundle Price</Label>
                  <Input
                    type="number"
                    value={bundleForm.bundlePrice}
                    onChange={(e) => setBundleForm({ ...bundleForm, bundlePrice: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    value={bundleForm.discountPercent}
                    onChange={(e) => setBundleForm({ ...bundleForm, discountPercent: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Select Items (paste Shop Item IDs, comma-separated)</Label>
                <Textarea
                  value={bundleForm.itemIds.join(', ')}
                  onChange={(e) => setBundleForm({ ...bundleForm, itemIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                  placeholder="item_id_1, item_id_2, item_id_3"
                  className="bg-slate-700 border-slate-600"
                />
                <p className="text-xs text-slate-400">Tip: Create shop items first, then use their IDs here</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={bundleForm.startDate}
                    onChange={(e) => setBundleForm({ ...bundleForm, startDate: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="datetime-local"
                    value={bundleForm.endDate}
                    onChange={(e) => setBundleForm({ ...bundleForm, endDate: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Stock Limit (optional)</Label>
                  <Input
                    type="number"
                    value={bundleForm.stockLimit || ''}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || null;
                      setBundleForm({ ...bundleForm, stockLimit: val, stockRemaining: val });
                    }}
                    placeholder="Leave empty for unlimited"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowBundleForm(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!bundleForm.name.trim() || bundleForm.itemIds.length === 0) {
                    toast.error('Enter bundle name and items');
                    return;
                  }
                  try {
                    const newBundle = await base44.entities.Bundle.create(bundleForm);
                    setBundles([newBundle, ...bundles]);
                    setShowBundleForm(false);
                    setBundleForm({
                      name: '', description: '', itemIds: [], originalPrice: 0, bundlePrice: 0, discountPercent: 20,
                      isLimited: true, stockLimit: null, stockRemaining: null, startDate: '', endDate: '', isActive: true
                    });
                    toast.success('Bundle created!');
                  } catch (e) {
                    toast.error('Failed to create bundle');
                  }
                }}
                className="bg-amber-600"
              >
                Create Bundle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Bundle Dialog */}
        <Dialog open={!!editingBundle} onOpenChange={() => setEditingBundle(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Bundle</DialogTitle>
            </DialogHeader>
            {editingBundle && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={editingBundle.name}
                    onChange={(e) => setEditingBundle({ ...editingBundle, name: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bundle Price</Label>
                    <Input
                      type="number"
                      value={editingBundle.bundlePrice}
                      onChange={(e) => setEditingBundle({ ...editingBundle, bundlePrice: parseInt(e.target.value) || 0 })}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  {editingBundle.stockLimit !== null && (
                    <div className="space-y-2">
                      <Label>Stock Remaining</Label>
                      <Input
                        type="number"
                        value={editingBundle.stockRemaining || 0}
                        onChange={(e) => setEditingBundle({ ...editingBundle, stockRemaining: parseInt(e.target.value) || 0 })}
                        className="bg-slate-700 border-slate-600"
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="editBundleActive"
                    checked={editingBundle.isActive}
                    onChange={(e) => setEditingBundle({ ...editingBundle, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="editBundleActive" className="cursor-pointer">Active</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditingBundle(null)}>Cancel</Button>
              <Button
                onClick={async () => {
                  try {
                    await base44.entities.Bundle.update(editingBundle.id, editingBundle);
                    setBundles(bundles.map(b => b.id === editingBundle.id ? editingBundle : b));
                    setEditingBundle(null);
                    toast.success('Bundle updated');
                  } catch (e) {
                    toast.error('Failed to update');
                  }
                }}
                className="bg-amber-600"
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reward Link Form Dialog */}
        <Dialog open={showRewardLinkForm} onOpenChange={setShowRewardLinkForm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Reward Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Link Name</Label>
                <Input
                  value={rewardLinkForm.name}
                  onChange={(e) => setRewardLinkForm({ ...rewardLinkForm, name: e.target.value })}
                  placeholder="Welcome Bonus"
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Reward Type</Label>
                  <Select
                    value={rewardLinkForm.rewardType}
                    onValueChange={(v) => setRewardLinkForm({ ...rewardLinkForm, rewardType: v, rewardValue: v === 'magic_egg' ? 0 : 100, rewardData: {} })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xp">XP</SelectItem>
                      <SelectItem value="coins">Quest Coins</SelectItem>
                      {isSuperAdmin && <SelectItem value="magic_egg">Magic Egg</SelectItem>}
                      <SelectItem value="pet">Pet</SelectItem>
                      <SelectItem value="theme">Theme</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(rewardLinkForm.rewardType === 'xp' || rewardLinkForm.rewardType === 'coins') && (
                  <div className="space-y-2">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      value={rewardLinkForm.rewardValue}
                      onChange={(e) => setRewardLinkForm({ ...rewardLinkForm, rewardValue: parseInt(e.target.value) || 0 })}
                      placeholder="100"
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                )}

                {rewardLinkForm.rewardType === 'pet' && (
                  <div className="space-y-2">
                    <Label>Select Pet</Label>
                    <Select
                      value={rewardLinkForm.rewardData?.petId || ''}
                      onValueChange={(v) => setRewardLinkForm({ ...rewardLinkForm, rewardData: { petId: v } })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue placeholder="Choose pet" />
                      </SelectTrigger>
                      <SelectContent>
                        {PETS.map(pet => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {pet.emoji} {pet.name}
                          </SelectItem>
                        ))}
                        {customPets.map(pet => (
                          <SelectItem key={pet.id} value={`custom_${pet.id}`}>
                            {pet.emoji || '🎁'} {pet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {rewardLinkForm.rewardType === 'theme' && (
                  <div className="space-y-2">
                    <Label>Select Theme</Label>
                    <Select
                      value={rewardLinkForm.rewardData?.themeId || ''}
                      onValueChange={(v) => setRewardLinkForm({ ...rewardLinkForm, rewardData: { themeId: v } })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue placeholder="Choose theme" />
                      </SelectTrigger>
                      <SelectContent>
                        {THEMES.map(theme => (
                          <SelectItem key={theme.id} value={theme.id}>
                            {theme.name}
                          </SelectItem>
                        ))}
                        {customThemes.map(theme => (
                          <SelectItem key={theme.id} value={`custom_${theme.id}`}>
                            {theme.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {rewardLinkForm.rewardType === 'title' && (
                  <div className="space-y-2">
                    <Label>Title Text</Label>
                    <Input
                      value={rewardLinkForm.rewardData?.title || ''}
                      onChange={(e) => setRewardLinkForm({ ...rewardLinkForm, rewardData: { title: e.target.value } })}
                      placeholder="VIP Member"
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Uses (leave empty for unlimited)</Label>
                  <Input
                    type="number"
                    value={rewardLinkForm.maxUses || ''}
                    onChange={(e) => setRewardLinkForm({ ...rewardLinkForm, maxUses: parseInt(e.target.value) || null })}
                    placeholder="10"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expires At (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={rewardLinkForm.expiresAt}
                    onChange={(e) => setRewardLinkForm({ ...rewardLinkForm, expiresAt: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowRewardLinkForm(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!rewardLinkForm.name.trim()) {
                    toast.error('Enter link name');
                    return;
                  }
                  try {
                    const newLink = await base44.entities.RewardLink.create(rewardLinkForm);
                    setRewardLinks([newLink, ...rewardLinks]);
                    setShowRewardLinkForm(false);
                    setRewardLinkForm({
                      name: '', rewardType: 'xp', rewardValue: 100, rewardData: {},
                      maxUses: 10, usedBy: [], expiresAt: '', isActive: true
                    });
                    toast.success('Reward link created!');
                  } catch (e) {
                    toast.error('Failed to create link');
                  }
                }}
                className="bg-gradient-to-r from-pink-500 to-purple-500"
              >
                Create Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Cosmetic Dialog */}
        <Dialog open={showCosmeticForm} onOpenChange={setShowCosmeticForm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Pet Cosmetic</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={cosmeticForm.name}
                    onChange={(e) => setCosmeticForm({ ...cosmeticForm, name: e.target.value })}
                    placeholder="Cool Sunglasses"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cosmetic Type</Label>
                  <Select value={cosmeticForm.cosmeticType} onValueChange={(v) => setCosmeticForm({ ...cosmeticForm, cosmeticType: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hat">Hat</SelectItem>
                      <SelectItem value="glasses">Glasses</SelectItem>
                      <SelectItem value="accessory">Accessory</SelectItem>
                      <SelectItem value="background">Background</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={cosmeticForm.description}
                  onChange={(e) => setCosmeticForm({ ...cosmeticForm, description: e.target.value })}
                  placeholder="Stylish shades for your pet"
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Price (Coins)</Label>
                  <Input
                    type="number"
                    value={cosmeticForm.price}
                    onChange={(e) => setCosmeticForm({ ...cosmeticForm, price: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rarity</Label>
                  <Select value={cosmeticForm.rarity} onValueChange={(v) => setCosmeticForm({ ...cosmeticForm, rarity: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="uncommon">Uncommon</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="cosmeticLimited"
                      checked={cosmeticForm.isLimited}
                      onChange={(e) => setCosmeticForm({ ...cosmeticForm, isLimited: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="cosmeticLimited" className="cursor-pointer">Limited</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Upload Image (PNG/SVG with transparent background)</Label>
                <Input
                  type="file"
                  accept="image/png,image/svg+xml"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setCosmeticForm({ ...cosmeticForm, imageUrl: reader.result });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="bg-slate-700 border-slate-600"
                />
                {cosmeticForm.imageUrl && (
                  <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                    <img src={cosmeticForm.imageUrl} alt="Preview" className="w-16 h-16 object-contain" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setCosmeticForm({ ...cosmeticForm, imageUrl: '' })}
                      className="text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowCosmeticForm(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!cosmeticForm.name.trim() || !cosmeticForm.imageUrl) {
                    toast.error('Enter name and upload image');
                    return;
                  }
                  try {
                    const newCosmetic = await base44.entities.PetCosmetic.create(cosmeticForm);
                    setPetCosmetics([newCosmetic, ...petCosmetics]);
                    setShowCosmeticForm(false);
                    setCosmeticForm({
                      name: '', description: '', cosmeticType: 'hat', imageUrl: '', price: 50, rarity: 'common', isLimited: false, isActive: true
                    });
                    toast.success('Cosmetic created!');
                  } catch (e) {
                    toast.error('Failed to create cosmetic');
                  }
                }}
                className="bg-pink-600"
              >
                Create Cosmetic
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Theme Dialog */}
        <Dialog open={showThemeForm} onOpenChange={setShowThemeForm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Create Custom Theme</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={themeForm.name}
                    onChange={(e) => setThemeForm({ ...themeForm, name: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rarity</Label>
                  <Select value={themeForm.rarity} onValueChange={(v) => setThemeForm({ ...themeForm, rarity: v })}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="uncommon">Uncommon</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>XP Required</Label>
                <Input
                  type="number"
                  value={themeForm.xpRequired}
                  onChange={(e) => setThemeForm({ ...themeForm, xpRequired: parseInt(e.target.value) || 0 })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <Input
                    type="color"
                    value={themeForm.primaryColor}
                    onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                    className="h-10 bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <Input
                    type="color"
                    value={themeForm.secondaryColor}
                    onChange={(e) => setThemeForm({ ...themeForm, secondaryColor: e.target.value })}
                    className="h-10 bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <Input
                    type="color"
                    value={themeForm.accentColor}
                    onChange={(e) => setThemeForm({ ...themeForm, accentColor: e.target.value })}
                    className="h-10 bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <Input
                    type="color"
                    value={themeForm.bgColor}
                    onChange={(e) => setThemeForm({ ...themeForm, bgColor: e.target.value })}
                    className="h-10 bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={themeForm.description}
                  onChange={(e) => setThemeForm({ ...themeForm, description: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: themeForm.bgColor }}>
                <p className="text-sm font-medium" style={{ color: themeForm.primaryColor }}>Preview</p>
                <div className="flex gap-2 mt-2">
                  <div className="px-3 py-1 rounded" style={{ backgroundColor: themeForm.primaryColor, color: 'white' }}>Primary</div>
                  <div className="px-3 py-1 rounded" style={{ backgroundColor: themeForm.secondaryColor, color: 'white' }}>Secondary</div>
                  <div className="px-3 py-1 rounded" style={{ backgroundColor: themeForm.accentColor, color: 'white' }}>Accent</div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowThemeForm(false)}>Cancel</Button>
              <Button onClick={handleCreateTheme} className="bg-cyan-600">Create Theme</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}