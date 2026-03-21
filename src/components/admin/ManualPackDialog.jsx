import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ManualPackDialog({ open, onOpenChange, form, setForm, shopItems, onSubmit }) {
  const toggleItem = (id) => {
    const ids = form.itemIds.includes(id) ? form.itemIds.filter(i => i !== id) : [...form.itemIds, id];
    const total = shopItems.filter(i => ids.includes(i.id)).reduce((s, i) => s + (i.price || 0), 0);
    setForm({ ...form, itemIds: ids, originalPrice: total, bundlePrice: Math.round(total * (1 - (form.discountPercent || 20) / 100)) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Build Custom Pack</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Pack Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-700 border-slate-600" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-700 border-slate-600" />
          </div>
          <div className="space-y-2">
            <Label>Select Items</Label>
            <div className="space-y-1 max-h-40 overflow-y-auto bg-slate-700/50 rounded-lg p-2">
              {shopItems.map(item => (
                <label key={item.id} className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
                  <input type="checkbox" checked={form.itemIds.includes(item.id)} onChange={() => toggleItem(item.id)} className="rounded" />
                  {item.name} — {item.price} 🪙
                </label>
              ))}
              {shopItems.length === 0 && <p className="text-slate-400 text-sm">No shop items</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Discount %</Label>
              <Input type="number" value={form.discountPercent} onChange={(e) => { const d = parseInt(e.target.value) || 0; setForm({ ...form, discountPercent: d, bundlePrice: Math.round(form.originalPrice * (1 - d / 100)) }); }} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Bundle Price</Label>
              <Input type="number" value={form.bundlePrice} onChange={(e) => setForm({ ...form, bundlePrice: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Stock</Label>
              <Input type="number" value={form.stockLimit || ''} onChange={(e) => { const v = parseInt(e.target.value) || 10; setForm({ ...form, stockLimit: v, stockRemaining: v }); }} className="bg-slate-700 border-slate-600" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} className="bg-blue-600">Create Pack</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}