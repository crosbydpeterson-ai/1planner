import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function NewCosmeticDialog({ open, onOpenChange, cosmeticForm, setCosmeticForm, onCreateCosmetic }) {
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCosmeticForm({ ...cosmeticForm, imageUrl: file_url });
      toast.success('Image uploaded');
    } catch (err) {
      toast.error('Upload failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Cosmetic</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={cosmeticForm.name} onChange={(e) => setCosmeticForm({ ...cosmeticForm, name: e.target.value })} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
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
            <Textarea value={cosmeticForm.description || ''} onChange={(e) => setCosmeticForm({ ...cosmeticForm, description: e.target.value })} className="bg-slate-700 border-slate-600" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price (Quest Coins)</Label>
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
          </div>
          <div className="space-y-2">
            <Label>Image (transparent PNG/SVG)</Label>
            <Input type="file" accept="image/*" onChange={handleImageUpload} className="bg-slate-700 border-slate-600" />
            {cosmeticForm.imageUrl && (
              <div className="flex items-center gap-3 mt-2">
                <img src={cosmeticForm.imageUrl} alt="Preview" className="w-16 h-16 object-contain bg-slate-700 rounded-lg p-1" />
                <Button size="sm" variant="ghost" onClick={() => setCosmeticForm({ ...cosmeticForm, imageUrl: '' })} className="text-red-400">Remove</Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="cosmeticLimited" checked={cosmeticForm.isLimited} onChange={(e) => setCosmeticForm({ ...cosmeticForm, isLimited: e.target.checked })} className="rounded" />
            <Label htmlFor="cosmeticLimited" className="cursor-pointer">Limited Edition</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onCreateCosmetic} className="bg-gradient-to-r from-pink-500 to-purple-600">Create Cosmetic</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}