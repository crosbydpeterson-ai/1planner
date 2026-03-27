import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ArrowLeft, Search, Users, ClipboardList, Plus, 
  Lock, Unlock, Eye, EyeOff, Key, Check, X, Edit2, Save,
  Palette, Star, Trash2, Gift, Sparkles, Wand2, Loader2, ShoppingBag, Ban
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
import IdeaGeneratorPanel from '@/components/admin/IdeaGeneratorPanel';
import BansAndFlagsPanel from '@/components/admin/BansAndFlagsPanel';
import EconomyCharts from '@/components/admin/EconomyCharts';
import AdminEmailBroadcast from '@/components/admin/AdminEmailBroadcast';
import DailyRewardsSettings from '@/components/admin/DailyRewardsSettings';
import BoothSkinManager from '@/components/admin/BoothSkinManager';
import SuperAssignmentCreator from '@/components/admin/super/SuperAssignmentCreator';
import SuperAssignmentsAnalytics from '@/components/admin/super/SuperAssignmentsAnalytics';
import PetEditorDialog from '@/components/pets/PetEditorDialog';
import RolesManager from '@/components/admin/RolesManager';
import GlobalEventManager from '@/components/admin/GlobalEventManager';
import NewThemeDialog from '@/components/admin/NewThemeDialog';
import AnnouncementManager from '@/components/admin/AnnouncementManager';
import RewardLinkFormDialog from '@/components/admin/RewardLinkFormDialog';
import CosmeticFormDialog from '@/components/admin/CosmeticFormDialog';
import ManualPackDialog from '@/components/admin/ManualPackDialog';
import BundleFormDialog from '@/components/admin/BundleFormDialog';
import EditBundleDialog from '@/components/admin/EditBundleDialog';
import EditShopItemDialog from '@/components/admin/EditShopItemDialog';

const ADMIN_PASSWORD = 'Crosby110!';

