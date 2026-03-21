import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function BundleDialog({ open, onOpenChange, form, setForm, onSubmit }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Bundle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Bundle Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-700 border-slate-600" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-slate-700 border-slate-600" />
          </div>
          <div className="space-y-2">
            <Label>Item IDs (comma separated)</Label>
            <Input
              value={(form.itemIds || []).join(', ')}
              onChange={(e) => setForm({ ...form, itemIds: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="item_id_1, item_id_2"
              className="bg-slate-700 border-slate-600"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Original Price</Label>
              <Input type="number" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Bundle Price</Label>
              <Input type="number" value={form.bundlePrice} onChange={(e) => setForm({ ...form, bundlePrice: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="bundleLimited" checked={form.isLimited} onChange={(e) => setForm({ ...form, isLimited: e.target.checked })} className="rounded" />
            <Label htmlFor="bundleLimited" className="cursor-pointer">Limited Time</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit} className="bg-amber-600">Create Bundle</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}