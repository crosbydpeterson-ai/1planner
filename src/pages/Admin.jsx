import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Search, Users, ClipboardList, Plus, Lock, Unlock, Eye, EyeOff, Key, Check, X, Edit2, Save, Palette, Star, Trash2, Gift, Sparkles, Wand2, Loader2, ShoppingBag, Ban, Gamepad2 } from 'lucide-react';
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
import CustomizationPanel from '@/components/admin/CustomizationPanel';
import PetAvatar from '@/components/quest/PetAvatar';
import CosmeticGeneratorPanel from '@/components/admin/CosmeticGeneratorPanel';
import BulkPetCreatorPanel from '@/components/admin/BulkPetCreatorPanel';
import IdeaGeneratorPanel from '@/components/admin/IdeaGeneratorPanel';
import BansAndFlagsPanel from '@/components/admin/BansAndFlagsPanel';
import CreateShopItemDialog from '@/components/admin/CreateShopItemDialog';
import CreatePetDialog from '@/components/admin/CreatePetDialog';
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
import AdminSettingsPanel from '@/components/admin/AdminSettingsPanel';
import ActiveEggJobs from '@/components/admin/ActiveEggJobs';
import SeasonPassGeneratorPanel from '@/components/admin/SeasonPassGeneratorPanel';
import PlusRewardsEditor from '@/components/admin/PlusRewardsEditor';
import PetMojiGeneratorPanel from '@/components/admin/PetMojiGeneratorPanel';
import BulkPetMojiCreatorPanel from '@/components/admin/BulkPetMojiCreatorPanel';
import CommunityModerationPanel from '@/components/admin/CommunityModerationPanel';
import PetConceptReviewPanel from '@/components/admin/PetConceptReviewPanel';
import CommunityChannelPermsPanel from '@/components/admin/CommunityChannelPermsPanel';
import LootEggManagerPanel from '@/components/admin/LootEggManagerPanel';
import GeneralImageGeneratorPanel from '@/components/admin/GeneralImageGeneratorPanel';
import LoreComicPanel from '@/components/admin/LoreComicPanel';
import AdminEventsPanel from '@/components/admin/AdminEventsPanel';
import KitchenAIPanel from '@/components/admin/KitchenAIPanel';
import AdminKitchenPanel from '@/components/admin/AdminKitchenPanel';
import RewardAIGenerator from '@/components/admin/RewardAIGenerator';

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
  const [permissions, setPermissions] = useState({ accessAI: false, deleteAssets: false, grantAdminTokens: false, toggleAdminRole: false, manageLocks: false, banFlagUsers: false, manageShop: false, manageEvents: false, viewAnalytics: false, manageAssignments: false, manageSuperAssignments: false, managePets: false, manageThemes: false, manageCosmetics: false, manageKitchen: false });
  const can = (key) => isSuperAdmin || !!permissions[key];
  const [users, setUsers] = useState([]);
  const [showForceTrade, setShowForceTrade] = useState(false);
  const [ftFrom, setFtFrom] = useState(''); const [ftTo, setFtTo] = useState(''); const [ftType, setFtType] = useState('pet'); const [ftItemId, setFtItemId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editXp, setEditXp] = useState(''); const [newPin, setNewPin] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [lootEggs, setLootEggs] = useState([]);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', subject: 'everyone', target: 'everyone', xpReward: 10, dueDate: '', lootEggId: 'none' });
  const [customPets, setCustomPets] = useState([]); const [editingPet, setEditingPet] = useState(null);
  const [customThemes, setCustomThemes] = useState([]); const [petCosmetics, setPetCosmetics] = useState([]); const [boothSkins, setBoothSkins] = useState([]);
  const [showPetForm, setShowPetForm] = useState(false); const [showThemeForm, setShowThemeForm] = useState(false); const [showCosmeticForm, setShowCosmeticForm] = useState(false);
  const [themeForm, setThemeForm] = useState({ name: '', rarity: 'common', xpRequired: 0, description: '', primaryColor: '#6366f1', secondaryColor: '#8b5cf6', accentColor: '#f59e0b', bgColor: '#f8fafc' });
  const [cosmeticForm, setCosmeticForm] = useState({ name: '', description: '', cosmeticType: 'hat', imageUrl: '', price: 50, rarity: 'common', isLimited: false, isActive: true });
  const [showGiftDialog, setShowGiftDialog] = useState(false); const [giftUser, setGiftUser] = useState(null); const [giftUsername, setGiftUsername] = useState(''); const [giftType, setGiftType] = useState('pet'); const [giftItemId, setGiftItemId] = useState('');
  const [seasons, setSeasons] = useState([]); const [showSeasonForm, setShowSeasonForm] = useState(false);
  const [seasonForm, setSeasonForm] = useState({ name: '', startDate: '', endDate: '', isActive: true, rewards: [] });
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [magicEggs, setMagicEggs] = useState([]); const [adminEggIdea, setAdminEggIdea] = useState(''); const [generatingAdminPet, setGeneratingAdminPet] = useState(false); const [adminEggCount, setAdminEggCount] = useState(1); const [adminEggProgress, setAdminEggProgress] = useState(null);
  const [events, setEvents] = useState([]); const [showEventForm, setShowEventForm] = useState(false);
  const [shopItems, setShopItems] = useState([]); const [bundles, setBundles] = useState([]);
  const [showShopItemForm, setShowShopItemForm] = useState(false); const [showBundleForm, setShowBundleForm] = useState(false);
  const [shopItemForm, setShopItemForm] = useState({ name: '', description: '', itemType: 'pet', itemData: {}, price: 50, rarity: 'common', isLimited: false, stockLimit: null, stockRemaining: null, startDate: '', endDate: '', isActive: true });
  const [bundleForm, setBundleForm] = useState({ name: '', description: '', itemIds: [], originalPrice: 0, bundlePrice: 0, discountPercent: 20, isLimited: true, stockLimit: null, stockRemaining: null, startDate: '', endDate: '', isActive: true });
  const [editingShopItem, setEditingShopItem] = useState(null); const [editingBundle, setEditingBundle] = useState(null);
  const [showManualPackForm, setShowManualPackForm] = useState(false);
  const [manualPackForm, setManualPackForm] = useState({ name: '', description: '', imageUrl: '', itemIds: [], originalPrice: 0, bundlePrice: 0, discountPercent: 20, isLimited: true, stockLimit: 10, stockRemaining: 10, startDate: '', endDate: '', isActive: true });
  const [petMojiList, setPetMojiList] = useState([]);
  const [giftToAll, setGiftToAll] = useState(false);
  const [appSettings, setAppSettings] = useState([]);
  const [referralSettings, setReferralSettings] = useState({ referralMode: false, referrerRewardXP: 50, referredRewardXP: 25 });
  const [adminReferralLinks, setAdminReferralLinks] = useState([]); const [newLinkMaxUses, setNewLinkMaxUses] = useState(10);
  const [rewardLinks, setRewardLinks] = useState([]); const [showRewardLinkForm, setShowRewardLinkForm] = useState(false);
  const [rewardLinkForm, setRewardLinkForm] = useState({ name: '', rewardType: 'xp', rewardValue: 100, rewardData: {}, maxUses: 10, usedBy: [], expiresAt: '', isActive: true });
  const defaultFeatureLocks = { global: { shop: false, market: false, battlePass: false, pets: false, xpGain: false }, classes: { math: {}, reading: {} }, users: {} };
  const [featureLocks, setFeatureLocks] = useState(defaultFeatureLocks);
  const [defaultAssignmentLootEggId, setDefaultAssignmentLootEggId] = useState('none');

  useEffect(() => { checkAdminAccess(); }, []);
  useEffect(() => { if (!isAuthenticated) return; const unsub = base44.entities.UserProfile.subscribe((event) => { if (event.type === 'update') setUsers(prev => prev.map(u => u.id === event.id ? { ...u, ...event.data } : u)); }); return unsub; }, [isAuthenticated]);

  const checkAdminAccess = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) { setLoading(false); return; }
    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0) { navigate(createPageUrl('Dashboard')); return; }
      const currentProfile = profiles[0];
      const username = (currentProfile.username || '').toLowerCase();
      const superByName = username === 'crosby';
      const role = currentProfile.rank || (superByName ? 'super_admin' : 'user');
      const hasCustomRole = Array.isArray(currentProfile.assignedRoleIds) && currentProfile.assignedRoleIds.length > 0;
      if (!(role === 'admin' || role === 'super_admin' || superByName || hasCustomRole)) { navigate(createPageUrl('Dashboard')); return; }
      setIsSuperAdmin(superByName || role === 'super_admin'); setIsAdminRole(true); setAdminProfile(currentProfile);
      const basePerms = { accessAI: false, deleteAssets: false, grantAdminTokens: false, toggleAdminRole: false, manageLocks: false, banFlagUsers: false, manageShop: false, manageEvents: false, viewAnalytics: false, manageAssignments: false, manageSuperAssignments: false, managePets: false, manageThemes: false, manageCosmetics: false, manageKitchen: false };
      if (superByName || role === 'super_admin') { setPermissions(Object.fromEntries(Object.keys(basePerms).map(k => [k, true]))); }
      else if (hasCustomRole) { try { const allRoles = await base44.entities.Role.list(); const myRoles = allRoles.filter(r => currentProfile.assignedRoleIds.includes(r.id)); const merged = { ...basePerms }; myRoles.forEach(r => { const p = r.permissions || {}; Object.keys(merged).forEach(k => { merged[k] = merged[k] || !!p[k]; }); }); setPermissions(merged); } catch (e) { setPermissions(basePerms); } }
      else { setPermissions(basePerms); }
      const adminAuth = localStorage.getItem('quest_admin_auth');
      if (superByName || role === 'super_admin') { setIsAuthenticated(true); localStorage.setItem('quest_admin_auth', 'true'); loadData(); }
      else if (adminAuth === 'true') { setIsAuthenticated(true); loadData(); }
      else { setLoading(false); }
    } catch (e) { navigate(createPageUrl('Dashboard')); }
  };

  const handleAdminLogin = () => { const ok = adminPin === ADMIN_PASSWORD || (adminProfile?.adminPanelPassword && adminPin === adminProfile.adminPanelPassword); if (ok) { setIsAuthenticated(true); localStorage.setItem('quest_admin_auth', 'true'); loadData(); } else { toast.error('Invalid admin password'); } };

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, allAssignments, allPets, allThemes, allSeasons, allEggs, allEvents, allSettings, allShopItems, allBundles, allReferralLinks, allRewardLinks, allCosmetics, allLootEggs] = await Promise.all([
        base44.entities.UserProfile.list('-created_date'), base44.entities.Assignment.list('-created_date'), base44.entities.CustomPet.list('-created_date'), base44.entities.CustomTheme.list('-created_date'), base44.entities.Season.list('-created_date'), base44.entities.MagicEgg.list('-created_date'), base44.entities.AdminEvent.list('-created_date'), base44.entities.AppSetting.list(), base44.entities.ShopItem.list('-created_date'), base44.entities.Bundle.list('-created_date'), base44.entities.ReferralLink.list('-created_date'), base44.entities.RewardLink.list('-created_date'), base44.entities.PetCosmetic.list('-created_date'), base44.entities.LootEgg.list('-created_date')
      ]);
      setUsers(allUsers); setAssignments(allAssignments); setCustomPets(allPets); setCustomThemes(allThemes); setSeasons(allSeasons); setMagicEggs(allEggs); setEvents(allEvents); setAppSettings(allSettings); setShopItems(allShopItems); setBundles(allBundles); setAdminReferralLinks(allReferralLinks.filter(l => l.isAdminLink)); setRewardLinks(allRewardLinks); setPetCosmetics(allCosmetics); setLootEggs(allLootEggs);
      const allBoothSkins = await base44.entities.BoothSkin.list('-created_date'); setBoothSkins(allBoothSkins);
      const allPetMojis = await base44.entities.PetMoji.list('-created_date'); setPetMojiList(allPetMojis);
      const refSetting = allSettings.find(s => s.key === 'referral_settings'); if (refSetting) setReferralSettings(refSetting.value);
      const locksSetting = allSettings.find(s => s.key === 'feature_locks'); if (locksSetting) setFeatureLocks(locksSetting.value || defaultFeatureLocks);
      const defaultAssignmentEggSetting = allSettings.find(s => s.key === 'default_assignment_loot_egg');
      setDefaultAssignmentLootEggId(defaultAssignmentEggSetting?.value?.lootEggId || 'none');
    } catch (e) { console.error('Error loading data:', e); }
    setLoading(false);
  };

  const handleSetXp = async () => { if (!selectedUser) return; const v = parseInt(editXp); if (isNaN(v) || v < 0) { toast.error('Please enter a valid XP amount'); return; } await base44.entities.UserProfile.update(selectedUser.id, { xp: v }); setUsers(users.map(u => u.id === selectedUser.id ? { ...u, xp: v } : u)); setSelectedUser({ ...selectedUser, xp: v }); toast.success(`XP set to ${v}`); };
  const handleToggleLock = async (user) => { const n = !user.isLocked; await base44.entities.UserProfile.update(user.id, { isLocked: n }); setUsers(users.map(u => u.id === user.id ? { ...u, isLocked: n } : u)); toast.success(`User ${n ? 'locked' : 'unlocked'}`); };
  const handleToggleHidden = async (user) => { const n = !user.hiddenFromLeaderboard; await base44.entities.UserProfile.update(user.id, { hiddenFromLeaderboard: n }); setUsers(users.map(u => u.id === user.id ? { ...u, hiddenFromLeaderboard: n } : u)); toast.success(`User ${n ? 'hidden from' : 'visible on'} leaderboard`); };
  const handleResetPin = async () => { if (!selectedUser) return; if (!/^\d{4}$/.test(newPin)) { toast.error('PIN must be exactly 4 digits'); return; } localStorage.setItem(`pin_${selectedUser.userId}`, btoa(newPin)); toast.success('PIN reset successfully'); setNewPin(''); };
  const saveFeatureLocks = async () => { const ex = appSettings.find(s => s.key === 'feature_locks'); if (ex) { await base44.entities.AppSetting.update(ex.id, { value: featureLocks }); setAppSettings(appSettings.map(s => s.key === 'feature_locks' ? { ...s, value: featureLocks } : s)); } else { const ns = await base44.entities.AppSetting.create({ key: 'feature_locks', value: featureLocks }); setAppSettings([...appSettings, ns]); } toast.success('Locks saved!'); };
  const handleCreateAssignment = async () => { if (!assignmentForm.title.trim()) { toast.error('Please enter a title'); return; } const selectedLootEggId = assignmentForm.lootEggId === 'none' ? null : assignmentForm.lootEggId; const fallbackLootEggId = defaultAssignmentLootEggId === 'none' ? null : defaultAssignmentLootEggId; const n = await base44.entities.Assignment.create({ ...assignmentForm, lootEggId: selectedLootEggId || fallbackLootEggId, isApproved: true, target: assignmentForm.subject === 'everyone' ? 'everyone' : assignmentForm.target }); setAssignments([n, ...assignments]); setShowAssignmentForm(false); setAssignmentForm({ title: '', description: '', subject: 'everyone', target: 'everyone', xpReward: 10, dueDate: '', lootEggId: 'none' }); toast.success('Assignment created!'); };
  const handleApproveAssignment = async (a) => { await base44.entities.Assignment.update(a.id, { isApproved: true }); setAssignments(assignments.map(x => x.id === a.id ? { ...x, isApproved: true } : x)); toast.success('Assignment approved'); };
  const handleDeleteAssignment = async (a) => { await base44.entities.Assignment.delete(a.id); setAssignments(assignments.filter(x => x.id !== a.id)); toast.success('Assignment deleted'); };
  const handleUpdateAssignment = async () => { if (!editingAssignment) return; const updatePayload = { ...editingAssignment, lootEggId: editingAssignment.lootEggId === 'none' ? null : editingAssignment.lootEggId }; await base44.entities.Assignment.update(editingAssignment.id, updatePayload); setAssignments(assignments.map(a => a.id === editingAssignment.id ? { ...a, ...updatePayload } : a)); setEditingAssignment(null); toast.success('Assignment updated'); };
  const handleCreateSeason = async () => { if (!seasonForm.name.trim() || !seasonForm.startDate || !seasonForm.endDate) { toast.error('Please fill in all required fields'); return; } const n = await base44.entities.Season.create(seasonForm); setSeasons([n, ...seasons]); setShowSeasonForm(false); setSeasonForm({ name: '', startDate: '', endDate: '', isActive: true, rewards: [] }); toast.success('Season created!'); };
  const handleDeleteSeason = async (s) => { await base44.entities.Season.delete(s.id); setSeasons(seasons.filter(x => x.id !== s.id)); toast.success('Season deleted'); };
  const addSeasonReward = () => setSeasonForm({ ...seasonForm, rewards: [...seasonForm.rewards, { xpRequired: 100, type: 'pet', value: '', name: '' }] });
  const updateSeasonReward = (i, f, v) => { const r = [...seasonForm.rewards]; r[i][f] = v; setSeasonForm({ ...seasonForm, rewards: r }); };
  const removeSeasonReward = (i) => setSeasonForm({ ...seasonForm, rewards: seasonForm.rewards.filter((_, j) => j !== i) });
  const resolveGiftRecipient = () => { if (giftUser) return giftUser; const u = giftUsername.trim(); if (!u) { toast.error('Please select a user'); return null; } const m = users.find(x => x.username?.toLowerCase() === u.toLowerCase()); if (!m) { toast.error(`User "${u}" not found`); return null; } setGiftUser(m); return m; };
  const handleGiftItem = async () => {
    const requiresItemValue = !['onepassplus'].includes(giftType);
    if (giftToAll && isSuperAdmin) {
      if (requiresItemValue && !giftItemId) { toast.error('Please select an item or enter an amount'); return; }
      toast.info('Gifting to all users...');
      for (const recipient of users) { await giftSingleUser(recipient); }
      toast.success(`Gifted to all ${users.length} users!`);
      setShowGiftDialog(false); setGiftItemId(''); setGiftToAll(false);
      return;
    }
    const recipient = resolveGiftRecipient(); if (!recipient || (requiresItemValue && !giftItemId)) { toast.error('Please enter an amount or select an item'); return; }
    if (!isSuperAdmin) { const today = new Date().toDateString(); let lastDate = adminProfile?.lastGiftDate || ''; let dailyCount = adminProfile?.dailyGiftCount || 0; if (lastDate !== today) { dailyCount = 0; } if (dailyCount >= 50) { toast.error('Daily gift limit reached (50).'); return; } if ((adminProfile?.adminTokens || 0) <= 0) { toast.error('No admin tokens left.'); return; } if ((adminProfile?.questCoins || 0) < 25) { toast.error('Not enough Quest Coins (need 25).'); return; } }
    await giftSingleUser(recipient);
    if (!isSuperAdmin) { const nc2 = (adminProfile?.questCoins||0)-25; const nt = (adminProfile?.adminTokens||0)-1; const nd = (adminProfile?.dailyGiftCount||0)+1; const td = new Date().toDateString(); await base44.entities.UserProfile.update(adminProfile.id, { questCoins: nc2, adminTokens: nt, dailyGiftCount: nd, lastGiftDate: td }); setAdminProfile({ ...adminProfile, questCoins: nc2, adminTokens: nt, dailyGiftCount: nd, lastGiftDate: td }); }
    toast.success('Gift sent!');
    setShowGiftDialog(false); setGiftItemId(''); setGiftToAll(false);
  };

  const giftSingleUser = async (recipient) => {
    if (giftType === 'seasonxp') { const amt = parseInt(giftItemId); if (isNaN(amt) || amt <= 0) { toast.error('Please enter a valid amount'); return; } let activeSeasonId = recipient.activeSeasonId; const activeSeasons = seasons.filter(s => s.isActive); if (!activeSeasonId || !activeSeasons.find(s => s.id === activeSeasonId)) { const now = new Date(); const best = activeSeasons.find(s => new Date(s.startDate) <= now && new Date(s.endDate) >= now) || activeSeasons[0]; activeSeasonId = best?.id; } const currentSeasonXp = (recipient.activeSeasonId === activeSeasonId) ? (recipient.seasonXp || 0) : 0; const ns = currentSeasonXp + amt; await base44.entities.UserProfile.update(recipient.id, { seasonXp: ns, activeSeasonId: activeSeasonId }); setUsers(users.map(u => u.id === recipient.id ? { ...u, seasonXp: ns, activeSeasonId: activeSeasonId } : u)); toast.success(`${amt} 1Pass XP gifted!`);
    } else if (giftType === 'coins') { const amt = parseInt(giftItemId); if (isNaN(amt) || amt <= 0) { toast.error('Please enter a valid amount'); return; } const nc = (recipient.questCoins || 0) + amt; await base44.entities.UserProfile.update(recipient.id, { questCoins: nc }); setUsers(users.map(u => u.id === recipient.id ? { ...u, questCoins: nc } : u)); toast.success(`${amt} Quest Coins gifted!`);
    } else if (giftType === 'gems') { const amt = parseInt(giftItemId); if (isNaN(amt) || amt <= 0) { toast.error('Please enter a valid amount'); return; } const ng = (recipient.gems || 0) + amt; await base44.entities.UserProfile.update(recipient.id, { gems: ng }); setUsers(users.map(u => u.id === recipient.id ? { ...u, gems: ng } : u)); toast.success(`${amt} Gems gifted! 💎`);
    } else if (giftType === 'onepassplus') { await base44.entities.UserProfile.update(recipient.id, { has1PassPlus: true }); setUsers(users.map(u => u.id === recipient.id ? { ...u, has1PassPlus: true } : u)); toast.success('1Pass Plus gifted!');
    } else if (giftType === 'pet') { const up = [...(recipient.unlockedPets || [])]; if (!up.includes(giftItemId)) { up.push(giftItemId); const updateData = { unlockedPets: up }; if (giftItemId.startsWith('custom_')) { const petDbId = giftItemId.replace('custom_', ''); const pet = customPets.find(p => p.id === petDbId); if (pet) { let themeId = null; const existingTheme = customThemes.find(t => t.name === pet.name); if (existingTheme) { themeId = `custom_${existingTheme.id}`; } else if (pet.theme) { const newTheme = await base44.entities.CustomTheme.create({ name: pet.name, rarity: pet.rarity || 'common', xpRequired: 0, description: `Theme from ${pet.name}`, primaryColor: pet.theme.primary || '#6366f1', secondaryColor: pet.theme.secondary || '#a5b4fc', accentColor: pet.theme.accent || '#f59e0b', bgColor: pet.theme.bg || '#f0f9ff' }); setCustomThemes([newTheme, ...customThemes]); themeId = `custom_${newTheme.id}`; } if (themeId) { const ut = [...(recipient.unlockedThemes || [])]; if (!ut.includes(themeId)) { ut.push(themeId); updateData.unlockedThemes = ut; } } } } await base44.entities.UserProfile.update(recipient.id, updateData); setUsers(users.map(u => u.id === recipient.id ? { ...u, ...updateData } : u)); } toast.success('Pet gifted!');
    } else if (giftType === 'theme') { const ut = [...(recipient.unlockedThemes || [])]; if (!ut.includes(giftItemId)) { ut.push(giftItemId); await base44.entities.UserProfile.update(recipient.id, { unlockedThemes: ut }); setUsers(users.map(u => u.id === recipient.id ? { ...u, unlockedThemes: ut } : u)); } toast.success('Theme gifted!');
    } else if (giftType === 'cosmetic') { const uc = [...(recipient.unlockedCosmetics || [])]; if (!uc.includes(giftItemId)) { uc.push(giftItemId); await base44.entities.UserProfile.update(recipient.id, { unlockedCosmetics: uc }); setUsers(users.map(u => u.id === recipient.id ? { ...u, unlockedCosmetics: uc } : u)); } toast.success('Cosmetic gifted!');
    } else if (giftType === 'boothskin') { const ub = [...(recipient.unlockedBoothSkins || [])]; if (!ub.includes(giftItemId)) { ub.push(giftItemId); await base44.entities.UserProfile.update(recipient.id, { unlockedBoothSkins: ub }); setUsers(users.map(u => u.id === recipient.id ? { ...u, unlockedBoothSkins: ub } : u)); }
    } else if (giftType === 'petmoji') { const moji = await base44.entities.PetMoji.filter({ id: giftItemId }); if (moji.length > 0) { const current = moji[0].exclusiveOwnerIds || []; if (!current.includes(recipient.id)) { await base44.entities.PetMoji.update(giftItemId, { exclusiveOwnerIds: [...current, recipient.id], isExclusive: true }); } } }
  };

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));

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
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}><Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"><ArrowLeft className="w-5 h-5" /></Button></Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-lg"><Shield className="w-6 h-6 text-white" /></div>
              <div><h1 className="text-2xl font-bold text-white">Admin Panel</h1><p className="text-sm text-slate-400">Manage users, assets, AI tools</p></div>
            </div>
          </div>
          <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => { localStorage.removeItem('quest_admin_auth'); setIsAuthenticated(false); }}>Logout</Button>
        </motion.div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-slate-800 border-slate-700 mb-6 h-auto flex flex-wrap gap-1 p-2">
            <TabsTrigger value="users" className="data-[state=active]:bg-slate-700"><Users className="w-4 h-4 mr-2" />Users ({users.length})</TabsTrigger>
            {can('manageAssignments') && <TabsTrigger value="assignments" className="data-[state=active]:bg-slate-700"><ClipboardList className="w-4 h-4 mr-2" />Assignments ({assignments.length})</TabsTrigger>}
            {can('managePets') && <TabsTrigger value="pets" className="data-[state=active]:bg-slate-700"><Star className="w-4 h-4 mr-2" />Pets ({customPets.length})</TabsTrigger>}
            {can('manageThemes') && <TabsTrigger value="themes" className="data-[state=active]:bg-slate-700"><Palette className="w-4 h-4 mr-2" />Themes ({customThemes.length})</TabsTrigger>}
            {can('manageCosmetics') && <TabsTrigger value="cosmetics" className="data-[state=active]:bg-slate-700">👒 Cosmetics ({petCosmetics.length})</TabsTrigger>}
            {can('accessAI') && <TabsTrigger value="ai" className="data-[state=active]:bg-slate-700">✨ AI Tools</TabsTrigger>}
            {can('accessAI') && <TabsTrigger value="reward_ai" className="data-[state=active]:bg-slate-700">🎰 Reward AI</TabsTrigger>}
            {can('accessAI') && <TabsTrigger value="petmojis" className="data-[state=active]:bg-slate-700">😺 Petmojis</TabsTrigger>}
            <TabsTrigger value="seasons" className="data-[state=active]:bg-slate-700"><Sparkles className="w-4 h-4 mr-2" />Seasons ({seasons.length})</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="eggs" className="data-[state=active]:bg-slate-700">🥚 Magic Eggs</TabsTrigger>}
            <TabsTrigger value="loot_eggs" className="data-[state=active]:bg-slate-700">🎰 Loot Eggs</TabsTrigger>
            {can('manageEvents') && <TabsTrigger value="events" className="data-[state=active]:bg-slate-700">🫧 Events</TabsTrigger>}
            {can('manageKitchen') && <TabsTrigger value="kitchen" className="data-[state=active]:bg-slate-700">👨‍🍳 Kitchen</TabsTrigger>}
            {can('manageShop') && <TabsTrigger value="shop" className="data-[state=active]:bg-slate-700"><ShoppingBag className="w-4 h-4 mr-2" />Shop</TabsTrigger>}
            {can('viewAnalytics') && <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">📊 Analytics</TabsTrigger>}
            <TabsTrigger value="email" className="data-[state=active]:bg-slate-700">✉️ Email</TabsTrigger>
            {(isSuperAdmin || permissions.toggleAdminRole) && <TabsTrigger value="roles" className="data-[state=active]:bg-slate-700"><Shield className="w-4 h-4 mr-2" />Roles</TabsTrigger>}
            {(isSuperAdmin || can('manageSuperAssignments')) && <TabsTrigger value="super_assignments" className="data-[state=active]:bg-slate-700">⭐ Super Assignments</TabsTrigger>}
            {(isSuperAdmin || can('manageLocks')) && <TabsTrigger value="locks" className="data-[state=active]:bg-slate-700"><Lock className="w-4 h-4 mr-2" />Locks</TabsTrigger>}
            {(isSuperAdmin || can('banFlagUsers')) && <TabsTrigger value="bans_flags" className="data-[state=active]:bg-slate-700"><Ban className="w-4 h-4 mr-2" />Bans & Flags</TabsTrigger>}
            {can('manageEvents') && <TabsTrigger value="updates" className="data-[state=active]:bg-slate-700">📢 Updates</TabsTrigger>}
            {can('manageEvents') && <TabsTrigger value="community_perms" className="data-[state=active]:bg-slate-700">💬 Community</TabsTrigger>}
            {can('manageEvents') && <TabsTrigger value="moderation" className="data-[state=active]:bg-slate-700">🛡️ Moderation</TabsTrigger>}
            {can('managePets') && <TabsTrigger value="concepts" className="data-[state=active]:bg-slate-700">💡 Pet Concepts</TabsTrigger>}
            <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700">⚙️ Settings</TabsTrigger>
            {isSuperAdmin && <TabsTrigger value="lore" className="data-[state=active]:bg-slate-700">📖 Lore Comic</TabsTrigger>}
          </TabsList>

          {can('manageEvents') && <TabsContent value="updates"><div className="bg-slate-800 rounded-2xl p-5 border border-slate-700"><AnnouncementManager /></div></TabsContent>}

          <TabsContent value="users">
            <div className="mb-4 flex items-center gap-2">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search users..." className="pl-10 bg-slate-800 border-slate-700 text-white w-full" /></div>
              {isSuperAdmin && <Button onClick={() => setShowForceTrade(true)} className="bg-red-600">Force Trade</Button>}
            </div>
            <div className="space-y-3">
              {loading ? <div className="text-center py-8 text-slate-400">Loading...</div> : filteredUsers.length === 0 ? <div className="text-center py-8 text-slate-400">No users found</div> : filteredUsers.map((user) => (
                <motion.div key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <PetAvatar petId={user.equippedPetId} cosmeticIds={user.equippedCosmetics || []} cosmeticPositions={user.cosmeticPositions || {}} size="sm" />
                      <div>
                        <h3 className="font-semibold text-white flex items-center gap-2">{user.username}{user.isLocked && <Lock className="w-4 h-4 text-red-400" />}{user.hiddenFromLeaderboard && <EyeOff className="w-4 h-4 text-yellow-400" />}{user.isPetCreator && <Wand2 className="w-4 h-4 text-pink-400" />}{user.isGameCreator && <Gamepad2 className="w-4 h-4 text-teal-400" />}{user.has1PassPlus && <Sparkles className="w-4 h-4 text-yellow-300" />}</h3>
                        <p className="text-sm text-slate-400">Math: {user.mathTeacher} • Reading: {user.readingTeacher}{user.has1PassPlus ? ' • 1Pass Plus' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right"><p className="text-amber-400 font-bold">{user.xp || 0} XP</p><p className="text-blue-400 text-sm">{user.questCoins || 0} 🪙</p></div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleToggleLock(user)} className="text-slate-400 hover:text-white">{user.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}</Button>
                        <Button size="sm" variant="ghost" onClick={() => handleToggleHidden(user)} className="text-slate-400 hover:text-white">{user.hiddenFromLeaderboard ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</Button>
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedUser(user); setEditXp(String(user.xp || 0)); }} className="text-slate-400 hover:text-white"><Edit2 className="w-4 h-4" /></Button>
                        {isSuperAdmin && <Button size="sm" variant="ghost" onClick={() => { localStorage.setItem('quest_profile_id', user.id); navigate(createPageUrl('Dashboard')); }} className="text-emerald-400 hover:text-emerald-300" title="Switch to this user">Switch</Button>}
                        <Button size="sm" variant="ghost" onClick={() => { setGiftUser(user); setGiftUsername(user.username || ''); setGiftItemId(''); setGiftToAll(false); setShowGiftDialog(true); }} className="text-purple-400 hover:text-purple-300" title="Gift"><Gift className="w-4 h-4" /></Button>
                        {(isSuperAdmin || permissions.grantAdminTokens) && <Button size="sm" variant="ghost" onClick={async () => { const nt = (user.adminTokens || 0) + 10; await base44.entities.UserProfile.update(user.id, { adminTokens: nt }); setUsers(users.map(u => u.id === user.id ? { ...u, adminTokens: nt } : u)); toast.success(`Granted 10 admin tokens`); }} className="text-emerald-400 hover:text-emerald-300" title="Grant 10 Admin Tokens"><Plus className="w-4 h-4" /></Button>}
                        <Button size="sm" variant="ghost" onClick={async () => { const ns = !user.isPetCreator; await base44.entities.UserProfile.update(user.id, { isPetCreator: ns }); setUsers(users.map(u => u.id === user.id ? { ...u, isPetCreator: ns } : u)); toast.success(ns ? 'Pet creator granted!' : 'Pet creator removed'); }} className={user.isPetCreator ? "text-pink-400 hover:text-pink-300" : "text-slate-400 hover:text-slate-300"} title="Pet Creator"><Wand2 className="w-4 h-4" /></Button>
                        <Button size="sm" variant="ghost" onClick={async () => { const ns = !user.isGameCreator; await base44.entities.UserProfile.update(user.id, { isGameCreator: ns }); setUsers(users.map(u => u.id === user.id ? { ...u, isGameCreator: ns } : u)); toast.success(ns ? 'Game creator granted!' : 'Game creator removed'); }} className={user.isGameCreator ? "text-teal-400 hover:text-teal-300" : "text-slate-400 hover:text-slate-300"} title="Game Creator"><Gamepad2 className="w-4 h-4" /></Button>
                        {(isSuperAdmin || permissions.toggleAdminRole) && user.username?.toLowerCase() !== 'crosby' && <Button size="sm" variant="ghost" onClick={async () => { const nr = user.rank === 'admin' ? 'user' : 'admin'; await base44.entities.UserProfile.update(user.id, { rank: nr }); setUsers(users.map(u => u.id === user.id ? { ...u, rank: nr } : u)); toast.success(nr === 'admin' ? 'Now ADMIN' : 'Admin removed'); }} className="text-emerald-400 hover:text-emerald-300"><Shield className="w-4 h-4" /></Button>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assignments">
            <div className="mb-4"><div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-4"><h3 className="text-white font-semibold mb-2">Super Assignments</h3><p className="text-slate-400 text-sm mb-3">Create polls, short answers, or suggestion boxes.</p><SuperAssignmentCreator /></div></div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-4 space-y-3"><div><h3 className="text-white font-semibold">Default Assignment Egg</h3><p className="text-slate-400 text-sm">Choose the egg students get when they complete assignments.</p></div><div className="flex flex-col md:flex-row gap-3 md:items-center"><Select value={defaultAssignmentLootEggId} onValueChange={setDefaultAssignmentLootEggId}><SelectTrigger className="bg-slate-700 border-slate-600 md:max-w-sm"><SelectValue placeholder="Select default egg" /></SelectTrigger><SelectContent><SelectItem value="none">No default egg</SelectItem>{lootEggs.map((egg) => (<SelectItem key={egg.id} value={egg.id}>{egg.emoji || '🥚'} {egg.name}</SelectItem>))}</SelectContent></Select><Button onClick={async () => { const existingSetting = appSettings.find(s => s.key === 'default_assignment_loot_egg'); const value = { lootEggId: defaultAssignmentLootEggId === 'none' ? null : defaultAssignmentLootEggId }; if (existingSetting) { await base44.entities.AppSetting.update(existingSetting.id, { value }); setAppSettings(appSettings.map(s => s.key === 'default_assignment_loot_egg' ? { ...s, value } : s)); } else { const created = await base44.entities.AppSetting.create({ key: 'default_assignment_loot_egg', value }); setAppSettings([...appSettings, created]); } toast.success('Default assignment egg saved'); }} className="bg-amber-600">Save Default Egg</Button></div></div>
            <div className="flex justify-end mb-4"><Button onClick={() => setShowAssignmentForm(true)} className="bg-gradient-to-r from-emerald-500 to-teal-600"><Plus className="w-4 h-4 mr-2" />New Assignment</Button></div>
            <div className="space-y-3">{assignments.map((a) => { const creator = a.created_by ? users.find(u => u.userId === a.created_by) : null; const rewardEgg = a.lootEggId ? lootEggs.find(e => e.id === a.lootEggId) : null; return (<div key={a.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-center justify-between"><div className="flex-1 min-w-0"><h3 className="font-semibold text-white flex items-center gap-2 flex-wrap">{a.title}{!a.isApproved && <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">Pending</span>}{a.isFlagged && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">🚩 Flagged</span>}</h3><p className="text-sm text-slate-400">{a.subject === 'everyone' ? 'All Students' : `${a.subject}: ${a.target}`}{a.xpReward && ` • ${a.xpReward} XP`}{rewardEgg && ` • Egg: ${rewardEgg.emoji || '🥚'} ${rewardEgg.name}`}{a.dueDate && ` • Due: ${a.dueDate}`}{` • By: ${creator?.username || a.created_by || 'Unknown'}`}</p>{a.isFlagged && a.flagReason && <p className="text-xs text-red-400 mt-1">Reason: {a.flagReason}</p>}</div><div className="flex gap-2 flex-shrink-0">{a.isFlagged && <Button size="sm" onClick={async () => { await base44.entities.Assignment.update(a.id, { isFlagged: false, flagReason: null }); setAssignments(assignments.map(x => x.id === a.id ? { ...x, isFlagged: false, flagReason: null } : x)); toast.success('Flag cleared'); }} className="bg-emerald-600"><Check className="w-4 h-4 mr-1" />Clear</Button>}{!a.isApproved && can('manageAssignments') && <Button size="sm" onClick={() => handleApproveAssignment(a)} className="bg-emerald-600"><Check className="w-4 h-4 mr-1" />Approve</Button>}<Button size="sm" variant="ghost" onClick={() => setEditingAssignment({ ...a, lootEggId: a.lootEggId || 'none' })} className="text-slate-400 hover:text-white"><Edit2 className="w-4 h-4" /></Button>{(isSuperAdmin || permissions.deleteAssets || can('manageAssignments')) && <Button size="sm" variant="ghost" onClick={() => handleDeleteAssignment(a)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button>}</div></div>); })}</div>
          </TabsContent>

          <TabsContent value="ai"><div className="space-y-6"><GeneralImageGeneratorPanel /><IdeaGeneratorPanel adminProfile={adminProfile} onCreated={() => loadData()} /><BulkPetCreatorPanel /><CosmeticGeneratorPanel /><KitchenAIPanel /></div></TabsContent>

          {can('accessAI') && <TabsContent value="reward_ai"><RewardAIGenerator /></TabsContent>}

          <TabsContent value="petmojis"><div className="space-y-6"><BulkPetMojiCreatorPanel onCreated={() => loadData()} /><PetMojiGeneratorPanel /></div></TabsContent>

          <TabsContent value="pets">
            <div className="flex justify-end mb-4"><Button onClick={() => setShowPetForm(true)} className="bg-gradient-to-r from-purple-500 to-pink-600"><Plus className="w-4 h-4 mr-2" />New Pet</Button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{customPets.map((pet) => (<div key={pet.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-3">{pet.imageUrl ? <img src={pet.imageUrl} alt={pet.name} className="w-12 h-12 rounded-lg object-cover" /> : <span className="text-4xl">{pet.emoji}</span>}<div><h3 className="font-semibold text-white">{pet.name}</h3><p className="text-xs text-slate-400 capitalize">{pet.rarity} • {pet.isGiftOnly ? 'Gift Only' : `${pet.xpRequired} XP`}</p></div></div><div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => setEditingPet(pet)} className="text-slate-400 hover:text-white"><Edit2 className="w-4 h-4" /></Button>{(isSuperAdmin || permissions.deleteAssets) && <Button size="sm" variant="ghost" onClick={async () => { await base44.entities.CustomPet.delete(pet.id); setCustomPets(customPets.filter(p => p.id !== pet.id)); toast.success('Pet deleted'); }} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button>}</div></div>{pet.description && <p className="text-sm text-slate-500">{pet.description}</p>}<p className="text-xs text-slate-500 mt-1">By: {pet.createdBy || '—'} • {pet.created_date ? new Date(pet.created_date).toLocaleString() : '—'} • How: {pet.imageSource || '—'} • Tab: {pet.createdSourceTab || '—'}</p></div>))}{customPets.length === 0 && <div className="col-span-full text-center py-8 text-slate-400">No custom pets yet</div>}</div>
          </TabsContent>

          <TabsContent value="seasons">
            <SeasonPassGeneratorPanel adminProfile={adminProfile} customPets={customPets} customThemes={customThemes} onSeasonCreated={(s) => setSeasons([s, ...seasons])} />
            {seasons.filter(s => s.isActive).map(s => (
              <div key={s.id} className="mt-4">
                <PlusRewardsEditor season={s} customPets={customPets} customThemes={customThemes} adminProfile={adminProfile} onSeasonUpdated={(updated) => setSeasons(seasons.map(x => x.id === updated.id ? updated : x))} />
              </div>
            ))}
            <div className="flex justify-end mb-4"><Button onClick={() => setShowSeasonForm(true)} className="bg-gradient-to-r from-amber-500 to-orange-600"><Plus className="w-4 h-4 mr-2" />Manual Season</Button></div>
            <div className="space-y-4">{seasons.map((season) => (<div key={season.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700"><div className="flex items-center justify-between mb-2"><div><h3 className="font-semibold text-white flex items-center gap-2">{season.name}{season.isActive && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Active</span>}</h3><p className="text-xs text-slate-400">{season.startDate} to {season.endDate}</p></div>{isSuperAdmin && <Button size="sm" variant="ghost" onClick={() => handleDeleteSeason(season)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button>}</div>{season.rewards?.length > 0 && <div className="text-sm text-slate-400">{season.rewards.length} rewards configured</div>}</div>))}{seasons.length === 0 && <div className="text-center py-8 text-slate-400">No seasons yet</div>}</div>
          </TabsContent>

          {isSuperAdmin ? (<TabsContent value="eggs"><div className="space-y-6"><div className="bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-white/10"><div className="flex items-center gap-3 mb-4"><span className="text-4xl">🥚✨</span><div><h3 className="text-xl font-bold text-white">Admin Magic Egg</h3><p className="text-slate-400 text-sm">Create unlimited custom creatures with AI — runs on server so you won't lose progress</p></div></div><div className="space-y-4"><Textarea value={adminEggIdea} onChange={(e) => setAdminEggIdea(e.target.value)} placeholder="Describe your creature idea (for batch: describe a theme and we'll generate variations)..." className="bg-slate-800/50 border-white/10 text-white min-h-[100px]" /><div className="flex items-center gap-3"><Label className="text-slate-300 whitespace-nowrap">Count:</Label><div className="flex gap-1">{[1,2,3,4,5].map(n => (<Button key={n} size="sm" variant={adminEggCount === n ? 'default' : 'outline'} onClick={() => setAdminEggCount(n)} className={adminEggCount === n ? 'bg-purple-600' : 'border-slate-600 text-slate-300'}>{n}</Button>))}</div><span className="text-xs text-slate-500">{adminEggCount > 1 ? `Will create ${adminEggCount} creatures` : 'Single creature'}</span></div><ActiveEggJobs adminProfile={adminProfile} onComplete={() => loadData()} /><Button onClick={async () => { if (!adminEggIdea.trim()) { toast.error('Enter a creature idea!'); return; } setGeneratingAdminPet(true); try { const job = await base44.entities.EggGenerationJob.create({ idea: adminEggIdea.trim(), totalCount: adminEggCount, status: 'pending', startedBy: adminProfile?.userId || 'admin', startedByProfileId: adminProfile?.id, completedCount: 0, createdPetIds: [], createdThemeIds: [] }); base44.functions.invoke('generateMagicEggs', { jobId: job.id }); toast.success('Job started! Progress will update below.'); setAdminEggIdea(''); } catch (e) { toast.error('Failed to start job'); console.error(e); } setGeneratingAdminPet(false); }} disabled={generatingAdminPet} className="w-full bg-gradient-to-r from-purple-500 to-pink-500">{generatingAdminPet ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Starting...</> : <><Wand2 className="w-4 h-4 mr-2" />Create {adminEggCount > 1 ? `${adminEggCount} Creatures` : 'Creature'} with AI</>}</Button></div></div><div><h3 className="text-lg font-semibold text-white mb-4">User Magic Eggs ({magicEggs.length})</h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{magicEggs.map((egg) => { const owner = users.find(u => u.userId === egg.userId); return (<div key={egg.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="text-3xl">{egg.isUsed ? '🐣' : '🥚'}</span><div><p className="text-white font-medium">{owner?.username || 'Unknown'}</p><p className="text-xs text-slate-400">{egg.isUsed ? 'Hatched' : 'Unused'}{egg.source ? ` • ${egg.source.replace(/_/g,' ')}` : ''}</p></div></div>{(isSuperAdmin || permissions.deleteAssets) && <Button size="sm" variant="ghost" onClick={async () => { await base44.entities.MagicEgg.delete(egg.id); setMagicEggs(magicEggs.filter(e => e.id !== egg.id)); toast.success('Egg deleted'); }} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button>}</div></div>); })}{magicEggs.length === 0 && <div className="col-span-full text-center py-8 text-slate-400">No magic eggs yet</div>}</div></div></div></TabsContent>) : null}

          <TabsContent value="loot_eggs"><div className="bg-slate-800 rounded-2xl p-5 border border-slate-700"><LootEggManagerPanel users={users} customPets={customPets} customThemes={customThemes} /></div></TabsContent>

          <TabsContent value="events"><div className="space-y-6"><GlobalEventManager /><hr className="border-slate-700" /><AdminEventsPanel /></div></TabsContent>

          {can('manageKitchen') && <TabsContent value="kitchen"><div className="bg-slate-800 rounded-2xl p-5 border border-slate-700"><AdminKitchenPanel /></div></TabsContent>}

          <TabsContent value="themes">
            <div className="flex justify-end mb-4"><Button onClick={() => setShowThemeForm(true)} className="bg-gradient-to-r from-cyan-500 to-blue-600"><Plus className="w-4 h-4 mr-2" />New Theme</Button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{customThemes.map((theme) => (<div key={theme.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700"><div className="flex items-center justify-between mb-3"><div><h3 className="font-semibold text-white">{theme.name}</h3><p className="text-xs text-slate-400 capitalize">{theme.rarity} • {theme.xpRequired} XP</p></div>{(isSuperAdmin || permissions.deleteAssets) && <Button size="sm" variant="ghost" onClick={async () => { await base44.entities.CustomTheme.delete(theme.id); setCustomThemes(customThemes.filter(t => t.id !== theme.id)); toast.success('Theme deleted'); }} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button>}</div><div className="flex gap-2 mb-2"><div className="w-8 h-8 rounded" style={{ backgroundColor: theme.primaryColor }} /><div className="w-8 h-8 rounded" style={{ backgroundColor: theme.secondaryColor }} /><div className="w-8 h-8 rounded" style={{ backgroundColor: theme.accentColor }} /><div className="w-8 h-8 rounded border border-slate-600" style={{ backgroundColor: theme.bgColor }} /></div>{theme.description && <p className="text-sm text-slate-500">{theme.description}</p>}</div>))}{customThemes.length === 0 && <div className="col-span-full text-center py-8 text-slate-400">No custom themes yet</div>}</div>
          </TabsContent>

          <TabsContent value="shop">
            <div className="flex flex-wrap gap-2 justify-end mb-4"><Button onClick={() => setShowShopItemForm(true)} className="bg-purple-600">New Item</Button><Button onClick={() => setShowBundleForm(true)} className="bg-amber-600">New Bundle</Button><Button onClick={() => setShowManualPackForm(true)} className="bg-blue-600">Build Custom Pack</Button></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4"><div className="bg-slate-800 rounded-xl p-4 border border-slate-700"><h3 className="text-white font-semibold mb-2">Shop Items ({shopItems.length})</h3><div className="space-y-2 max-h-80 overflow-y-auto">{shopItems.length === 0 ? <div className="text-slate-400 text-sm">No items</div> : shopItems.map((item) => (<div key={item.id} className="flex items-center justify-between bg-slate-700/60 rounded-lg px-3 py-2"><div className="text-sm text-white">{item.name} • {item.itemType} • {item.price} 🪙</div><Button size="sm" variant="ghost" className="text-slate-300" onClick={() => setEditingShopItem(item)}>Edit</Button></div>))}</div></div><div className="bg-slate-800 rounded-xl p-4 border border-slate-700"><h3 className="text-white font-semibold mb-2">Bundles ({bundles.length})</h3><div className="space-y-2 max-h-80 overflow-y-auto">{bundles.length === 0 ? <div className="text-slate-400 text-sm">No bundles</div> : bundles.map((b) => (<div key={b.id} className="flex items-center justify-between bg-slate-700/60 rounded-lg px-3 py-2"><div className="text-sm text-white">{b.name} • {b.bundlePrice} 🪙</div><Button size="sm" variant="ghost" className="text-slate-300" onClick={() => setEditingBundle(b)}>Edit</Button></div>))}</div></div></div>
          </TabsContent>

          <TabsContent value="cosmetics">
            <div className="flex justify-end mb-4"><Button onClick={() => setShowCosmeticForm(true)} className="bg-gradient-to-r from-pink-500 to-purple-600"><Plus className="w-4 h-4 mr-2" />New Cosmetic</Button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{petCosmetics.map((c) => (<div key={c.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-3">{c.imageUrl && <img src={c.imageUrl} alt={c.name} className="w-12 h-12 object-contain" />}<div><h3 className="font-semibold text-white">{c.name}</h3><p className="text-xs text-slate-400 capitalize">{c.cosmeticType} • {c.rarity} • {c.price} 🪙</p></div></div>{(isSuperAdmin || permissions.deleteAssets) && <Button size="sm" variant="ghost" onClick={async () => { await base44.entities.PetCosmetic.delete(c.id); setPetCosmetics(petCosmetics.filter(x => x.id !== c.id)); toast.success('Cosmetic deleted'); }} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button>}</div>{c.description && <p className="text-sm text-slate-500">{c.description}</p>}</div>))}{petCosmetics.length === 0 && <div className="col-span-full text-center py-8 text-slate-400">No pet cosmetics yet</div>}</div>
          </TabsContent>

          <TabsContent value="booths"><BoothSkinManager /></TabsContent>
          <TabsContent value="analytics"><EconomyCharts /></TabsContent>
          <TabsContent value="email"><AdminEmailBroadcast /></TabsContent>
          {(isSuperAdmin || permissions.toggleAdminRole) && <TabsContent value="roles"><RolesManager /></TabsContent>}
          {(isSuperAdmin || can('manageSuperAssignments')) && <TabsContent value="super_assignments"><SuperAssignmentsAnalytics /></TabsContent>}
          {(isSuperAdmin || can('banFlagUsers')) && <TabsContent value="bans_flags"><BansAndFlagsPanel users={users} setUsers={setUsers} /></TabsContent>}

          <TabsContent value="locks"><div className="bg-slate-800 rounded-2xl p-5 border border-slate-700"><h3 className="text-white font-semibold mb-3">Global Feature Locks</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{['shop','market','battlePass','pets','xpGain'].map((k) => (<label key={k} className="flex items-center gap-2 bg-slate-700/60 rounded-lg px-3 py-2 text-sm text-slate-200"><input type="checkbox" checked={!!featureLocks.global?.[k]} onChange={(e) => setFeatureLocks({ ...featureLocks, global: { ...(featureLocks.global || {}), [k]: e.target.checked } })} />{k}</label>))}</div><div className="flex justify-end mt-4"><Button onClick={saveFeatureLocks} className="bg-emerald-600">Save Locks</Button></div></div></TabsContent>

          {can('manageEvents') && <TabsContent value="community_perms"><div className="bg-slate-800 rounded-2xl p-5 border border-slate-700"><CommunityChannelPermsPanel /></div></TabsContent>}
          {can('manageEvents') && <TabsContent value="moderation"><div className="bg-slate-800 rounded-2xl p-5 border border-slate-700"><CommunityModerationPanel /></div></TabsContent>}
          {can('managePets') && <TabsContent value="concepts"><div className="bg-slate-800 rounded-2xl p-5 border border-slate-700"><PetConceptReviewPanel customPets={customPets} setCustomPets={setCustomPets} customThemes={customThemes} setCustomThemes={setCustomThemes} /></div></TabsContent>}
          {isSuperAdmin && <TabsContent value="lore"><div className="bg-slate-800 rounded-2xl p-5 border border-slate-700"><LoreComicPanel /></div></TabsContent>}
          <TabsContent value="settings"><AdminSettingsPanel appSettings={appSettings} setAppSettings={setAppSettings} referralSettings={referralSettings} setReferralSettings={setReferralSettings} adminReferralLinks={adminReferralLinks} setAdminReferralLinks={setAdminReferralLinks} newLinkMaxUses={newLinkMaxUses} setNewLinkMaxUses={setNewLinkMaxUses} rewardLinks={rewardLinks} setRewardLinks={setRewardLinks} showRewardLinkForm={showRewardLinkForm} setShowRewardLinkForm={setShowRewardLinkForm} isSuperAdmin={isSuperAdmin} /></TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog open={showForceTrade} onOpenChange={setShowForceTrade}><DialogContent className="bg-slate-800 border-slate-700 text-white"><DialogHeader><DialogTitle>Force Trade (Admin)</DialogTitle></DialogHeader><div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-2"><div><Label>From User</Label><Select value={ftFrom} onValueChange={setFtFrom}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Select user" /></SelectTrigger><SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.username || u.userId}</SelectItem>)}</SelectContent></Select></div><div><Label>To User</Label><Select value={ftTo} onValueChange={setFtTo}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Select user" /></SelectTrigger><SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.username || u.userId}</SelectItem>)}</SelectContent></Select></div><div><Label>Item Type</Label><Select value={ftType} onValueChange={setFtType}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pet">Pet</SelectItem><SelectItem value="theme">Theme</SelectItem><SelectItem value="title">Title</SelectItem><SelectItem value="cosmetic">Cosmetic</SelectItem><SelectItem value="boothskin">Booth Skin</SelectItem></SelectContent></Select></div><div><Label>Item ID</Label><Input value={ftItemId} onChange={(e) => setFtItemId(e.target.value)} className="bg-slate-700 border-slate-600" placeholder="e.g. starter_slime" /></div></div><DialogFooter><Button variant="ghost" onClick={() => setShowForceTrade(false)}>Cancel</Button><Button onClick={async () => { if (!ftFrom || !ftTo || !ftItemId) return; const { data } = await base44.functions.invoke('adminForceTrade', { fromProfileId: ftFrom, toProfileId: ftTo, itemType: ftType, itemId: ftItemId }); if (data?.success) { setShowForceTrade(false); setFtFrom(''); setFtTo(''); setFtType('pet'); setFtItemId(''); } }} className="bg-red-600">Force Move</Button></DialogFooter></DialogContent></Dialog>

        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}><DialogContent className="bg-slate-800 border-slate-700 text-white"><DialogHeader><DialogTitle>Edit User: {selectedUser?.username}</DialogTitle></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label>Set XP</Label><div className="flex gap-2"><Input type="number" value={editXp} onChange={(e) => setEditXp(e.target.value)} className="bg-slate-700 border-slate-600" /><Button onClick={handleSetXp} className="bg-amber-600"><Save className="w-4 h-4 mr-1" />Set</Button></div></div><div className="space-y-2"><Label>Reset PIN</Label><div className="flex gap-2"><Input type="text" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="New 4-digit PIN" maxLength={4} className="bg-slate-700 border-slate-600" /><Button onClick={handleResetPin} className="bg-red-600"><Key className="w-4 h-4 mr-1" />Reset</Button></div></div></div></DialogContent></Dialog>

        <Dialog open={showAssignmentForm} onOpenChange={setShowAssignmentForm}><DialogContent className="bg-slate-800 border-slate-700 text-white"><DialogHeader><DialogTitle>Create Assignment</DialogTitle></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label>Title</Label><Input value={assignmentForm.title} onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })} className="bg-slate-700 border-slate-600" /></div><div className="space-y-2"><Label>Description</Label><Textarea value={assignmentForm.description} onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })} className="bg-slate-700 border-slate-600" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Subject</Label><Select value={assignmentForm.subject} onValueChange={(v) => setAssignmentForm({ ...assignmentForm, subject: v, target: v === 'everyone' ? 'everyone' : '' })}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="everyone">Everyone</SelectItem><SelectItem value="math">Math</SelectItem><SelectItem value="reading">Reading</SelectItem></SelectContent></Select></div>{assignmentForm.subject !== 'everyone' && <div className="space-y-2"><Label>Teacher</Label><Select value={assignmentForm.target} onValueChange={(v) => setAssignmentForm({ ...assignmentForm, target: v })}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Select teacher" /></SelectTrigger><SelectContent>{(assignmentForm.subject === 'math' ? MATH_TEACHERS : READING_TEACHERS).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>}</div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>XP Reward</Label><Input type="number" value={assignmentForm.xpReward} onChange={(e) => setAssignmentForm({ ...assignmentForm, xpReward: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" /></div><div className="space-y-2"><Label>Due Date</Label><Input type="date" value={assignmentForm.dueDate} onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })} className="bg-slate-700 border-slate-600" /></div></div><div className="space-y-2"><Label>Assignment Egg</Label><Select value={assignmentForm.lootEggId || 'none'} onValueChange={(v) => setAssignmentForm({ ...assignmentForm, lootEggId: v })}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Select loot egg" /></SelectTrigger><SelectContent><SelectItem value="none">No egg</SelectItem>{lootEggs.map((egg) => (<SelectItem key={egg.id} value={egg.id}>{egg.emoji || '🥚'} {egg.name}</SelectItem>))}</SelectContent></Select></div></div><DialogFooter><Button variant="ghost" onClick={() => setShowAssignmentForm(false)}>Cancel</Button><Button onClick={handleCreateAssignment} className="bg-emerald-600">Create Assignment</Button></DialogFooter></DialogContent></Dialog>

        <CreatePetDialog open={showPetForm} onOpenChange={setShowPetForm} adminProfile={adminProfile} onCreated={(p) => setCustomPets([p, ...customPets])} />
        <PetEditorDialog open={!!editingPet} pet={editingPet} onOpenChange={(o) => { if (!o) setEditingPet(null); }} onSaved={(u) => { setCustomPets(prev => prev.map(p => p.id === u.id ? u : p)); setEditingPet(null); }} />

        <Dialog open={showGiftDialog} onOpenChange={(open) => { setShowGiftDialog(open); if (!open) { setGiftUser(null); setGiftUsername(''); setGiftItemId(''); setGiftToAll(false); setGiftType('pet'); } }}><DialogContent className="bg-slate-800 border-slate-700 text-white"><DialogHeader><DialogTitle>Gift {giftToAll ? 'to ALL Users' : `to ${giftUser?.username || giftUsername || 'User'}`}</DialogTitle></DialogHeader><div className="space-y-4 py-4">{isSuperAdmin && <label className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 cursor-pointer"><input type="checkbox" checked={giftToAll} onChange={(e) => { setGiftToAll(e.target.checked); if (e.target.checked) { setGiftUser(null); setGiftUsername(''); } }} /><div><p className="text-sm text-amber-300 font-semibold">🎁 Gift to ALL users</p><p className="text-[10px] text-amber-400/70">Apply to every user at once</p></div></label>}{!giftToAll && <div className="space-y-2"><Label>Gift to Username</Label><div className="flex gap-2"><Input value={giftUsername} onChange={(e) => setGiftUsername(e.target.value)} placeholder="Enter username" className="bg-slate-700 border-slate-600" /><Button size="sm" variant="outline" onClick={resolveGiftRecipient} className="border-purple-500 text-purple-300">Find</Button></div>{giftUser && <p className="text-xs text-slate-400">Selected: <span className="text-purple-200">{giftUser.username}</span></p>}</div>}<div className="space-y-2"><Label>Gift Type</Label><Select value={giftType} onValueChange={(v) => { setGiftType(v); setGiftItemId(''); }}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="coins">Quest Coins</SelectItem><SelectItem value="gems">Gems 💎</SelectItem><SelectItem value="seasonxp">1Pass XP</SelectItem><SelectItem value="onepassplus">1Pass Plus</SelectItem><SelectItem value="pet">Pet</SelectItem><SelectItem value="theme">Theme</SelectItem><SelectItem value="cosmetic">Cosmetic</SelectItem><SelectItem value="boothskin">Booth Skin</SelectItem><SelectItem value="petmoji">Petmoji (Exclusive)</SelectItem></SelectContent></Select></div>{giftType === 'coins' && <div className="space-y-2"><Label>Quest Coins Amount</Label><Input type="number" value={giftItemId} onChange={(e) => setGiftItemId(e.target.value)} placeholder="100" className="bg-slate-700 border-slate-600" /></div>}{giftType === 'gems' && <div className="space-y-2"><Label>Gems Amount 💎</Label><Input type="number" value={giftItemId} onChange={(e) => setGiftItemId(e.target.value)} placeholder="5" className="bg-slate-700 border-slate-600" /></div>}{giftType === 'seasonxp' && <div className="space-y-2"><Label>1Pass XP Amount</Label><Input type="number" value={giftItemId} onChange={(e) => setGiftItemId(e.target.value)} placeholder="100" className="bg-slate-700 border-slate-600" /><p className="text-xs text-slate-400">This adds XP directly to the user's 1Pass progress.</p></div>}{giftType === 'onepassplus' && <div className="space-y-2"><Label>1Pass Plus</Label><div className="rounded-lg border border-yellow-400/30 bg-yellow-500/10 px-3 py-3 text-sm text-yellow-200">This gifts 1Pass Plus access to the selected user.</div></div>}{giftType !== 'coins' && giftType !== 'seasonxp' && giftType !== 'onepassplus' && <div className="space-y-2"><Label>Select {giftType}</Label><Select value={giftItemId} onValueChange={setGiftItemId}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder={`Select a ${giftType}`} /></SelectTrigger><SelectContent>{giftType === 'pet' ? <>{PETS.map(p => <SelectItem key={p.id} value={p.id}>{p.emoji||'🎁'} {p.name} (Built-in)</SelectItem>)}{customPets.map(p => <SelectItem key={p.id} value={`custom_${p.id}`}>{p.emoji||'🎁'} {p.name} (Custom)</SelectItem>)}</> : giftType === 'theme' ? <>{THEMES.map(t => <SelectItem key={t.id} value={t.id}>{t.name} (Built-in)</SelectItem>)}{customThemes.map(t => <SelectItem key={t.id} value={`custom_${t.id}`}>{t.name} (Custom)</SelectItem>)}</> : giftType === 'boothskin' ? <>{boothSkins.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</> : giftType === 'petmoji' ? <>{petMojiList.map(m => <SelectItem key={m.id} value={m.id}>{m.name} {m.isExclusive ? '✨' : ''}</SelectItem>)}</> : <>{petCosmetics.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.cosmeticType})</SelectItem>)}</>}</SelectContent></Select></div>}<div className="flex gap-2 pt-2">{isSuperAdmin && <Button variant="outline" size="sm" onClick={async () => { const r = resolveGiftRecipient(); if (!r) return; const petIds = [...PETS.map(p => p.id), ...customPets.map(p => `custom_${p.id}`)]; const themeIds = [...(r.unlockedThemes || []), ...customThemes.map(t => `custom_${t.id}`)]; const uniqueThemes = [...new Set(themeIds)]; await base44.entities.UserProfile.update(r.id, { unlockedPets: petIds, unlockedThemes: uniqueThemes }); setUsers(users.map(u => u.id === r.id ? { ...u, unlockedPets: petIds, unlockedThemes: uniqueThemes } : u)); toast.success('All pets + their themes gifted!'); }} className="flex-1 border-purple-500 text-purple-400">Gift ALL Pets</Button>}{isSuperAdmin && <Button variant="outline" size="sm" onClick={async () => { const r = resolveGiftRecipient(); if (!r) return; const ids = [...THEMES.map(t => t.id), ...customThemes.map(t => `custom_${t.id}`)]; await base44.entities.UserProfile.update(r.id, { unlockedThemes: ids }); setUsers(users.map(u => u.id === r.id ? { ...u, unlockedThemes: ids } : u)); toast.success('All themes gifted!'); }} className="flex-1 border-cyan-500 text-cyan-400">Gift ALL Themes</Button>}</div>{isSuperAdmin && <Button variant="outline" size="sm" onClick={async () => { const r = resolveGiftRecipient(); if (!r) return; await base44.entities.MagicEgg.create({ userId: r.userId, source: 'admin_gift', giftedBy: adminProfile?.userId, giftedByProfileId: adminProfile?.id }); toast.success('🥚 Magic Egg gifted!'); }} className="w-full border-amber-500 text-amber-400">🥚 Gift Magic Egg</Button>}</div><DialogFooter><Button variant="ghost" onClick={() => setShowGiftDialog(false)}>Cancel</Button><Button onClick={handleGiftItem} className="bg-purple-600">Send Gift</Button></DialogFooter></DialogContent></Dialog>

        <Dialog open={!!editingAssignment} onOpenChange={() => setEditingAssignment(null)}><DialogContent className="bg-slate-800 border-slate-700 text-white"><DialogHeader><DialogTitle>Edit Assignment</DialogTitle></DialogHeader>{editingAssignment && <div className="space-y-4 py-4"><div className="space-y-2"><Label>Title</Label><Input value={editingAssignment.title} onChange={(e) => setEditingAssignment({ ...editingAssignment, title: e.target.value })} className="bg-slate-700 border-slate-600" /></div><div className="space-y-2"><Label>Description</Label><Textarea value={editingAssignment.description || ''} onChange={(e) => setEditingAssignment({ ...editingAssignment, description: e.target.value })} className="bg-slate-700 border-slate-600" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>XP Reward</Label><Input type="number" value={editingAssignment.xpReward || 25} onChange={(e) => setEditingAssignment({ ...editingAssignment, xpReward: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" /></div><div className="space-y-2"><Label>Due Date</Label><Input type="date" value={editingAssignment.dueDate || ''} onChange={(e) => setEditingAssignment({ ...editingAssignment, dueDate: e.target.value })} className="bg-slate-700 border-slate-600" /></div></div><div className="space-y-2"><Label>Assignment Egg</Label><Select value={editingAssignment.lootEggId || 'none'} onValueChange={(v) => setEditingAssignment({ ...editingAssignment, lootEggId: v })}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Select loot egg" /></SelectTrigger><SelectContent><SelectItem value="none">No egg</SelectItem>{lootEggs.map((egg) => (<SelectItem key={egg.id} value={egg.id}>{egg.emoji || '🥚'} {egg.name}</SelectItem>))}</SelectContent></Select></div></div>}<DialogFooter><Button variant="ghost" onClick={() => setEditingAssignment(null)}>Cancel</Button><Button onClick={handleUpdateAssignment} className="bg-emerald-600">Save Changes</Button></DialogFooter></DialogContent></Dialog>

        <Dialog open={showSeasonForm} onOpenChange={setShowSeasonForm}><DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Create Season</DialogTitle></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label>Season Name</Label><Input value={seasonForm.name} onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })} placeholder="Spring 2024" className="bg-slate-700 border-slate-600" /></div><div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Start Date</Label><Input type="date" value={seasonForm.startDate} onChange={(e) => setSeasonForm({ ...seasonForm, startDate: e.target.value })} className="bg-slate-700 border-slate-600" /></div><div className="space-y-2"><Label>End Date</Label><Input type="date" value={seasonForm.endDate} onChange={(e) => setSeasonForm({ ...seasonForm, endDate: e.target.value })} className="bg-slate-700 border-slate-600" /></div></div><div className="space-y-2"><div className="flex items-center justify-between"><Label>Season Rewards</Label><Button size="sm" onClick={addSeasonReward} className="bg-amber-600"><Plus className="w-3 h-3 mr-1" /> Add Reward</Button></div><div className="space-y-3">{seasonForm.rewards.map((reward, index) => (<div key={index} className="bg-slate-700 rounded-lg p-3 space-y-2"><div className="flex items-center justify-between"><span className="text-sm text-slate-300">Reward {index + 1}</span><Button size="sm" variant="ghost" onClick={() => removeSeasonReward(index)} className="text-red-400 h-6 px-2"><X className="w-3 h-3" /></Button></div><div className="grid grid-cols-2 gap-2"><Input placeholder="Name" value={reward.name} onChange={(e) => updateSeasonReward(index, 'name', e.target.value)} className="bg-slate-600 border-slate-500 text-sm" /><Input type="number" placeholder="XP Required" value={reward.xpRequired} onChange={(e) => updateSeasonReward(index, 'xpRequired', parseInt(e.target.value) || 0)} className="bg-slate-600 border-slate-500 text-sm" /></div><div className="grid grid-cols-2 gap-2"><Select value={reward.type} onValueChange={(v) => updateSeasonReward(index, 'type', v)}><SelectTrigger className="bg-slate-600 border-slate-500 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pet">Pet</SelectItem><SelectItem value="theme">Theme</SelectItem><SelectItem value="title">Title</SelectItem><SelectItem value="food">Food</SelectItem></SelectContent></Select>{reward.type === 'food' ? <Input placeholder="Food Item ID" value={reward.value} onChange={(e) => updateSeasonReward(index, 'value', e.target.value)} className="bg-slate-600 border-slate-500 text-sm" /> : reward.type === 'pet' ? <Select value={reward.value} onValueChange={(v) => updateSeasonReward(index, 'value', v)}><SelectTrigger className="bg-slate-600 border-slate-500 text-sm"><SelectValue placeholder="Select pet" /></SelectTrigger><SelectContent>{customPets.map(p => <SelectItem key={p.id} value={`custom_${p.id}`}>{p.emoji||'🎁'} {p.name}</SelectItem>)}</SelectContent></Select> : reward.type === 'theme' ? <Select value={reward.value} onValueChange={(v) => updateSeasonReward(index, 'value', v)}><SelectTrigger className="bg-slate-600 border-slate-500 text-sm"><SelectValue placeholder="Select theme" /></SelectTrigger><SelectContent>{customThemes.map(t => <SelectItem key={t.id} value={`custom_${t.id}`}>{t.name}</SelectItem>)}</SelectContent></Select> : <Input placeholder="Title text" value={reward.value} onChange={(e) => updateSeasonReward(index, 'value', e.target.value)} className="bg-slate-600 border-slate-500 text-sm" />}</div></div>))}{seasonForm.rewards.length === 0 && <p className="text-sm text-slate-500 text-center py-2">No rewards added yet</p>}</div></div></div><DialogFooter><Button variant="ghost" onClick={() => setShowSeasonForm(false)}>Cancel</Button><Button onClick={handleCreateSeason} className="bg-amber-600">Create Season</Button></DialogFooter></DialogContent></Dialog>

        <CreateShopItemDialog open={showShopItemForm} onOpenChange={setShowShopItemForm} form={shopItemForm} setForm={setShopItemForm} customPets={customPets} customThemes={customThemes} isSuperAdmin={isSuperAdmin} onCreated={(i) => setShopItems([i, ...shopItems])} />
        <EditShopItemDialog item={editingShopItem} onOpenChange={(v) => { if (!v) setEditingShopItem(null); }} onSaved={(u) => { setShopItems(shopItems.map(i => i.id === u.id ? u : i)); setEditingShopItem(null); }} />
        <ManualPackDialog open={showManualPackForm} onOpenChange={setShowManualPackForm} form={manualPackForm} setForm={setManualPackForm} shopItems={shopItems} onCreated={(b) => setBundles([b, ...bundles])} />
        <BundleFormDialog open={showBundleForm} onOpenChange={setShowBundleForm} form={bundleForm} setForm={setBundleForm} onCreated={(b) => setBundles([b, ...bundles])} />
        <EditBundleDialog bundle={editingBundle} onOpenChange={(v) => { if (!v) setEditingBundle(null); }} onSaved={(u) => { setBundles(bundles.map(b => b.id === u.id ? u : b)); setEditingBundle(null); }} />
        <RewardLinkFormDialog open={showRewardLinkForm} onOpenChange={setShowRewardLinkForm} form={rewardLinkForm} setForm={(f) => typeof f === 'function' ? setRewardLinkForm(f) : setRewardLinkForm(f)} isSuperAdmin={isSuperAdmin} customPets={customPets} customThemes={customThemes} onCreated={(l) => setRewardLinks([l, ...rewardLinks])} />
        <CosmeticFormDialog open={showCosmeticForm} onOpenChange={setShowCosmeticForm} form={cosmeticForm} setForm={setCosmeticForm} onCreated={(c) => setPetCosmetics([c, ...petCosmetics])} />
        <NewThemeDialog open={showThemeForm} onOpenChange={setShowThemeForm} themeForm={themeForm} setThemeForm={setThemeForm} onCreateTheme={async () => { if (!themeForm.name.trim()) { toast.error('Please enter a name'); return; } const n = await base44.entities.CustomTheme.create(themeForm); setCustomThemes([n, ...customThemes]); setShowThemeForm(false); setThemeForm({ name: '', rarity: 'common', xpRequired: 0, description: '', primaryColor: '#6366f1', secondaryColor: '#8b5cf6', accentColor: '#f59e0b', bgColor: '#f8fafc' }); toast.success('Theme created!'); }} />
      </div>
    </div>
  );
}