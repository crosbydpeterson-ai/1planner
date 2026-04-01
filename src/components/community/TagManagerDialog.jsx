import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function TagManagerDialog({ open, onClose, onRefresh }) {
  const [tags, setTags] = useState([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#5865f2');
  const [saving, setSaving] = useState(false);
  const [allProfiles, setAllProfiles] = useState([]);
  const [editingTag, setEditingTag] = useState(null);
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => {
    if (open) { loadTags(); loadProfiles(); }
  }, [open]);

  const loadTags = async () => {
    const all = await base44.entities.CommunityTag.list();
    setTags(all);
    onRefresh?.();
  };

  const loadProfiles = async () => {
    const profiles = await base44.entities.UserProfile.list();
    setAllProfiles(profiles);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await base44.entities.CommunityTag.create({
      name: newName.trim(),
      color: newColor,
      assignedProfileIds: [],
    });
    setNewName('');
    setNewColor('#5865f2');
    setSaving(false);
    await loadTags();
  };

  const handleDelete = async (id) => {
    await base44.entities.CommunityTag.delete(id);
    await loadTags();
    if (editingTag?.id === id) setEditingTag(null);
  };

  const handleAssign = async (tagId, profileId) => {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    const ids = [...(tag.assignedProfileIds || [])];
    if (ids.includes(profileId)) return;
    ids.push(profileId);
    await base44.entities.CommunityTag.update(tagId, { assignedProfileIds: ids });
    await loadTags();
  };

  const handleUnassign = async (tagId, profileId) => {
    const tag = tags.find(t => t.id === tagId);
    if (!tag) return;
    const ids = (tag.assignedProfileIds || []).filter(id => id !== profileId);
    await base44.entities.CommunityTag.update(tagId, { assignedProfileIds: ids });
    await loadTags();
  };

  const filteredProfiles = searchUser.trim()
    ? allProfiles.filter(p => p.username?.toLowerCase().includes(searchUser.toLowerCase()))
    : allProfiles.slice(0, 20);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto bg-[#313338] border-[#1e1f22] text-[#dbdee1]">
        <DialogHeader>
          <DialogTitle className="text-white">Manage Tags</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create */}
          <div className="bg-[#2b2d31] rounded-lg p-3 space-y-2">
            <p className="text-[10px] font-bold text-[#949ba4] uppercase">New Tag</p>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border-none bg-transparent"
              />
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Tag name" className="flex-1 bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-[#6d6f78]" />
              <Button onClick={handleCreate} disabled={saving || !newName.trim()} size="sm" className="bg-[#5865f2] hover:bg-[#4752c4] text-white">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            {tags.map((tag) => (
              <div key={tag.id} className="bg-[#2b2d31] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: tag.color + '30', color: tag.color }}
                    >
                      {tag.name}
                    </span>
                    <span className="text-[10px] text-[#949ba4]">{(tag.assignedProfileIds || []).length} users</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[10px] h-6 text-[#949ba4] hover:text-white"
                      onClick={() => setEditingTag(editingTag?.id === tag.id ? null : tag)}
                    >
                      {editingTag?.id === tag.id ? 'Close' : 'Edit'}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-500/10" onClick={() => handleDelete(tag.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {editingTag?.id === tag.id && (
                  <div className="space-y-2 pt-1 border-t border-[#3f4147]">
                    {/* Assigned users */}
                    <div className="flex flex-wrap gap-1">
                      {(tag.assignedProfileIds || []).map((pid) => {
                        const p = allProfiles.find(pr => pr.id === pid);
                        return (
                          <span key={pid} className="flex items-center gap-1 bg-[#1e1f22] text-[#dbdee1] text-[10px] px-2 py-0.5 rounded-full">
                            {p?.username || pid}
                            <button onClick={() => handleUnassign(tag.id, pid)} className="hover:text-red-400"><X className="w-3 h-3" /></button>
                          </span>
                        );
                      })}
                    </div>

                    {/* Add user */}
                    <Input
                      value={searchUser}
                      onChange={(e) => setSearchUser(e.target.value)}
                      placeholder="Search user..."
                      className="h-7 text-xs bg-[#1e1f22] border-[#1e1f22] text-white placeholder:text-[#6d6f78]"
                    />
                    <div className="max-h-32 overflow-y-auto space-y-0.5">
                      {filteredProfiles.filter(p => !(tag.assignedProfileIds || []).includes(p.id)).map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleAssign(tag.id, p.id)}
                          className="w-full text-left text-xs text-[#b5bac1] hover:bg-[#35373c] px-2 py-1 rounded flex items-center gap-2"
                        >
                          <Plus className="w-3 h-3 text-[#949ba4]" />
                          {p.username}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {tags.length === 0 && <p className="text-xs text-[#6d6f78] text-center py-4">No tags yet</p>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}