import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { isGradient, extractHex, colorStyle } from '@/components/theme/themeUtils';

function GradientColorInput({ label, value, onChange }) {
  const [useGradient, setUseGradient] = useState(isGradient(value));
  const [color1, setColor1] = useState(extractHex(value));
  const [color2, setColor2] = useState(() => {
    if (!isGradient(value)) return '#a855f7';
    const matches = value.match(/#[0-9a-fA-F]{3,8}/g);
    return matches?.[1] || '#a855f7';
  });
  const [direction, setDirection] = useState('135deg');

  const buildGradient = (c1, c2, dir) => `linear-gradient(${dir}, ${c1}, ${c2})`;

  const handleToggle = (checked) => {
    setUseGradient(checked);
    if (checked) {
      onChange(buildGradient(color1, color2, direction));
    } else {
      onChange(color1);
    }
  };

  const handleColor1 = (hex) => {
    setColor1(hex);
    onChange(useGradient ? buildGradient(hex, color2, direction) : hex);
  };

  const handleColor2 = (hex) => {
    setColor2(hex);
    onChange(buildGradient(color1, hex, direction));
  };

  const handleDirection = (dir) => {
    setDirection(dir);
    onChange(buildGradient(color1, color2, dir));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400">Gradient</span>
          <Switch checked={useGradient} onCheckedChange={handleToggle} className="scale-75" />
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <Input type="color" value={color1} onChange={(e) => handleColor1(e.target.value)} className="h-9 w-14 p-1 bg-slate-700 border-slate-600 shrink-0" />
        {useGradient && (
          <>
            <span className="text-slate-400 text-xs">→</span>
            <Input type="color" value={color2} onChange={(e) => handleColor2(e.target.value)} className="h-9 w-14 p-1 bg-slate-700 border-slate-600 shrink-0" />
            <Select value={direction} onValueChange={handleDirection}>
              <SelectTrigger className="bg-slate-700 border-slate-600 h-9 text-xs w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="to right">→</SelectItem>
                <SelectItem value="to left">←</SelectItem>
                <SelectItem value="to bottom">↓</SelectItem>
                <SelectItem value="to top">↑</SelectItem>
                <SelectItem value="135deg">↘</SelectItem>
                <SelectItem value="45deg">↗</SelectItem>
              </SelectContent>
            </Select>
          </>
        )}
      </div>
      {/* Mini preview */}
      <div className="h-4 rounded-full" style={colorStyle(useGradient ? buildGradient(color1, color2, direction) : color1)} />
    </div>
  );
}

export default function NewThemeDialog({ open, onOpenChange, themeForm, setThemeForm, onCreateTheme }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
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
            <GradientColorInput label="Primary" value={themeForm.primaryColor} onChange={(v) => setThemeForm({ ...themeForm, primaryColor: v })} />
            <GradientColorInput label="Secondary" value={themeForm.secondaryColor} onChange={(v) => setThemeForm({ ...themeForm, secondaryColor: v })} />
            <GradientColorInput label="Accent" value={themeForm.accentColor} onChange={(v) => setThemeForm({ ...themeForm, accentColor: v })} />
            <GradientColorInput label="Background" value={themeForm.bgColor} onChange={(v) => setThemeForm({ ...themeForm, bgColor: v })} />
          </div>

          <div className="space-y-2"><Label>Description</Label><Textarea value={themeForm.description} onChange={(e) => setThemeForm({ ...themeForm, description: e.target.value })} className="bg-slate-700 border-slate-600" /></div>
          
          {/* Live Preview */}
          <div className="rounded-lg overflow-hidden border border-slate-600">
            <div className="p-4 relative" style={colorStyle(themeForm.bgColor)}>
              <p className="text-sm font-medium mb-2" style={{ color: extractHex(themeForm.primaryColor) }}>Preview</p>
              <div className="flex gap-2">
                <div className="px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={colorStyle(themeForm.primaryColor)}>Primary</div>
                <div className="px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={colorStyle(themeForm.secondaryColor)}>Secondary</div>
                <div className="px-3 py-1.5 rounded-lg text-white text-xs font-medium" style={colorStyle(themeForm.accentColor)}>Accent</div>
              </div>
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