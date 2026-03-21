import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function NewThemeDialog({ open, onOpenChange, themeForm, setThemeForm, onCreateTheme }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader><DialogTitle>Create Custom Theme</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={themeForm.name} onChange={(e) => setThemeForm({ ...themeForm, name: e.target.value })} className="bg-slate-700 border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>Rarity</Label>
              <Select value={themeForm.rarity} onValueChange={(v) => setThemeForm({ ...themeForm, rarity: v })}>
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
          <div className="space-y-2">
            <Label>XP Required</Label>
            <Input type="number" value={themeForm.xpRequired} onChange={(e) => setThemeForm({ ...themeForm, xpRequired: parseInt(e.target.value) || 0 })} className="bg-slate-700 border-slate-600" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Primary</Label><Input type="color" value={themeForm.primaryColor} onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })} className="h-10 bg-slate-700 border-slate-600" /></div>
            <div className="space-y-2"><Label>Secondary</Label><Input type="color" value={themeForm.secondaryColor} onChange={(e) => setThemeForm({ ...themeForm, secondaryColor: e.target.value })} className="h-10 bg-slate-700 border-slate-600" /></div>
            <div className="space-y-2"><Label>Accent</Label><Input type="color" value={themeForm.accentColor} onChange={(e) => setThemeForm({ ...themeForm, accentColor: e.target.value })} className="h-10 bg-slate-700 border-slate-600" /></div>
            <div className="space-y-2"><Label>Background</Label><Input type="color" value={themeForm.bgColor} onChange={(e) => setThemeForm({ ...themeForm, bgColor: e.target.value })} className="h-10 bg-slate-700 border-slate-600" /></div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={themeForm.description} onChange={(e) => setThemeForm({ ...themeForm, description: e.target.value })} className="bg-slate-700 border-slate-600" /></div>
          <div className="p-4 rounded-lg" style={{ backgroundColor: themeForm.bgColor }}>
            <p className="text-sm font-medium" style={{ color: themeForm.primaryColor }}>Preview</p>
            <div className="flex gap-2 mt-2">
              <div className="px-3 py-1 rounded" style={{ backgroundColor: themeForm.primaryColor, color: 'white' }}>Primary</div>
              <div className="px-3 py-1 rounded" style={{ backgroundColor: themeForm.secondaryColor, color: 'white' }}>Secondary</div>
              <div className="px-3 py-1 rounded" style={{ backgroundColor: themeForm.accentColor, color: 'white' }}>Accent</div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onCreateTheme} className="bg-cyan-600">Create Theme</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}