import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ArrowLeft, Search, Users, ClipboardList, Plus, 
  Lock, Unlock, Eye, EyeOff, Key, Zap, Check, X, Edit2, Save,
  Palette, Star, Image, Trash2, Gift, Calendar, Sparkles, Wand2, Loader2, ShoppingBag, Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MATH_TEACHERS, READING_TEACHERS } from '@/components/quest/TeacherConfig';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import { toast } from 'sonner';
import AdminChatWidget from '@/components/admin/AdminChatWidget';

const ADMIN_PASSWORD = 'Crosby110!'; // In production, this would be hashed and stored server-side

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(false);
  
  // Users
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editXp, setEditXp] = useState('');
  const [newPin, setNewPin] = useState('');
  
  // Assignments
  const [assignments, setAssignments] = useState([]);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    subject: 'everyone',
    target: 'everyone',
    xpReward: 10,
    dueDate: ''
  });

  // Custom Pets & Themes
  const [customPets, setCustomPets] = useState([]);
  const [customThemes, setCustomThemes] = useState([]);
  const [showPetForm, setShowPetForm] = useState(false);
  const [showThemeForm, setShowThemeForm] = useState(false);
  const [petForm, setPetForm] = useState({
    name: '', rarity: 'common', xpRequired: 0, description: '', emoji: '', imageUrl: '', isGiftOnly: false,
    theme: { primary: '#6366f1', secondary: '#a855f7', accent: '#f59e0b', bg: '#f8fafc' }
  });
  const [generatingPetImage, setGeneratingPetImage] = useState(false);
  const [themeForm, setThemeForm] = useState({
    name: '', rarity: 'common', xpRequired: 0, description: '',
    primaryColor: '#6366f1', secondaryColor: '#8b5cf6', accentColor: '#f59e0b', bgColor: '#f8fafc'
  });

  // Gifting
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [giftUser, setGiftUser] = useState(null);
  const [giftType, setGiftType] = useState('pet');
  const [giftItemId, setGiftItemId] = useState('');

  // Seasons
  const [seasons, setSeasons] = useState([]);
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [seasonForm, setSeasonForm] = useState({
    name: '', startDate: '', endDate: '', isActive: true, rewards: []
  });
  const [editingAssignment, setEditingAssignment] = useState(null);

  // Magic Eggs
  const [magicEggs, setMagicEggs] = useState([]);
  const [adminEggIdea, setAdminEggIdea] = useState('');
  const [generatingAdminPet, setGeneratingAdminPet] = useState(false);

  // Events
  const [events, setEvents] = useState([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    name: '', type: 'bubble_pop', isActive: false,
    config: { bubbleCount: 15, eggChance: 10 }
  });

  // Shop
  const [shopItems, setShopItems] = useState([]);
  const [bundles, setBundles] = useState([]);
  const [showShopItemForm, setShowShopItemForm] = useState(false);
  const [showBundleForm, setShowBundleForm] = useState(false);
  const [shopItemForm, setShopItemForm] = useState({
    name: '', description: '', itemType: 'pet', itemData: {}, price: 50, rarity: 'common',
    isLimited: false, stockLimit: null, stockRemaining: null, startDate: '', endDate: '', isActive: true
  });
  const [bundleForm, setBundleForm] = useState({
    name: '', description: '', itemIds: [], originalPrice: 0, bundlePrice: 0, discountPercent: 20,
    isLimited: true, stockLimit: null, stockRemaining: null, startDate: '', endDate: '', isActive: true
  });
  const [editingShopItem, setEditingShopItem] = useState(null);
  const [editingBundle, setEditingBundle] = useState(null);
  const [showManualPackForm, setShowManualPackForm] = useState(false);
  const [manualPackForm, setManualPackForm] = useState({
    name: '', description: '', imageUrl: '', itemIds: [], originalPrice: 0, bundlePrice: 0,
    discountPercent: 20, isLimited: true, stockLimit: 10, stockRemaining: 10,
    startDate: '', endDate: '', isActive: true
  });

  // Settings
  const [appSettings, setAppSettings] = useState([]);
  const [referralSettings, setReferralSettings] = useState({
    referralMode: false,
    referrerRewardXP: 50,
    referredRewardXP: 25,
  });

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    // First check if user is logged in and is admin
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) {
      setLoading(false);
      return;
    }

    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0 || profiles[0].username.toLowerCase() !== 'crosby') {
        // Not admin user, redirect to dashboard
        navigate(createPageUrl('Dashboard'));
        return;
      }
      
      // Check if already authenticated with password
      const adminAuth = localStorage.getItem('quest_admin_auth');
      if (adminAuth === 'true') {
        setIsAuthenticated(true);
        loadData();
      } else {
        setLoading(false);
      }
    } catch (e) {
      navigate(createPageUrl('Dashboard'));
    }
  };

  const handleAdminLogin = () => {
    // Simple password verification (in production, this would be server-side with hashing)
    if (adminPin === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem('quest_admin_auth', 'true');
      loadData();
    } else {
      toast.error('Invalid admin password');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, allAssignments, allPets, allThemes, allSeasons, allEggs, allEvents, allSettings, allShopItems, allBundles] = await Promise.all([
        base44.entities.UserProfile.list('-created_date'),
        base44.entities.Assignment.list('-created_date'),
        base44.entities.CustomPet.list('-created_date'),
        base44.entities.CustomTheme.list('-created_date'),
        base44.entities.Season.list('-created_date'),
        base44.entities.MagicEgg.list('-created_date'),
        base44.entities.AdminEvent.list('-created_date'),
        base44.entities.AppSetting.list(),
        base44.entities.ShopItem.list('-created_date'),
        base44.entities.Bundle.list('-created_date')
      ]);
      setUsers(allUsers);
      setAssignments(allAssignments);
      setCustomPets(allPets);
      setCustomThemes(allThemes);
      setSeasons(allSeasons);
      setMagicEggs(allEggs);
      setEvents(allEvents);
      setAppSettings(allSettings);
      setShopItems(allShopItems);
      setBundles(allBundles);
      const refSetting = allSettings.find(s => s.key === 'referral_settings');
      if (refSetting) {
        setReferralSettings(refSetting.value);
      }
    } catch (e) {
      console.error('Error loading data:', e);
    }
    setLoading(false);
  };

  const handleSetXp = async () => {
    if (!selectedUser) return;
    const xpValue = parseInt(editXp);
    if (isNaN(xpValue) || xpValue < 0) {
      toast.error('Please enter a valid XP amount');
      return;
    }

    try {
      await base44.entities.UserProfile.update(selectedUser.id, { xp: xpValue });
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, xp: xpValue } : u));
      setSelectedUser({ ...selectedUser, xp: xpValue });
      toast.success(`XP set to ${xpValue}`);
    } catch (e) {
      toast.error('Failed to update XP');
    }
  };

  const handleToggleLock = async (user) => {
    try {
      const newLocked = !user.isLocked;
      await base44.entities.UserProfile.update(user.id, { isLocked: newLocked });
      setUsers(users.map(u => u.id === user.id ? { ...u, isLocked: newLocked } : u));
      toast.success(`User ${newLocked ? 'locked' : 'unlocked'}`);
    } catch (e) {
      toast.error('Failed to update user');
    }
  };

  const handleToggleHidden = async (user) => {
    try {
      const newHidden = !user.hiddenFromLeaderboard;
      await base44.entities.UserProfile.update(user.id, { hiddenFromLeaderboard: newHidden });
      setUsers(users.map(u => u.id === user.id ? { ...u, hiddenFromLeaderboard: newHidden } : u));
      toast.success(`User ${newHidden ? 'hidden from' : 'visible on'} leaderboard`);
    } catch (e) {
      toast.error('Failed to update user');
    }
  };

  const handleResetPin = async () => {
    if (!selectedUser) return;
    if (!/^\d{4}$/.test(newPin)) {
      toast.error('PIN must be exactly 4 digits');
      return;
    }

    // Store new hashed PIN
    localStorage.setItem(`pin_${selectedUser.userId}`, btoa(newPin));
    toast.success('PIN reset successfully');
    setNewPin('');
  };

  const handleCreateAssignment = async () => {
    if (!assignmentForm.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      const newAssignment = await base44.entities.Assignment.create({
        ...assignmentForm,
        isApproved: true, // Admin-created assignments are auto-approved
        target: assignmentForm.subject === 'everyone' ? 'everyone' : assignmentForm.target
      });
      setAssignments([newAssignment, ...assignments]);
      setShowAssignmentForm(false);
      setAssignmentForm({
        title: '',
        description: '',
        subject: 'everyone',
        target: 'everyone',
        xpReward: 10,
        dueDate: ''
      });
      toast.success('Assignment created!');
    } catch (e) {
      toast.error('Failed to create assignment');
    }
  };

  const handleApproveAssignment = async (assignment) => {
    try {
      await base44.entities.Assignment.update(assignment.id, { isApproved: true });
      setAssignments(assignments.map(a => a.id === assignment.id ? { ...a, isApproved: true } : a));
      toast.success('Assignment approved');
    } catch (e) {
      toast.error('Failed to approve assignment');
    }
  };

  const handleCreatePet = async () => {
    if (!petForm.name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    if (!petForm.emoji && !petForm.imageUrl) {
      toast.error('Please add an emoji or image');
      return;
    }
    try {
      const newPet = await base44.entities.CustomPet.create(petForm);
      setCustomPets([newPet, ...customPets]);
      setShowPetForm(false);
      setPetForm({ 
        name: '', rarity: 'common', xpRequired: 0, description: '', emoji: '', imageUrl: '', isGiftOnly: false,
        theme: { primary: '#6366f1', secondary: '#a855f7', accent: '#f59e0b', bg: '#f8fafc' }
      });
      toast.success('Pet created!');
    } catch (e) {
      toast.error('Failed to create pet');
    }
  };

  const handleCreateTheme = async () => {
    if (!themeForm.name.trim()) {
      toast.error('Please enter a name');
      return;
    }
    try {
      const newTheme = await base44.entities.CustomTheme.create(themeForm);
      setCustomThemes([newTheme, ...customThemes]);
      setShowThemeForm(false);
      setThemeForm({
        name: '', rarity: 'common', xpRequired: 0, description: '',
        primaryColor: '#6366f1', secondaryColor: '#8b5cf6', accentColor: '#f59e0b', bgColor: '#f8fafc'
      });
      toast.success('Theme created!');
    } catch (e) {
      toast.error('Failed to create theme');
    }
  };

  const handleDeletePet = async (pet) => {
    try {
      await base44.entities.CustomPet.delete(pet.id);
      setCustomPets(customPets.filter(p => p.id !== pet.id));
      toast.success('Pet deleted');
    } catch (e) {
      toast.error('Failed to delete pet');
    }
  };

  const handleDeleteTheme = async (theme) => {
    try {
      await base44.entities.CustomTheme.delete(theme.id);
      setCustomThemes(customThemes.filter(t => t.id !== theme.id));
      toast.success('Theme deleted');
    } catch (e) {
      toast.error('Failed to delete theme');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPetForm({ ...petForm, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGeneratePetImage = async () => {
    if (!petForm.name) {
      toast.error('Please enter a pet name first');
      return;
    }
    setGeneratingPetImage(true);
    try {
      const imagePrompt = `Cute cartoon pet character for a kids game: ${petForm.name}. ${petForm.description || 'A friendly magical creature'}.
Style: adorable, friendly, colorful digital art, game mascot style, simple clean design.
Color scheme: primary ${petForm.theme?.primary}, secondary ${petForm.theme?.secondary}, accent ${petForm.theme?.accent}.
White or transparent background, centered, high quality illustration.`;
      
      const result = await base44.integrations.Core.GenerateImage({
        prompt: imagePrompt
      });
      
      setPetForm({ ...petForm, imageUrl: result.url });
      toast.success('Image generated!');
    } catch (e) {
      toast.error('Failed to generate image');
    }
    setGeneratingPetImage(false);
  };

  const handleGiftItem = async () => {
    if (!giftUser || !giftItemId) {
      toast.error('Please enter an amount or select an item');
      return;
    }
    try {
      if (giftType === 'coins') {
        const amount = parseInt(giftItemId);
        if (isNaN(amount) || amount <= 0) {
          toast.error('Please enter a valid amount');
          return;
        }
        const newCoins = (giftUser.questCoins || 0) + amount;
        await base44.entities.UserProfile.update(giftUser.id, { questCoins: newCoins });
        setUsers(users.map(u => u.id === giftUser.id ? { ...u, questCoins: newCoins } : u));
        toast.success(`${amount} Quest Coins gifted to ${giftUser.username}!`);
      } else if (giftType === 'pet') {
        const unlockedPets = [...(giftUser.unlockedPets || [])];
        if (!unlockedPets.includes(giftItemId)) {
          unlockedPets.push(giftItemId);
          await base44.entities.UserProfile.update(giftUser.id, { unlockedPets });
          setUsers(users.map(u => u.id === giftUser.id ? { ...u, unlockedPets } : u));
        }
        toast.success(`Pet gifted to ${giftUser.username}!`);
      } else {
        const unlockedThemes = [...(giftUser.unlockedThemes || [])];
        if (!unlockedThemes.includes(giftItemId)) {
          unlockedThemes.push(giftItemId);
          await base44.entities.UserProfile.update(giftUser.id, { unlockedThemes });
          setUsers(users.map(u => u.id === giftUser.id ? { ...u, unlockedThemes } : u));
        }
        toast.success(`Theme gifted to ${giftUser.username}!`);
      }
      setShowGiftDialog(false);
      setGiftItemId('');
    } catch (e) {
      toast.error('Failed to gift item');
    }
  };

  const handleDeleteAssignment = async (assignment) => {
    try {
      await base44.entities.Assignment.delete(assignment.id);
      setAssignments(assignments.filter(a => a.id !== assignment.id));
      toast.success('Assignment deleted');
    } catch (e) {
      toast.error('Failed to delete assignment');
    }
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment) return;
    try {
      await base44.entities.Assignment.update(editingAssignment.id, editingAssignment);
      setAssignments(assignments.map(a => a.id === editingAssignment.id ? editingAssignment : a));
      setEditingAssignment(null);
      toast.success('Assignment updated');
    } catch (e) {
      toast.error('Failed to update assignment');
    }
  };

  const handleCreateSeason = async () => {
    if (!seasonForm.name.trim() || !seasonForm.startDate || !seasonForm.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }
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

  const handleDeleteSeason = async (season) => {
    try {
      await base44.entities.Season.delete(season.id);
      setSeasons(seasons.filter(s => s.id !== season.id));
      toast.success('Season deleted');
    } catch (e) {
      toast.error('Failed to delete season');
    }
  };

  const addSeasonReward = () => {
    setSeasonForm({
      ...seasonForm,
      rewards: [...seasonForm.rewards, { xpRequired: 100, type: 'pet', value: '', name: '' }]
    });
  };

  const updateSeasonReward = (index, field, value) => {
    const newRewards = [...seasonForm.rewards];
    newRewards[index][field] = value;
    setSeasonForm({ ...seasonForm, rewards: newRewards });
  };

  const removeSeasonReward = (index) => {
    setSeasonForm({
      ...seasonForm,
      rewards: seasonForm.rewards.filter((_, i) => i !== index)
    });
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-xl">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400 mt-2">Enter admin password to continue</p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Admin Password</Label>
                <Input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Enter password..."
                  onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                  className="h-12 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Button
                onClick={handleAdminLogin}
                className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-600"
              >
                Access Admin Panel
              </Button>
            </div>
          </div>

          <div className="text-center mt-4">
            <Link to={createPageUrl('Dashboard')} className="text-slate-400 hover:text-white text-sm">
              ← Back to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AdminChatWidget />
      <div className="max-w-6xl mx-auto p-4 pb-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                <p className="text-sm text-slate-400">Manage users & assignments</p>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white"
            onClick={() => {
              localStorage.removeItem('quest_admin_auth');
              setIsAuthenticated(false);
            }}
          >
            Logout
          </Button>
        </motion.div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-slate-800 border-slate-700 mb-6 flex-wrap">
            <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
              <Users className="w-4 h-4 mr-2" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-slate-700">
              <ClipboardList className="w-4 h-4 mr-2" />
              Assignments ({assignments.length})
            </TabsTrigger>
            <TabsTrigger value="pets" className="data-[state=active]:bg-slate-700">
              <Star className="w-4 h-4 mr-2" />
              Pets ({customPets.length})
            </TabsTrigger>
            <TabsTrigger value="themes" className="data-[state=active]:bg-slate-700">
              <Palette className="w-4 h-4 mr-2" />
              Themes ({customThemes.length})
            </TabsTrigger>
            <TabsTrigger value="seasons" className="data-[state=active]:bg-slate-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Seasons ({seasons.length})
            </TabsTrigger>
            <TabsTrigger value="eggs" className="data-[state=active]:bg-slate-700">
              🥚
              Magic Eggs
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-slate-700">
              🫧
              Events
            </TabsTrigger>
            <TabsTrigger value="shop" className="data-[state=active]:bg-slate-700">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Shop
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700">
              ⚙️
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            {/* Search */}
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="pl-10 bg-slate-800 border-slate-700 text-white"
              />
            </div>

            {/* Users list */}
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-slate-400">Loading...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-slate-400">No users found</div>
              ) : (
                filteredUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <h3 className="font-semibold text-white flex items-center gap-2">
                            {user.username}
                            {user.isLocked && (
                              <Lock className="w-4 h-4 text-red-400" />
                            )}
                            {user.hiddenFromLeaderboard && (
                              <EyeOff className="w-4 h-4 text-yellow-400" />
                            )}
                            {user.isPetCreator && (
                              <Wand2 className="w-4 h-4 text-pink-400" />
                            )}
                          </h3>
                          <p className="text-sm text-slate-400">
                            Math: {user.mathTeacher} • Reading: {user.readingTeacher}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-amber-400 font-bold">{user.xp || 0} XP</p>
                          <p className="text-blue-400 text-sm">{user.questCoins || 0} 🪙</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleLock(user)}
                            className="text-slate-400 hover:text-white"
                          >
                            {user.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleHidden(user)}
                            className="text-slate-400 hover:text-white"
                          >
                            {user.hiddenFromLeaderboard ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setEditXp(String(user.xp || 0));
                            }}
                            className="text-slate-400 hover:text-white"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setGiftUser(user);
                              setShowGiftDialog(true);
                            }}
                            className="text-purple-400 hover:text-purple-300"
                            title="Gift Items/Coins"
                          >
                            <Gift className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              const newStatus = !user.isPetCreator;
                              await base44.entities.UserProfile.update(user.id, { isPetCreator: newStatus });
                              setUsers(users.map(u => u.id === user.id ? { ...u, isPetCreator: newStatus } : u));
                              toast.success(newStatus ? `${user.username} can now create pets!` : `Pet creator access removed from ${user.username}`);
                            }}
                            className={user.isPetCreator ? "text-pink-400 hover:text-pink-300" : "text-slate-400 hover:text-slate-300"}
                            title={user.isPetCreator ? "Remove Pet Creator" : "Grant Pet Creator"}
                          >
                            <Wand2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="assignments">
            <div className="flex justify-end mb-4">
              <Button
                onClick={() => setShowAssignmentForm(true)}
                className="bg-gradient-to-r from-emerald-500 to-teal-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Assignment
              </Button>
            </div>

            <div className="space-y-3">
              {assignments.map((assignment) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                >
                  <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white flex items-center gap-2 flex-wrap">
                      {assignment.title}
                      {!assignment.isApproved && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                          Pending
                        </span>
                      )}
                      {assignment.isFlagged && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                          🚩 Flagged
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {assignment.subject === 'everyone' 
                        ? 'All Students' 
                        : `${assignment.subject}: ${assignment.target}`
                      }
                      {assignment.xpReward && ` • ${assignment.xpReward} XP`}
                      {assignment.dueDate && ` • Due: ${assignment.dueDate}`}
                    </p>
                    {assignment.isFlagged && assignment.flagReason && (
                      <p className="text-xs text-red-400 mt-1">Reason: {assignment.flagReason}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {assignment.isFlagged && (
                      <Button
                        size="sm"
                        onClick={async () => {
                          await base44.entities.Assignment.update(assignment.id, { isFlagged: false, flagReason: null });
                          setAssignments(assignments.map(a => a.id === assignment.id ? { ...a, isFlagged: false, flagReason: null } : a));
                          toast.success('Assignment cleared! Users can now earn XP.');
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Clear Flag
                      </Button>
                    )}
                    {!assignment.isApproved && (
                      <Button
                        size="sm"
                        onClick={() => handleApproveAssignment(assignment)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingAssignment({ ...assignment })}
                      className="text-slate-400 hover:text-white"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteAssignment(assignment)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="pets">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowPetForm(true)} className="bg-gradient-to-r from-purple-500 to-pink-600">
                <Plus className="w-4 h-4 mr-2" />
                New Pet
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customPets.map((pet) => (
                <div key={pet.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {pet.imageUrl ? (
                        <img src={pet.imageUrl} alt={pet.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <span className="text-4xl">{pet.emoji}</span>
                      )}
                      <div>
                        <h3 className="font-semibold text-white">{pet.name}</h3>
                        <p className="text-xs text-slate-400 capitalize">
                          {pet.rarity} • {pet.isGiftOnly ? 'Gift Only' : `${pet.xpRequired} XP`}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleDeletePet(pet)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {pet.description && <p className="text-sm text-slate-500">{pet.description}</p>}
                </div>
              ))}
              {customPets.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-400">No custom pets yet</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="seasons">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowSeasonForm(true)} className="bg-gradient-to-r from-amber-500 to-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                New Season
              </Button>
            </div>
            <div className="space-y-4">
              {seasons.map((season) => (
                <div key={season.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        {season.name}
                        {season.isActive && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Active</span>}
                      </h3>
                      <p className="text-xs text-slate-400">{season.startDate} to {season.endDate}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteSeason(season)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {season.rewards?.length > 0 && (
                    <div className="text-sm text-slate-400">{season.rewards.length} rewards configured</div>
                  )}
                </div>
              ))}
              {seasons.length === 0 && (
                <div className="text-center py-8 text-slate-400">No seasons yet</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="eggs">
            <div className="space-y-6">
              {/* Admin Magic Egg Creator */}
              <div className="bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">🥚✨</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">Admin Magic Egg</h3>
                    <p className="text-slate-400 text-sm">Create unlimited custom creatures with AI</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <Textarea
                    value={adminEggIdea}
                    onChange={(e) => setAdminEggIdea(e.target.value)}
                    placeholder="Describe your creature idea... (e.g., 'A cosmic pizza that shoots cheese stars', 'A friendly cloud robot that rains candy')"
                    className="bg-slate-800/50 border-white/10 text-white min-h-[100px]"
                  />
                  <Button
                    onClick={async () => {
                      if (!adminEggIdea.trim()) {
                        toast.error('Enter a creature idea!');
                        return;
                      }
                      setGeneratingAdminPet(true);
                      try {
                        const result = await base44.integrations.Core.InvokeLLM({
                          prompt: `You are a magical creature designer for a KIDS school gamification app.

Create a magical companion based on: "${adminEggIdea}"

WHAT YOU CAN CREATE:
- Traditional pets, magical creatures, living objects, food creatures, nature spirits, abstract concepts, robots, mythical beings - ANYTHING fun!

CONTENT RULES (FOR CHILDREN):
- Must be appropriate for elementary/middle school kids
- NO violence, weapons, scary monsters, demons, horror
- Keep it cute, fun, positive, school-friendly!

Generate:
- name: Creative 2-3 word name
- description: Fun 1-2 sentence description
- emoji: Single emoji that fits
- rarity: uncommon, rare, or epic
- theme: { primary, secondary, accent, bg } - all valid hex codes`,
                          response_json_schema: {
                            type: "object",
                            properties: {
                              name: { type: "string" },
                              description: { type: "string" },
                              emoji: { type: "string" },
                              rarity: { type: "string", enum: ["uncommon", "rare", "epic"] },
                              theme: {
                                type: "object",
                                properties: {
                                  primary: { type: "string" },
                                  secondary: { type: "string" },
                                  accent: { type: "string" },
                                  bg: { type: "string" }
                                }
                              }
                            }
                          }
                        });

                        // Generate image
                        let imageUrl = '';
                        try {
                          const imgResult = await base44.integrations.Core.GenerateImage({
                            prompt: `Cute cartoon creature for kids game: ${result.name}. ${result.description}. Style: adorable, colorful, Pixar-style, game mascot. Colors: ${result.theme?.primary}, ${result.theme?.secondary}. White background, centered.`
                          });
                          imageUrl = imgResult.url;
                        } catch (e) {
                          console.log('Image generation failed, using emoji');
                        }

                        // Create the pet
                        const newPet = await base44.entities.CustomPet.create({
                          name: result.name,
                          description: result.description,
                          emoji: result.emoji,
                          imageUrl: imageUrl,
                          rarity: result.rarity,
                          xpRequired: 999999,
                          isGiftOnly: true,
                          theme: result.theme
                        });

                        setCustomPets([newPet, ...customPets]);
                        toast.success(`🎉 ${result.name} created!`, {
                          description: 'Pet added to your collection'
                        });
                        setAdminEggIdea('');
                      } catch (e) {
                        toast.error('Magic failed! Try again.');
                      }
                      setGeneratingAdminPet(false);
                    }}
                    disabled={generatingAdminPet}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {generatingAdminPet ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating Magic...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Create Creature with AI
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Existing Magic Eggs */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">User Magic Eggs ({magicEggs.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {magicEggs.map((egg) => {
                    const owner = users.find(u => u.userId === egg.userId);
                    return (
                      <div key={egg.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{egg.isUsed ? '🐣' : '🥚'}</span>
                            <div>
                              <p className="text-white font-medium">{owner?.username || 'Unknown User'}</p>
                              <p className="text-xs text-slate-400">
                                {egg.isUsed ? 'Hatched' : 'Unused'}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await base44.entities.MagicEgg.delete(egg.id);
                              setMagicEggs(magicEggs.filter(e => e.id !== egg.id));
                              toast.success('Egg deleted');
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {magicEggs.length === 0 && (
                    <div className="col-span-full text-center py-8 text-slate-400">No magic eggs yet</div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="space-y-6">
              {/* Create Event */}
              <div className="bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-500/20 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">🫧</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">Create Event</h3>
                    <p className="text-slate-400 text-sm">Launch fun events for students</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Event Name</Label>
                      <Input
                        value={eventForm.name}
                        onChange={(e) => setEventForm({ ...eventForm, name: e.target.value })}
                        placeholder="Bubble Bonanza"
                        className="bg-slate-800/50 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">Event Type</Label>
                      <Select value={eventForm.type} onValueChange={(v) => setEventForm({ ...eventForm, type: v })}>
                        <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bubble_pop">🫧 Bubble Pop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {eventForm.type === 'bubble_pop' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-300">Bubble Count</Label>
                        <Input
                          type="number"
                          value={eventForm.config.bubbleCount}
                          onChange={(e) => setEventForm({ 
                            ...eventForm, 
                            config: { ...eventForm.config, bubbleCount: parseInt(e.target.value) || 15 }
                          })}
                          className="bg-slate-800/50 border-white/10 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-300">Magic Egg Chance (%)</Label>
                        <Input
                          type="number"
                          value={eventForm.config.eggChance}
                          onChange={(e) => setEventForm({ 
                            ...eventForm, 
                            config: { ...eventForm.config, eggChance: parseInt(e.target.value) || 10 }
                          })}
                          className="bg-slate-800/50 border-white/10 text-white"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={async () => {
                      if (!eventForm.name.trim()) {
                        toast.error('Enter an event name!');
                        return;
                      }
                      try {
                        const newEvent = await base44.entities.AdminEvent.create({
                          ...eventForm,
                          isActive: true,
                          startTime: new Date().toISOString()
                        });
                        setEvents([newEvent, ...events]);
                        toast.success(`🎉 ${eventForm.name} is now LIVE!`);
                        setEventForm({
                          name: '', type: 'bubble_pop', isActive: false,
                          config: { bubbleCount: 15, eggChance: 10 }
                        });
                      } catch (e) {
                        toast.error('Failed to create event');
                      }
                    }}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Launch Event
                  </Button>
                </div>
              </div>

              {/* Existing Events */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Events ({events.length})</h3>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">
                            {event.type === 'bubble_pop' ? '🫧' : '🎮'}
                          </span>
                          <div>
                            <h4 className="text-white font-medium flex items-center gap-2">
                              {event.name}
                              {event.isActive && (
                                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded animate-pulse">
                                  LIVE
                                </span>
                              )}
                            </h4>
                            <p className="text-xs text-slate-400">
                              {event.type === 'bubble_pop' && `${event.config?.bubbleCount || 15} bubbles • ${event.config?.eggChance || 10}% egg chance`}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              const newActive = !event.isActive;
                              await base44.entities.AdminEvent.update(event.id, { isActive: newActive });
                              setEvents(events.map(e => e.id === event.id ? { ...e, isActive: newActive } : e));
                              toast.success(newActive ? 'Event activated!' : 'Event stopped');
                            }}
                            className={event.isActive ? "text-red-400 hover:text-red-300" : "text-emerald-400 hover:text-emerald-300"}
                          >
                            {event.isActive ? <X className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await base44.entities.AdminEvent.delete(event.id);
                              setEvents(events.filter(e => e.id !== event.id));
                              toast.success('Event deleted');
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {events.length === 0 && (
                    <div className="text-center py-8 text-slate-400">No events yet</div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="themes">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowThemeForm(true)} className="bg-gradient-to-r from-cyan-500 to-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                New Theme
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customThemes.map((theme) => (
                <div key={theme.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{theme.name}</h3>
                      <p className="text-xs text-slate-400 capitalize">{theme.rarity} • {theme.xpRequired} XP</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteTheme(theme)} className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.primaryColor }} />
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.secondaryColor }} />
                    <div className="w-8 h-8 rounded" style={{ backgroundColor: theme.accentColor }} />
                    <div className="w-8 h-8 rounded border border-slate-600" style={{ backgroundColor: theme.bgColor }} />
                  </div>
                  {theme.description && <p className="text-sm text-slate-500">{theme.description}</p>}
                </div>
              ))}
              {customThemes.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-400">No custom themes yet</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="shop">
            <div className="space-y-6">
              {/* Shop Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Shop Items ({shopItems.length})</h3>
                  <Button onClick={() => setShowShopItemForm(true)} className="bg-gradient-to-r from-purple-500 to-pink-600">
                    <Plus className="w-4 h-4 mr-2" />
                    New Item
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {shopItems.map((item) => (
                    <div key={item.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="text-white font-medium">{item.name}</h4>
                          <p className="text-xs text-slate-400 capitalize">{item.itemType} • {item.price} coins</p>
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditingShopItem(item)} className="text-slate-400 hover:text-white">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await base44.entities.ShopItem.delete(item.id);
                              setShopItems(shopItems.filter(i => i.id !== item.id));
                              toast.success('Item deleted');
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-slate-500 mb-2">{item.description}</p>
                      <div className="flex items-center gap-2 text-xs">
                        {item.isLimited && <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Limited</span>}
                        {!item.isActive && <span className="bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded">Inactive</span>}
                        {item.stockRemaining !== null && <span className="text-slate-400">{item.stockRemaining} left</span>}
                      </div>
                    </div>
                  ))}
                  {shopItems.length === 0 && (
                    <div className="col-span-full text-center py-8 text-slate-400">No shop items yet</div>
                  )}
                </div>
              </div>

              {/* Pack Builders */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Manual Pack Builder */}
                <div className="bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-teal-500/20 rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">📦</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">Manual Pack Builder</h3>
                      <p className="text-slate-400 text-sm">Choose items, image, and settings</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowManualPackForm(true)}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Create Custom Pack
                  </Button>
                </div>

                {/* AI Pack Builder */}
                <div className="bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-500/20 rounded-2xl p-6 border border-white/10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">📦✨</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">AI Pack Builder</h3>
                      <p className="text-slate-400 text-sm">Generate packs with AI in seconds</p>
                    </div>
                  </div>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Describe your pack idea... (e.g., 'Winter Holiday Bundle with snow pets and icy themes', 'Galaxy Pack with cosmic creatures and space themes')"
                    className="bg-slate-800/50 border-white/10 text-white min-h-[100px]"
                    id="packIdea"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      placeholder="Original Price (coins)"
                      className="bg-slate-800/50 border-white/10 text-white"
                      id="packOriginalPrice"
                    />
                    <Input
                      type="number"
                      placeholder="Bundle Price (coins)"
                      className="bg-slate-800/50 border-white/10 text-white"
                      id="packBundlePrice"
                    />
                    <Input
                      type="number"
                      placeholder="Stock Limit (optional)"
                      className="bg-slate-800/50 border-white/10 text-white"
                      id="packStock"
                    />
                    <Input
                      type="datetime-local"
                      placeholder="End Date"
                      className="bg-slate-800/50 border-white/10 text-white"
                      id="packEndDate"
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      const idea = document.getElementById('packIdea').value;
                      const originalPrice = parseInt(document.getElementById('packOriginalPrice').value) || 0;
                      const bundlePrice = parseInt(document.getElementById('packBundlePrice').value) || 0;
                      const stock = parseInt(document.getElementById('packStock').value) || null;
                      const endDate = document.getElementById('packEndDate').value;
                      
                      if (!idea.trim() || !bundlePrice) {
                        toast.error('Enter pack idea and bundle price');
                        return;
                      }
                      
                      const btn = event.target;
                      btn.disabled = true;
                      btn.innerHTML = '<svg class="animate-spin w-4 h-4 mr-2 inline" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Creating Pack...';
                      
                      try {
                        // Generate pack items with AI
                        const result = await base44.integrations.Core.InvokeLLM({
                          prompt: `You are a game designer creating a LIMITED-TIME themed pack for a kids school app.

Pack Theme: "${idea}"

Create 3-5 unique items (pets/themes) that fit this theme:
- Each item needs: name, description, type (pet/theme/title), emoji
- For pets: include theme colors { primary, secondary, accent, bg }
- Keep it school-appropriate and exciting
- Make items feel exclusive and valuable

Generate a pack_name and items array.`,
                          response_json_schema: {
                            type: "object",
                            properties: {
                              pack_name: { type: "string" },
                              pack_description: { type: "string" },
                              items: {
                                type: "array",
                                items: {
                                  type: "object",
                                  properties: {
                                    name: { type: "string" },
                                    description: { type: "string" },
                                    type: { type: "string", enum: ["pet", "theme", "title"] },
                                    emoji: { type: "string" },
                                    theme: {
                                      type: "object",
                                      properties: {
                                        primary: { type: "string" },
                                        secondary: { type: "string" },
                                        accent: { type: "string" },
                                        bg: { type: "string" }
                                      }
                                    },
                                    colors: {
                                      type: "object",
                                      properties: {
                                        primary: { type: "string" },
                                        secondary: { type: "string" },
                                        accent: { type: "string" },
                                        bg: { type: "string" }
                                      }
                                    },
                                    title_text: { type: "string" }
                                  }
                                }
                              }
                            }
                          }
                        });
                        
                        // Create shop items
                        const itemIds = [];
                        for (const item of result.items) {
                          let shopItem;
                          if (item.type === 'pet') {
                            const pet = await base44.entities.CustomPet.create({
                              name: item.name,
                              description: item.description,
                              emoji: item.emoji,
                              rarity: 'epic',
                              xpRequired: 999999,
                              isGiftOnly: true,
                              theme: item.theme
                            });
                            shopItem = await base44.entities.ShopItem.create({
                              name: item.name,
                              description: item.description,
                              itemType: 'pet',
                              itemData: { petId: `custom_${pet.id}` },
                              price: 0,
                              rarity: 'epic',
                              isActive: false
                            });
                            setCustomPets([pet, ...customPets]);
                          } else if (item.type === 'theme') {
                            const theme = await base44.entities.CustomTheme.create({
                              name: item.name,
                              description: item.description,
                              rarity: 'epic',
                              xpRequired: 999999,
                              primaryColor: item.colors?.primary || '#6366f1',
                              secondaryColor: item.colors?.secondary || '#8b5cf6',
                              accentColor: item.colors?.accent || '#f59e0b',
                              bgColor: item.colors?.bg || '#f8fafc'
                            });
                            shopItem = await base44.entities.ShopItem.create({
                              name: item.name,
                              description: item.description,
                              itemType: 'theme',
                              itemData: { themeId: `custom_${theme.id}` },
                              price: 0,
                              rarity: 'epic',
                              isActive: false
                            });
                            setCustomThemes([theme, ...customThemes]);
                          } else {
                            shopItem = await base44.entities.ShopItem.create({
                              name: item.name,
                              description: item.description,
                              itemType: 'title',
                              itemData: { title: item.title_text || item.name },
                              price: 0,
                              rarity: 'rare',
                              isActive: false
                            });
                          }
                          itemIds.push(shopItem.id);
                          setShopItems([shopItem, ...shopItems]);
                        }
                        
                        // Create bundle
                        const bundle = await base44.entities.Bundle.create({
                          name: result.pack_name,
                          description: result.pack_description,
                          itemIds: itemIds,
                          originalPrice: originalPrice,
                          bundlePrice: bundlePrice,
                          discountPercent: Math.round(((originalPrice - bundlePrice) / originalPrice) * 100),
                          isLimited: true,
                          stockLimit: stock,
                          stockRemaining: stock,
                          startDate: new Date().toISOString(),
                          endDate: endDate,
                          isActive: true
                        });
                        
                        setBundles([bundle, ...bundles]);
                        toast.success(`🎉 ${result.pack_name} created with ${result.items.length} items!`);
                        
                        document.getElementById('packIdea').value = '';
                        document.getElementById('packOriginalPrice').value = '';
                        document.getElementById('packBundlePrice').value = '';
                        document.getElementById('packStock').value = '';
                        document.getElementById('packEndDate').value = '';
                      } catch (e) {
                        console.error(e);
                        toast.error('Failed to create pack');
                      }
                      
                      btn.disabled = false;
                      btn.innerHTML = '<svg class="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>Create Pack with AI';
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Create Pack with AI
                  </Button>
                </div>
                </div>
              </div>

              {/* Bundles */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Bundles ({bundles.length})</h3>
                  <Button onClick={() => setShowBundleForm(true)} className="bg-gradient-to-r from-amber-500 to-orange-600">
                    <Plus className="w-4 h-4 mr-2" />
                    New Bundle
                  </Button>
                </div>
                <div className="space-y-3">
                  {bundles.map((bundle) => (
                    <div key={bundle.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-medium flex items-center gap-2">
                            <Package className="w-4 h-4" />
                            {bundle.name}
                            {bundle.isLimited && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Limited</span>}
                            {!bundle.isActive && <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded">Inactive</span>}
                          </h4>
                          <p className="text-xs text-slate-400 mt-1">
                            {bundle.itemIds?.length || 0} items • {bundle.bundlePrice} coins • {bundle.discountPercent}% off
                            {bundle.stockRemaining !== null && ` • ${bundle.stockRemaining} left`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => setEditingBundle(bundle)} className="text-slate-400 hover:text-white">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                              await base44.entities.Bundle.delete(bundle.id);
                              setBundles(bundles.filter(b => b.id !== bundle.id));
                              toast.success('Bundle deleted');
                            }}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {bundles.length === 0 && (
                    <div className="text-center py-8 text-slate-400">No bundles yet</div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Referral-Only Mode Banner */}
              {referralSettings.referralMode && (
                <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <Lock className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white">🔒 Referral-Only Mode Active</h4>
                      <p className="text-sm text-red-200">New users must have a referral link to sign up</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-blue-500/20 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">🔗</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">Referral System</h3>
                    <p className="text-slate-400 text-sm">Configure how referrals work in your app</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg">
                    <input
                      type="checkbox"
                      id="referralMode"
                      checked={referralSettings.referralMode}
                      onChange={(e) => setReferralSettings({ ...referralSettings, referralMode: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="referralMode" className="cursor-pointer text-white">
                      Enable Referral-Only Mode (New users must have a referral link to sign up)
                    </Label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Referrer Reward (XP)</Label>
                      <Input
                        type="number"
                        value={referralSettings.referrerRewardXP}
                        onChange={(e) => setReferralSettings({ ...referralSettings, referrerRewardXP: parseInt(e.target.value) || 0 })}
                        placeholder="XP for person who shared link"
                        className="bg-slate-800/50 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-slate-300">New User Reward (XP)</Label>
                      <Input
                        type="number"
                        value={referralSettings.referredRewardXP}
                        onChange={(e) => setReferralSettings({ ...referralSettings, referredRewardXP: parseInt(e.target.value) || 0 })}
                        placeholder="XP for new user who joins"
                        className="bg-slate-800/50 border-white/10 text-white"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-300">
                    <p className="font-medium mb-2">📋 How it works:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li>Each user gets a unique referral link in their settings</li>
                      <li>When someone signs up with their link, both users earn XP</li>
                      <li>If referral-only mode is ON, new users must use a referral link to sign up</li>
                      <li>If OFF, referral links are optional but still reward XP</li>
                    </ul>
                  </div>

                  <Button
                    onClick={async () => {
                      try {
                        const existingSetting = appSettings.find(s => s.key === 'referral_settings');
                        if (existingSetting) {
                          await base44.entities.AppSetting.update(existingSetting.id, { value: referralSettings });
                          setAppSettings(appSettings.map(s => 
                            s.key === 'referral_settings' ? { ...s, value: referralSettings } : s
                          ));
                        } else {
                          const newSetting = await base44.entities.AppSetting.create({ 
                            key: 'referral_settings', 
                            value: referralSettings 
                          });
                          setAppSettings([...appSettings, newSetting]);
                        }
                        toast.success('Referral settings saved!');
                      } catch (e) {
                        console.error('Failed to save referral settings:', e);
                        toast.error('Failed to save settings');
                      }
                    }}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Referral Settings
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Edit User: {selectedUser?.username}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Set XP */}
              <div className="space-y-2">
                <Label>Set XP</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    value={editXp}
                    onChange={(e) => setEditXp(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                  <Button onClick={handleSetXp} className="bg-amber-600">
                    <Save className="w-4 h-4 mr-1" />
                    Set
                  </Button>
                </div>
              </div>

              {/* Reset PIN */}
              <div className="space-y-2">
                <Label>Reset PIN</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="New 4-digit PIN"
                    maxLength={4}
                    className="bg-slate-700 border-slate-600"
                  />
                  <Button onClick={handleResetPin} className="bg-red-600">
                    <Key className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Assignment Dialog */}
        <Dialog open={showAssignmentForm} onOpenChange={setShowAssignmentForm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Create Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select
                    value={assignmentForm.subject}
                    onValueChange={(v) => setAssignmentForm({ 
                      ...assignmentForm, 
                      subject: v,
                      target: v === 'everyone' ? 'everyone' : ''
                    })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="everyone">Everyone</SelectItem>
                      <SelectItem value="math">Math</SelectItem>
                      <SelectItem value="reading">Reading</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {assignmentForm.subject !== 'everyone' && (
                  <div className="space-y-2">
                    <Label>Teacher</Label>
                    <Select
                      value={assignmentForm.target}
                      onValueChange={(v) => setAssignmentForm({ ...assignmentForm, target: v })}
                    >
                      <SelectTrigger className="bg-slate-700 border-slate-600">
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {(assignmentForm.subject === 'math' ? MATH_TEACHERS : READING_TEACHERS).map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>XP Reward</Label>
                  <Input
                    type="number"
                    value={assignmentForm.xpReward}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, xpReward: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={assignmentForm.dueDate}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowAssignmentForm(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAssignment} className="bg-emerald-600">
                Create Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Pet Dialog */}
        <Dialog open={showPetForm} onOpenChange={setShowPetForm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Create Custom Pet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={petForm.name}
                    onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Rarity</Label>
                  <Select value={petForm.rarity} onValueChange={(v) => setPetForm({ ...petForm, rarity: v })}>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>XP Required {petForm.isGiftOnly && '(ignored)'}</Label>
                  <Input
                    type="number"
                    value={petForm.xpRequired}
                    onChange={(e) => setPetForm({ ...petForm, xpRequired: parseInt(e.target.value) || 0 })}
                    className="bg-slate-700 border-slate-600"
                    disabled={petForm.isGiftOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Emoji (or upload image)</Label>
                  <Input
                    value={petForm.emoji}
                    onChange={(e) => setPetForm({ ...petForm, emoji: e.target.value })}
                    placeholder="🐶"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isGiftOnly"
                  checked={petForm.isGiftOnly}
                  onChange={(e) => setPetForm({ ...petForm, isGiftOnly: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isGiftOnly" className="cursor-pointer">Gift Only (not in global pool)</Label>
              </div>
              <div className="space-y-2">
                <Label>Pet Image</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleGeneratePetImage}
                    disabled={generatingPetImage}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    {generatingPetImage ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4 mr-2" />
                    )}
                    AI Generate
                  </Button>
                  <span className="text-slate-400 text-sm">or</span>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="bg-slate-700 border-slate-600 flex-1"
                  />
                </div>
                {petForm.imageUrl && (
                  <div className="flex items-center gap-3 mt-2">
                    <img src={petForm.imageUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover shadow-lg" />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setPetForm({ ...petForm, imageUrl: '' })}
                      className="text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={petForm.description}
                  onChange={(e) => setPetForm({ ...petForm, description: e.target.value })}
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              
              {/* Theme Colors */}
              <div className="space-y-2">
                <Label>Pet Theme Colors</Label>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <Label className="text-xs text-slate-400">Primary</Label>
                    <Input
                      type="color"
                      value={petForm.theme?.primary || '#6366f1'}
                      onChange={(e) => setPetForm({ ...petForm, theme: { ...petForm.theme, primary: e.target.value } })}
                      className="h-10 bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Secondary</Label>
                    <Input
                      type="color"
                      value={petForm.theme?.secondary || '#a855f7'}
                      onChange={(e) => setPetForm({ ...petForm, theme: { ...petForm.theme, secondary: e.target.value } })}
                      className="h-10 bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Accent</Label>
                    <Input
                      type="color"
                      value={petForm.theme?.accent || '#f59e0b'}
                      onChange={(e) => setPetForm({ ...petForm, theme: { ...petForm.theme, accent: e.target.value } })}
                      className="h-10 bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-400">Background</Label>
                    <Input
                      type="color"
                      value={petForm.theme?.bg || '#f8fafc'}
                      onChange={(e) => setPetForm({ ...petForm, theme: { ...petForm.theme, bg: e.target.value } })}
                      className="h-10 bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowPetForm(false)}>Cancel</Button>
              <Button onClick={handleCreatePet} className="bg-purple-600">Create Pet</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Gift Dialog */}
        <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Gift Item to {giftUser?.username}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Gift Type</Label>
                <Select value={giftType} onValueChange={(v) => { setGiftType(v); setGiftItemId(''); }}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coins">Quest Coins</SelectItem>
                    <SelectItem value="pet">Pet</SelectItem>
                    <SelectItem value="theme">Theme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {giftType === 'coins' && (
                <div className="space-y-2">
                  <Label>Amount of Quest Coins</Label>
                  <Input
                    type="number"
                    value={giftItemId}
                    onChange={(e) => setGiftItemId(e.target.value)}
                    placeholder="100"
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              )}
              
              {giftType !== 'coins' && (
                <div className="space-y-2">
                  <Label>Select {giftType === 'pet' ? 'Pet' : 'Theme'}</Label>
                  <Select value={giftItemId} onValueChange={setGiftItemId}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue placeholder={`Select a ${giftType}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {giftType === 'pet' ? (
                      <>
                        {PETS.map(pet => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {pet.emoji || '🎁'} {pet.name} (Built-in)
                          </SelectItem>
                        ))}
                        {customPets.map(pet => (
                          <SelectItem key={pet.id} value={`custom_${pet.id}`}>
                            {pet.emoji || '🎁'} {pet.name} (Custom)
                          </SelectItem>
                        ))}
                      </>
                    ) : (
                      <>
                        {THEMES.map(theme => (
                          <SelectItem key={theme.id} value={theme.id}>
                            {theme.name} (Built-in)
                          </SelectItem>
                        ))}
                        {customThemes.map(theme => (
                          <SelectItem key={theme.id} value={`custom_${theme.id}`}>
                            {theme.name} (Custom)
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!giftUser) return;
                    const allPetIds = [...PETS.map(p => p.id), ...customPets.map(p => `custom_${p.id}`)];
                    await base44.entities.UserProfile.update(giftUser.id, { unlockedPets: allPetIds });
                    setUsers(users.map(u => u.id === giftUser.id ? { ...u, unlockedPets: allPetIds } : u));
                    toast.success(`All pets gifted to ${giftUser.username}!`);
                  }}
                  className="flex-1 border-purple-500 text-purple-400 hover:bg-purple-500/20"
                >
                  Gift ALL Pets
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    if (!giftUser) return;
                    const allThemeIds = [...THEMES.map(t => t.id), ...customThemes.map(t => `custom_${t.id}`)];
                    await base44.entities.UserProfile.update(giftUser.id, { unlockedThemes: allThemeIds });
                    setUsers(users.map(u => u.id === giftUser.id ? { ...u, unlockedThemes: allThemeIds } : u));
                    toast.success(`All themes gifted to ${giftUser.username}!`);
                  }}
                  className="flex-1 border-cyan-500 text-cyan-400 hover:bg-cyan-500/20"
                >
                  Gift ALL Themes
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  if (!giftUser) return;
                  await base44.entities.MagicEgg.create({ userId: giftUser.userId });
                  toast.success(`🥚 Magic Egg gifted to ${giftUser.username}!`, {
                    description: 'They can now create their own custom pet!'
                  });
                }}
                className="w-full border-amber-500 text-amber-400 hover:bg-amber-500/20"
              >
                🥚 Gift Magic Egg
              </Button>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowGiftDialog(false)}>Cancel</Button>
              <Button onClick={handleGiftItem} className="bg-purple-600">Gift Item</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Assignment Dialog */}
        <Dialog open={!!editingAssignment} onOpenChange={() => setEditingAssignment(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Edit Assignment</DialogTitle>
            </DialogHeader>
            {editingAssignment && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={editingAssignment.title}
                    onChange={(e) => setEditingAssignment({ ...editingAssignment, title: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editingAssignment.description || ''}
                    onChange={(e) => setEditingAssignment({ ...editingAssignment, description: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>XP Reward</Label>
                    <Input
                      type="number"
                      value={editingAssignment.xpReward || 25}
                      onChange={(e) => setEditingAssignment({ ...editingAssignment, xpReward: parseInt(e.target.value) || 0 })}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input
                      type="date"
                      value={editingAssignment.dueDate || ''}
                      onChange={(e) => setEditingAssignment({ ...editingAssignment, dueDate: e.target.value })}
                      className="bg-slate-700 border-slate-600"
                    />
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditingAssignment(null)}>Cancel</Button>
              <Button onClick={handleUpdateAssignment} className="bg-emerald-600">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Season Form Dialog */}
        <Dialog open={showSeasonForm} onOpenChange={setShowSeasonForm}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Season</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Season Name</Label>
                <Input
                  value={seasonForm.name}
                  onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })}
                  placeholder="Spring 2024"
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={seasonForm.startDate}
                    onChange={(e) => setSeasonForm({ ...seasonForm, startDate: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={seasonForm.endDate}
                    onChange={(e) => setSeasonForm({ ...seasonForm, endDate: e.target.value })}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Season Rewards</Label>
                  <Button size="sm" onClick={addSeasonReward} className="bg-amber-600">
                    <Plus className="w-3 h-3 mr-1" /> Add Reward
                  </Button>
                </div>
                <div className="space-y-3">
                  {seasonForm.rewards.map((reward, index) => (
                    <div key={index} className="bg-slate-700 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-300">Reward {index + 1}</span>
                        <Button size="sm" variant="ghost" onClick={() => removeSeasonReward(index)} className="text-red-400 h-6 px-2">
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Name"
                          value={reward.name}
                          onChange={(e) => updateSeasonReward(index, 'name', e.target.value)}
                          className="bg-slate-600 border-slate-500 text-sm"
                        />
                        <Input
                          type="number"
                          placeholder="XP Required"
                          value={reward.xpRequired}
                          onChange={(e) => updateSeasonReward(index, 'xpRequired', parseInt(e.target.value) || 0)}
                          className="bg-slate-600 border-slate-500 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Select value={reward.type} onValueChange={(v) => updateSeasonReward(index, 'type', v)}>
                          <SelectTrigger className="bg-slate-600 border-slate-500 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pet">Pet</SelectItem>
                            <SelectItem value="theme">Theme</SelectItem>
                            <SelectItem value="title">Title</SelectItem>
                          </SelectContent>
                        </Select>
                        {reward.type === 'pet' ? (
                          <Select value={reward.value} onValueChange={(v) => updateSeasonReward(index, 'value', v)}>
                            <SelectTrigger className="bg-slate-600 border-slate-500 text-sm">
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
                        ) : reward.type === 'theme' ? (
                          <Select value={reward.value} onValueChange={(v) => updateSeasonReward(index, 'value', v)}>
                            <SelectTrigger className="bg-slate-600 border-slate-500 text-sm">
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
                        ) : (
                          <Input
                            placeholder="Title text"
                            value={reward.value}
                            onChange={(e) => updateSeasonReward(index, 'value', e.target.value)}
                            className="bg-slate-600 border-slate-500 text-sm"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {seasonForm.rewards.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-2">No rewards added yet</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowSeasonForm(false)}>Cancel</Button>
              <Button onClick={handleCreateSeason} className="bg-amber-600">Create Season</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                      <SelectItem value="magic_egg">Magic Egg</SelectItem>
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