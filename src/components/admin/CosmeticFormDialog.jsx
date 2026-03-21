import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CosmeticFormDialog({ open, onOpenChange, form, setForm, onCreated }) {
  const handleCreate = async () => {
    if (!form.name.trim() || !form.imageUrl) {
      toast.error('Enter name and upload image');
      return;
    }
    const newCosmetic = await base44.entities.PetCosmetic.create(form);
    onCreated(newCosmetic);
    setForm({ name: '', description: '', cosmeticType: 'hat', imageUrl: '', price: 50, rarity: 'common', isLimited: false, isActive: true });
    onOpenChange(false);
    toast.success('Cosmetic created!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Pet Cosmetic</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Cool Sunglasses" className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Cosmetic Type</Label>
              <Select value={form.cosmeticType} onValueChange={(v) => setForm({ ...form, cosmeticType: v })}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="hat">Hat</SelectItem>
                  <SelectItem value="glasses">Glasses</SelectItem>
                  <SelectItem value="accessory">Accessory</SelectItem>
                  <SelectItem value="background">Background</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Stylish shades for your pet" className="bg-slate-700 border-slate-600" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Price (Coins)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Rarity</Label>
              <Select value={form.rarity} onValueChange={(v) => setForm({ ...form, rarity: v })}>
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
            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="cosmeticLimited" checked={form.isLimited} onChange={(e) => setForm({ ...form, isLimited: e.target.checked })} className="rounded" />
                <Label htmlFor="cosmeticLimited" className="cursor-pointer">Limited</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Upload Image (PNG/SVG with transparent background)</Label>
            <Input type="file" accept="image/png,image/svg+xml" onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onloadend = () => setForm({ ...form, imageUrl: reader.result });
                reader.readAsDataURL(file);
              }
            }} className="bg-slate-700 border-slate-600" />
            {form.imageUrl && (
              <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                <img src={form.imageUrl} alt="Preview" className="w-16 h-16 object-contain" />
                <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, imageUrl: '' })} className="text-red-400">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} className="bg-pink-600">Create Cosmetic</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}