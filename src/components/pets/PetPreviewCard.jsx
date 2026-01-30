import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Check } from "lucide-react";

const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];

export default function PetPreviewCard({ value, onChange, onRemove, onSave, saving }) {
  const item = value || {};

  const handle = (k, v) => onChange?.({ ...item, [k]: v });
  const handleTheme = (k, v) => onChange?.({ ...item, theme: { ...(item.theme || {}), [k]: v } });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="text-base">Pet Preview & Edit</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4">
        <div className="w-full aspect-square bg-slate-50 rounded-lg border flex items-center justify-center overflow-hidden">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name || "pet"} className="object-contain w-full h-full" />
          ) : (
            <div className="text-slate-400 text-sm">No image</div>
          )}
        </div>

        <Input placeholder="Name" value={item.name || ""} onChange={(e) => handle("name", e.target.value)} />
        <Textarea placeholder="Description" value={item.description || ""} onChange={(e) => handle("description", e.target.value)} />

        <div className="grid grid-cols-2 gap-3">
          <Select value={item.rarity || "common"} onValueChange={(v) => handle("rarity", v)}>
            <SelectTrigger><SelectValue placeholder="Rarity" /></SelectTrigger>
            <SelectContent>
              {RARITIES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
            </SelectContent>
          </Select>
          <Input type="number" min={0} placeholder="XP required" value={item.xpRequired ?? 0} onChange={(e) => handle("xpRequired", Number(e.target.value))} />
        </div>

        <Input placeholder="Emoji (optional)" value={item.emoji || ""} onChange={(e) => handle("emoji", e.target.value)} />

        <div className="grid grid-cols-4 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Primary</label>
            <input type="color" value={item.theme?.primary || "#22c55e"} onChange={(e) => handleTheme("primary", e.target.value)} className="h-9 w-full rounded border" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Secondary</label>
            <input type="color" value={item.theme?.secondary || "#86efac"} onChange={(e) => handleTheme("secondary", e.target.value)} className="h-9 w-full rounded border" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Accent</label>
            <input type="color" value={item.theme?.accent || "#4ade80"} onChange={(e) => handleTheme("accent", e.target.value)} className="h-9 w-full rounded border" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-500">Background</label>
            <input type="color" value={item.theme?.bg || "#f0fdf4"} onChange={(e) => handleTheme("bg", e.target.value)} className="h-9 w-full rounded border" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          {onRemove && (
            <Button type="button" variant="outline" onClick={onRemove} className="gap-1">
              <Trash2 className="w-4 h-4" /> Discard
            </Button>
          )}
          <Button type="button" onClick={onSave} disabled={saving} className="gap-1">
            <Check className="w-4 h-4" /> {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}