import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';
import { toast } from 'sonner';
import { rollNotebookRarity, rollNotebookItems, applyNotebookDrops } from '@/lib/notebookDrops';

export default function AdminGiftDialog({
  open, onOpenChange,
  giftUser, giftUsername, setGiftUsername,
  giftType, setGiftType,
  giftItemId, setGiftItemId,
  isSuperAdmin, adminProfile, setAdminProfile,
  users, setUsers,
  customPets, customThemes, petCosmetics, boothSkins,
  resolveGiftRecipient, handleGiftItem,
}) {
  const handleNotebookDrop = async () => {
    const recipient = resolveGiftRecipient();
    if (!recipient) return;
    const rarity = rollNotebookRarity() || 'super_rare'; // always drop when gifted
    const items = rollNotebookItems(rarity, recipient.unlockedPets || [], recipient.unlockedThemes || []);
    await applyNotebookDrops(recipient, items, base44);
    toast.success(`📔 Notebook Drop (${rarity}) gifted to ${recipient.username}!`, {
      description: `${items.length} item(s) delivered.`
    });
    setUsers(users.map(u => u.id === recipient.id ? { ...u } : u));
    onOpenChange(false);
    setGiftItemId('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Gift Item to {giftUser?.username || giftUsername || 'User'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Gift to Username</Label>
            <div className="flex gap-2">
              <Input
                value={giftUsername}
                onChange={(e) => setGiftUsername(e.target.value)}
                placeholder="Enter username"
                className="bg-slate-700 border-slate-600"
              />
              <Button type="button" size="sm" variant="outline" onClick={resolveGiftRecipient} className="border-purple-500 text-purple-300 hover:bg-purple-500/20">
                Find
              </Button>
            </div>
            {giftUser && (
              <p className="text-xs text-slate-400">Selected: <span className="text-purple-200">{giftUser.username}</span></p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Gift Type</Label>
            <Select value={giftType} onValueChange={(v) => { setGiftType(v); setGiftItemId(''); }}>
              <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="coins">Quest Coins</SelectItem>
                <SelectItem value="pet">Pet</SelectItem>
                <SelectItem value="theme">Theme</SelectItem>
                <SelectItem value="cosmetic">Cosmetic</SelectItem>
                <SelectItem value="boothskin">Booth Skin</SelectItem>
                <SelectItem value="notebook_drop">📔 Notebook Drop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {giftType === 'notebook_drop' && (
            <div className="bg-slate-700/50 rounded-lg p-3 text-sm text-slate-300">
              A random Notebook Drop rarity will be rolled and all loot instantly granted to the recipient.
            </div>
          )}

          {giftType === 'coins' && (
            <div className="space-y-2">
              <Label>Amount of Quest Coins</Label>
              <Input type="number" value={giftItemId} onChange={(e) => setGiftItemId(e.target.value)} placeholder="100" className="bg-slate-700 border-slate-600" />
            </div>
          )}

          {giftType !== 'coins' && giftType !== 'notebook_drop' && (
            <div className="space-y-2">
              <Label>Select {giftType === 'pet' ? 'Pet' : giftType === 'theme' ? 'Theme' : 'Item'}</Label>
              <Select value={giftItemId} onValueChange={setGiftItemId}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder={`Select a ${giftType}`} />
                </SelectTrigger>
                <SelectContent>
                  {giftType === 'pet' ? (
                    <>
                      {PETS.map(pet => <SelectItem key={pet.id} value={pet.id}>{pet.emoji || '🎁'} {pet.name} (Built-in)</SelectItem>)}
                      {customPets.map(pet => <SelectItem key={pet.id} value={`custom_${pet.id}`}>{pet.emoji || '🎁'} {pet.name} (Custom)</SelectItem>)}
                    </>
                  ) : giftType === 'theme' ? (
                    <>
                      {THEMES.map(t => <SelectItem key={t.id} value={t.id}>{t.name} (Built-in)</SelectItem>)}
                      {customThemes.map(t => <SelectItem key={t.id} value={`custom_${t.id}`}>{t.name} (Custom)</SelectItem>)}
                    </>
                  ) : giftType === 'boothskin' ? (
                    boothSkins.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                  ) : (
                    petCosmetics.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.cosmeticType})</SelectItem>)
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {isSuperAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={async () => {
                  const r = resolveGiftRecipient(); if (!r) return;
                  const ids = [...PETS.map(p => p.id), ...customPets.map(p => `custom_${p.id}`)];
                  await base44.entities.UserProfile.update(r.id, { unlockedPets: ids });
                  setUsers(users.map(u => u.id === r.id ? { ...u, unlockedPets: ids } : u));
                  toast.success(`All pets gifted to ${r.username}!`);
                }} className="flex-1 border-purple-500 text-purple-400 hover:bg-purple-500/20">Gift ALL Pets</Button>
                <Button variant="outline" size="sm" onClick={async () => {
                  const r = resolveGiftRecipient(); if (!r) return;
                  const ids = [...THEMES.map(t => t.id), ...customThemes.map(t => `custom_${t.id}`)];
                  await base44.entities.UserProfile.update(r.id, { unlockedThemes: ids });
                  setUsers(users.map(u => u.id === r.id ? { ...u, unlockedThemes: ids } : u));
                  toast.success(`All themes gifted to ${r.username}!`);
                }} className="flex-1 border-cyan-500 text-cyan-400 hover:bg-cyan-500/20">Gift ALL Themes</Button>
              </>
            )}
          </div>

          {isSuperAdmin && (
            <Button variant="outline" size="sm" onClick={async () => {
              const r = resolveGiftRecipient(); if (!r) return;
              await base44.entities.MagicEgg.create({ userId: r.userId });
              toast.success(`🥚 Magic Egg gifted to ${r.username}!`);
            }} className="w-full border-amber-500 text-amber-400 hover:bg-amber-500/20">
              🥚 Gift Magic Egg
            </Button>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          {giftType === 'notebook_drop'
            ? <Button onClick={handleNotebookDrop} className="bg-blue-600">Gift Drop</Button>
            : <Button onClick={handleGiftItem} className="bg-purple-600">Gift Item</Button>
          }
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}