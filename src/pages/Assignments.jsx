import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, ArrowLeft, CheckCircle, Plus, AlertTriangle, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import AssignmentCard from '@/components/quest/AssignmentCard';
import SuperAssignmentCard from '@/components/quest/SuperAssignmentCard';
import GlassIcon from '@/components/ui/GlassIcon';
import Tutorial from '@/components/tutorial/Tutorial';
import DailyRewardClaim from '@/components/rewards/DailyRewardClaim';

 import { toast } from 'sonner';
import { PETS, getRandomPet } from '@/components/quest/PetCatalog';
import PetClearanceEventModal from '@/components/events/PetClearanceEventModal';

export default function Assignments() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [superAssignments, setSuperAssignments] = useState([]);
  const [superResponses, setSuperResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '', subject: 'everyone' });
  const [submitting, setSubmitting] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);
  const [dailyConfig, setDailyConfig] = useState(null);
  const [dailyProgress, setDailyProgress] = useState(null);
  const [showDailyClaim, setShowDailyClaim] = useState(false);
  const [creatorMap, setCreatorMap] = useState({});
  const [lootEggsById, setLootEggsById] = useState({});
  const [showPetClearance, setShowPetClearance] = useState(false);


   useEffect(() => {
    loadData();
    base44.analytics.track({ eventName: 'assignments_viewed' });
  }, []);

  const loadData = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) {
      navigate(createPageUrl('Home'));
      setLoading(false);
      return;
    }

    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0) {
        navigate(createPageUrl('Home'));
        setLoading(false);
        return;
      }

      const p = profiles[0];
      setProfile(p);

      // Load daily rewards config
      const settings = await base44.entities.AppSetting.list();
      const dr = settings.find(s => s.key === 'daily_rewards_config');
      setDailyConfig(dr ? dr.value : null);

      // Load or init progress
      const progList = await base44.entities.DailyRewardProgress.filter({ userProfileId: p.id });
      if (progList.length > 0) {
        setDailyProgress(progList[0]);
        const today = new Date().toISOString().split('T')[0];
        if (progList[0].eligible && progList[0].eligibleDate === today && progList[0].lastClaimDate !== today) {
          setShowDailyClaim(true);
        }
      }

       // Show one-time warning if flagged and not acknowledged
      if (p.flagged && !p.flagAcknowledged) {
        setShowFlagDialog(true);
      }

      // Load all assignments (approved by default now)
      const allAssignments = await base44.entities.Assignment.list('-created_date');
      const today = new Date().toISOString().split('T')[0];
      
      // Filter out expired assignments and delete them
      const expiredIds = [];
      const visible = allAssignments.filter(a => {
        // Check if past due date
        if (a.dueDate && a.dueDate < today) {
          expiredIds.push(a.id);
          return false;
        }
        if (a.target === 'everyone' || a.subject === 'everyone') return true;
        if (a.subject === 'math' && a.target === p.mathTeacher) return true;
        if (a.subject === 'reading' && a.target === p.readingTeacher) return true;
        if (a.target === 'Admin' && (p.rank === 'admin' || p.rank === 'super_admin' || p.mathTeacher === 'Admin' || p.readingTeacher === 'Admin')) return true;
        return false;
      });
      
      // Auto-delete expired assignments
      for (const id of expiredIds) {
        base44.entities.Assignment.delete(id).catch(() => {});
      }
      
      setAssignments(visible);

      // Build creator map from all users
      const [allUsers, allLootEggs, assignmentSettings] = await Promise.all([
        base44.entities.UserProfile.list(),
        base44.entities.LootEgg.list('-created_date'),
        base44.entities.AppSetting.list()
      ]);
      const cMap = {};
      allUsers.forEach(u => { cMap[u.userId] = u.username; });
      setCreatorMap(cMap);
      const eggMap = {};
      allLootEggs.forEach(egg => { eggMap[egg.id] = egg; });
      const defaultAssignmentEggId = assignmentSettings.find(s => s.key === 'default_assignment_loot_egg')?.value?.lootEggId;
      if (defaultAssignmentEggId) {
        eggMap.__defaultAssignmentEggId = defaultAssignmentEggId;
      }
      setLootEggsById(eggMap);

      // Load Super Assignments for this user
      const [allSuper, userResponses] = await Promise.all([
        base44.entities.SuperAssignment.list('-created_date'),
        base44.entities.SuperAssignmentResponse.filter({ userProfileId: p.id })
      ]);
      const now = new Date();
      const visibleSuper = allSuper.filter((sa) => {
        if (sa.isActive === false) return false;
        if (sa.startDate && new Date(sa.startDate) > now) return false;
        if (sa.endDate && new Date(sa.endDate) < now) return false;
        if (sa.recipientsScope === 'everyone') return true;
        if (sa.recipientsScope === 'class') {
          if (sa.subject === 'math' && sa.targetTeacher === p.mathTeacher) return true;
          if (sa.subject === 'reading' && sa.targetTeacher === p.readingTeacher) return true;
          return false;
        }
        if (sa.recipientsScope === 'users') {
          return Array.isArray(sa.specificUserProfileIds) && sa.specificUserProfileIds.includes(p.id);
        }
        return false;
      });
      setSuperAssignments(visibleSuper);
      setSuperResponses(userResponses);
    } catch (e) {
      console.error('Error loading data:', e);
    }
    setLoading(false);
  };

  const handleAddAssignment = async () => {
    if (profile?.isBanned) {
      toast.error(`Sorry, you are banned${profile.banReason ? `: ${profile.banReason}` : ''}. Unbans at ${profile.banEndDate ? new Date(profile.banEndDate).toLocaleString() : 'N/A'}. For appeals contact an admin.`);
      return;
    }
    if (!newAssignment.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    
    setSubmitting(true);
    try {
      // Set target based on subject and user's teacher
      let target = 'everyone';
      if (newAssignment.subject === 'math') {
        target = profile.mathTeacher;
      } else if (newAssignment.subject === 'reading') {
        target = profile.readingTeacher;
      }

      const assignment = await base44.entities.Assignment.create({
        title: newAssignment.title,
        description: newAssignment.description,
        subject: newAssignment.subject,
        target: target,
        xpReward: 25,
        dueDate: newAssignment.dueDate || null,
        isApproved: true
      });

      toast.success('Assignment added!');
      
      setAssignments((prevAssignments) => [assignment, ...prevAssignments]);
      setShowAddForm(false);
      setNewAssignment({ title: '', description: '', dueDate: '', subject: 'everyone' });
    } catch (e) {
      toast.error('Failed to submit assignment');
    }
    setSubmitting(false);
  };

  const handleComplete = async (assignment) => {
    if (!profile) return;

    try {
      const completedAssignments = [...(profile.completedAssignments || []), assignment.id];
      let xpToAdd = 25;
      let coinsToAdd = 1;
      if (profile.isBanned) { xpToAdd = 0; coinsToAdd = 0; }

      // Auto-flag rule: posted during school hours and completed within 30 minutes during school hours
      const createdAt = assignment.created_date ? new Date(assignment.created_date) : null;
      const now = new Date();
      const minutesSincePost = createdAt ? Math.floor((now.getTime() - createdAt.getTime()) / 60000) : null;
      const timeToMinutes = (d) => d.getHours() * 60 + d.getMinutes();
      const schoolStartMin = 8 * 60 + 30; // 8:30
      const schoolEndMin = 14 * 60 + 50;  // 2:50
      const nowMin = timeToMinutes(now);
      const postedMin = createdAt ? timeToMinutes(createdAt) : null;

      const postedDuringSchool = createdAt ? (postedMin >= schoolStartMin && postedMin <= schoolEndMin) : false;
      const nowDuringSchool = nowMin >= schoolStartMin && nowMin <= schoolEndMin;
      const shouldFlagUser = Boolean(createdAt && postedDuringSchool && nowDuringSchool && minutesSincePost !== null && minutesSincePost <= 30);

      const newXp = (profile.xp || 0) + xpToAdd;
      const newCoins = (profile.questCoins || 0) + coinsToAdd;

      // Track season-specific XP
      let seasonXpUpdate = {};
      try {
        const activeSeasons = await base44.entities.Season.filter({ isActive: true });
        if (activeSeasons.length > 0) {
          const activeSeason = activeSeasons[0];
          const now = new Date();
          const seasonStart = new Date(activeSeason.startDate);
          const seasonEnd = new Date(activeSeason.endDate);
          if (now >= seasonStart && now <= seasonEnd) {
            // If tracking a different season, reset seasonXp
            if (profile.activeSeasonId !== activeSeason.id) {
              seasonXpUpdate = { seasonXp: xpToAdd, activeSeasonId: activeSeason.id };
            } else {
              seasonXpUpdate = { seasonXp: (profile.seasonXp || 0) + xpToAdd };
            }
          }
        }
      } catch (e) {
        console.error('Error updating season XP:', e);
      }
      
      // Get a random pet as reward
      const currentPets = profile.unlockedPets || ['starter_slime'];
      const randomPet = getRandomPet(currentPets);
      const isNewPet = !currentPets.includes(randomPet.id);
      const newUnlockedPets = (isNewPet && !profile.isBanned) ? [...currentPets, randomPet.id] : currentPets;

      const userUpdate = {
        xp: newXp,
        questCoins: newCoins,
        completedAssignments,
        unlockedPets: newUnlockedPets,
        ...seasonXpUpdate
      };
      if (shouldFlagUser && !profile.flagged) {
        userUpdate.flagged = true;
        userUpdate.flagMessage = 'Unnatural completion detected: finished within 30 minutes during school hours';
        userUpdate.flagAcknowledged = false;
      }
      await base44.entities.UserProfile.update(profile.id, userUpdate);

      setProfile({
        ...profile,
        xp: newXp,
        questCoins: newCoins,
        completedAssignments,
        unlockedPets: newUnlockedPets,
        flagged: shouldFlagUser ? true : profile.flagged,
        flagMessage: shouldFlagUser ? 'Unnatural completion detected: finished within 30 minutes during school hours' : profile.flagMessage,
        flagAcknowledged: shouldFlagUser ? false : profile.flagAcknowledged
      });

      // Mark daily reward eligibility (manual claim)
      try {
        const today = new Date().toISOString().split('T')[0];
        let progList = await base44.entities.DailyRewardProgress.filter({ userProfileId: profile.id });
        if (progList.length === 0) {
          const created = await base44.entities.DailyRewardProgress.create({ userProfileId: profile.id, eligible: true, eligibleDate: today, streakCount: 0, currentIndex: 0 });
          setDailyProgress(created);
          setShowDailyClaim(true);
        } else {
          const prog = progList[0];
          // Only show popup if not already claimed today
          if (prog.lastClaimDate !== today) {
            await base44.entities.DailyRewardProgress.update(prog.id, { eligible: true, eligibleDate: today });
            setDailyProgress({ ...prog, eligible: true, eligibleDate: today });
            setShowDailyClaim(true);
          }
        }
      } catch (e) {
        // ignore
      }

       // Contribute to global event jar
      if (xpToAdd > 0) {
        base44.functions.invoke('contributeGlobalXP', {
          xpAmount: xpToAdd,
          userProfileId: profile.id
        }).catch(() => {}); // fire-and-forget
      }

      let assignmentEgg = null;
      const awardedLootEggId = assignment.lootEggId || lootEggsById.__defaultAssignmentEggId;
      if (awardedLootEggId && !profile.isBanned) {
        assignmentEgg = lootEggsById[awardedLootEggId] || null;
        await base44.entities.LootEggDrop.create({
          lootEggId: awardedLootEggId,
          profileId: profile.id,
          username: profile.username,
          source: 'assignment_completion',
          assignmentId: assignment.id
        });
      }

      // Track XP gain
      base44.analytics.track({
        eventName: "assignment_completed_xp_gained",
        properties: {
          xp_gained: xpToAdd,
          assignment_title: assignment.title,
          assignment_subject: assignment.subject,
          new_total_xp: newXp,
          new_pet_unlocked: isNewPet
        }
      });

      toast.success(`+25 XP & +1 Quest Coin earned!`, {
        description: `Assignment "${assignment.title}" completed${assignmentEgg ? ` • Received ${assignmentEgg.emoji || '🥚'} ${assignmentEgg.name}` : ''}${shouldFlagUser ? ' • (Flag set for review)' : ''}`
      });

      // Pet Clearance Event: 5% chance, once per session (admin or ?testAd=1 always shows)
      const urlParams = new URLSearchParams(window.location.search);
      const isAdmin = profile.rank === 'admin' || profile.rank === 'super_admin';
      const forceShow = urlParams.get('testAd') === '1' || isAdmin;
      const alreadyShownThisSession = sessionStorage.getItem('petClearanceShown') === '1';
      if (!alreadyShownThisSession && !profile.isBanned && (forceShow || Math.random() < 0.05)) {
        sessionStorage.setItem('petClearanceShown', '1');
        setTimeout(() => setShowPetClearance(true), 800);
      }

      if (isNewPet && !profile.isBanned) {
        setTimeout(() => {
          toast.success(`${randomPet.emoji} New pet unlocked: ${randomPet.name}!`, {
            description: `You got a ${randomPet.rarity} pet with its own exclusive theme!`,
            duration: 5000
          });
        }, 500);
      } else if (!profile.isBanned) {
        setTimeout(() => {
          toast(`${randomPet.emoji} You already have ${randomPet.name}`, {
            description: 'Keep completing assignments to collect more pets!'
          });
        }, 500);
      }
    } catch (e) {
      console.error('Error completing assignment:', e);
      toast.error('Failed to complete assignment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!profile) return null;

  const completedIds = profile.completedAssignments || [];
  const filteredAssignments = assignments.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !completedIds.includes(a.id);
    if (filter === 'completed') return completedIds.includes(a.id);
    return a.subject === filter;
  });

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 lg:px-8 xl:px-12 2xl:px-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-2"
        >
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <GlassIcon icon={ClipboardList} color="emerald" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Assignments</h1>
              <p className="text-sm text-slate-500">Complete quests to earn XP</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="bg-gradient-to-r from-emerald-500 to-teal-600"
            data-tutorial="add-assignment"
            disabled={profile?.isBanned}
          >
            <Plus className="w-4 h-4 mr-1" />
            ADD
          </Button>
        </motion.div>

        {profile.isBanned && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3">
            <div className="font-semibold">Sorry, you have been BANNED{profile.banReason ? ` for ${profile.banReason}` : ''}.</div>
            <div>Unbanned at: {profile.banEndDate ? new Date(profile.banEndDate).toLocaleString() : 'N/A'} • For appeals contact an admin.</div>
          </div>
        )}

         {/* Add Assignment Dialog */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add an Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  placeholder="Assignment title + subject (e.g. Math: Chapter 5 Review)"
                />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={newAssignment.subject}
                  onValueChange={(value) => setNewAssignment({ ...newAssignment, subject: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="math">Math</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  placeholder="Add details about the assignment (optional)"
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date (optional)</Label>
                <Input
                  type="date"
                  value={newAssignment.dueDate}
                  onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button onClick={handleAddAssignment} disabled={submitting || profile?.isBanned} className="bg-emerald-600">
                {submitting ? 'Adding...' : 'Add Assignment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>



        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="bg-white shadow-sm border border-slate-100 p-1 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
              <TabsTrigger value="pending" className="rounded-lg">Pending</TabsTrigger>
              <TabsTrigger value="completed" className="rounded-lg">Completed</TabsTrigger>
              <TabsTrigger value="math" className="rounded-lg">Math</TabsTrigger>
              <TabsTrigger value="reading" className="rounded-lg">Reading</TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>

        {/* Stats - Liquid Glass */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/5" />
            <div className="flex items-center gap-2 relative z-10">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-2xl font-bold text-slate-800">{completedIds.length}</span>
            </div>
            <p className="text-sm text-slate-500 relative z-10">Completed</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/10 to-slate-500/5" />
            <div className="flex items-center gap-2 relative z-10">
              <ClipboardList className="w-5 h-5 text-slate-400" />
              <span className="text-2xl font-bold text-slate-800">
                {Math.max(0, assignments.length - completedIds.filter(id => assignments.some(a => a.id === id)).length)}
              </span>
            </div>
            <p className="text-sm text-slate-500 relative z-10">Remaining</p>
          </div>
        </motion.div>

        {/* Super Assignments Section */}
        {superAssignments.length > 0 && (
          <div className="space-y-4 mb-6">
            <h2 className="text-lg font-semibold text-slate-800">Super Assignments</h2>
            <AnimatePresence>
              {superAssignments.map((sa, index) => (
                <motion.div
                  key={sa.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <SuperAssignmentCard
                    assignment={sa}
                    profile={profile}
                    userResponse={superResponses.find(r => r.assignmentId === sa.id && r.userProfileId === profile.id)}
                    onResponded={(resp) => {
                      setSuperResponses(prev => {
                        const filtered = prev.filter(r => !(r.assignmentId === sa.id && r.userProfileId === profile.id));
                        return [resp, ...filtered];
                      });
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Daily Reward Banner */}
         {dailyConfig && dailyProgress && dailyProgress.eligible && (
           <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
             <div className="flex items-center gap-2 text-emerald-700">
               <Gift className="w-4 h-4" />
               <span>Daily reward ready to claim!</span>
             </div>
             <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowDailyClaim(true)}>Claim</Button>
           </div>
         )}

        {/* Assignment List */}
         <div className="space-y-4">
          <AnimatePresence>
            {filteredAssignments.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 bg-white rounded-2xl border border-slate-100"
              >
                <ClipboardList className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p className="text-slate-500">No assignments found</p>
              </motion.div>
            ) : (
              filteredAssignments.map((assignment, index) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <AssignmentCard
                    assignment={assignment}
                    isCompleted={completedIds.includes(assignment.id)}
                    onComplete={handleComplete}
                    creatorName={creatorMap[assignment.created_by] || assignment.created_by || 'Unknown'}
                  />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* One-time Flag Warning */}
      <Dialog open={showFlagDialog} onOpenChange={(v) => setShowFlagDialog(v)}>
        <DialogContent>
          <DialogHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <DialogTitle>Warning</DialogTitle>
          </DialogHeader>
          <div className="text-slate-600 text-center whitespace-pre-wrap">
            {profile?.flagMessage || '⚠️ Please NO spam assignments. More violations can lead to bans or account loss.'}
          </div>
          <DialogFooter className="justify-center">
            <Button
              onClick={async () => {
                if (!profile) return;
                try {
                  await base44.entities.UserProfile.update(profile.id, { flagAcknowledged: true });
                  setProfile({ ...profile, flagAcknowledged: true });
                  setShowFlagDialog(false);
                } catch (e) {
                  // ignore
                }
              }}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tutorial */}
       <Tutorial profile={profile} currentPage="Assignments" onComplete={() => {}} />

       {/* Claim Dialog */}
       <DailyRewardClaim
         open={showDailyClaim}
         onOpenChange={setShowDailyClaim}
         profile={profile}
         progress={dailyProgress}
         config={dailyConfig}
         onClaimed={(p) => setDailyProgress(prev => ({ ...prev, ...p }))}
       />

      {/* Pet Clearance Event Modal */}
      <PetClearanceEventModal
        open={showPetClearance}
        onClose={() => setShowPetClearance(false)}
        onClaim={async (pet) => {
          const profileId = localStorage.getItem('quest_profile_id');
          if (!profileId) return;
          // Re-fetch fresh profile to avoid stale closure
          const profiles = await base44.entities.UserProfile.filter({ id: profileId });
          if (profiles.length === 0) return;
          const freshProfile = profiles[0];
          const petKey = pet.id;
          const currentPets = freshProfile.unlockedPets || [];
          const alreadyOwned = currentPets.includes(petKey);
          const newUnlockedPets = alreadyOwned ? currentPets : [...currentPets, petKey];
          const newFakeAdClicks = (freshProfile.fakeAdClicks || 0) + 1;
          await base44.entities.UserProfile.update(freshProfile.id, {
            unlockedPets: newUnlockedPets,
            fakeAdClicks: newFakeAdClicks
          });
          setProfile(prev => ({ ...prev, unlockedPets: newUnlockedPets, fakeAdClicks: newFakeAdClicks }));
          base44.analytics.track({ eventName: 'fake_ad_pet_claimed', properties: { pet_id: petKey, fake_ad_clicks: newFakeAdClicks } });
        }}
      />
      </div>
      );
}