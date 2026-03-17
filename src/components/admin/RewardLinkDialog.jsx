import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import { toast } from 'sonner';

const DEFAULT_FORM = {
  name: '', rewardType: 'xp', rewardValue: 100, rewardData: {},
  maxUses: 10, usedBy: [], expiresAt: '', isActive: true
};

export default function RewardLinkDialog({ open, onOpenChange, isSuperAdmin, customPets, customThemes, rewardLinks, setRewardLinks }) {
  const [form, setForm] = React.useState(DEFAULT_FORM);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader><DialogTitle>Create Reward Link</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Link Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Welcome Bonus" className="bg-slate-700 border-slate-600" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Reward Type</Label>
              <Select value={form.rewardType} onValueChange={(v) => setForm({ ...form, rewardType: v, rewardValue: v === 'magic_egg' || v === 'notebook_drop' ? 0 : 100, rewardData: {} })}>
                <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="xp">XP</SelectItem>
                  <SelectItem value="coins">Quest Coins</SelectItem>
                  {isSuperAdmin && <SelectItem value="magic_egg">Magic Egg</SelectItem>}
                  <SelectItem value="notebook_drop">📔 Notebook Drop</SelectItem>
                  <SelectItem value="pet">Pet</SelectItem>
                  <SelectItem value="theme">Theme</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(form.rewardType === 'xp' || form.rewardType === 'coins') && (
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input type="number" value={form.rewardValue} onChange={(e) => setForm({ ...form, rewardValue: parseInt(e.target.value) || 0 })} placeholder="100" className="bg-slate-700 border-slate-600" />
              </div>
            )}
            {form.rewardType === 'notebook_drop' && (
              <div className="space-y-2 flex items-end">
                <p className="text-sm text-slate-400">A random Notebook Drop will be rolled and delivered when redeemed.</p>
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
                <Input value={form.rewardData?.title || ''} onChange={(e) => setForm({ ...form, rewardData: { title: e.target.value } })} placeholder="VIP Member" className="bg-slate-700 border-slate-600" />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Max Uses (empty = unlimited)</Label>
              <Input type="number" value={form.maxUses || ''} onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || null })} placeholder="10" className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Expires At (optional)</Label>
              <Input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className="bg-slate-700 border-slate-600" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={async () => {
            if (!form.name.trim()) { toast.error('Enter link name'); return; }
            const newLink = await base44.entities.RewardLink.create(form);
            setRewardLinks([newLink, ...rewardLinks]);
            onOpenChange(false);
            setForm(DEFAULT_FORM);
            toast.success('Reward link created!');
          }} className="bg-gradient-to-r from-pink-500 to-purple-500">Create Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}