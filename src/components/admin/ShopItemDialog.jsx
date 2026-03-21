import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ShopItemDialog({ open, onOpenChange, form, setForm, customPets, customThemes, isSuperAdmin, onSubmit }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Shop Item</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Item Type</Label>
              <Select value={form.itemType} onValueChange={(v) => setForm({ ...form, itemType: v })}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pet">Pet</SelectItem>
                  <SelectItem value="theme">Theme</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="xp_booster">XP Booster</SelectItem>
                  <SelectItem value="magic_egg">Magic Egg</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-700 border-slate-600" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price (Quest Coins)</Label>
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
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="shopIsLimited" checked={form.isLimited} onChange={(e) => setForm({ ...form, isLimited: e.target.checked })} className="rounded" />
            <Label htmlFor="shopIsLimited" className="cursor-pointer">Limited Time</Label>
          </div>
          {form.isLimited && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stock Limit</Label>
                <Input type="number" value={form.stockLimit || ''} onChange={(e) => { const v = parseInt(e.target.value) || null; setForm({ ...form, stockLimit: v, stockRemaining: v }); }} className="bg-slate-700 border-slate-600" />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="datetime-local" value={form.endDate || ''} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="bg-slate-700 border-slate-600" />
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