export default function Admin() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(false);
  const [adminProfile, setAdminProfile] = useState(null);
  const [isAdminRole, setIsAdminRole] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [permissions, setPermissions] = useState({ accessAI: false, deleteAssets: false, grantAdminTokens: false, toggleAdminRole: false, manageLocks: false, banFlagUsers: false, manageShop: false, manageEvents: false, viewAnalytics: false, manageAssignments: false, manageSuperAssignments: false, managePets: false, manageThemes: false, manageCosmetics: false });
  const can = (key) => isSuperAdmin || !!permissions[key];
  
  const [users, setUsers] = useState([]);
  const [showForceTrade, setShowForceTrade] = useState(false);
  const [ftFrom, setFtFrom] = useState('');
  const [ftTo, setFtTo] = useState('');
  const [ftType, setFtType] = useState('pet');
  const [ftItemId, setFtItemId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editXp, setEditXp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', subject: 'everyone', target: 'everyone', xpReward: 10, dueDate: '' });
  const [customPets, setCustomPets] = useState([]);
  const [editingPet, setEditingPet] = useState(null);
  const [customThemes, setCustomThemes] = useState([]);
  const [petCosmetics, setPetCosmetics] = useState([]);
  const [boothSkins, setBoothSkins] = useState([]);
  const [showPetForm, setShowPetForm] = useState(false);
  const [showThemeForm, setShowThemeForm] = useState(false);
  const [showCosmeticForm, setShowCosmeticForm] = useState(false);
  const [petForm, setPetForm] = useState({ name: '', rarity: 'common', xpRequired: 0, description: '', emoji: '', imageUrl: '', isGiftOnly: false, theme: { primary: '#6366f1', secondary: '#a855f7', accent: '#f59e0b', bg: '#f8fafc' } });
  const [generatingPetImage, setGeneratingPetImage] = useState(false);
  const [themeForm, setThemeForm] = useState({ name: '', rarity: 'common', xpRequired: 0, description: '', primaryColor: '#6366f1', secondaryColor: '#8b5cf6', accentColor: '#f59e0b', bgColor: '#f8fafc' });
  const [cosmeticForm, setCosmeticForm] = useState({ name: '', description: '', cosmeticType: 'hat', imageUrl: '', price: 50, rarity: 'common', isLimited: false, isActive: true });
  const [showGiftDialog, setShowGiftDialog] = useState(false);
  const [giftUser, setGiftUser] = useState(null);
  const [giftUsername, setGiftUsername] = useState('');
  const [giftType, setGiftType] = useState('pet');
  const [giftItemId, setGiftItemId] = useState('');
  const [seasons, setSeasons] = useState([]);
  const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [seasonForm, setSeasonForm] = useState({ name: '', startDate: '', endDate: '', isActive: true, rewards: [] });
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
  const [adminReferralLinks, setAdminReferralLinks] = useState([]);
  const [newLinkMaxUses, setNewLinkMaxUses] = useState(10);

  // Reward Links
  const [rewardLinks, setRewardLinks] = useState([]);
  const [showRewardLinkForm, setShowRewardLinkForm] = useState(false);
  const [rewardLinkForm, setRewardLinkForm] = useState({
    name: '',
    rewardType: 'xp',
    rewardValue: 100,
    rewardData: {},
    maxUses: 10,
    usedBy: [],
    expiresAt: '',
    isActive: true
  });

  const defaultFeatureLocks = {
    global: { shop: false, market: false, battlePass: false, pets: false, xpGain: false },
    classes: { math: {}, reading: {} },
    users: {}
  };
  const [featureLocks, setFeatureLocks] = useState(defaultFeatureLocks);
  const [lockSubject, setLockSubject] = useState('math');
  const [lockTeacher, setLockTeacher] = useState('');
  const [lockUserId, setLockUserId] = useState('');

  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Reflect cosmetic position updates live in Admin users list
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsubscribe = base44.entities.UserProfile.subscribe((event) => {
      if (event.type === 'update') {
        setUsers(prev => prev.map(u => u.id === event.id ? { ...u, ...event.data } : u));
      }
    });
    return unsubscribe;
  }, [isAuthenticated]);

  const checkAdminAccess = async () => {
    // First check if user is logged in and is admin
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) {
      setLoading(false);
      return;
    }

    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0) {
        navigate(createPageUrl('Dashboard'));
        return;
      }
      
      const currentProfile = profiles[0];
      
      // Role-based access
      const username = (currentProfile.username || '').toLowerCase();
      const superByName = username === 'crosby';
      const role = currentProfile.rank || (superByName ? 'super_admin' : 'user');
      const hasCustomRole = Array.isArray(currentProfile.assignedRoleIds) && currentProfile.assignedRoleIds.length > 0;
      const allow = role === 'admin' || role === 'super_admin' || superByName || hasCustomRole;
      if (!allow) {
        navigate(createPageUrl('Dashboard'));
        return;
      }
      setIsSuperAdmin(superByName || role === 'super_admin');
      setIsAdminRole(true);
      setAdminProfile(currentProfile);

      // Load permissions from assigned roles (super admin = all)
      const basePerms = {
        accessAI: false,
        deleteAssets: false,
        grantAdminTokens: false,
        toggleAdminRole: false,
        manageLocks: false,
        banFlagUsers: false,
        manageShop: false,
        manageEvents: false,
        viewAnalytics: false,
        manageAssignments: false,
        manageSuperAssignments: false,
        managePets: false,
        manageThemes: false,
        manageCosmetics: false,
      };
      if (superByName || role === 'super_admin') {
        const allTrue = Object.fromEntries(Object.keys(basePerms).map(k => [k, true]));
        setPermissions(allTrue);
      } else if (Array.isArray(currentProfile.assignedRoleIds) && currentProfile.assignedRoleIds.length > 0) {
        try {
          const allRoles = await base44.entities.Role.list();
          const myRoles = allRoles.filter(r => currentProfile.assignedRoleIds.includes(r.id));
          const merged = { ...basePerms };
          myRoles.forEach(r => {
            const p = r.permissions || {};
            Object.keys(merged).forEach(k => { merged[k] = merged[k] || !!p[k]; });
          });
          setPermissions(merged);
        } catch (e) {
          console.error('Failed loading roles', e);
          setPermissions(basePerms);
        }
      } else {
        setPermissions(basePerms);
      }
      
      // Auto-authenticate super admins; otherwise respect stored auth
      const adminAuth = localStorage.getItem('quest_admin_auth');
      if (superByName || role === 'super_admin') {
        setIsAuthenticated(true);
        localStorage.setItem('quest_admin_auth', 'true');
        loadData();
      } else if (adminAuth === 'true') {
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
    const ok = adminPin === ADMIN_PASSWORD || (adminProfile?.adminPanelPassword && adminPin === adminProfile.adminPanelPassword);
    if (ok) {
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
      const [allUsers, allAssignments, allPets, allThemes, allSeasons, allEggs, allEvents, allSettings, allShopItems, allBundles, allReferralLinks, allRewardLinks, allCosmetics] = await Promise.all([
        base44.entities.UserProfile.list('-created_date'),
        base44.entities.Assignment.list('-created_date'),
        base44.entities.CustomPet.list('-created_date'),
        base44.entities.CustomTheme.list('-created_date'),
        base44.entities.Season.list('-created_date'),
        base44.entities.MagicEgg.list('-created_date'),
        base44.entities.AdminEvent.list('-created_date'),
        base44.entities.AppSetting.list(),
        base44.entities.ShopItem.list('-created_date'),
        base44.entities.Bundle.list('-created_date'),
        base44.entities.ReferralLink.list('-created_date'),
        base44.entities.RewardLink.list('-created_date'),
        base44.entities.PetCosmetic.list('-created_date')
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
      setAdminReferralLinks(allReferralLinks.filter(link => link.isAdminLink));
      setRewardLinks(allRewardLinks);
      setPetCosmetics(allCosmetics);
      const allBoothSkins = await base44.entities.BoothSkin.list('-created_date');
      setBoothSkins(allBoothSkins);
      const refSetting = allSettings.find(s => s.key === 'referral_settings');
      if (refSetting) {
        setReferralSettings(refSetting.value);
      }
      const locksSetting = allSettings.find(s => s.key === 'feature_locks');
      if (locksSetting) {
        setFeatureLocks(locksSetting.value || defaultFeatureLocks);
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

  const saveFeatureLocks = async () => {
    try {
      const existingSetting = appSettings.find(s => s.key === 'feature_locks');
      if (existingSetting) {
        await base44.entities.AppSetting.update(existingSetting.id, { value: featureLocks });
        setAppSettings(appSettings.map(s => s.key === 'feature_locks' ? { ...s, value: featureLocks } : s));
      } else {
        const newSetting = await base44.entities.AppSetting.create({ key: 'feature_locks', value: featureLocks });
        setAppSettings([...appSettings, newSetting]);
      }
      toast.success('Locks saved!');
    } catch (e) {
      toast.error('Failed to save locks');
    }
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
      setAssignments((prevAssignments) => [newAssignment, ...prevAssignments]);
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
      const imageSource = petForm.imageUrl ? (petForm.imageUrl.startsWith('data:') ? 'uploaded' : 'ai_generated') : 'emoji_only';
      const createPayload = {
        ...petForm,
        createdBy: adminProfile?.userId || 'admin',
        createdByProfileId: adminProfile?.id,
        createdSourceTab: 'admin_pets',
        imageSource
      };
      const newPet = await base44.entities.CustomPet.create(createPayload);
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

  const resolveGiftRecipient = () => {
    if (giftUser) {
      return giftUser;
    }

    const username = giftUsername.trim();
    if (!username) {
      toast.error('Please select a user');
      return null;
    }

    const matchedUser = users.find(
      (user) => user.username?.toLowerCase() === username.toLowerCase()
    );

    if (!matchedUser) {
      toast.error(`User "${username}" not found`);
      return null;
    }

    setGiftUser(matchedUser);
    return matchedUser;
  };

  const handleGiftItem = async () => {
    const recipient = resolveGiftRecipient();
    if (!recipient || !giftItemId) {
        toast.error('Please enter an amount or select an item');
        return;
      }
      // Admin-only gifting constraints
      if (!isSuperAdmin) {
        const today = new Date().toDateString();
        let lastDate = adminProfile?.lastGiftDate || '';
        let dailyCount = adminProfile?.dailyGiftCount || 0;
        // Reset daily counter if day changed
        if (lastDate !== today) {
          dailyCount = 0;
          lastDate = today;
          await base44.entities.UserProfile.update(adminProfile.id, { dailyGiftCount: dailyCount, lastGiftDate: today });
          setAdminProfile({ ...adminProfile, dailyGiftCount: dailyCount, lastGiftDate: today });
        }
        if (dailyCount >= 50) {
          toast.error('Daily gift limit reached (50). Ask super admin for more.');
          return;
        }
        if ((adminProfile?.adminTokens || 0) <= 0) {
          toast.error('No admin tokens left. Ask super admin.');
          return;
        }
        if ((adminProfile?.questCoins || 0) < 25) {
          toast.error('Not enough Quest Coins (need 25).');
          return;
        }
      }
      try {
      if (giftType === 'coins') {
        const amount = parseInt(giftItemId);
        if (isNaN(amount) || amount <= 0) {
          toast.error('Please enter a valid amount');
          return;
        }
        const newCoins = (recipient.questCoins || 0) + amount;
        await base44.entities.UserProfile.update(recipient.id, { questCoins: newCoins });
        setUsers(users.map(u => u.id === recipient.id ? { ...u, questCoins: newCoins } : u));
        toast.success(`${amount} Quest Coins gifted to ${recipient.username}!`);
      } else if (giftType === 'pet') {
        const unlockedPets = [...(recipient.unlockedPets || [])];
        if (!unlockedPets.includes(giftItemId)) {
          unlockedPets.push(giftItemId);
          await base44.entities.UserProfile.update(recipient.id, { unlockedPets });
          setUsers(users.map(u => u.id === recipient.id ? { ...u, unlockedPets } : u));
        }
        toast.success(`Pet gifted to ${recipient.username}!`);
      } else if (giftType === 'theme') {
        const unlockedThemes = [...(recipient.unlockedThemes || [])];
        if (!unlockedThemes.includes(giftItemId)) {
          unlockedThemes.push(giftItemId);
          await base44.entities.UserProfile.update(recipient.id, { unlockedThemes });
          setUsers(users.map(u => u.id === recipient.id ? { ...u, unlockedThemes } : u));
        }
        toast.success(`Theme gifted to ${recipient.username}!`);
      } else if (giftType === 'cosmetic') {
        const unlockedCosmetics = [...(recipient.unlockedCosmetics || [])];
        if (!unlockedCosmetics.includes(giftItemId)) {
          unlockedCosmetics.push(giftItemId);
          await base44.entities.UserProfile.update(recipient.id, { unlockedCosmetics });
          setUsers(users.map(u => u.id === recipient.id ? { ...u, unlockedCosmetics } : u));
        }
        toast.success(`Cosmetic gifted to ${recipient.username}!`);
      }
      // Deduct admin costs (only for admins)
      if (!isSuperAdmin) {
        const newCoins = (adminProfile?.questCoins || 0) - 25;
        const newTokens = (adminProfile?.adminTokens || 0) - 1;
        const today2 = new Date().toDateString();
        const newDaily = ((adminProfile?.dailyGiftCount || 0) + 1);
        await base44.entities.UserProfile.update(adminProfile.id, {
          questCoins: newCoins,
          adminTokens: newTokens,
          dailyGiftCount: newDaily,
          lastGiftDate: today2
        });
        setAdminProfile({
          ...adminProfile,
          questCoins: newCoins,
          adminTokens: newTokens,
          dailyGiftCount: newDaily,
          lastGiftDate: today2
        });
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-xl"><Shield className="w-8 h-8 text-white" /></div>
            <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
            <p className="text-slate-400 mt-2">Enter admin password to continue</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 space-y-4">
            <div className="space-y-2"><Label className="text-slate-300">Admin Password</Label><Input type="password" value={adminPin} onChange={(e) => setAdminPin(e.target.value)} placeholder="Enter password..." onKeyDown={(e) => e.key === 'Enter' && handleAdminLogin()} className="h-12 bg-slate-700 border-slate-600 text-white" /></div>
            <Button onClick={handleAdminLogin} className="w-full h-12 bg-gradient-to-r from-red-500 to-orange-600">Access Admin Panel</Button>
          </div>
          <div className="text-center mt-4"><Link to={createPageUrl('Dashboard')} className="text-slate-400 hover:text-white text-sm">← Back to Dashboard</Link></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {isSuperAdmin && <AdminChatWidget />}
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
                <p className="text-sm text-slate-400">Manage users, assets, AI tools</p>
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
            {can('manageAssignments') && (
              <TabsTrigger value="assignments" className="data-[state=active]:bg-slate-700">
                <ClipboardList className="w-4 h-4 mr-2" />
                Assignments ({assignments.length})
              </TabsTrigger>
            )}
            {can('managePets') && (
              <TabsTrigger value="pets" className="data-[state=active]:bg-slate-700">
                <Star className="w-4 h-4 mr-2" />
                Pets ({customPets.length})
              </TabsTrigger>
            )}
            {can('manageThemes') && (
              <TabsTrigger value="themes" className="data-[state=active]:bg-slate-700">
                <Palette className="w-4 h-4 mr-2" />
                Themes ({customThemes.length})
              </TabsTrigger>
            )}
            {can('manageCosmetics') && (
              <TabsTrigger value="cosmetics" className="data-[state=active]:bg-slate-700">
                👒
                Cosmetics ({petCosmetics.length})
              </TabsTrigger>
            )}
            {can('accessAI') && (
              <TabsTrigger value="ai" className="data-[state=active]:bg-slate-700">
                ✨
                AI Tools
              </TabsTrigger>
            )}
            <TabsTrigger value="seasons" className="data-[state=active]:bg-slate-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Seasons ({seasons.length})
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="eggs" className="data-[state=active]:bg-slate-700">
                🥚
                Magic Eggs
              </TabsTrigger>
            )}
            {can('manageEvents') && (
              <TabsTrigger value="events" className="data-[state=active]:bg-slate-700">
                🫧
                Events
              </TabsTrigger>
            )}
            {can('manageShop') && (
              <TabsTrigger value="shop" className="data-[state=active]:bg-slate-700">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Shop
              </TabsTrigger>
            )}
             {can('viewAnalytics') && (
               <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">
                 📊
                 Analytics
               </TabsTrigger>
             )}
             <TabsTrigger value="email" className="data-[state=active]:bg-slate-700">
               ✉️
               Email
             </TabsTrigger>
             {(isSuperAdmin || permissions.toggleAdminRole) && (
               <TabsTrigger value="roles" className="data-[state=active]:bg-slate-700">
                 <Shield className="w-4 h-4 mr-2" />
                 Roles
               </TabsTrigger>
             )}
             {(isSuperAdmin || can('manageSuperAssignments')) && (
              <TabsTrigger value="super_assignments" className="data-[state=active]:bg-slate-700">
                ⭐
                Super Assignments
              </TabsTrigger>
            )}
             {(isSuperAdmin || can('manageLocks')) && (
              <TabsTrigger value="locks" className="data-[state=active]:bg-slate-700">
                <Lock className="w-4 h-4 mr-2" />
                Locks
              </TabsTrigger>
            )}
            {(isSuperAdmin || can('banFlagUsers')) && (
              <TabsTrigger value="bans_flags" className="data-[state=active]:bg-slate-700">
                <Ban className="w-4 h-4 mr-2" />
                Bans & Flags
              </TabsTrigger>
            )}
            <TabsTrigger value="updates" className="data-[state=active]:bg-slate-700">📢 Updates</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700">⚙️ Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="updates">
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700"><AnnouncementManager /></div>
          </TabsContent>

          <TabsContent value="users">
            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search users..."
                  className="pl-10 bg-slate-800 border-slate-700 text-white w-full"
                />
              </div>
              {isSuperAdmin && (
                <Button onClick={() => setShowForceTrade(true)} className="bg-red-600">Force Trade</Button>
              )}
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
                        <PetAvatar petId={user.equippedPetId} cosmeticIds={user.equippedCosmetics || []} cosmeticPositions={user.cosmeticPositions || {}} size="sm" />
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
                          {isSuperAdmin && (
                           <Button
                             size="sm"
                             variant="ghost"
                             onClick={() => {
                               localStorage.setItem('quest_profile_id', user.id);
                               navigate(createPageUrl('Dashboard'));
                             }}
                             className="text-emerald-400 hover:text-emerald-300"
                             title="Switch to this user"
                           >
                             Switch
                           </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setGiftUser(user);
                              setGiftUsername(user.username || '');
                              setShowGiftDialog(true);
                            }}
                            className="text-purple-400 hover:text-purple-300"
                            title="Gift Items/Coins"
                          >
                            <Gift className="w-4 h-4" />
                          </Button>
                          {(isSuperAdmin || permissions.grantAdminTokens) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                const add = 10;
                                const newTokens = (user.adminTokens || 0) + add;
                                await base44.entities.UserProfile.update(user.id, { adminTokens: newTokens });
                                setUsers(users.map(u => u.id === user.id ? { ...u, adminTokens: newTokens } : u));
                                toast.success(`Granted ${add} admin tokens to ${user.username}`);
                              }}
                              className="text-emerald-400 hover:text-emerald-300"
                              title="Grant 10 Admin Tokens"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          )}
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
                          {(isSuperAdmin || permissions.toggleAdminRole) && (user.username?.toLowerCase() !== 'crosby') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={async () => {
                                const newRank = user.rank === 'admin' ? 'user' : 'admin';
                                await base44.entities.UserProfile.update(user.id, { rank: newRank });
                                setUsers(users.map(u => u.id === user.id ? { ...u, rank: newRank } : u));
                                toast.success(newRank === 'admin' ? `${user.username} is now ADMIN` : `Admin removed from ${user.username}`);
                              }}
                              className="text-emerald-400 hover:text-emerald-300"
                              title="Toggle Admin"
                            >
                              <Shield className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="assignments">
            <div className="mb-4">
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-4">
                <h3 className="text-white font-semibold mb-2">Super Assignments</h3>
                <p className="text-slate-400 text-sm mb-3">Create polls, short answers, or suggestion boxes.</p>
                <div className="mt-2">
                  <SuperAssignmentCreator />
                </div>
              </div>
            </div>
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
              {assignments.map((a) => {
                const creator = a.created_by ? users.find(u => u.userId === a.created_by) : null;
                return (
                <div key={a.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white flex items-center gap-2 flex-wrap">
                      {a.title}
                      {!a.isApproved && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Pending</span>}
                      {a.isFlagged && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">🚩 Flagged</span>}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {a.subject === 'everyone' ? 'All Students' : `${a.subject}: ${a.target}`}
                      {a.xpReward && ` • ${a.xpReward} XP`}
                      {a.dueDate && ` • Due: ${a.dueDate}`}
                      {` • By: ${creator?.username || a.created_by || 'Unknown'}`}
                    </p>
                    {a.isFlagged && a.flagReason && <p className="text-xs text-red-400 mt-1">Reason: {a.flagReason}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {a.isFlagged && <Button size="sm" onClick={async () => { await base44.entities.Assignment.update(a.id, { isFlagged: false, flagReason: null }); setAssignments(assignments.map(x => x.id === a.id ? { ...x, isFlagged: false, flagReason: null } : x)); toast.success('Flag cleared'); }} className="bg-emerald-600 hover:bg-emerald-700"><Check className="w-4 h-4 mr-1" />Clear</Button>}
                    {!a.isApproved && can('manageAssignments') && <Button size="sm" onClick={() => handleApproveAssignment(a)} className="bg-emerald-600 hover:bg-emerald-700"><Check className="w-4 h-4 mr-1" />Approve</Button>}
                    <Button size="sm" variant="ghost" onClick={() => setEditingAssignment({ ...a })} className="text-slate-400 hover:text-white"><Edit2 className="w-4 h-4" /></Button>
                    {(isSuperAdmin || permissions.deleteAssets || can('manageAssignments')) && <Button size="sm" variant="ghost" onClick={() => handleDeleteAssignment(a)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button>}
                  </div>
                </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="ai">
            <div className="space-y-6">
              <BulkPetCreatorPanel />
              <CosmeticGeneratorPanel />
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
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditingPet(pet)} className="text-slate-400 hover:text-white">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {(isSuperAdmin || permissions.deleteAssets) && (
                        <Button size="sm" variant="ghost" onClick={() => handleDeletePet(pet)} className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {pet.description && <p className="text-sm text-slate-500">{pet.description}</p>}
                  <p className="text-xs text-slate-500 mt-1">
                    By: {pet.createdBy || '—'} • {pet.created_date ? new Date(pet.created_date).toLocaleString() : '—'} • How: {pet.imageSource || '—'} • Tab: {pet.createdSourceTab || '—'}
                  </p>
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
                    {isSuperAdmin && (
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteSeason(season)} className="text-red-400 hover:text-red-300">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
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

          {isSuperAdmin ? (
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
                          prompt: `You are a creative designer for a school-safe game. Follow the idea closely and choose a style that fits the concept (it can be cute, serious, spooky-but-safe, sci‑fi, abstract, realistic, etc.).

                          Design based on: "${adminEggIdea}"

                          WHAT YOU CAN CREATE (broad, pick what fits the idea):
                          - Creatures, characters, companions, robots, artifacts, tools, vehicles, locations, nature spirits, living objects, abstract symbols, mythical beings, and more.

                          CONTENT GUIDELINES (school-appropriate):
                          - Must be appropriate for elementary/middle school students
                          - Avoid gore/graphic violence and explicit content
                          - Tone can vary (not required to be cute) as long as it remains school-friendly

                          Generate:
                          - name: Creative 2–3 word name
                          - description: 1–2 sentence description that matches the idea and chosen style
                          - emoji: A single fitting emoji (or best approximation)
                          - rarity: uncommon, rare, or epic
                          - theme: { primary, secondary, accent, bg } — valid hex colors that suit the concept`,
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
                              prompt: `School-safe illustration aligned to the concept (not required to be cute). Subject: ${result.name}. ${result.description}. Style: choose a fitting genre (e.g., sci‑fi, minimal, abstract, realistic, whimsical) based on the idea; high quality; cohesive with theme. Colors: ${result.theme?.primary}, ${result.theme?.secondary}, ${result.theme?.accent}. Background: white or transparent, centered, no text.`
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
                            theme: result.theme,
                            createdBy: adminProfile?.userId || 'admin',
                            createdByProfileId: adminProfile?.id,
                            createdSourceTab: 'admin_eggs',
                            imageSource: imageUrl ? 'ai_generated' : 'emoji_only'
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
                                <p className="text-xs text-slate-400">{egg.isUsed ? 'Hatched' : 'Unused'}{egg.source ? ` • ${egg.source.replace(/_/g, ' ')}` : ''}{egg.giftedBy ? ` • gifted by ${(users.find(u => u.userId === egg.giftedBy))?.username || egg.giftedBy}` : ''}{egg.hatchedByUsername ? ` • hatched by ${egg.hatchedByUsername}` : ''}</p>
                              </div>
                            </div>
                            {(isSuperAdmin || permissions.deleteAssets) && (
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
                            )}
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
          ) : null}

          <TabsContent value="events">
            <div className="space-y-6">
              <GlobalEventManager />
              <hr className="border-slate-700" />
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">Pop-Up Events ({events.length})</h3>
                <Button onClick={() => setShowEventForm(true)} className="bg-blue-600">New Event</Button>
              </div>
              <div className="space-y-3">
                {events.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">No events yet</div>
                ) : events.map((evt) => (
                  <div key={evt.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-white font-medium">{evt.name}</h4>
                        <p className="text-xs text-slate-400 capitalize">{evt.type} {evt.isActive ? '• Active' : ''}</p>
                      </div>
                      <div className="text-xs text-slate-400">{evt.startTime && `Start: ${new Date(evt.startTime).toLocaleString()}`}</div>
                    </div>
                  </div>
                ))}
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
                    {(isSuperAdmin || permissions.deleteAssets) && (
                     <Button size="sm" variant="ghost" onClick={() => handleDeleteTheme(theme)} className="text-red-400 hover:text-red-300">
                       <Trash2 className="w-4 h-4" />
                     </Button>
                    )}
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
            <div className="flex flex-wrap gap-2 justify-end mb-4">
              <Button onClick={() => setShowShopItemForm(true)} className="bg-purple-600">New Item</Button>
              <Button onClick={() => setShowBundleForm(true)} className="bg-amber-600">New Bundle</Button>
              <Button onClick={() => setShowManualPackForm(true)} className="bg-blue-600">Build Custom Pack</Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h3 className="text-white font-semibold mb-2">Shop Items ({shopItems.length})</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {shopItems.length === 0 ? (
                    <div className="text-slate-400 text-sm">No items</div>
                  ) : shopItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-slate-700/60 rounded-lg px-3 py-2">
                      <div className="text-sm text-white">{item.name} • {item.itemType} • {item.price} 🪙</div>
                      <Button size="sm" variant="ghost" className="text-slate-300"
                        onClick={() => setEditingShopItem(item)}>
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <h3 className="text-white font-semibold mb-2">Bundles ({bundles.length})</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {bundles.length === 0 ? (
                    <div className="text-slate-400 text-sm">No bundles</div>
                  ) : bundles.map((b) => (
                    <div key={b.id} className="flex items-center justify-between bg-slate-700/60 rounded-lg px-3 py-2">
                      <div className="text-sm text-white">{b.name} • {b.bundlePrice} 🪙</div>
                      <Button size="sm" variant="ghost" className="text-slate-300"
                        onClick={() => setEditingBundle(b)}>
                        Edit
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cosmetics">
            <div className="flex justify-end mb-4">
              <Button onClick={() => setShowCosmeticForm(true)} className="bg-gradient-to-r from-pink-500 to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                New Cosmetic
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {petCosmetics.map((cosmetic) => (
                <div key={cosmetic.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {cosmetic.imageUrl && (
                        <img src={cosmetic.imageUrl} alt={cosmetic.name} className="w-12 h-12 object-contain" />
                      )}
                      <div>
                        <h3 className="font-semibold text-white">{cosmetic.name}</h3>
                        <p className="text-xs text-slate-400 capitalize">
                          {cosmetic.cosmeticType} • {cosmetic.rarity} • {cosmetic.price} 🪙
                        </p>
                      </div>
                    </div>
                    {(isSuperAdmin || permissions.deleteAssets) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          await base44.entities.PetCosmetic.delete(cosmetic.id);
                          setPetCosmetics(petCosmetics.filter(c => c.id !== cosmetic.id));
                          toast.success('Cosmetic deleted');
                        }}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  {cosmetic.description && <p className="text-sm text-slate-500">{cosmetic.description}</p>}
                </div>
              ))}
              {petCosmetics.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-400">No pet cosmetics yet</div>
              )}
            </div>
          </TabsContent>


          <TabsContent value="booths">
            <BoothSkinManager />
          </TabsContent>

          <TabsContent value="analytics">
            <EconomyCharts />
          </TabsContent>
          <TabsContent value="email">
            <AdminEmailBroadcast />
          </TabsContent>
          {(isSuperAdmin || permissions.toggleAdminRole) && (
            <TabsContent value="roles">
              <RolesManager />
            </TabsContent>
          )}
          {(isSuperAdmin || can('manageSuperAssignments')) && (
            <TabsContent value="super_assignments">
              <SuperAssignmentsAnalytics />
            </TabsContent>
          )}

          {(isSuperAdmin || can('banFlagUsers')) && (
            <TabsContent value="bans_flags">
              <BansAndFlagsPanel users={users} setUsers={setUsers} />
            </TabsContent>
          )}


          <TabsContent value="locks">
            <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
              <h3 className="text-white font-semibold mb-3">Global Feature Locks</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['shop','market','battlePass','pets','xpGain'].map((k) => (
                  <label key={k} className="flex items-center gap-2 bg-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={!!featureLocks.global?.[k]}
                      onChange={(e) => setFeatureLocks({
                        ...featureLocks,
                        global: { ...(featureLocks.global || {}), [k]: e.target.checked }
                      })}
                    />
                    {k}
                  </label>
                ))}
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={saveFeatureLocks} className="bg-emerald-600">Save Locks</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <CustomizationPanel />
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

              {/* Daily Rewards (Streak & Wheel) */}
              <div className="bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-2xl p-6 border border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">🎁</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">Daily Rewards</h3>
                    <p className="text-slate-400 text-sm">Configure streak schedule and optional spin-the-wheel</p>
                  </div>
                </div>

                <DailyRewardsSettings />
              </div>

              {/* Reward Links */}
              <div className="bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">🎁</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">Reward Links</h3>
                    <p className="text-slate-400 text-sm">Create special links that give XP, coins, pets, etc.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <Button
                    onClick={() => setShowRewardLinkForm(true)}
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Reward Link
                  </Button>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Active Reward Links ({rewardLinks.filter(l => l.isActive).length})</Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {rewardLinks.map((link) => {
                        const usedCount = link.usedBy?.length || 0;
                        const remaining = link.maxUses ? link.maxUses - usedCount : '∞';
                        const isExpired = link.expiresAt && new Date(link.expiresAt) < new Date();
                        const linkUrl = `${window.location.origin}?reward=${link.id}`;
                        
                        return (
                          <div key={link.id} className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-white font-medium">{link.name}</span>
                                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                                  {link.rewardType === 'xp' && `${link.rewardValue} XP`}
                                  {link.rewardType === 'coins' && `${link.rewardValue} 🪙`}
                                  {link.rewardType === 'magic_egg' && '🥚 Magic Egg'}
                                  {link.rewardType === 'pet' && '🐾 Pet'}
                                  {link.rewardType === 'theme' && '🎨 Theme'}
                                  {link.rewardType === 'title' && '👑 Title'}
                                </span>
                                <span className={`text-xs font-medium ${remaining === 0 || isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                                  {remaining}/{link.maxUses || '∞'} uses
                                </span>
                                {isExpired && (
                                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Expired</span>
                                )}
                                {!link.isActive && (
                                  <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded">Inactive</span>
                                )}
                              </div>
                              <code className="text-xs text-slate-400 block truncate">{linkUrl}</code>
                              {link.expiresAt && (
                                <p className="text-xs text-slate-500 mt-1">
                                  Expires: {new Date(link.expiresAt).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  navigator.clipboard.writeText(linkUrl);
                                  toast.success('Link copied!');
                                }}
                                className="text-purple-400 hover:text-purple-300"
                              >
                                Copy
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={async () => {
                                  await base44.entities.RewardLink.update(link.id, { isActive: !link.isActive });
                                  setRewardLinks(rewardLinks.map(l => l.id === link.id ? { ...l, isActive: !l.isActive } : l));
                                  toast.success(link.isActive ? 'Link deactivated' : 'Link activated');
                                }}
                                className={link.isActive ? 'text-yellow-400 hover:text-yellow-300' : 'text-emerald-400 hover:text-emerald-300'}
                              >
                                {link.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                              </Button>
                              {isSuperAdmin && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={async () => {
                                    await base44.entities.RewardLink.delete(link.id);
                                    setRewardLinks(rewardLinks.filter(l => l.id !== link.id));
                                    toast.success('Link deleted');
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {rewardLinks.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">No reward links created yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Referral Links */}
              <div className="bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl">🎟️</span>
                  <div>
                    <h3 className="text-xl font-bold text-white">Admin Referral Links</h3>
                    <p className="text-slate-400 text-sm">Create multi-use invite links for early access</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <Label className="text-slate-300 mb-2 block">Max Uses</Label>
                      <Input
                        type="number"
                        value={newLinkMaxUses}
                        onChange={(e) => setNewLinkMaxUses(parseInt(e.target.value) || 1)}
                        min="1"
                        placeholder="10"
                        className="bg-slate-800/50 border-white/10 text-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={async () => {
                          try {
                            const profileId = localStorage.getItem('quest_profile_id');
                            const newLink = await base44.entities.ReferralLink.create({
                              referrerId: profileId,
                              usedBy: [],
                              maxUses: newLinkMaxUses,
                              isAdminLink: true
                            });
                            setAdminReferralLinks([newLink, ...adminReferralLinks]);
                            toast.success(`Created link with ${newLinkMaxUses} uses!`);
                          } catch (e) {
                            toast.error('Failed to create link');
                          }
                        }}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Link
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Active Admin Links</Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {adminReferralLinks.map((link) => {
                        const usedCount = link.usedBy?.length || 0;
                        const remaining = link.maxUses - usedCount;
                        const linkUrl = `${window.location.origin}/Home?ref=${link.id}`;
                        
                        return (
                          <div key={link.id} className="bg-slate-800/50 rounded-lg p-3 flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-sm font-medium ${remaining > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                  {remaining}/{link.maxUses} uses remaining
                                </span>
                                {remaining === 0 && (
                                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">Expired</span>
                                )}
                              </div>
                              <code className="text-xs text-slate-400 block truncate">{linkUrl}</code>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  navigator.clipboard.writeText(linkUrl);
                                  toast.success('Link copied!');
                                }}
                                className="text-emerald-400 hover:text-emerald-300"
                              >
                                Copy
                              </Button>
                              {isSuperAdmin && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={async () => {
                                    await base44.entities.ReferralLink.delete(link.id);
                                    setAdminReferralLinks(adminReferralLinks.filter(l => l.id !== link.id));
                                    toast.success('Link deleted');
                                  }}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {adminReferralLinks.length === 0 && (
                        <p className="text-sm text-slate-400 text-center py-4">No admin links created yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Force Trade Dialog */}
        <Dialog open={showForceTrade} onOpenChange={setShowForceTrade}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Force Trade (Admin)</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2">
              <div>
                <Label>From User</Label>
                <Select value={ftFrom} onValueChange={setFtFrom}>
                  <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {users.map(u => (<SelectItem key={u.id} value={u.id}>{u.username || u.userId}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>To User</Label>
                <Select value={ftTo} onValueChange={setFtTo}>
                  <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {users.map(u => (<SelectItem key={u.id} value={u.id}>{u.username || u.userId}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Item Type</Label>
                <Select value={ftType} onValueChange={setFtType}>
                  <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pet">Pet</SelectItem>
                    <SelectItem value="theme">Theme</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="cosmetic">Cosmetic</SelectItem>
                    <SelectItem value="boothskin">Booth Skin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Item ID</Label>
                <Input value={ftItemId} onChange={(e) => setFtItemId(e.target.value)} className="bg-slate-700 border-slate-600" placeholder="e.g. starter_slime or custom_abc123" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowForceTrade(false)}>Cancel</Button>
              <Button onClick={async () => {
                if (!ftFrom || !ftTo || !ftItemId) return;
                const { data } = await base44.functions.invoke('adminForceTrade', { fromProfileId: ftFrom, toProfileId: ftTo, itemType: ftType, itemId: ftItemId });
                if (data?.success) {
                  setShowForceTrade(false);
                  setFtFrom(''); setFtTo(''); setFtType('pet'); setFtItemId('');
                }
              }} className="bg-red-600">Force Move</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

        <CreatePetDialog open={showPetForm} onOpenChange={setShowPetForm} adminProfile={adminProfile} onCreated={(newPet) => setCustomPets([newPet, ...customPets])} />
        <PetEditorDialog
          open={!!editingPet}
          pet={editingPet}
          onOpenChange={(open) => { if (!open) setEditingPet(null); }}
          onSaved={(updated) => { setCustomPets(prev => prev.map(p => p.id === updated.id ? updated : p)); setEditingPet(null); }}
        />

        {/* Gift Dialog */}
        <Dialog open={showGiftDialog} onOpenChange={setShowGiftDialog}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Gift Item to {giftUser?.username || giftUsername || 'User'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Gift to Username</Label>
                <div className="flex gap-2">
                  <Input
                    value={giftUsername}
                    onChange={(e) => setGiftUsername(e.target.value)}
                    placeholder="Enter username"
                    className="bg-slate-700 border-slate-600"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={resolveGiftRecipient}
                    className="border-purple-500 text-purple-300 hover:bg-purple-500/20"
                  >
                    Find
                  </Button>
                </div>
                {giftUser && (
                  <p className="text-xs text-slate-400">
                    Selected: <span className="text-purple-200">{giftUser.username}</span>
                  </p>
                )}
              </div>
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
                   <SelectItem value="cosmetic">Cosmetic</SelectItem>
                   <SelectItem value="boothskin">Booth Skin</SelectItem>
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
                  <Label>
                    Select {giftType === 'pet' ? 'Pet' : giftType === 'theme' ? 'Theme' : 'Cosmetic'}
                  </Label>
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
                    ) : giftType === 'theme' ? (
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
                    ) : giftType === 'boothskin' ? (
                      <>
                        {boothSkins.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </>
                    ) : (
                      <>
                        {petCosmetics.map((cosmetic) => (
                          <SelectItem key={cosmetic.id} value={cosmetic.id}>
                            {cosmetic.name} ({cosmetic.cosmeticType})
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                {isSuperAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const recipient = resolveGiftRecipient();
                      if (!recipient) return;
                      const allPetIds = [...PETS.map(p => p.id), ...customPets.map(p => `custom_${p.id}`)];
                      await base44.entities.UserProfile.update(recipient.id, { unlockedPets: allPetIds });
                      setUsers(users.map(u => u.id === recipient.id ? { ...u, unlockedPets: allPetIds } : u));
                      toast.success(`All pets gifted to ${recipient.username}!`);
                    }}
                    className="flex-1 border-purple-500 text-purple-400 hover:bg-purple-500/20"
                  >
                    Gift ALL Pets
                  </Button>
                )}
                {isSuperAdmin && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const recipient = resolveGiftRecipient();
                      if (!recipient) return;
                      const allThemeIds = [...THEMES.map(t => t.id), ...customThemes.map(t => `custom_${t.id}`)];
                      await base44.entities.UserProfile.update(recipient.id, { unlockedThemes: allThemeIds });
                      setUsers(users.map(u => u.id === recipient.id ? { ...u, unlockedThemes: allThemeIds } : u));
                      toast.success(`All themes gifted to ${recipient.username}!`);
                    }}
                    className="flex-1 border-cyan-500 text-cyan-400 hover:bg-cyan-500/20"
                  >
                    Gift ALL Themes
                  </Button>
                )}
              </div>
              
              {isSuperAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const recipient = resolveGiftRecipient();
                    if (!recipient) return;
                    await base44.entities.MagicEgg.create({ userId: recipient.userId, source: 'admin_gift', giftedBy: adminProfile?.userId, giftedByProfileId: adminProfile?.id });
                    toast.success(`🥚 Magic Egg gifted to ${recipient.username}!`);
                  }}
                  className="w-full border-amber-500 text-amber-400 hover:bg-amber-500/20"
                >
                  🥚 Gift Magic Egg
                </Button>
              )}
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

        <CreateShopItemDialog open={showShopItemForm} onOpenChange={setShowShopItemForm} form={shopItemForm} setForm={setShopItemForm} customPets={customPets} customThemes={customThemes} isSuperAdmin={isSuperAdmin} onCreated={(newItem) => setShopItems([newItem, ...shopItems])} />

        <EditShopItemDialog item={editingShopItem} onOpenChange={(v) => { if (!v) setEditingShopItem(null); }} onSaved={(updated) => { setShopItems(shopItems.map(i => i.id === updated.id ? updated : i)); setEditingShopItem(null); }} />

        <ManualPackDialog
          open={showManualPackForm}
          onOpenChange={setShowManualPackForm}
          form={manualPackForm}
          setForm={setManualPackForm}
          shopItems={shopItems}
          onCreated={(newBundle) => setBundles([newBundle, ...bundles])}
        />

        <BundleFormDialog open={showBundleForm} onOpenChange={setShowBundleForm} form={bundleForm} setForm={setBundleForm} onCreated={(b) => setBundles([b, ...bundles])} />

        <EditBundleDialog bundle={editingBundle} onOpenChange={(v) => { if (!v) setEditingBundle(null); }} onSaved={(updated) => { setBundles(bundles.map(b => b.id === updated.id ? updated : b)); setEditingBundle(null); }} />

        <RewardLinkFormDialog
          open={showRewardLinkForm}
          onOpenChange={setShowRewardLinkForm}
          form={rewardLinkForm}
          setForm={setRewardLinkForm}
          isSuperAdmin={isSuperAdmin}
          customPets={customPets}
          customThemes={customThemes}
          onCreated={(newLink) => setRewardLinks([newLink, ...rewardLinks])}
        />

        <CosmeticFormDialog
          open={showCosmeticForm}
          onOpenChange={setShowCosmeticForm}
          form={cosmeticForm}
          setForm={setCosmeticForm}
          onCreated={(newCosmetic) => setPetCosmetics([newCosmetic, ...petCosmetics])}
        />

        <NewThemeDialog open={showThemeForm} onOpenChange={setShowThemeForm} themeForm={themeForm} setThemeForm={setThemeForm} onCreateTheme={handleCreateTheme} />
      </div>
    </div>
  );
}