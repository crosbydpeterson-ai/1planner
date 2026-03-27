import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Ban, Gavel, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function BansAndFlagsPanel({ users, setUsers }) {
  const [selectedModerationUserId, setSelectedModerationUserId] = useState('');
  const [selectedFlagUserId, setSelectedFlagUserId] = useState('');
  const [banReasonInput, setBanReasonInput] = useState('');
  const [banEndInput, setBanEndInput] = useState('');
  const [flagMessageInput, setFlagMessageInput] = useState('');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <Gavel className="w-4 h-4 text-red-400" />
          <h3 className="text-white font-semibold">Ban User</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-slate-300">Select User</Label>
            <Select value={selectedModerationUserId} onValueChange={setSelectedModerationUserId}>
              <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Choose a user" /></SelectTrigger>
              <SelectContent>{users.map(u => (<SelectItem key={u.id} value={u.id}>{u.username || u.userId}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-slate-300">Reason</Label>
              <Input value={banReasonInput} onChange={(e) => setBanReasonInput(e.target.value)} placeholder="Reason for ban" className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-slate-300">End (optional)</Label>
              <Input type="datetime-local" value={banEndInput} onChange={(e) => setBanEndInput(e.target.value)} className="bg-slate-700 border-slate-600" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button className="bg-red-600 hover:bg-red-700" onClick={async () => {
              const target = users.find(u => u.id === selectedModerationUserId);
              if (!target) return toast.error('Select a user');
              await base44.entities.UserProfile.update(target.id, { isBanned: true, banReason: banReasonInput || 'Banned by admin', banEndDate: banEndInput || null });
              setUsers(users.map(u => u.id === target.id ? { ...u, isBanned: true, banReason: banReasonInput || 'Banned by admin', banEndDate: banEndInput || null } : u));
              toast.success(`${target.username || target.userId} banned`);
            }}><Ban className="w-4 h-4 mr-1" />Ban</Button>
            <Button variant="outline" className="border-emerald-500 text-emerald-300 hover:bg-emerald-500/10" onClick={async () => {
              const target = users.find(u => u.id === selectedModerationUserId);
              if (!target) return toast.error('Select a user');
              await base44.entities.UserProfile.update(target.id, { isBanned: false, banReason: '', banEndDate: null });
              setUsers(users.map(u => u.id === target.id ? { ...u, isBanned: false, banReason: '', banEndDate: null } : u));
              toast.success(`${target.username || target.userId} unbanned`);
            }}>Unban</Button>
          </div>
        </div>
        <div className="mt-5">
          <Label className="text-slate-300">Currently Banned</Label>
          <div className="mt-2 space-y-2 max-h-56 overflow-y-auto">
            {users.filter(u => u.isBanned).map(u => (
              <div key={u.id} className="flex items-center justify-between bg-slate-700/60 border border-slate-600 rounded-lg px-3 py-2">
                <div>
                  <p className="text-white text-sm">{u.username || u.userId}</p>
                  {u.banReason && <p className="text-xs text-slate-300">Reason: {u.banReason}</p>}
                  {u.banEndDate && <p className="text-xs text-slate-400">Ends: {new Date(u.banEndDate).toLocaleString()}</p>}
                </div>
                <Button size="sm" variant="ghost" className="text-emerald-300" onClick={async () => {
                  await base44.entities.UserProfile.update(u.id, { isBanned: false, banReason: '', banEndDate: null });
                  setUsers(users.map(x => x.id === u.id ? { ...x, isBanned: false, banReason: '', banEndDate: null } : x));
                  toast.success('Unbanned');
                }}>Unban</Button>
              </div>
            ))}
            {users.filter(u => u.isBanned).length === 0 && <p className="text-xs text-slate-400">No banned users</p>}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-yellow-400" />
          <h3 className="text-white font-semibold">Flags & Warnings</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-slate-300">Select User</Label>
            <Select value={selectedFlagUserId} onValueChange={setSelectedFlagUserId}>
              <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Choose a user" /></SelectTrigger>
              <SelectContent>{users.map(u => (<SelectItem key={u.id} value={u.id}>{u.username || u.userId}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-slate-300">Message</Label>
            <Textarea value={flagMessageInput} onChange={(e) => setFlagMessageInput(e.target.value)} placeholder="Custom warning message" className="bg-slate-700 border-slate-600" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button className="bg-yellow-600 hover:bg-yellow-700" onClick={async () => {
              const target = users.find(u => u.id === selectedFlagUserId);
              if (!target) return toast.error('Select a user');
              await base44.entities.UserProfile.update(target.id, { flagged: true, flagMessage: flagMessageInput || 'Warning issued', flagAcknowledged: false });
              setUsers(users.map(u => u.id === target.id ? { ...u, flagged: true, flagMessage: flagMessageInput || 'Warning issued', flagAcknowledged: false } : u));
              toast.success('Flag set');
            }}>Set Flag</Button>
            <Button variant="outline" className="border-emerald-500 text-emerald-300 hover:bg-emerald-500/10" onClick={async () => {
              const target = users.find(u => u.id === selectedFlagUserId);
              if (!target) return toast.error('Select a user');
              await base44.entities.UserProfile.update(target.id, { flagged: false, flagMessage: '', flagAcknowledged: false });
              setUsers(users.map(u => u.id === target.id ? { ...u, flagged: false, flagMessage: '', flagAcknowledged: false } : u));
              toast.success('Flag cleared');
            }}>Clear Flag</Button>
            <Button variant="outline" className="border-blue-500 text-blue-300 hover:bg-blue-500/10" onClick={async () => {
              const target = users.find(u => u.id === selectedFlagUserId);
              if (!target) return toast.error('Select a user');
              await base44.entities.UserProfile.update(target.id, { flagAcknowledged: true });
              setUsers(users.map(u => u.id === target.id ? { ...u, flagAcknowledged: true } : u));
              toast.success('Marked acknowledged');
            }}>Mark Acknowledged</Button>
          </div>
        </div>
        <div className="mt-5">
          <Label className="text-slate-300">Flagged Users</Label>
          <div className="mt-2 space-y-2 max-h-56 overflow-y-auto">
            {users.filter(u => u.flagged).map(u => (
              <div key={u.id} className="flex items-start justify-between bg-slate-700/60 border border-slate-600 rounded-lg px-3 py-2">
                <div>
                  <p className="text-white text-sm">{u.username || u.userId}</p>
                  {u.flagMessage && <p className="text-xs text-slate-300">Message: {u.flagMessage}</p>}
                  <p className="text-xs text-slate-400">Acknowledged: {u.flagAcknowledged ? 'Yes' : 'No'}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" className="text-blue-300" onClick={async () => {
                    await base44.entities.UserProfile.update(u.id, { flagAcknowledged: true });
                    setUsers(users.map(x => x.id === u.id ? { ...x, flagAcknowledged: true } : x));
                  }}>Acknowledge</Button>
                  <Button size="sm" variant="ghost" className="text-red-300" onClick={async () => {
                    await base44.entities.UserProfile.update(u.id, { flagged: false, flagMessage: '', flagAcknowledged: false });
                    setUsers(users.map(x => x.id === u.id ? { ...x, flagged: false, flagMessage: '', flagAcknowledged: false } : x));
                  }}>Clear</Button>
                </div>
              </div>
            ))}
            {users.filter(u => u.flagged).length === 0 && <p className="text-xs text-slate-400">No flagged users</p>}
          </div>
        </div>
      </div>
    </div>
  );
}