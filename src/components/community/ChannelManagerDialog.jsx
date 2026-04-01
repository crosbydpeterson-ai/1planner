import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { PERMISSION_OPTIONS, COMMENT_PERMISSION_OPTIONS, getPermissionLabel } from './permissionUtils';

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

  const handleUpdate = async (id, field, value) => {
    await base44.entities.CommunityChannel.update(id, { [field]: value });
    onRefresh();
  };

  const PermSelect = ({ value, onChange, includeNobody }) => {
    const opts = includeNobody ? COMMENT_PERMISSION_OPTIONS : PERMISSION_OPTIONS;
    return (
      <Select value={value || 'everyone'} onValueChange={onChange}>
        <SelectTrigger className="h-7 text-[11px] bg-[#1e1f22] border-[#1e1f22] text-[#dbdee1]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#2b2d31] border-[#1e1f22]">
          {opts.map((o) => (
            <SelectItem key={o.value} value={o.value} className="text-[11px] text-[#dbdee1] focus:bg-[#5865f2] focus:text-white">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-[#313338] border-[#1e1f22] text-[#dbdee1]">
        <DialogHeader>
          <DialogTitle className="text-white">Manage Channels</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new */}
          <div className="bg-[#2b2d31] rounded-lg p-3 space-y-2">
            <p className="text-[10px] font-bold text-[#949ba4] uppercase">New Channel</p>
            <div className="flex items-center gap-2">
              <Input value={newIcon} onChange={(e) => setNewIcon(e.target.value)} className="w-12 text-center bg-[#1e1f22] border-[#1e1f22] text-white" placeholder="💬" />
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Channel name" className="flex-1 bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-[#6d6f78]" />
            </div>
            <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" className="bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-[#6d6f78]" />
            <Button onClick={handleCreate} disabled={saving || !newName.trim()} size="sm" className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white">
              <Plus className="w-4 h-4 mr-1" /> Create Channel
            </Button>
          </div>

          {/* Existing */}
          <div className="space-y-2">
            {channels.map((ch) => (
              <div key={ch.id} className="bg-[#2b2d31] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{ch.icon || '💬'}</span>
                    <span className="font-semibold text-sm text-white">{ch.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-[10px] h-6 ${ch.isActive ? 'text-green-400' : 'text-[#949ba4]'}`}
                      onClick={() => handleUpdate(ch.id, 'isActive', !ch.isActive)}
                    >
                      {ch.isActive ? '● Active' : '○ Hidden'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleDelete(ch.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-[#949ba4] uppercase">View</label>
                    <PermSelect value={ch.viewPermission} onChange={(v) => handleUpdate(ch.id, 'viewPermission', v)} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-[#949ba4] uppercase">Post</label>
                    <PermSelect value={ch.postPermission} onChange={(v) => handleUpdate(ch.id, 'postPermission', v)} />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-[#949ba4] uppercase">Comment</label>
                    <PermSelect value={ch.commentPermission} onChange={(v) => handleUpdate(ch.id, 'commentPermission', v)} includeNobody />
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