import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Wand2, Loader2, Gift, Send, ClipboardList } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { PETS } from '@/components/quest/PetCatalog';

const COLORS = ['#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#3b82f6','#ec4899','#14b8a6','#f97316'];
const TYPE_EMOJI = { xp: '⚡', coins: '🪙', pet: '🐾', theme: '🎨', title: '🏷️', magic_egg: '🥚', cosmetic: '👒' };

export default function LootEggManagerPanel({ users = [], customPets = [], customThemes = [] }) {
  const [lootEggs, setLootEggs] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingStep, setGeneratingStep] = useState('');
  const [giftingAll, setGiftingAll] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [defaultEggId, setDefaultEggId] = useState(null);
  // Pets created during this session (not yet in parent's customPets)
  const [localCustomPets, setLocalCustomPets] = useState([]);
  const allCustomPets = [...customPets, ...localCustomPets];

  const [form, setForm] = useState({
    name: '', description: '', emoji: '🥚', color: '#6366f1', prizes: [],
  });

  useEffect(() => { loadEggs(); loadDefaultEgg(); }, []);

  const loadEggs = async () => {
    const eggs = await base44.entities.LootEgg.list('-created_date');
    setLootEggs(eggs);
    setLoading(false);
  };

  const loadDefaultEgg = async () => {
    const settings = await base44.entities.AppSetting.list();
    const setting = settings.find(s => s.key === 'default_assignment_loot_egg');
    setDefaultEggId(setting?.value?.lootEggId || null);
  };

  const toggleDefaultEgg = async (eggId) => {
    const newId = defaultEggId === eggId ? null : eggId;
    const settings = await base44.entities.AppSetting.list();
    const existing = settings.find(s => s.key === 'default_assignment_loot_egg');
    if (existing) {
      await base44.entities.AppSetting.update(existing.id, { value: { lootEggId: newId } });
    } else {
      await base44.entities.AppSetting.create({ key: 'default_assignment_loot_egg', value: { lootEggId: newId } });
    }
    setDefaultEggId(newId);
    toast.success(newId ? 'Set as default assignment egg' : 'Default assignment egg cleared');
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
    setGeneratingStep('Designing egg & prizes...');
    try {
      // Step 1: Generate egg concept with prize ideas
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are creating a loot egg for a classroom gamification app. The theme is: "${aiPrompt}". 
Generate a loot egg with:
- A creative name
- An emoji (single emoji)
- A hex color that fits
- A short description (1 sentence)
- 5-8 prizes with varying rarity. Types can be: xp, coins, pet, magic_egg, title.
  - For xp/coins: value should be a number string like "50" or "100"
  - For pet: provide petName (creative name), petDescription (2 sentences, kid-friendly), petRarity (common/uncommon/rare/epic/legendary), petImagePrompt (detailed art prompt for a cute cartoon creature)
  - For title: value should be the title text
  - For magic_egg: value can be "1"
  - weight determines chance (higher = more common). Use weights like: common=30, uncommon=20, rare=10, epic=5, legendary=2
  - Include 1-2 pet prizes (rare/legendary weight) and mix in xp/coins/title/magic_egg for the rest

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
                  petName: { type: 'string' },
                  petDescription: { type: 'string' },
                  petRarity: { type: 'string' },
                  petImagePrompt: { type: 'string' },
                }
              }
            }
          }
        }
      });

      // Step 2: For each pet prize, generate the actual pet with an image
      const finalPrizes = [];
      const newLocalPets = [];
      const petPrizes = (result.prizes || []).filter(p => p.type === 'pet' && p.petName);
      const otherPrizes = (result.prizes || []).filter(p => !(p.type === 'pet' && p.petName));

      for (const prize of petPrizes) {
        setGeneratingStep(`Creating pet: ${prize.petName}...`);
        try {
          const imgResult = await base44.integrations.Core.GenerateImage({
            prompt: prize.petImagePrompt
              ? `${prize.petImagePrompt}, cute cartoon style, vibrant colors, kid-friendly, white background, digital art`
              : `Cute cartoon ${prize.petName} creature, vibrant colors, kid-friendly digital art style, white background`
          });
          const rarity = prize.petRarity || 'rare';
          const xpMap = { common: 0, uncommon: 100, rare: 300, epic: 800, legendary: 2000 };
          const petRecord = await base44.entities.CustomPet.create({
            name: prize.petName,
            description: prize.petDescription || '',
            rarity,
            xpRequired: xpMap[rarity] || 300,
            isGiftOnly: true,
            imageUrl: imgResult.url,
            imageSource: 'ai_generated',
            createdSourceTab: 'unknown',
          });
          newLocalPets.push(petRecord);
          finalPrizes.push({
            type: 'pet',
            label: prize.label || prize.petName,
            value: `custom_${petRecord.id}`,
            weight: prize.weight,
          });
        } catch (e) {
          console.error('Failed to create pet for prize', e);
          toast.error(`Failed to create pet: ${prize.petName}`);
        }
      }

      // Add non-pet prizes
      for (const prize of otherPrizes) {
        finalPrizes.push({ type: prize.type, label: prize.label, value: prize.value, weight: prize.weight });
      }

      // Sort by weight descending (most common first)
      finalPrizes.sort((a, b) => (b.weight || 0) - (a.weight || 0));

      // Register new pets locally so EggRow and dialog can show their images
      if (newLocalPets.length > 0) {
        setLocalCustomPets(prev => [...prev, ...newLocalPets]);
      }

      setForm({
        name: result.name || 'Mystery Egg',
        emoji: result.emoji || '🥚',
        color: result.color || '#6366f1',
        description: result.description || '',
        prizes: finalPrizes,
      });
      setGeneratingStep('');
      setShowCreate(true);
      toast.success(`✅ Egg generated! Created ${newLocalPets.length} pet(s).`);
    } catch (e) {
      toast.error('Generation failed: ' + e.message);
    }
    setGenerating(false);
    setGeneratingStep('');
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
            {generating ? <><Loader2 className="w-4 h-4 animate-spin mr-1" />{generatingStep || 'Generating...'}</> : <><Wand2 className="w-4 h-4 mr-1" />Generate</>}
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
              <EggRow key={egg.id} egg={egg} users={users} customPets={allCustomPets} onDelete={handleDelete} onGiftAll={handleGiftToAll} onGiftUser={handleGiftToUser} giftingAll={giftingAll} isDefaultEgg={defaultEggId === egg.id} onToggleDefault={() => toggleDefaultEgg(egg.id)} />
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
                  // Find pet image for display
                  let prizeImg = null;
                  if (prize.type === 'pet' && prize.value?.startsWith('custom_')) {
                    const petId = prize.value.replace('custom_', '');
                    const pet = allCustomPets.find(cp => cp.id === petId);
                    prizeImg = pet?.imageUrl || null;
                  }
                  return (
                    <div key={i} className="bg-slate-700/60 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {prizeImg && <img src={prizeImg} className="w-8 h-8 rounded object-cover border border-slate-500" alt={prize.label} />}
                          <span className="text-xs text-slate-400">Prize {i + 1} — {pct}% chance</span>
                        </div>
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
                              {allCustomPets.map(p => <SelectItem key={p.id} value={`custom_${p.id}`}>{p.imageUrl ? '🖼️' : (p.emoji || '🎁')} {p.name}</SelectItem>)}
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

function EggRow({ egg, users, customPets = [], onDelete, onGiftAll, onGiftUser, giftingAll, isDefaultEgg, onToggleDefault }) {
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
          <button
            onClick={(e) => { e.stopPropagation(); onToggleDefault(); }}
            title={isDefaultEgg ? 'Currently the default assignment egg (click to unset)' : 'Set as default assignment egg'}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-all ${isDefaultEgg ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300' : 'border-slate-600 bg-slate-700/50 text-slate-400 hover:border-slate-500'}`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <Checkbox checked={isDefaultEgg} className="h-3.5 w-3.5 border-current data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
          </button>
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
              // Look up pet image if it's a custom pet prize
              let petImg = null;
              if (p.type === 'pet' && p.value?.startsWith('custom_')) {
                const petId = p.value.replace('custom_', '');
                const pet = customPets.find(cp => cp.id === petId);
                petImg = pet?.imageUrl || null;
              }
              return (
                <div key={i} className="flex items-center justify-between bg-slate-700/40 rounded-lg px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    {petImg
                      ? <img src={petImg} className="w-6 h-6 rounded object-cover" alt={p.label} />
                      : <span className="text-sm">{TYPE_EMOJI[p.type] || '🎁'}</span>}
                    <span className="text-xs text-slate-300">{p.label || p.type}</span>
                  </div>
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