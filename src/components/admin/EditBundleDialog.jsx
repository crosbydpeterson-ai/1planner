import React from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function EditBundleDialog({ bundle, onOpenChange, onSaved }) {
  const [form, setForm] = React.useState(bundle);
  React.useEffect(() => { if (bundle) setForm(bundle); }, [bundle]);

  if (!form) return null;

  return (
    <Dialog open={!!bundle} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl">
        <DialogHeader><DialogTitle>Edit Bundle</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-slate-700 border-slate-600" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bundle Price</Label>
              <Input type="number" value={form.bundlePrice} onChange={(e) => setForm({ ...form, bundlePrice: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" />
            </div>
            {form.stockLimit !== null && (
              <div className="space-y-2">
                <Label>Stock Remaining</Label>
                <Input type="number" value={form.stockRemaining || 0} onChange={(e) => setForm({ ...form, stockRemaining: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="editBundleActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
            <Label htmlFor="editBundleActive" className="cursor-pointer">Active</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={async () => {
            await base44.entities.Bundle.update(form.id, form);
            onSaved(form);
            onOpenChange(false);
            toast.success('Bundle updated');
          }} className="bg-amber-600">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}