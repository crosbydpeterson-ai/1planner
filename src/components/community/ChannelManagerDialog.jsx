import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ChannelManagerDialog({ open, onClose, channels, onRefresh }) {
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('💬');
  const [newDesc, setNewDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await base44.entities.CommunityChannel.create({
      name: newName.trim(),
      icon: newIcon || '💬',
      description: newDesc.trim(),
      sortOrder: channels.length,
      isActive: true,
      viewPermission: 'everyone',
      postPermission: 'everyone',
      commentPermission: 'everyone',
    });
    setNewName('');
    setNewIcon('💬');
    setNewDesc('');
    setSaving(false);
    onRefresh();
  };

  const handleDelete = async (id) => {
    await base44.entities.CommunityChannel.delete(id);
    onRefresh();
  };

  const handleUpdatePermission = async (id, field, value) => {
    await base44.entities.CommunityChannel.update(id, { [field]: value });
    onRefresh();
  };

  const handleToggleActive = async (ch) => {
    await base44.entities.CommunityChannel.update(ch.id, { isActive: !ch.isActive });
    onRefresh();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Channels</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new */}
          <div className="bg-slate-50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase">New Channel</p>
            <div className="flex items-center gap-2">
              <Input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} className="w-12 text-center" placeholder="💬" />
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Channel name" className="flex-1" />
            </div>
            <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" />
            <Button onClick={handleCreate} disabled={saving || !newName.trim()} size="sm" className="w-full">
              <Plus className="w-4 h-4 mr-1" /> Create Channel
            </Button>
          </div>

          {/* Existing channels */}
          <div className="space-y-3">
            {channels.map((ch) => (
              <div key={ch.id} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ch.icon || '💬'}</span>
                    <span className="font-semibold text-sm text-slate-800">{ch.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant={ch.isActive ? "outline" : "secondary"}
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => handleToggleActive(ch)}
                    >
                      {ch.isActive ? 'Active' : 'Hidden'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600" onClick={() => handleDelete(ch.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 uppercase">View</label>
                    <Select value={ch.viewPermission || 'everyone'} onValueChange={(v) => handleUpdatePermission(ch.id, 'viewPermission', v)}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">Everyone</SelectItem>
                        <SelectItem value="admin_only">Admin Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 uppercase">Post</label>
                    <Select value={ch.postPermission || 'everyone'} onValueChange={(v) => handleUpdatePermission(ch.id, 'postPermission', v)}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">Everyone</SelectItem>
                        <SelectItem value="admin_only">Admin Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-[10px] font-medium text-slate-400 uppercase">Comment</label>
                    <Select value={ch.commentPermission || 'everyone'} onValueChange={(v) => handleUpdatePermission(ch.id, 'commentPermission', v)}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="everyone">Everyone</SelectItem>
                        <SelectItem value="admin_only">Admin Only</SelectItem>
                        <SelectItem value="nobody">Nobody</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}