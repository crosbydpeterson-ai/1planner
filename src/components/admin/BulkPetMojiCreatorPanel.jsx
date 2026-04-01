import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, UploadCloud, Wand2, Save, Trash2, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { SAFE_PROMPT_SUFFIX } from "@/components/community/petmojiModeration";

export default function BulkPetMojiCreatorPanel({ onCreated }) {
  const [lore, setLore] = useState("");
  const [isExclusive, setIsExclusive] = useState(false);
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  const handleFiles = async (files) => {
    if (!files || !files.length) return;
    setUploading(true);
    const uploads = [];
    for (let i = 0; i < files.length && i < 10; i++) {
      uploads.push(base44.integrations.Core.UploadFile({ file: files[i] }));
    }
    const uploaded = await Promise.all(uploads);
    const next = uploaded.map((u, idx) => ({
      id: `${Date.now()}_${idx}`,
      imageUrl: u.file_url,
      name: "",
      description: "",
      isActive: true,
      isExclusive,
    }));
    setItems((prev) => [...prev, ...next]);
    setUploading(false);
  };

  const handleGenerate = async () => {
    if (!items.length) return;
    setGenerating(true);

    const fileUrls = items.map((it) => it.imageUrl);
    const schema = {
      type: "object",
      properties: {
        petmojis: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
            },
            required: ["name", "description"],
          },
        },
      },
      required: ["petmojis"],
    };

    const prompt = [
      "You are naming emoji-style reaction stickers for a kid-friendly school game chat.",
      lore ? `Context/guidance: ${lore}` : "",
      `There are ${fileUrls.length} sticker images attached. Return one entry per image, in order.`,
      "For each, provide: name (short, 1-3 words, like an emoji label e.g. 'Happy Dance', 'Thumbs Up', 'Sleepy Cat') and description (what the sticker shows, <=15 words).",
      "Keep it fun, clean, and kid-friendly.",
    ].filter(Boolean).join("\n");

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: schema,
      file_urls: fileUrls,
    });

    const mojis = res?.petmojis || [];
    setItems((prev) =>
      prev.map((it, idx) => {
        const m = mojis[idx];
        if (!m) return it;
        return {
          ...it,
          name: m.name || it.name,
          description: m.description || it.description,
        };
      })
    );
    setGenerating(false);
  };

  const changeAt = (idx, field, value) =>
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });

  const removeAt = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const saveOne = async (idx) => {
    const it = items[idx];
    if (!it.name.trim()) { toast.error("Name is required"); return; }
    await base44.entities.PetMoji.create({
      name: it.name.trim(),
      description: it.description || "",
      imageUrl: it.imageUrl,
      isActive: it.isActive,
      isExclusive: it.isExclusive,
      exclusiveOwnerIds: [],
    });
    removeAt(idx);
    toast.success(`"${it.name}" saved!`);
    onCreated?.();
  };

  const saveAll = async () => {
    const valid = items.filter((it) => it.name.trim());
    if (!valid.length) { toast.error("Give names to your petmojis first"); return; }
    setSavingAll(true);
    const payloads = valid.map((it) => ({
      name: it.name.trim(),
      description: it.description || "",
      imageUrl: it.imageUrl,
      isActive: it.isActive,
      isExclusive: it.isExclusive,
      exclusiveOwnerIds: [],
    }));
    await base44.entities.PetMoji.bulkCreate(payloads);
    toast.success(`${payloads.length} petmojis saved!`);
    setItems([]);
    setSavingAll(false);
    onCreated?.();
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-pink-400" /> Bulk Petmoji Creator
        </h2>
        <Button onClick={saveAll} disabled={!items.length || savingAll} className="gap-2">
          <Save className="w-4 h-4" /> {savingAll ? "Saving..." : "Save All"}
        </Button>
      </div>

      <Card className="mb-4 bg-slate-800 border-slate-700">
        <CardContent className="p-4 grid gap-3">
          <div>
            <label className="text-sm text-slate-300">Lore / guidance (optional)</label>
            <Textarea
              placeholder="Describe the theme or style for these petmojis; helps AI name them."
              value={lore}
              onChange={(e) => setLore(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>

          <div className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-sm text-white font-medium">Exclusive by default</p>
                <p className="text-[10px] text-slate-400">New uploads will be marked exclusive</p>
              </div>
            </div>
            <Switch checked={isExclusive} onCheckedChange={setIsExclusive} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white text-slate-700">
                <UploadCloud className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload 1–10 images"}
              </span>
            </label>
            <Button onClick={handleGenerate} disabled={!items.length || generating} className="gap-2">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {generating ? "Generating Names..." : "Generate Names"}
            </Button>
          </div>
          <p className="text-xs text-slate-400">Upload sticker images, then click Generate to auto-name them with AI.</p>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((it, idx) => (
            <div key={it.id} className="bg-slate-700/60 rounded-xl p-3 relative group">
              <img src={it.imageUrl} alt={it.name || "petmoji"} className="w-16 h-16 rounded-lg object-cover mx-auto mb-2" />
              <Input
                value={it.name}
                onChange={(e) => changeAt(idx, "name", e.target.value)}
                placeholder="Name..."
                className="bg-slate-600 border-slate-500 text-white text-xs h-7 mb-1"
              />
              <Input
                value={it.description}
                onChange={(e) => changeAt(idx, "description", e.target.value)}
                placeholder="Description..."
                className="bg-slate-600 border-slate-500 text-white text-xs h-7 mb-2"
              />
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => changeAt(idx, "isExclusive", !it.isExclusive)}
                    className={`p-1 rounded ${it.isExclusive ? "text-amber-400" : "text-slate-500"}`}
                    title={it.isExclusive ? "Exclusive" : "Public"}
                  >
                    <Lock className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => changeAt(idx, "isActive", !it.isActive)}
                    className={`p-1 rounded ${it.isActive ? "text-emerald-400" : "text-slate-500"}`}
                    title={it.isActive ? "Active" : "Hidden"}
                  >
                    {it.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-400 hover:text-emerald-300" onClick={() => saveOne(idx)}>
                    <Save className="w-3 h-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-red-400 hover:text-red-300" onClick={() => removeAt(idx)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}