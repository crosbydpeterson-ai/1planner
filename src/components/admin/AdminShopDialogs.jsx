import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function NewShopItemDialog({ open, onOpenChange, isSuperAdmin, customPets, customThemes, shopItems, setShopItems }) {
  const defaultForm = { name: '', description: '', itemType: 'pet', itemData: {}, price: 50, rarity: 'common', isLimited: false, stockLimit: null, stockRemaining: null, startDate: '', endDate: '', isActive: true };
  const [form, setForm] = React.useState(defaultForm);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader><DialogTitle>Create Shop Item</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Winter Fox" className="bg-slate-700 border-slate-600" /></div>
            <div className="space-y-2"><Label>Price (Quest Coins)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" /></div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-700 border-slate-600" /></div>
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
                  {['common','uncommon','rare','epic','legendary'].map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.itemType === 'pet' && <div className="space-y-2"><Label>Select Pet</Label>
            <Select value={form.itemData?.petId || ''} onValueChange={(v) => setForm({ ...form, itemData: { petId: v } })}>
              <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Select pet" /></SelectTrigger>
              <SelectContent>{customPets.map(p => <SelectItem key={p.id} value={`custom_${p.id}`}>{p.emoji || '🎁'} {p.name}</SelectItem>)}</SelectContent>
            </Select></div>}
          {form.itemType === 'theme' && <div className="space-y-2"><Label>Select Theme</Label>
            <Select value={form.itemData?.themeId || ''} onValueChange={(v) => setForm({ ...form, itemData: { themeId: v } })}>
              <SelectTrigger className="bg-slate-700 border-slate-600"><SelectValue placeholder="Select theme" /></SelectTrigger>
              <SelectContent>{customThemes.map(t => <SelectItem key={t.id} value={`custom_${t.id}`}>{t.name}</SelectItem>)}</SelectContent>
            </Select></div>}
          {form.itemType === 'title' && <div className="space-y-2"><Label>Title Text</Label><Input value={form.itemData?.title || ''} onChange={(e) => setForm({ ...form, itemData: { title: e.target.value } })} placeholder="Epic Champion" className="bg-slate-700 border-slate-600" /></div>}
          {form.itemType === 'xp_booster' && <div className="space-y-2"><Label>XP Boost Amount</Label><Input type="number" value={form.itemData?.xpAmount || ''} onChange={(e) => setForm({ ...form, itemData: { xpAmount: parseInt(e.target.value) || 0 } })} placeholder="100" className="bg-slate-700 border-slate-600" /></div>}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isLimited" checked={form.isLimited} onChange={(e) => setForm({ ...form, isLimited: e.target.checked })} className="rounded" />
            <Label htmlFor="isLimited" className="cursor-pointer">Limited-Time Item</Label>
          </div>
          {form.isLimited && <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Start Date</Label><Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="bg-slate-700 border-slate-600" /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="bg-slate-700 border-slate-600" /></div>
            <div className="space-y-2"><Label>Stock Limit (optional)</Label><Input type="number" value={form.stockLimit || ''} onChange={(e) => { const val = parseInt(e.target.value) || null; setForm({ ...form, stockLimit: val, stockRemaining: val }); }} placeholder="Leave empty for unlimited" className="bg-slate-700 border-slate-600" /></div>
          </div>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={async () => {
            if (!form.name.trim()) { toast.error('Enter item name'); return; }
            const newItem = await base44.entities.ShopItem.create(form);
            setShopItems([newItem, ...shopItems]);
            onOpenChange(false);
            setForm(defaultForm);
            toast.success('Shop item created!');
          }} className="bg-purple-600">Create Item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditShopItemDialog({ item, onOpenChange, shopItems, setShopItems }) {
  const [form, setForm] = React.useState(item || {});
  React.useEffect(() => { setForm(item || {}); }, [item]);
  if (!item) return null;
  return (
    <Dialog open={!!item} onOpenChange={() => onOpenChange(null)}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader><DialogTitle>Edit Shop Item</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-700 border-slate-600" /></div>
            <div className="space-y-2"><Label>Price</Label><Input type="number" value={form.price || 0} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" /></div>
          </div>
          <div className="flex items-center gap-2"><input type="checkbox" id="editIsActive" checked={!!form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" /><Label htmlFor="editIsActive" className="cursor-pointer">Active</Label></div>
          {form.stockLimit !== null && <div className="space-y-2"><Label>Stock Remaining</Label><Input type="number" value={form.stockRemaining || 0} onChange={(e) => setForm({ ...form, stockRemaining: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" /></div>}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(null)}>Cancel</Button>
          <Button onClick={async () => {
            await base44.entities.ShopItem.update(form.id, form);
            setShopItems(shopItems.map(i => i.id === form.id ? form : i));
            onOpenChange(null);
            toast.success('Item updated');
          }} className="bg-purple-600">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ManualPackDialog({ open, onOpenChange, shopItems, bundles, setBundles }) {
  const defaultForm = { name: '', description: '', imageUrl: '', itemIds: [], originalPrice: 0, bundlePrice: 0, discountPercent: 20, isLimited: true, stockLimit: 10, stockRemaining: 10, startDate: '', endDate: '', isActive: true };
  const [form, setForm] = React.useState(defaultForm);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Custom Pack</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Pack Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Winter Crew Pack" className="bg-slate-700 border-slate-600" /></div>
            <div className="space-y-2"><Label>Pack Image</Label><Input type="file" accept="image/*" onChange={(e) => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onloadend = () => setForm({ ...form, imageUrl: r.result }); r.readAsDataURL(f); } }} className="bg-slate-700 border-slate-600" /></div>
          </div>
          {form.imageUrl && <div className="flex items-center gap-3"><img src={form.imageUrl} alt="Pack" className="w-20 h-20 rounded-lg object-cover" /><Button size="sm" variant="ghost" onClick={() => setForm({ ...form, imageUrl: '' })} className="text-red-400"><Trash2 className="w-4 h-4" /></Button></div>}
          <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-700 border-slate-600" /></div>
          <div className="space-y-2">
            <Label>Select Items for Pack</Label>
            <div className="bg-slate-700 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
              {shopItems.length === 0 ? <p className="text-slate-400 text-sm text-center py-4">Create shop items first</p> : shopItems.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <input type="checkbox" id={`pack-item-${item.id}`} checked={form.itemIds.includes(item.id)} onChange={(e) => setForm({ ...form, itemIds: e.target.checked ? [...form.itemIds, item.id] : form.itemIds.filter(id => id !== item.id) })} className="rounded" />
                  <Label htmlFor={`pack-item-${item.id}`} className="cursor-pointer flex-1">{item.name} ({item.itemType}) - {item.price} coins</Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400">Selected: {form.itemIds.length} items</p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Original Price</Label><Input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" /></div>
            <div className="space-y-2"><Label>Bundle Price</Label><Input type="number" value={form.bundlePrice} onChange={(e) => setForm({ ...form, bundlePrice: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" /></div>
            <div className="space-y-2"><Label>Stock Limit</Label><Input type="number" value={form.stockLimit || ''} onChange={(e) => { const val = parseInt(e.target.value) || null; setForm({ ...form, stockLimit: val, stockRemaining: val }); }} placeholder="10" className="bg-slate-700 border-slate-600" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Start Date</Label><Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="bg-slate-700 border-slate-600" /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="bg-slate-700 border-slate-600" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={async () => {
            if (!form.name.trim() || form.itemIds.length === 0) { toast.error('Enter pack name and select items'); return; }
            const newBundle = await base44.entities.Bundle.create(form);
            setBundles([newBundle, ...bundles]);
            onOpenChange(false);
            setForm(defaultForm);
            toast.success('Pack created!');
          }} className="bg-blue-600">Create Pack</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function NewBundleDialog({ open, onOpenChange, bundles, setBundles }) {
  const defaultForm = { name: '', description: '', itemIds: [], originalPrice: 0, bundlePrice: 0, discountPercent: 20, isLimited: true, stockLimit: null, stockRemaining: null, startDate: '', endDate: '', isActive: true };
  const [form, setForm] = React.useState(defaultForm);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader><DialogTitle>Create Bundle</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label>Bundle Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Winter Crew Pack" className="bg-slate-700 border-slate-600" /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-700 border-slate-600" /></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Original Price</Label><Input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" /></div>
            <div className="space-y-2"><Label>Bundle Price</Label><Input type="number" value={form.bundlePrice} onChange={(e) => setForm({ ...form, bundlePrice: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" /></div>
            <div className="space-y-2"><Label>Discount %</Label><Input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" /></div>
          </div>
          <div className="space-y-2"><Label>Item IDs (comma-separated)</Label><Textarea value={form.itemIds.join(', ')} onChange={(e) => setForm({ ...form, itemIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="item_id_1, item_id_2" className="bg-slate-700 border-slate-600" /><p className="text-xs text-slate-400">Tip: Create shop items first, then use their IDs here</p></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Start Date</Label><Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="bg-slate-700 border-slate-600" /></div>
            <div className="space-y-2"><Label>End Date</Label><Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="bg-slate-700 border-slate-600" /></div>
            <div className="space-y-2"><Label>Stock Limit (optional)</Label><Input type="number" value={form.stockLimit || ''} onChange={(e) => { const val = parseInt(e.target.value) || null; setForm({ ...form, stockLimit: val, stockRemaining: val }); }} placeholder="Leave empty for unlimited" className="bg-slate-700 border-slate-600" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={async () => {
            if (!form.name.trim() || form.itemIds.length === 0) { toast.error('Enter bundle name and items'); return; }
            const newBundle = await base44.entities.Bundle.create(form);
            setBundles([newBundle, ...bundles]);
            onOpenChange(false);
            setForm(defaultForm);
            toast.success('Bundle created!');
          }} className="bg-amber-600">Create Bundle</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditBundleDialog({ item, onOpenChange, bundles, setBundles }) {
  const [form, setForm] = React.useState(item || {});
  React.useEffect(() => { setForm(item || {}); }, [item]);
  if (!item) return null;
  return (
    <Dialog open={!!item} onOpenChange={() => onOpenChange(null)}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader><DialogTitle>Edit Bundle</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2"><Label>Name</Label><Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-700 border-slate-600" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Bundle Price</Label><Input type="number" value={form.bundlePrice || 0} onChange={(e) => setForm({ ...form, bundlePrice: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" /></div>
            {form.stockLimit !== null && <div className="space-y-2"><Label>Stock Remaining</Label><Input type="number" value={form.stockRemaining || 0} onChange={(e) => setForm({ ...form, stockRemaining: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" /></div>}
          </div>
          <div className="flex items-center gap-2"><input type="checkbox" id="editBundleActive" checked={!!form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" /><Label htmlFor="editBundleActive" className="cursor-pointer">Active</Label></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(null)}>Cancel</Button>
          <Button onClick={async () => {
            await base44.entities.Bundle.update(form.id, form);
            setBundles(bundles.map(b => b.id === form.id ? form : b));
            onOpenChange(null);
            toast.success('Bundle updated');
          }} className="bg-amber-600">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}