import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function ShopItemDialog({ open, onOpenChange, form, setForm, customPets, customThemes, isSuperAdmin, onSubmit }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader><DialogTitle>Create Shop Item</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Winter Fox" className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Price (Quest Coins)</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-700 border-slate-600" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Item Type</Label>
              <Select value={form.itemType} onValueChange={(v) => setForm({ ...form, itemType: v })}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pet">Pet</SelectItem>
                  <SelectItem value="theme">Theme</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="xp_booster">XP Booster</SelectItem>
                  {isSuperAdmin && <SelectItem value="magic_egg">Magic Egg</SelectItem>}
                </SelectContent>
              </Select>
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
          </div>
          {form.itemType === 'pet' && (
            <div className="space-y-2">
              <Label>Select Pet</Label>
              <Select value={form.itemData?.petId || ''} onValueChange={(v) => setForm({ ...form, itemData: { petId: v } })}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Select pet" /></SelectTrigger>
                <SelectContent>
                  {customPets.map(pet => (<SelectItem key={pet.id} value={`custom_${pet.id}`}>{pet.emoji || '🎁'} {pet.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
          {form.itemType === 'theme' && (
            <div className="space-y-2">
              <Label>Select Theme</Label>
              <Select value={form.itemData?.themeId || ''} onValueChange={(v) => setForm({ ...form, itemData: { themeId: v } })}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Select theme" /></SelectTrigger>
                <SelectContent>
                  {customThemes.map(theme => (<SelectItem key={theme.id} value={`custom_${theme.id}`}>{theme.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
          {form.itemType === 'title' && (
            <div className="space-y-2">
              <Label>Title Text</Label>
              <Input value={form.itemData?.title || ''} onChange={(e) => setForm({ ...form, itemData: { title: e.target.value } })} placeholder="Epic Champion" className="bg-slate-700 border-slate-600" />
            </div>
          )}
          {form.itemType === 'xp_booster' && (
            <div className="space-y-2">
              <Label>XP Boost Amount</Label>
              <Input type="number" value={form.itemData?.xpAmount || ''} onChange={(e) => setForm({ ...form, itemData: { xpAmount: parseInt(e.target.value) || 0 } })} placeholder="100" className="bg-slate-700 border-slate-600" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isLimited" checked={form.isLimited} onChange={(e) => setForm({ ...form, isLimited: e.target.checked })} className="rounded" />
            <Label htmlFor="isLimited" className="cursor-pointer">Limited-Time Item</Label>
          </div>
          {form.isLimited && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="bg-slate-700 border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="bg-slate-700 border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label>Stock Limit (optional)</Label>
                <Input type="number" value={form.stockLimit || ''} onChange={(e) => { const val = parseInt(e.target.value) || null; setForm({ ...form, stockLimit: val, stockRemaining: val }); }} placeholder="Leave empty for unlimited" className="bg-slate-700 border-slate-600" />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} className="bg-purple-600">Create Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}