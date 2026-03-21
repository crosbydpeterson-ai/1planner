import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function BundleFormDialog({ open, onOpenChange, form, setForm, onCreated }) {
  const handleCreate = async () => {
    if (!form.name.trim() || form.itemIds.length === 0) {
      toast.error('Enter bundle name and items');
      return;
    }
    const newBundle = await base44.entities.Bundle.create(form);
    onCreated(newBundle);
    setForm({
      name: '', description: '', itemIds: [], originalPrice: 0, bundlePrice: 0, discountPercent: 20,
      isLimited: true, stockLimit: null, stockRemaining: null, startDate: '', endDate: '', isActive: true
    });
    onOpenChange(false);
    toast.success('Bundle created!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader><DialogTitle>Create Bundle</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Bundle Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Winter Crew Pack" className="bg-slate-700 border-slate-600" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-700 border-slate-600" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Original Price</Label>
              <Input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Bundle Price</Label>
              <Input type="number" value={form.bundlePrice} onChange={(e) => setForm({ ...form, bundlePrice: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Discount %</Label>
              <Input type="number" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Select Items (paste Shop Item IDs, comma-separated)</Label>
            <Textarea value={form.itemIds.join(', ')} onChange={(e) => setForm({ ...form, itemIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="item_id_1, item_id_2" className="bg-slate-700 border-slate-600" />
            <p className="text-xs text-slate-400">Tip: Create shop items first, then use their IDs here</p>
          </div>
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
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} className="bg-amber-600">Create Bundle</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}