import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PERMISSION_OPTIONS, COMMENT_PERMISSION_OPTIONS } from './permissionUtils';

export default function ChannelManagerDialog({ open, onClose, channels, onRefresh, isAdmin }) {
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

  const handleUpdate = async (id, field, value) => {
    await base44.entities.CommunityChannel.update(id, { [field]: value });
    onRefresh();
  };

  const PermSelect = ({ value, onChange, includeNobody }) => {
    const opts = includeNobody ? COMMENT_PERMISSION_OPTIONS : PERMISSION_OPTIONS;
    return (
      <Select value={value || 'everyone'} onValueChange={onChange}>
        <SelectTrigger className="h-7 text-[11px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opts.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-[11px]">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Channels</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new channel — available to everyone */}
          <div className="bg-slate-50 rounded-xl p-3 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase">Create Channel</p>
            <div className="flex items-center gap-2">
              <Input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} className="w-12 text-center" placeholder="💬" />
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Channel name" className="flex-1" />
            </div>
            <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" />
            <Button onClick={handleCreate} disabled={saving || !newName.trim()} size="sm" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white">
              <Plus className="w-4 h-4 mr-1" /> Create Channel
            </Button>
          </div>

          {/* Admin-only: manage existing channels */}
          {isAdmin && channels.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase">Manage Channels (Admin)</p>
              {channels.map((ch) => (
                <div key={ch.id} className="bg-slate-50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{ch.icon || '💬'}</span>
                      <span className="font-semibold text-sm">{ch.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`text-[10px] h-6 ${ch.isActive ? 'text-green-500' : 'text-slate-400'}`}
                        onClick={() => handleUpdate(ch.id, 'isActive', !ch.isActive)}
                      >
                        {ch.isActive ? '● Active' : '○ Hidden'}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleDelete(ch.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase">View</label>
                      <PermSelect value={ch.viewPermission} onChange={(v) => handleUpdate(ch.id, 'viewPermission', v)} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Post</label>
                      <PermSelect value={ch.postPermission} onChange={(v) => handleUpdate(ch.id, 'postPermission', v)} />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase">Comment</label>
                      <PermSelect value={ch.commentPermission} onChange={(v) => handleUpdate(ch.id, 'commentPermission', v)} includeNobody />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}