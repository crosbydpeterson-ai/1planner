import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const INITIAL_FORM = {
  name: '', description: '', imageUrl: '', itemIds: [], originalPrice: 0, bundlePrice: 0,
  discountPercent: 20, isLimited: true, stockLimit: 10, stockRemaining: 10,
  startDate: '', endDate: '', isActive: true
};

export default function ManualPackDialog({ open, onOpenChange, form, setForm, shopItems, onCreated }) {
  const handleCreate = async () => {
    if (!form.name.trim() || form.itemIds.length === 0) {
      toast.error('Enter pack name and select items');
      return;
    }
    const newBundle = await base44.entities.Bundle.create(form);
    onCreated(newBundle);
    setForm({ ...INITIAL_FORM });
    onOpenChange(false);
    toast.success('Pack created!');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Pack</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pack Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Winter Crew Pack" className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Pack Image</Label>
              <Input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setForm({ ...form, imageUrl: reader.result });
                  reader.readAsDataURL(file);
                }
              }} className="bg-slate-700 border-slate-600" />
            </div>
          </div>
          {form.imageUrl && (
            <div className="flex items-center gap-3">
              <img src={form.imageUrl} alt="Pack" className="w-20 h-20 rounded-lg object-cover" />
              <Button size="sm" variant="ghost" onClick={() => setForm({ ...form, imageUrl: '' })} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
            </div>
          )}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Limited-time bundle!" className="bg-slate-700 border-slate-600" />
          </div>
          <div className="space-y-2">
            <Label>Select Items for Pack</Label>
            <div className="bg-slate-700 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
              {shopItems.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">Create shop items first</p>
              ) : shopItems.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <input type="checkbox" id={`pack-item-${item.id}`} checked={form.itemIds.includes(item.id)} onChange={(e) => {
                    if (e.target.checked) setForm({ ...form, itemIds: [...form.itemIds, item.id] });
                    else setForm({ ...form, itemIds: form.itemIds.filter(id => id !== item.id) });
                  }} className="rounded" />
                  <Label htmlFor={`pack-item-${item.id}`} className="cursor-pointer flex-1">{item.name} ({item.itemType}) - {item.price} coins</Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-400">Selected: {form.itemIds.length} items</p>
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
              <Label>Stock Limit</Label>
              <Input type="number" value={form.stockLimit || ''} onChange={(e) => { const val = parseInt(e.target.value) || null; setForm({ ...form, stockLimit: val, stockRemaining: val }); }} placeholder="10" className="bg-slate-700 border-slate-600" />
            </div>
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
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} className="bg-blue-600">Create Pack</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}