import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, ArrowLeft, CheckCircle, Plus, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import AssignmentCard from '@/components/quest/AssignmentCard';
import GlassIcon from '@/components/ui/GlassIcon';
import Tutorial from '@/components/tutorial/Tutorial';

import { toast } from 'sonner';
import { PETS, getRandomPet } from '@/components/quest/PetCatalog';

export default function Assignments() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '', subject: 'everyone' });
  const [submitting, setSubmitting] = useState(false);
  const [showFlagDialog, setShowFlagDialog] = useState(false);


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
        return false;
      });
      
      // Auto-delete expired assignments
      for (const id of expiredIds) {
        base44.entities.Assignment.delete(id).catch(() => {});
      }
      
      setAssignments(visible);
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
      const newXp = (profile.xp || 0) + xpToAdd;
      const newCoins = (profile.questCoins || 0) + coinsToAdd;
      
      // Get a random pet as reward
      const currentPets = profile.unlockedPets || ['starter_slime'];
      const randomPet = getRandomPet(currentPets);
      const isNewPet = !currentPets.includes(randomPet.id);
      const newUnlockedPets = isNewPet ? [...currentPets, randomPet.id] : currentPets;

      await base44.entities.UserProfile.update(profile.id, {
        xp: newXp,
        questCoins: newCoins,
        completedAssignments,
        unlockedPets: newUnlockedPets
      });

      setProfile({
        ...profile,
        xp: newXp,
        questCoins: newCoins,
        completedAssignments,
        unlockedPets: newUnlockedPets
      });

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
        description: `Assignment "${assignment.title}" completed`
      });

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
      <div className="max-w-4xl mx-auto p-4 pb-8">
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
                  placeholder="Assignment title (or paste from Google Classroom)"
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
                {assignments.length - completedIds.length}
              </span>
            </div>
            <p className="text-sm text-slate-500 relative z-10">Remaining</p>
          </div>
        </motion.div>

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
    </div>
  );
}