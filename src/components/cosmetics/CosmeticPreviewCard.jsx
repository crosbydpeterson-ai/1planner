import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Trash2 } from "lucide-react";

const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];
const TYPES = ["hat", "glasses", "accessory", "background"];

export default function CosmeticPreviewCard({ value, onChange, onRemove, onSave, saving }) {
  const item = value || {};

  const handleField = (field, v) => {
    onChange?.({ ...item, [field]: v });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4">
        <CardTitle className="text-base">Preview & Edit</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 p-4">
        {item.imageUrl ? (
          <div className="w-full aspect-square bg-slate-50 rounded-lg border flex items-center justify-center overflow-hidden">
            <img src={item.imageUrl} alt={item.name || "cosmetic"} className="object-contain w-full h-full" />
          </div>
        ) : (
          <div className="w-full aspect-square bg-slate-50 rounded-lg border flex items-center justify-center text-slate-400 text-sm">
            No image
          </div>
        )}

        <Input
          placeholder="Cosmetic name"
          value={item.name || ""}
          onChange={(e) => handleField("name", e.target.value)}
        />

        <Textarea
          placeholder="Short description"
          value={item.description || ""}
          onChange={(e) => handleField("description", e.target.value)}
          className="min-h-[80px]"
        />

        <div className="grid grid-cols-2 gap-3">
          <Select value={item.cosmeticType || "accessory"} onValueChange={(v) => handleField("cosmeticType", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={item.rarity || "common"} onValueChange={(v) => handleField("rarity", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Rarity" />
            </SelectTrigger>
            <SelectContent>
              {RARITIES.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 items-center">
          <Input
            type="number"
            min={0}
            placeholder="Price"
            value={item.price ?? 50}
            onChange={(e) => handleField("price", Number(e.target.value))}
          />

          <div className="flex items-center gap-2 justify-between">
            <span className="text-sm text-slate-600">Limited?</span>
            <Switch checked={!!item.isLimited} onCheckedChange={(v) => handleField("isLimited", v)} />
          </div>
        </div>

        <div className="flex items-center gap-2 justify-end pt-1">
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