import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Wand2, Loader2, Gift, Send } from 'lucide-react';
import { PETS } from '@/components/quest/PetCatalog';

const COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#3b82f6','#ec4899','#14b8a6','#f97316'];

export default function LootEggManagerPanel({ users = [], customPets = [], customThemes = [] }) {
  const [lootEggs, setLootEggs] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [giftingAll, setGiftingAll] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');

  const [form, setForm] = useState({
    name: '', description: '', emoji: '🥚', color: '#6366f1', prizes: [],
  });

  useEffect(() => { loadEggs(); }, []);

  const loadEggs = async () => {
    const eggs = await base44.entities.LootEgg.list('-created_date');
    setLootEggs(eggs);
    setLoading(false);
  };

  const addPrize = () => {
    setForm({ ...form, prizes: [...form.prizes, { type: 'xp', label: '', value: '', weight: 10 }] });
  };

  const updatePrize = (i, field, val) => {
    const p = [...form.prizes];
    p[i] = { ...p[i], [field]: field === 'weight' ? Number(val) || 0 : val };
    setForm({ ...form, prizes: p });
  };

  const removePrize = (i) => {
    setForm({ ...form, prizes: form.prizes.filter((_, j) => j !== i) });
  };

  const handleCreate = async () => {
    if (!form.name.trim() || form.prizes.length === 0) {
      toast.error('Name and at least one prize required');
      return;
    }
    await base44.entities.LootEgg.create({ ...form, isActive: true });
    toast.success('Loot Egg created!');
    setShowCreate(false);
    setForm({ name: '', description: '', emoji: '🥚', color: '#6366f1', prizes: [] });
    await loadEggs();
  };

  const handleDelete = async (id) => {
    await base44.entities.LootEgg.delete(id);
    setLootEggs(lootEggs.filter(e => e.id !== id));
    toast.success('Egg deleted');
  };

  const handleGiftToAll = async (egg) => {
    if (!users.length) { toast.error('No users loaded'); return; }
    setGiftingAll(true);
    const records = users.map(u => ({ lootEggId: egg.id, profileId: u.id, username: u.username, source: 'admin_gift' }));
    await base44.entities.LootEggDrop.bulkCreate(records);
    toast.success(`Gifted ${egg.name} to all ${users.length} users!`);
    setGiftingAll(false);
  };

  const handleGiftToUser = async (egg, userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    await base44.entities.LootEggDrop.create({ lootEggId: egg.id, profileId: user.id, username: user.username, source: 'admin_gift' });
    toast.success(`Gifted ${egg.name} to ${user.username}`);
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) { toast.error('Describe the egg theme'); return; }
    setGenerating(true);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are creating a loot egg for a classroom gamification app. The theme is: "${aiPrompt}". 
Generate a loot egg with:
- A creative name
- An emoji (single emoji)
- A hex color that fits
- A short description (1 sentence)
- 5-8 prizes with varying rarity. Types can be: xp, coins, pet, theme, magic_egg, title.
  - For xp/coins: value should be a number string like "50" or "100"
  - For pet/theme: value should be a descriptive name
  - For title: value should be the title text
  - For magic_egg: value can be "1"
  - weight determines chance (higher = more common). Use weights like: common=30, uncommon=20, rare=10, epic=5, legendary=2

Make it fun and engaging for 10-14 year old students.`,
      response_json_schema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          emoji: { type: 'string' },
          color: { type: 'string' },
          description: { type: 'string' },
          prizes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                label: { type: 'string' },
                value: { type: 'string' },
                weight: { type: 'number' },
              }
            }
          }
        }
      }
    });
    setForm({
      name: result.name || 'Mystery Egg',
      emoji: result.emoji || '🥚',
      color: result.color || '#6366f1',
      description: result.description || '',
      prizes: result.prizes || [],
    });
    setShowCreate(true);
    setGenerating(false);
  };

  const totalWeight = form.prizes.reduce((s, p) => s + (p.weight || 0), 0);

  return (
    <div className="space-y-6">
      {/* AI Generator */}
      <div className="bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl p-5 border border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">🥚✨</span>
          <div>
            <h3 className="text-lg font-bold text-white">AI Egg Creator</h3>
            <p className="text-sm text-slate-400">Describe a theme and AI will design prizes + chances</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="e.g. Ocean depths with sea creature rewards..." className="bg-slate-800/50 border-white/10 text-white flex-1" />
          <Button onClick={handleAIGenerate} disabled={generating} className="bg-gradient-to-r from-purple-500 to-pink-500">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          </Button>
        </div>
        <Button onClick={() => setShowCreate(true)} className="mt-3 bg-emerald-600">
          <Plus className="w-4 h-4 mr-2" /> Create Egg Manually
        </Button>
      </div>

      {/* Existing eggs */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Loot Eggs ({lootEggs.length})</h3>
        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : lootEggs.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No loot eggs yet. Create one above!</p>
        ) : (
          <div className="space-y-3">
            {lootEggs.map(egg => (
              <EggRow key={egg.id} egg={egg} users={users} onDelete={handleDelete} onGiftAll={handleGiftToAll} onGiftUser={handleGiftToUser} giftingAll={giftingAll} />
            ))}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create Loot Egg</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-700 border-slate-600" placeholder="Golden Mystery Egg" />
              </div>
              <div>
                <Label>Emoji</Label>
                <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="bg-slate-700 border-slate-600 text-center text-2xl" />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-700 border-slate-600" placeholder="A mysterious egg..." />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-1">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>

            {/* Prizes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Prizes (drop rates)</Label>
                <Button size="sm" onClick={addPrize} className="bg-indigo-600 h-7 text-xs"><Plus className="w-3 h-3 mr-1" />Add Prize</Button>
              </div>
              <div className="space-y-2">
                {form.prizes.map((prize, i) => {
                  const pct = totalWeight > 0 ? ((prize.weight / totalWeight) * 100).toFixed(1) : 0;
                  return (
                    <div key={i} className="bg-slate-700/60 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Prize {i + 1} — {pct}% chance</span>
                        <Button size="sm" variant="ghost" onClick={() => removePrize(i)} className="h-6 text-red-400"><Trash2 className="w-3 h-3" /></Button>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <Select value={prize.type} onValueChange={(v) => updatePrize(i, 'type', v)}>
                          <SelectTrigger className="bg-slate-600 border-slate-500 text-xs h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="xp">⚡ XP</SelectItem>
                            <SelectItem value="coins">🪙 Coins</SelectItem>
                            <SelectItem value="pet">🐾 Pet</SelectItem>
                            <SelectItem value="theme">🎨 Theme</SelectItem>
                            <SelectItem value="magic_egg">🥚 Magic Egg</SelectItem>
                            <SelectItem value="title">🏷️ Title</SelectItem>
                            <SelectItem value="cosmetic">👒 Cosmetic</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input value={prize.label} onChange={(e) => updatePrize(i, 'label', e.target.value)} placeholder="Display name" className="bg-slate-600 border-slate-500 text-xs h-8" />
                        {prize.type === 'pet' ? (
                          <Select value={prize.value} onValueChange={(v) => updatePrize(i, 'value', v)}>
                            <SelectTrigger className="bg-slate-600 border-slate-500 text-xs h-8"><SelectValue placeholder="Pick pet" /></SelectTrigger>
                            <SelectContent>
                              {PETS.map(p => <SelectItem key={p.id} value={p.id}>{p.emoji} {p.name}</SelectItem>)}
                              {customPets.map(p => <SelectItem key={p.id} value={`custom_${p.id}`}>{p.emoji || '🎁'} {p.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : prize.type === 'theme' ? (
                          <Select value={prize.value} onValueChange={(v) => updatePrize(i, 'value', v)}>
                            <SelectTrigger className="bg-slate-600 border-slate-500 text-xs h-8"><SelectValue placeholder="Pick theme" /></SelectTrigger>
                            <SelectContent>
                              {customThemes.map(t => <SelectItem key={t.id} value={`custom_${t.id}`}>{t.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input value={prize.value} onChange={(e) => updatePrize(i, 'value', e.target.value)} placeholder={prize.type === 'xp' || prize.type === 'coins' ? 'Amount' : 'Value'} className="bg-slate-600 border-slate-500 text-xs h-8" />
                        )}
                        <div className="flex items-center gap-1">
                          <Input type="number" value={prize.weight} onChange={(e) => updatePrize(i, 'weight', e.target.value)} className="bg-slate-600 border-slate-500 text-xs h-8 w-16" />
                          <span className="text-[10px] text-slate-500">wt</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {form.prizes.length === 0 && <p className="text-xs text-slate-500 text-center py-3">Add prizes to define drop rates</p>}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} className="bg-amber-600">Create Egg</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EggRow({ egg, users, onDelete, onGiftAll, onGiftUser, giftingAll }) {
  const [expanded, setExpanded] = useState(false);
  const [giftUserId, setGiftUserId] = useState('');
  const totalWeight = (egg.prizes || []).reduce((s, p) => s + (p.weight || 0), 0);

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{egg.emoji || '🥚'}</span>
          <div>
            <h4 className="font-semibold text-white">{egg.name}</h4>
            <p className="text-xs text-slate-400">{egg.prizes?.length || 0} prizes • {egg.description || 'No description'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={(e) => { e.stopPropagation(); onGiftAll(egg); }} disabled={giftingAll} className="bg-amber-600 text-xs h-7">
            <Send className="w-3 h-3 mr-1" />{giftingAll ? 'Sending...' : 'Gift All'}
          </Button>
          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onDelete(egg.id); }} className="text-red-400 h-7">
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-700 pt-3">
          {/* Gift to specific user */}
          <div className="flex gap-2">
            <Select value={giftUserId} onValueChange={setGiftUserId}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-xs h-8 flex-1">
                <SelectValue placeholder="Gift to specific user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map(u => <SelectItem key={u.id} value={u.id}>{u.username}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => { if (giftUserId) { onGiftUser(egg, giftUserId); setGiftUserId(''); } }} className="bg-purple-600 h-8 text-xs">
              <Gift className="w-3 h-3 mr-1" />Gift
            </Button>
          </div>

          {/* Prize list */}
          <div className="space-y-1">
            {(egg.prizes || []).map((p, i) => {
              const pct = totalWeight > 0 ? ((p.weight / totalWeight) * 100).toFixed(1) : 0;
              return (
                <div key={i} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-slate-300">{p.label || p.type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-slate-600 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-12 text-right">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}