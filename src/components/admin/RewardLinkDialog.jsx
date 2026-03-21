import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';

export default function RewardLinkDialog({ open, onOpenChange, form, setForm, customPets, customThemes, isSuperAdmin, onSubmit }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Reward Link</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Link Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Holiday Bonus" className="bg-slate-700 border-slate-600" />
          </div>
          <div className="space-y-2">
            <Label>Reward Type</Label>
            <Select value={form.rewardType} onValueChange={(v) => setForm({ ...form, rewardType: v, rewardData: {} })}>
              <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="xp">XP</SelectItem>
                <SelectItem value="coins">Quest Coins</SelectItem>
                <SelectItem value="magic_egg">Magic Egg</SelectItem>
                <SelectItem value="pet">Pet</SelectItem>
                <SelectItem value="theme">Theme</SelectItem>
                <SelectItem value="title">Title</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(form.rewardType === 'xp' || form.rewardType === 'coins') && (
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" value={form.rewardValue || ''} onChange={(e) => setForm({ ...form, rewardValue: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" />
            </div>
          )}
          {form.rewardType === 'pet' && (
            <div className="space-y-2">
              <Label>Select Pet</Label>
              <Select value={form.rewardData?.petId || ''} onValueChange={(v) => setForm({ ...form, rewardData: { petId: v } })}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Choose pet" /></SelectTrigger>
                <SelectContent>
                  {PETS.map(p => <SelectItem key={p.id} value={p.id}>{p.emoji} {p.name}</SelectItem>)}
                  {customPets.map(p => <SelectItem key={p.id} value={`custom_${p.id}`}>{p.emoji || '🎁'} {p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {form.rewardType === 'theme' && (
            <div className="space-y-2">
              <Label>Select Theme</Label>
              <Select value={form.rewardData?.themeId || ''} onValueChange={(v) => setForm({ ...form, rewardData: { themeId: v } })}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Choose theme" /></SelectTrigger>
                <SelectContent>
                  {THEMES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  {customThemes.map(t => <SelectItem key={t.id} value={`custom_${t.id}`}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          {form.rewardType === 'title' && (
            <div className="space-y-2">
              <Label>Title Text</Label>
              <Input value={form.rewardData?.title || ''} onChange={(e) => setForm({ ...form, rewardData: { title: e.target.value } })} placeholder="e.g. Holiday Hero" className="bg-slate-700 border-slate-600" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Uses</Label>
              <Input type="number" value={form.maxUses || ''} onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || null })} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Expires At</Label>
              <Input type="datetime-local" value={form.expiresAt || ''} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="bg-slate-700 border-slate-600" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} className="bg-gradient-to-r from-pink-500 to-purple-500">Create Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}