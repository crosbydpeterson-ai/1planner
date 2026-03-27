import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Wand2, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function CreatePetDialog({ open, onOpenChange, adminProfile, onCreated }) {
  const [form, setForm] = useState({ name: '', rarity: 'common', xpRequired: 0, description: '', emoji: '', imageUrl: '', isGiftOnly: false, theme: { primary: '#6366f1', secondary: '#a855f7', accent: '#f59e0b', bg: '#f8fafc' } });
  const [generating, setGenerating] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) { const reader = new FileReader(); reader.onloadend = () => setForm(f => ({ ...f, imageUrl: reader.result })); reader.readAsDataURL(file); }
  };

  const handleGenerateImage = async () => {
    if (!form.name) { toast.error('Enter a pet name first'); return; }
    setGenerating(true);
    const result = await base44.integrations.Core.GenerateImage({ prompt: `Cute cartoon pet for kids game: ${form.name}. ${form.description || 'Friendly magical creature'}. Style: adorable, game mascot, clean. Colors: ${form.theme?.primary}, ${form.theme?.secondary}. White background, centered.` });
    setForm(f => ({ ...f, imageUrl: result.url }));
    toast.success('Image generated!');
    setGenerating(false);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { toast.error('Enter a name'); return; }
    if (!form.emoji && !form.imageUrl) { toast.error('Add emoji or image'); return; }
    const imageSource = form.imageUrl ? (form.imageUrl.startsWith('data:') ? 'uploaded' : 'ai_generated') : 'emoji_only';
    const newPet = await base44.entities.CustomPet.create({ ...form, createdBy: adminProfile?.userId || 'admin', createdByProfileId: adminProfile?.id, createdSourceTab: 'admin_pets', imageSource });
    onCreated(newPet);
    onOpenChange(false);
    setForm({ name: '', rarity: 'common', xpRequired: 0, description: '', emoji: '', imageUrl: '', isGiftOnly: false, theme: { primary: '#6366f1', secondary: '#a855f7', accent: '#f59e0b', bg: '#f8fafc' } });
    toast.success('Pet created!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader><DialogTitle>Create Custom Pet</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-700 border-slate-600" /></div>
            <div className="space-y-2"><Label>Rarity</Label><Select value={form.rarity} onValueChange={(v) => setForm({ ...form, rarity: v })}><SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="common">Common</SelectItem><SelectItem value="uncommon">Uncommon</SelectItem><SelectItem value="rare">Rare</SelectItem><SelectItem value="epic">Epic</SelectItem><SelectItem value="legendary">Legendary</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>XP Required {form.isGiftOnly && '(ignored)'}</Label><Input type="number" value={form.xpRequired} onChange={(e) => setForm({ ...form, xpRequired: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" disabled={form.isGiftOnly} /></div>
            <div className="space-y-2"><Label>Emoji</Label><Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="🐶" className="bg-slate-700 border-slate-600" /></div>
          </div>
          <div className="flex items-center gap-2"><input type="checkbox" checked={form.isGiftOnly} onChange={(e) => setForm({ ...form, isGiftOnly: e.target.checked })} className="rounded" /><Label className="cursor-pointer">Gift Only</Label></div>
          <div className="space-y-2"><Label>Pet Image</Label>
            <div className="flex items-center gap-2">
              <Button onClick={handleGenerateImage} disabled={generating} className="bg-gradient-to-r from-purple-500 to-pink-500">{generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}AI Generate</Button>
              <span className="text-slate-400 text-sm">or</span>
              <Input type="file" accept="image/*" onChange={handleImageUpload} className="bg-slate-700 border-slate-600 flex-1" />
            </div>
            {form.imageUrl && <div className="flex items-center gap-3 mt-2"><img src={form.imageUrl} alt="Preview" className="w-16 h-16 rounded-xl object-cover shadow-lg" /><Button size="sm" variant="ghost" onClick={() => setForm({ ...form, imageUrl: '' })} className="text-red-400"><Trash2 className="w-4 h-4" /></Button></div>}
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-700 border-slate-600" /></div>
          <div className="space-y-2"><Label>Theme Colors</Label>
            <div className="grid grid-cols-4 gap-2">
              {['primary','secondary','accent','bg'].map(k => (<div key={k}><Label className="text-xs text-slate-400 capitalize">{k}</Label><Input type="color" value={form.theme?.[k] || '#6366f1'} onChange={(e) => setForm({ ...form, theme: { ...form.theme, [k]: e.target.value } })} className="h-10 bg-slate-700 border-slate-600" /></div>))}
            </div>
          </div>
        </div>
        <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={handleCreate} className="bg-purple-600">Create Pet</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}