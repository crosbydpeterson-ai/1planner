import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';

export default function NewCosmeticDialog({ open, onOpenChange, cosmeticForm, setCosmeticForm, onCreateCosmetic }) {
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
              <Input value={cosmeticForm.name} onChange={(e) => setCosmeticForm({ ...cosmeticForm, name: e.target.value })} placeholder="Cool Sunglasses" className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Cosmetic Type</Label>
              <Select value={cosmeticForm.cosmeticType} onValueChange={(v) => setCosmeticForm({ ...cosmeticForm, cosmeticType: v })}>
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
            <Textarea value={cosmeticForm.description} onChange={(e) => setCosmeticForm({ ...cosmeticForm, description: e.target.value })} placeholder="Stylish shades for your pet" className="bg-slate-700 border-slate-600" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Price (Coins)</Label>
              <Input type="number" value={cosmeticForm.price} onChange={(e) => setCosmeticForm({ ...cosmeticForm, price: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Rarity</Label>
              <Select value={cosmeticForm.rarity} onValueChange={(v) => setCosmeticForm({ ...cosmeticForm, rarity: v })}>
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
                <input type="checkbox" id="cosmeticLimited" checked={cosmeticForm.isLimited} onChange={(e) => setCosmeticForm({ ...cosmeticForm, isLimited: e.target.checked })} className="rounded" />
                <Label htmlFor="cosmeticLimited" className="cursor-pointer">Limited</Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Upload Image (PNG/SVG with transparent background)</Label>
            <Input type="file" accept="image/png,image/svg+xml" onChange={(e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { setCosmeticForm({ ...cosmeticForm, imageUrl: reader.result }); }; reader.readAsDataURL(file); } }} className="bg-slate-700 border-slate-600" />
            {cosmeticForm.imageUrl && (
              <div className="flex items-center gap-3 p-4 bg-slate-700 rounded-lg">
                <img src={cosmeticForm.imageUrl} alt="Preview" className="w-16 h-16 object-contain" />
                <Button size="sm" variant="ghost" onClick={() => setCosmeticForm({ ...cosmeticForm, imageUrl: '' })} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onCreateCosmetic} className="bg-pink-600">Create Cosmetic</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}