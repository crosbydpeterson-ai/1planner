import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, ArrowLeft, CheckCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import AssignmentCard from '@/components/quest/AssignmentCard';
import { toast } from 'sonner';
import { PETS, getRandomPet } from '@/components/quest/PetCatalog';

export default function Assignments() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) {
      navigate(createPageUrl('Home'));
      return;
    }

    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0) {
        navigate(createPageUrl('Home'));
        return;
      }

      const p = profiles[0];
      setProfile(p);

      // Load approved assignments visible to this user
      const allAssignments = await base44.entities.Assignment.filter({ isApproved: true });
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
    if (!newAssignment.title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    setSubmitting(true);
    try {
      await base44.entities.Assignment.create({
        title: newAssignment.title,
        description: newAssignment.description,
        subject: 'everyone',
        target: 'everyone',
        xpReward: 25,
        dueDate: newAssignment.dueDate || null,
        isApproved: false // Needs admin approval
      });
      toast.success('Assignment submitted for approval!');
      setShowAddForm(false);
      setNewAssignment({ title: '', description: '', dueDate: '' });
    } catch (e) {
      toast.error('Failed to submit assignment');
    }
    setSubmitting(false);
  };

  const handleComplete = async (assignment) => {
    if (!profile) return;

    try {
      const xpToAdd = 25; // Fixed 25 XP per assignment
      const newXp = (profile.xp || 0) + xpToAdd;
      const completedAssignments = [...(profile.completedAssignments || []), assignment.id];
      
      // Get a random pet as reward
      const currentPets = profile.unlockedPets || ['starter_slime'];
      const randomPet = getRandomPet(currentPets);
      const isNewPet = !currentPets.includes(randomPet.id);
      const newUnlockedPets = isNewPet ? [...currentPets, randomPet.id] : currentPets;

      await base44.entities.UserProfile.update(profile.id, {
        xp: newXp,
        completedAssignments,
        unlockedPets: newUnlockedPets
      });

      setProfile({
        ...profile,
        xp: newXp,
        completedAssignments,
        unlockedPets: newUnlockedPets
      });

      toast.success(`+25 XP earned!`, {
        description: `Assignment "${assignment.title}" completed`
      });

      // Show pet reward
      if (isNewPet) {
        setTimeout(() => {
          toast.success(`${randomPet.emoji} New pet unlocked: ${randomPet.name}!`, {
            description: `You got a ${randomPet.rarity} pet with its own exclusive theme!`,
            duration: 5000
          });
        }, 500);
      } else {
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
          className="flex items-center gap-4 mb-6"
        >
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Assignments</h1>
              <p className="text-sm text-slate-500">Complete quests to earn XP</p>
            </div>
          </div>
          <Button
            onClick={() => setShowAddForm(true)}
            size="sm"
            className="bg-gradient-to-r from-emerald-500 to-teal-600"
          >
            <Plus className="w-4 h-4 mr-1" />
            Suggest
          </Button>
        </motion.div>

        {/* Add Assignment Dialog */}
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suggest an Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  placeholder="Assignment title"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  placeholder="What needs to be done?"
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
              <p className="text-sm text-slate-500">All suggested assignments award 25 XP and require admin approval. Assignments auto-delete after due date.</p>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
              <Button onClick={handleAddAssignment} disabled={submitting} className="bg-emerald-600">
                {submitting ? 'Submitting...' : 'Submit'}
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

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              <span className="text-2xl font-bold text-slate-800">{completedIds.length}</span>
            </div>
            <p className="text-sm text-slate-500">Completed</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-slate-400" />
              <span className="text-2xl font-bold text-slate-800">
                {assignments.length - completedIds.length}
              </span>
            </div>
            <p className="text-sm text-slate-500">Remaining</p>
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
    </div>
  );
}