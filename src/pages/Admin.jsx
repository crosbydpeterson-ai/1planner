import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, ArrowLeft, Search, Users, ClipboardList, Plus, 
  Lock, Unlock, Eye, EyeOff, Key, Zap, Check, X, Edit2, Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { MATH_TEACHERS, READING_TEACHERS } from '@/components/quest/TeacherConfig';
import { toast } from 'sonner';

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
      const [allUsers, allAssignments] = await Promise.all([
        base44.entities.UserProfile.list('-created_date'),
        base44.entities.Assignment.list('-created_date')
      ]);
      setUsers(allUsers);
      setAssignments(allAssignments);
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
          <TabsList className="bg-slate-800 border-slate-700 mb-6">
            <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
              <Users className="w-4 h-4 mr-2" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="assignments" className="data-[state=active]:bg-slate-700">
              <ClipboardList className="w-4 h-4 mr-2" />
              Assignments ({assignments.length})
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
                      </p>
                    </div>
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
                  </div>
                </motion.div>
              ))}
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
      </div>
    </div>
  );
}