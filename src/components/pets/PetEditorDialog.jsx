import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function PetEditorDialog({ open, onOpenChange, pet, onSaved }) {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (pet) {
      setForm({
        name: pet.name || '',
        rarity: pet.rarity || 'common',
        xpRequired: pet.xpRequired || 0,
        description: pet.description || '',
        emoji: pet.emoji || '',
        imageUrl: pet.imageUrl || '',
        theme: pet.theme || { primary: '#6366f1', secondary: '#8b5cf6', accent: '#f59e0b', bg: '#f8fafc' },
      });
    } else {
      setForm(null);
    }
  }, [pet]);

  if (!pet) return null;

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setForm((f) => ({ ...f, imageUrl: reader.result }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const payload = { ...form };
    const updated = await base44.entities.CustomPet.update(pet.id, payload);
    onSaved?.(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form?.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Rarity</Label>
              <Select value={form?.rarity} onValueChange={(v) => setForm({ ...form, rarity: v })}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="common">Common</SelectItem>
                  <SelectItem value="uncommon">Uncommon</SelectItem>
                  <SelectItem value="rare">Rare</SelectItem>
                  <SelectItem value="epic">Epic</SelectItem>
                  <SelectItem value="legendary">Legendary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>XP Required</Label>
              <Input type="number" value={form?.xpRequired} onChange={(e) => setForm({ ...form, xpRequired: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Emoji</Label>
              <Input value={form?.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="bg-slate-700 border-slate-600" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form?.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-700 border-slate-600 min-h-[80px]" />
          </div>
          <div className="space-y-2">
            <Label>Replace Image (optional)</Label>
            <div className="flex items-center gap-3">
              {form?.imageUrl && <img src={form.imageUrl} alt="Preview" className="w-16 h-16 rounded object-cover" />}
              <Input type="file" accept="image/*" onChange={handleFile} className="bg-slate-700 border-slate-600" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Theme Colors</Label>
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-xs text-slate-400">Primary</Label>
                <Input type="color" value={form?.theme?.primary || '#6366f1'} onChange={(e) => setForm({ ...form, theme: { ...form.theme, primary: e.target.value } })} className="h-10 bg-slate-700 border-slate-600" />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Secondary</Label>
                <Input type="color" value={form?.theme?.secondary || '#8b5cf6'} onChange={(e) => setForm({ ...form, theme: { ...form.theme, secondary: e.target.value } })} className="h-10 bg-slate-700 border-slate-600" />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Accent</Label>
                <Input type="color" value={form?.theme?.accent || '#f59e0b'} onChange={(e) => setForm({ ...form, theme: { ...form.theme, accent: e.target.value } })} className="h-10 bg-slate-700 border-slate-600" />
              </div>
              <div>
                <Label className="text-xs text-slate-400">Background</Label>
                <Input type="color" value={form?.theme?.bg || '#f8fafc'} onChange={(e) => setForm({ ...form, theme: { ...form.theme, bg: e.target.value } })} className="h-10 bg-slate-700 border-slate-600" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 bg-slate-800/60 p-3 rounded">
            <div>
              <div>Created by: <span className="text-slate-200">{pet.createdBy || '—'}</span></div>
              <div>Created at: <span className="text-slate-200">{pet.created_date ? new Date(pet.created_date).toLocaleString() : '—'}</span></div>
            </div>
            <div>
              <div>How: <span className="text-slate-200 capitalize">{pet.imageSource || '—'}</span></div>
              <div>Tab: <span className="text-slate-200">{pet.createdSourceTab || '—'}</span></div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} className="bg-purple-600">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}