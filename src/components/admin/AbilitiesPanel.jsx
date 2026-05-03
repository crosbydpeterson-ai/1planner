import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Wand2, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['fire','ice','storm','nature','shadow','light','ocean','chaos','time','crystal'];
const CATEGORY_EMOJIS = {
  fire: '🔥', ice: '❄️', storm: '⚡', nature: '🌿', shadow: '🌑',
  light: '☀️', ocean: '🌊', chaos: '🎲', time: '⏳', crystal: '💎'
};
const CATEGORY_DESC = {
  fire: 'Aggressive — burns/destroys',
  ice: 'Defensive — freezes',
  storm: 'Speedy — lightning strikes',
  nature: 'Healing — growth & roots',
  shadow: 'Sneaky — stealth & deception',
  light: 'Holy — purify & shield',
  ocean: 'Flowing — waves & coral',
  chaos: 'Wild — random effects',
  time: 'Ancient — rewind & slow',
  crystal: 'Hard — gems & treasure',
};

export default function AbilitiesPanel() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [perPetLoading, setPerPetLoading] = useState({}); // { [petId]: true }
  const [savingPetId, setSavingPetId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const all = await base44.entities.CustomPet.list('-created_date');
    setPets(all);
    setLoading(false);
  };

  const profileId = () => localStorage.getItem('quest_profile_id');

  const handleBulkAI = async (forceAll = false) => {
    if (!confirm(forceAll ? 'Re-assign ability categories for ALL pets (overwrites existing)?' : 'Use AI to assign ability categories for pets that don\'t have one?')) return;
    setBulkLoading(true);
    try {
      const { data } = await base44.functions.invoke('suggestPetAbilities', {
        profileId: profileId(), mode: 'bulk', forceAll
      });
      if (data?.success) {
        toast.success(`AI assigned ${data.updated} of ${data.total} pets`);
        await load();
      } else {
        toast.error(data?.error || 'Bulk AI failed');
      }
    } catch (e) {
      toast.error('Bulk AI failed');
    }
    setBulkLoading(false);
  };

  const handleSuggestOne = async (pet) => {
    setPerPetLoading(prev => ({ ...prev, [pet.id]: true }));
    try {
      const { data } = await base44.functions.invoke('suggestPetAbilities', {
        profileId: profileId(), petIds: [pet.id]
      });
      if (data?.success) {
        toast.success(`${pet.name}: ${CATEGORY_EMOJIS[data.category]} ${data.category}`);
        setPets(prev => prev.map(p => p.id === pet.id ? { ...p, abilityCategory: data.category } : p));
      } else {
        toast.error(data?.error || 'AI failed');
      }
    } catch (e) {
      toast.error('AI failed');
    }
    setPerPetLoading(prev => ({ ...prev, [pet.id]: false }));
  };

  const handleManualSet = async (pet, category) => {
    setSavingPetId(pet.id);
    const value = category === 'none' ? null : category;
    await base44.entities.CustomPet.update(pet.id, { abilityCategory: value });
    setPets(prev => prev.map(p => p.id === pet.id ? { ...p, abilityCategory: value } : p));
    setSavingPetId(null);
  };

  const filtered = pets.filter(p =>
    !search ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.abilityCategory?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: pets.length,
    assigned: pets.filter(p => p.abilityCategory).length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <div>
            <h3 className="text-xl font-bold text-white">Pet Abilities</h3>
            <p className="text-slate-400 text-sm">
              Each pet can hold an ability category. When equipped as a piece in PawSpell, it gives that piece its ability.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-slate-300">{stats.assigned} / {stats.total} pets assigned</span>
          <div className="flex-1" />
          <Button onClick={() => handleBulkAI(false)} disabled={bulkLoading} className="bg-purple-600 hover:bg-purple-500 gap-2">
            {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            AI Fill Empty
          </Button>
          <Button onClick={() => handleBulkAI(true)} disabled={bulkLoading} variant="outline" className="border-purple-500 text-purple-300 gap-2">
            {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            AI Re-roll All
          </Button>
        </div>
      </div>

      {/* Category legend */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <p className="text-slate-300 text-xs font-bold mb-2 uppercase tracking-wider">Ability Categories</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {CATEGORIES.map(cat => (
            <div key={cat} className="bg-slate-700/40 rounded-lg p-2">
              <p className="text-white text-sm font-medium capitalize">
                {CATEGORY_EMOJIS[cat]} {cat}
              </p>
              <p className="text-slate-400 text-[11px] leading-tight">{CATEGORY_DESC[cat]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pets or categories..."
          className="pl-9 bg-slate-800 border-slate-700 text-white"
        />
      </div>

      {/* Pet list */}
      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-400">No pets found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map(pet => {
            const cat = pet.abilityCategory;
            return (
              <div key={pet.id} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                <div className="flex items-center gap-3">
                  {pet.imageUrl ? (
                    <img src={pet.imageUrl} alt={pet.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <span className="text-3xl flex-shrink-0">{pet.emoji || '🐾'}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{pet.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{pet.rarity}</p>
                  </div>
                  {cat && (
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-700/40 text-purple-200 border border-purple-700/60 capitalize">
                      {CATEGORY_EMOJIS[cat]} {cat}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 mt-3">
                  <Select value={cat || 'none'} onValueChange={(v) => handleManualSet(pet, v)} disabled={savingPetId === pet.id}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white h-9 text-xs flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {CATEGORIES.map(c => (
                        <SelectItem key={c} value={c}>
                          {CATEGORY_EMOJIS[c]} {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    onClick={() => handleSuggestOne(pet)}
                    disabled={!!perPetLoading[pet.id]}
                    className="bg-purple-600 hover:bg-purple-500 h-9 gap-1 text-xs"
                  >
                    {perPetLoading[pet.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                    AI
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}