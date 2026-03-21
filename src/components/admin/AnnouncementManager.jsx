import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Megaphone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', emoji: '🆕' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    const data = await base44.entities.Announcement.list('-created_date');
    setAnnouncements(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    const newAnnouncement = await base44.entities.Announcement.create({
      ...form,
      isActive: true
    });
    setAnnouncements([newAnnouncement, ...announcements]);
    setForm({ title: '', content: '', emoji: '🆕' });
    setShowForm(false);
    setSaving(false);
    toast.success('Update posted! Students will see it next time they open the app.');
  };

  const handleToggle = async (announcement) => {
    const newActive = !announcement.isActive;
    await base44.entities.Announcement.update(announcement.id, { isActive: newActive });
    setAnnouncements(announcements.map(a => a.id === announcement.id ? { ...a, isActive: newActive } : a));
    toast.success(newActive ? 'Announcement is now live' : 'Announcement hidden');
  };

  const handleDelete = async (id) => {
    await base44.entities.Announcement.delete(id);
    setAnnouncements(announcements.filter(a => a.id !== id));
    toast.success('Announcement deleted');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-blue-400" />
          <h3 className="text-white font-semibold">What's New Updates</h3>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-1" /> Post Update
        </Button>
      </div>

      {showForm && (
        <div className="bg-slate-700/50 rounded-xl p-4 space-y-3 border border-slate-600">
          <div className="grid grid-cols-[60px_1fr] gap-3">
            <div className="space-y-1">
              <Label className="text-slate-300 text-xs">Emoji</Label>
              <Input
                value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })}
                className="bg-slate-700 border-slate-600 text-center text-lg"
                maxLength={4}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-slate-300 text-xs">Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="New pets are here!"
                className="bg-slate-700 border-slate-600"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">Message</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="We just added 5 new legendary pets, a new event, and improved the shop..."
              className="bg-slate-700 border-slate-600 min-h-[80px]"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowForm(false)} className="text-slate-400">Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={saving} className="bg-blue-600">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Post Update
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {announcements.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">No updates posted yet. Post one and students will see it!</p>
        ) : (
          announcements.map((a) => (
            <div key={a.id} className={`flex items-start gap-3 rounded-lg px-3 py-2.5 border ${a.isActive ? 'bg-slate-700/40 border-slate-600' : 'bg-slate-800/40 border-slate-700 opacity-60'}`}>
              <span className="text-2xl mt-0.5">{a.emoji || '🆕'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm">{a.title}</p>
                <p className="text-slate-400 text-xs line-clamp-2">{a.content}</p>
                <p className="text-slate-500 text-xs mt-1">{new Date(a.created_date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch checked={a.isActive} onCheckedChange={() => handleToggle(a)} />
                <Button size="sm" variant="ghost" onClick={() => handleDelete(a.id)} className="text-red-400 hover:text-red-300 h-7 w-7 p-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}