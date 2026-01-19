import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ArrowLeft, Search, Users, ClipboardList, Plus, 
  Lock, Unlock, Eye, EyeOff, Key, Zap, Check, X, Edit2, Save,
  Palette, Star, Image, Trash2, Gift, Calendar, Sparkles
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

const ADMIN_PIN = '1234'; // In production, this would be hashed and stored server-side

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

  useEffect(() => {
    // Check if already authenticated
    const adminAuth = localStorage.getItem('quest_admin_auth');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
      loadData();
    }
  }, []);

  const handleAdminLogin = () => {
    // Simple PIN verification (in production, this would be server-side with hashing)
    if (adminPin === ADMIN_PIN) {
      setIsAuthenticated(true);
      localStorage.setItem('quest_admin_auth', 'true');
      loadData();
    } else {
      toast.error('Invalid admin PIN');
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, allAssignments, allPets, allThemes, allSeasons] = await Promise.all([
        base44.entities.UserProfile.list('-created_date'),
        base44.entities.Assignment.list('-created_date'),
        base44.entities.CustomPet.list('-created_date'),
        base44.entities.CustomTheme.list('-created_date'),
        base44.entities.Season.list('-created_date')
      ]);
      setUsers(allUsers);
      setAssignments(allAssignments);
      setCustomPets(allPets);
      setCustomThemes(allThemes);
      setSeasons(allSeasons);
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

  const handleGiftItem = async () => {
    if (!giftUser || !giftItemId) {
      toast.error('Please select an item to gift');
      return;
    }
    try {
      if (giftType === 'pet') {
        const unlockedPets = [...(giftUser.unlockedPets || [])];
        if (!unlockedPets.includes(giftItemId)) {
          unlockedPets.push(giftItemId);
          await base44.entities.UserProfile.update(giftUser.id, { unlockedPets });
          setUsers(users.map(u => u.id === giftUser.id ? { ...u, unlockedPets } : u));
        }
      } else {
        const unlockedThemes = [...(giftUser.unlockedThemes || [])];
        if (!unlockedThemes.includes(giftItemId)) {
          unlockedThemes.push(giftItemId);
          await base44.entities.UserProfile.update(giftUser.id, { unlockedThemes });
          setUsers(users.map(u => u.id === giftUser.id ? { ...u, unlockedThemes } : u));
        }
      }
      toast.success(`${giftType === 'pet' ? 'Pet' : 'Theme'} gifted to ${giftUser.username}!`);
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
            <p className="text-slate-400 mt-2">Enter admin PIN to continue</p>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Admin PIN</Label>
                <Input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  maxLength={4}
                  className="h-12 bg-slate-700 border-slate-600 text-white text-center text-2xl tracking-[0.5em] font-mono"
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
                          </h3>
                          <p className="text-sm text-slate-400">
                            Math: {user.mathTeacher} • Reading: {user.readingTeacher}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-amber-400 font-bold">{user.xp || 0} XP</p>
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
                          >
                            <Gift className="w-4 h-4" />
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
                    <div>
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        {assignment.title}
                        {!assignment.isApproved && (
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                            Pending
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
                    </div>
                    <div className="flex gap-2">
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
                <Label>Or Upload Image</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="bg-slate-700 border-slate-600"
                  />
                  {petForm.imageUrl && (
                    <img src={petForm.imageUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                  )}
                </div>
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
                    <SelectItem value="pet">Pet</SelectItem>
                    <SelectItem value="theme">Theme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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