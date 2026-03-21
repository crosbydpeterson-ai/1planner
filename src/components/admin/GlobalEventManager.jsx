import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash2, Edit2, X, Play, Square } from 'lucide-react';
import { toast } from 'sonner';
import { PETS } from '@/components/quest/PetCatalog';

export default function GlobalEventManager() {
  const [events, setEvents] = useState([]);
  const [customPets, setCustomPets] = useState([]);
  const [customThemes, setCustomThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [form, setForm] = useState({
    name: '', description: '', theme: 'magic_jar', totalXPGoal: 10000,
    isActive: false, startDate: '', endDate: '', tiers: []
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [allEvents, pets, themes] = await Promise.all([
      base44.entities.GlobalEvent.list('-created_date'),
      base44.entities.CustomPet.list(),
      base44.entities.CustomTheme.list()
    ]);
    setEvents(allEvents);
    setCustomPets(pets);
    setCustomThemes(themes);
    setLoading(false);
  };

  const addTier = () => {
    setForm({
      ...form,
      tiers: [...form.tiers, { xpThreshold: 1000, rewardType: 'coins', rewardValue: '50', rewardName: '' }]
    });
  };

  const updateTier = (index, field, value) => {
    const newTiers = [...form.tiers];
    newTiers[index][field] = value;
    setForm({ ...form, tiers: newTiers });
  };

  const removeTier = (index) => {
    setForm({ ...form, tiers: form.tiers.filter((_, i) => i !== index) });
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.totalXPGoal) {
      toast.error('Name and XP Goal are required');
      return;
    }
    try {
      if (editingEvent) {
        await base44.entities.GlobalEvent.update(editingEvent.id, form);
        setEvents(events.map(e => e.id === editingEvent.id ? { ...e, ...form } : e));
        toast.success('Event updated!');
      } else {
        const newEvent = await base44.entities.GlobalEvent.create(form);
        setEvents([newEvent, ...events]);
        toast.success('Event created!');
      }
      setShowForm(false);
      setEditingEvent(null);
      resetForm();
    } catch (e) {
      toast.error('Failed to save event');
    }
  };

  const resetForm = () => {
    setForm({
      name: '', description: '', theme: 'magic_jar', totalXPGoal: 10000,
      isActive: false, startDate: '', endDate: '', tiers: []
    });
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setForm({
      name: event.name,
      description: event.description || '',
      theme: event.theme || 'magic_jar',
      totalXPGoal: event.totalXPGoal,
      isActive: event.isActive,
      startDate: event.startDate || '',
      endDate: event.endDate || '',
      tiers: event.tiers || []
    });
    setShowForm(true);
  };

  const handleToggleActive = async (event) => {
    // If activating, deactivate others first
    if (!event.isActive) {
      for (const e of events.filter(e => e.isActive)) {
        await base44.entities.GlobalEvent.update(e.id, { isActive: false });
      }
    }
    const newActive = !event.isActive;
    await base44.entities.GlobalEvent.update(event.id, { isActive: newActive });
    setEvents(events.map(e => ({
      ...e,
      isActive: e.id === event.id ? newActive : false
    })));
    toast.success(newActive ? 'Event activated!' : 'Event deactivated');
  };

  const handleDelete = async (event) => {
    await base44.entities.GlobalEvent.delete(event.id);
    setEvents(events.filter(e => e.id !== event.id));
    toast.success('Event deleted');
  };

  const handleResetXP = async (event) => {
    await base44.entities.GlobalEvent.update(event.id, { currentGlobalXP: 0 });
    setEvents(events.map(e => e.id === event.id ? { ...e, currentGlobalXP: 0 } : e));
    toast.success('XP reset to 0');
  };

  const THEME_LABELS = {
    magic_jar: '🫙 Magic Jar',
    world_tree: '🌳 World Tree',
    community_chest: '📦 Community Chest',
    monster_hunter: '🐉 Monster Hunter',
  };

  if (loading) return <div className="text-slate-400 text-center py-8">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold">Global Events ({events.length})</h3>
        <Button onClick={() => { resetForm(); setEditingEvent(null); setShowForm(true); }} className="bg-purple-600">
          <Plus className="w-4 h-4 mr-2" /> New Global Event
        </Button>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="text-center py-8 text-slate-400">No global events yet</div>
        ) : events.map((event) => {
          const progress = event.totalXPGoal ? ((event.currentGlobalXP || 0) / event.totalXPGoal * 100).toFixed(1) : 0;
          return (
            <div key={event.id} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{THEME_LABELS[event.theme]?.split(' ')[0] || '🫙'}</span>
                  <div>
                    <h4 className="text-white font-medium flex items-center gap-2">
                      {event.name}
                      {event.isActive && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Active</span>}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {(event.currentGlobalXP || 0).toLocaleString()} / {event.totalXPGoal.toLocaleString()} XP ({progress}%) • {event.tiers?.length || 0} tiers
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => handleToggleActive(event)}
                    className={event.isActive ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'}>
                    {event.isActive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(event)} className="text-slate-400 hover:text-white">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleResetXP(event)} className="text-yellow-400 hover:text-yellow-300" title="Reset XP">
                    🔄
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(event)} className="text-red-400 hover:text-red-300">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {/* Mini progress bar */}
              <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit' : 'Create'} Global Event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="The World Tree" className="bg-slate-700 border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label>Theme / Skin</Label>
                <Select value={form.theme} onValueChange={(v) => setForm({ ...form, theme: v })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="magic_jar">🫙 Magic Jar</SelectItem>
                    <SelectItem value="world_tree">🌳 World Tree</SelectItem>
                    <SelectItem value="community_chest">📦 Community Chest</SelectItem>
                    <SelectItem value="monster_hunter">🐉 Monster Hunter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Everyone earns XP together!" className="bg-slate-700 border-slate-600" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Total XP Goal</Label>
                <Input type="number" value={form.totalXPGoal} onChange={(e) => setForm({ ...form, totalXPGoal: parseInt(e.target.value) || 0 })}
                  className="bg-slate-700 border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="bg-slate-700 border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="bg-slate-700 border-slate-600" />
              </div>
            </div>

            {/* Tiers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Reward Tiers</Label>
                <Button size="sm" onClick={addTier} className="bg-purple-600"><Plus className="w-3 h-3 mr-1" /> Add Tier</Button>
              </div>
              <div className="space-y-3">
                {form.tiers.map((tier, i) => (
                  <div key={i} className="bg-slate-700 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Tier {i + 1}</span>
                      <Button size="sm" variant="ghost" onClick={() => removeTier(i)} className="text-red-400 h-6 px-2">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-slate-400">XP Threshold</Label>
                        <Input type="number" value={tier.xpThreshold}
                          onChange={(e) => updateTier(i, 'xpThreshold', parseInt(e.target.value) || 0)}
                          className="bg-slate-600 border-slate-500 text-sm" />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">Reward Name</Label>
                        <Input value={tier.rewardName}
                          onChange={(e) => updateTier(i, 'rewardName', e.target.value)}
                          placeholder="50 Coins Bonus"
                          className="bg-slate-600 border-slate-500 text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs text-slate-400">Reward Type</Label>
                        <Select value={tier.rewardType} onValueChange={(v) => updateTier(i, 'rewardType', v)}>
                          <SelectTrigger className="bg-slate-600 border-slate-500 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xp">⚡ XP</SelectItem>
                            <SelectItem value="coins">🪙 Coins</SelectItem>
                            <SelectItem value="pet">🐾 Pet</SelectItem>
                            <SelectItem value="theme">🎨 Theme</SelectItem>
                            <SelectItem value="title">👑 Title</SelectItem>
                            <SelectItem value="magic_egg">🥚 Magic Egg</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-slate-400">
                          {tier.rewardType === 'xp' || tier.rewardType === 'coins' ? 'Amount' : 'Value/ID'}
                        </Label>
                        {tier.rewardType === 'pet' ? (
                          <Select value={tier.rewardValue} onValueChange={(v) => updateTier(i, 'rewardValue', v)}>
                            <SelectTrigger className="bg-slate-600 border-slate-500 text-sm"><SelectValue placeholder="Select pet" /></SelectTrigger>
                            <SelectContent>
                              {PETS.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.emoji} {p.name}</SelectItem>
                              ))}
                              {customPets.map(p => (
                                <SelectItem key={p.id} value={`custom_${p.id}`}>{p.emoji || '🎁'} {p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : tier.rewardType === 'theme' ? (
                          <Select value={tier.rewardValue} onValueChange={(v) => updateTier(i, 'rewardValue', v)}>
                            <SelectTrigger className="bg-slate-600 border-slate-500 text-sm"><SelectValue placeholder="Select theme" /></SelectTrigger>
                            <SelectContent>
                              {customThemes.map(t => (
                                <SelectItem key={t.id} value={`custom_${t.id}`}>{t.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input value={tier.rewardValue}
                            onChange={(e) => updateTier(i, 'rewardValue', e.target.value)}
                            placeholder={tier.rewardType === 'magic_egg' ? '1' : '100'}
                            className="bg-slate-600 border-slate-500 text-sm" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {form.tiers.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">No tiers yet — add rewards!</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowForm(false); setEditingEvent(null); }}>Cancel</Button>
            <Button onClick={handleSave} className="bg-purple-600">{editingEvent ? 'Update' : 'Create'} Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}