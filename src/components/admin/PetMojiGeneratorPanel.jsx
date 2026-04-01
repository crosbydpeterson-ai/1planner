import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Wand2, Trash2, Eye, EyeOff, Lock, Gift } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { SAFE_PROMPT_SUFFIX } from '@/components/community/petmojiModeration';

export default function PetMojiGeneratorPanel() {
  const [mode, setMode] = useState('pet');
  const [customPets, setCustomPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [action, setAction] = useState('');
  const [freeDescription, setFreeDescription] = useState('');
  const [name, setName] = useState('');
  const [isExclusive, setIsExclusive] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [petMojis, setPetMojis] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Gift dialog
  const [giftMoji, setGiftMoji] = useState(null);
  const [allProfiles, setAllProfiles] = useState([]);
  const [giftSearch, setGiftSearch] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoadingList(true);
    const [pets, mojis, profiles] = await Promise.all([
      base44.entities.CustomPet.list('-created_date'),
      base44.entities.PetMoji.list('-created_date'),
      base44.entities.UserProfile.list('-created_date'),
    ]);
    setCustomPets(pets);
    setPetMojis(mojis);
    setAllProfiles(profiles);
    setLoadingList(false);
  };

  const handleGenerate = async () => {
    let prompt = '';
    if (mode === 'pet') {
      if (!selectedPetId) { toast.error('Select a pet first'); return; }
      if (!action.trim()) { toast.error('Describe what the pet is doing'); return; }
      const pet = customPets.find(p => p.id === selectedPetId);
      if (!pet) return;
      prompt = `Create a small square emoji-style sticker of a cute cartoon ${pet.name} character ${action.trim()}. The character should match this description: ${pet.description || pet.name}. Style: kawaii emoji sticker, transparent background feel, vibrant colors, simple clean design, expressive face, chibi proportions. Make it look like a chat reaction emoji.${SAFE_PROMPT_SUFFIX}`;
      if (!name) setName(`${pet.name} ${action.trim().slice(0, 20)}`);
    } else {
      if (!freeDescription.trim()) { toast.error('Describe the petmoji'); return; }
      prompt = `Create a small square emoji-style sticker: ${freeDescription.trim()}. Style: kawaii emoji sticker, transparent background feel, vibrant colors, simple clean design, expressive face, chibi proportions. Make it look like a chat reaction emoji.${SAFE_PROMPT_SUFFIX}`;
      if (!name) setName(freeDescription.trim().slice(0, 30));
    }
    setGenerating(true);
    setPreviewUrl(null);
    const result = await base44.integrations.Core.GenerateImage({ prompt });
    setPreviewUrl(result.url);
    setGenerating(false);
  };

  const handleSave = async () => {
    if (!previewUrl || !name.trim()) { toast.error('Generate an image and give it a name'); return; }
    setSaving(true);
    const pet = mode === 'pet' ? customPets.find(p => p.id === selectedPetId) : null;
    const moji = await base44.entities.PetMoji.create({
      name: name.trim(),
      description: mode === 'pet' ? `${pet?.name || ''} ${action}` : freeDescription,
      imageUrl: previewUrl,
      basePetId: pet?.id || '',
      basePetName: pet?.name || '',
      isActive: true,
      isExclusive,
      exclusiveOwnerIds: [],
    });
    setPetMojis([moji, ...petMojis]);
    setPreviewUrl(null);
    setName('');
    setAction('');
    setFreeDescription('');
    setIsExclusive(false);
    setSaving(false);
    toast.success(isExclusive ? 'Exclusive petmoji saved! Gift it to users.' : 'Petmoji saved!');
  };

  const handleDelete = async (id) => {
    await base44.entities.PetMoji.delete(id);
    setPetMojis(petMojis.filter(m => m.id !== id));
    toast.success('Petmoji deleted');
  };

  const handleToggle = async (moji) => {
    const newActive = !moji.isActive;
    await base44.entities.PetMoji.update(moji.id, { isActive: newActive });
    setPetMojis(petMojis.map(m => m.id === moji.id ? { ...m, isActive: newActive } : m));
  };

  const handleToggleExclusive = async (moji) => {
    const newExclusive = !moji.isExclusive;
    await base44.entities.PetMoji.update(moji.id, { isExclusive: newExclusive });
    setPetMojis(petMojis.map(m => m.id === moji.id ? { ...m, isExclusive: newExclusive } : m));
    toast.success(newExclusive ? 'Now exclusive' : 'Now public');
  };

  const handleGiftToUser = async (profileId) => {
    if (!giftMoji) return;
    const current = giftMoji.exclusiveOwnerIds || [];
    if (current.includes(profileId)) { toast.error('User already has this petmoji'); return; }
    const updated = [...current, profileId];
    await base44.entities.PetMoji.update(giftMoji.id, { exclusiveOwnerIds: updated });
    setPetMojis(petMojis.map(m => m.id === giftMoji.id ? { ...m, exclusiveOwnerIds: updated } : m));
    setGiftMoji({ ...giftMoji, exclusiveOwnerIds: updated });
    const user = allProfiles.find(p => p.id === profileId);
    toast.success(`Gifted to ${user?.username || 'user'}!`);
  };

  const handleRemoveOwner = async (profileId) => {
    if (!giftMoji) return;
    const updated = (giftMoji.exclusiveOwnerIds || []).filter(id => id !== profileId);
    await base44.entities.PetMoji.update(giftMoji.id, { exclusiveOwnerIds: updated });
    setPetMojis(petMojis.map(m => m.id === giftMoji.id ? { ...m, exclusiveOwnerIds: updated } : m));
    setGiftMoji({ ...giftMoji, exclusiveOwnerIds: updated });
  };

  const filteredGiftProfiles = allProfiles.filter(p =>
    p.username?.toLowerCase().includes(giftSearch.toLowerCase())
  ).slice(0, 20);

  return (
    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">😺</span>
        <div>
          <h3 className="text-lg font-bold text-white">Petmoji Generator</h3>
          <p className="text-slate-400 text-sm">Create custom pet reaction emojis with AI</p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex gap-2">
        <Button size="sm" variant={mode === 'pet' ? 'default' : 'outline'} onClick={() => setMode('pet')}
          className={mode === 'pet' ? 'bg-purple-600' : 'border-slate-600 text-slate-300'}>
          🐾 From Pet
        </Button>
        <Button size="sm" variant={mode === 'describe' ? 'default' : 'outline'} onClick={() => setMode('describe')}
          className={mode === 'describe' ? 'bg-purple-600' : 'border-slate-600 text-slate-300'}>
          ✏️ Describe It
        </Button>
      </div>

      {mode === 'pet' && (
        <div className="space-y-3">
          <div>
            <Label className="text-slate-300">Select Pet</Label>
            <Select value={selectedPetId} onValueChange={setSelectedPetId}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Choose a pet..." /></SelectTrigger>
              <SelectContent>{customPets.map(p => (<SelectItem key={p.id} value={p.id}>{p.emoji || '🎁'} {p.name} ({p.rarity})</SelectItem>))}</SelectContent>
            </Select>
          </div>
          {selectedPetId && (() => {
            const pet = customPets.find(p => p.id === selectedPetId);
            if (!pet) return null;
            return (
              <div className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3">
                {pet.imageUrl ? <img src={pet.imageUrl} alt={pet.name} className="w-12 h-12 rounded-lg object-cover" /> : <span className="text-3xl">{pet.emoji}</span>}
                <div><p className="text-white font-medium text-sm">{pet.name}</p><p className="text-slate-400 text-xs">{pet.description || 'No description'}</p></div>
              </div>
            );
          })()}
          <div>
            <Label className="text-slate-300">What is the pet doing?</Label>
            <Input value={action} onChange={(e) => setAction(e.target.value)} placeholder="e.g. doing a thumbs up, crying, laughing, dancing..." className="bg-slate-700 border-slate-600 text-white" />
          </div>
        </div>
      )}

      {mode === 'describe' && (
        <div>
          <Label className="text-slate-300">Describe your petmoji</Label>
          <Textarea value={freeDescription} onChange={(e) => setFreeDescription(e.target.value)} placeholder="e.g. A tiny dragon blowing fire hearts, a sleeping cloud kitten..." className="bg-slate-700 border-slate-600 text-white min-h-[80px]" />
        </div>
      )}

      <div>
        <Label className="text-slate-300">Petmoji Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Auto-filled or type a name" className="bg-slate-700 border-slate-600 text-white" />
      </div>

      {/* Exclusive toggle */}
      <div className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <div>
            <p className="text-sm text-white font-medium">Exclusive Petmoji</p>
            <p className="text-[10px] text-slate-400">Only visible to users you gift it to</p>
          </div>
        </div>
        <Switch checked={isExclusive} onCheckedChange={setIsExclusive} />
      </div>

      <Button onClick={handleGenerate} disabled={generating} className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
        {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Wand2 className="w-4 h-4 mr-2" />Generate Petmoji</>}
      </Button>

      {previewUrl && (
        <div className="bg-slate-700/50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-white">Preview</p>
          <div className="flex items-center justify-center">
            <img src={previewUrl} alt="Petmoji preview" className="w-24 h-24 rounded-xl object-cover" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={generating} variant="outline" className="flex-1 border-slate-600 text-slate-300">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : '🔄 Regenerate'}
            </Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : '✅ Save Petmoji'}
            </Button>
          </div>
        </div>
      )}

      {/* Existing petmojis */}
      <div>
        <h4 className="text-white font-semibold mb-3">Saved Petmojis ({petMojis.length})</h4>
        {loadingList ? (
          <div className="text-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400 mx-auto" /></div>
        ) : petMojis.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No petmojis yet — create your first one above!</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {petMojis.map((moji) => (
              <div key={moji.id} className={`bg-slate-700/60 rounded-xl p-3 text-center relative group ${!moji.isActive ? 'opacity-50' : ''}`}>
                <img src={moji.imageUrl} alt={moji.name} className="w-14 h-14 rounded-lg object-cover mx-auto mb-2" />
                <p className="text-xs text-white font-medium truncate">{moji.name}</p>
                {moji.basePetName && <p className="text-[10px] text-slate-400 truncate">from {moji.basePetName}</p>}
                {moji.createdByUsername && <p className="text-[10px] text-slate-500 truncate">by {moji.createdByUsername}</p>}
                <div className="flex items-center justify-center gap-1 mt-1">
                  {moji.isExclusive && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 rounded font-semibold">✨ Exclusive</span>}
                  {moji.isExclusive && <span className="text-[9px] text-slate-500">{(moji.exclusiveOwnerIds || []).length} owners</span>}
                </div>
                <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {moji.isExclusive && (
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-amber-400 hover:text-amber-300" onClick={() => { setGiftMoji(moji); setGiftSearch(''); }}>
                      <Gift className="w-3 h-3" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-purple-400 hover:text-purple-300" onClick={() => handleToggleExclusive(moji)} title={moji.isExclusive ? 'Make public' : 'Make exclusive'}>
                    <Lock className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => handleToggle(moji)}>
                    {moji.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-300" onClick={() => handleDelete(moji.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gift exclusive petmoji dialog */}
      <Dialog open={!!giftMoji} onOpenChange={() => setGiftMoji(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-400" /> Gift: {giftMoji?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {giftMoji && (
              <div className="flex items-center justify-center">
                <img src={giftMoji.imageUrl} alt={giftMoji.name} className="w-16 h-16 rounded-lg object-cover" />
              </div>
            )}
            {/* Current owners */}
            {giftMoji && (giftMoji.exclusiveOwnerIds || []).length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-1">Current owners:</p>
                <div className="flex flex-wrap gap-1">
                  {(giftMoji.exclusiveOwnerIds || []).map(pid => {
                    const p = allProfiles.find(pr => pr.id === pid);
                    return (
                      <span key={pid} className="inline-flex items-center gap-1 bg-slate-700 text-xs px-2 py-0.5 rounded text-slate-200">
                        {p?.username || pid}
                        <button onClick={() => handleRemoveOwner(pid)} className="text-red-400 hover:text-red-300 ml-0.5">×</button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            <Input value={giftSearch} onChange={(e) => setGiftSearch(e.target.value)} placeholder="Search users..." className="bg-slate-700 border-slate-600" />
            <div className="max-h-40 overflow-y-auto space-y-1">
              {filteredGiftProfiles.map(p => (
                <button key={p.id} onClick={() => handleGiftToUser(p.id)}
                  className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-700 text-sm text-slate-200 transition-colors"
                >
                  <span className="text-xs">{p.username}</span>
                  {(giftMoji?.exclusiveOwnerIds || []).includes(p.id) && <span className="text-[9px] text-emerald-400 ml-auto">✓ Has it</span>}
                </button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}