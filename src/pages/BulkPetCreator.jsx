import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, UploadCloud, Wand2, Save } from "lucide-react";
import LockedOverlay from "@/components/common/LockedOverlay";
import PetPreviewCard from "../components/pets/PetPreviewCard";

const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];
const XP_BY_RARITY = { common: 0, uncommon: 200, rare: 600, epic: 1200, legendary: 2000 };

export default function BulkPetCreator() {
  const [admin, setAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  const [lore, setLore] = useState("");
  const [rarity, setRarity] = useState("common");
  const [items, setItems] = useState([]); // {id,imageUrl,name,description,rarity,xpRequired,emoji,theme}

  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const profileId = localStorage.getItem("quest_profile_id");
        if (!profileId) { setChecking(false); return; }
        const profiles = await base44.entities.UserProfile.filter({ id: profileId });
        const p = profiles?.[0];
        const isAdmin = p && (p.rank === "admin" || p.rank === "super_admin" || (typeof p.username === "string" && p.username.toLowerCase() === "crosby"));
        setAdmin(!!isAdmin);
      } catch (e) {
        console.error("Admin check failed", e);
      }
      setChecking(false);
    })();
  }, []);

  const handleFiles = async (files) => {
    if (!files || !files.length) return;
    setUploading(true);

    const uploads = [];
    for (let i = 0; i < files.length && i < 10; i++) {
      const f = files[i];
      uploads.push(base44.integrations.Core.UploadFile({ file: f }));
    }
    const uploaded = await Promise.all(uploads);

    const next = uploaded.map((u, idx) => ({
      id: `${Date.now()}_${idx}`,
      imageUrl: u.file_url,
      name: "",
      description: "",
      rarity,
      xpRequired: XP_BY_RARITY[rarity] ?? 0,
      emoji: "",
      theme: { primary: "#22c55e", secondary: "#86efac", accent: "#4ade80", bg: "#f0fdf4" }
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
        pets: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              rarity: { type: "string", enum: RARITIES },
              xpRequired: { type: "number" },
              emoji: { type: "string" },
              theme: {
                type: "object",
                properties: {
                  primary: { type: "string" },
                  secondary: { type: "string" },
                  accent: { type: "string" },
                  bg: { type: "string" }
                }
              }
            },
            required: ["name", "description", "rarity", "xpRequired", "theme"]
          }
        }
      },
      required: ["pets"]
    };

    const prompt = [
      "You generate concise, game-ready pets for a school-friendly game. Not everything is cute.",
      "Mix tones across pets: tech/computer, mystical/magic-egg vibe, scholarly/books, sporty/adventurous.",
      lore ? `Lore guidance: ${lore}` : "",
      `There are ${fileUrls.length} pet images attached. Return one entry per image, in order.`,
      "For each pet, provide: name (<=3 words), description (<=20 words), rarity, xpRequired (number), emoji (optional), and theme colors (primary, secondary, accent, bg as hex).",
      "Keep names readable and descriptions specific to the visual if possible."
    ].filter(Boolean).join("\n");

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: false,
      response_json_schema: schema,
      file_urls: fileUrls
    });

    const pets = res?.pets || [];
    setItems((prev) => prev.map((it, idx) => {
      const p = pets[idx];
      if (!p) return it;
      return {
        ...it,
        name: p.name || it.name,
        description: p.description || it.description,
        rarity: RARITIES.includes(p.rarity) ? p.rarity : it.rarity,
        xpRequired: typeof p.xpRequired === "number" ? p.xpRequired : it.xpRequired,
        emoji: p.emoji || it.emoji,
        theme: {
          primary: p.theme?.primary || it.theme?.primary,
          secondary: p.theme?.secondary || it.theme?.secondary,
          accent: p.theme?.accent || it.theme?.accent,
          bg: p.theme?.bg || it.theme?.bg
        }
      };
    }));

    setGenerating(false);
  };

  const changeAt = (idx, updated) => setItems((prev) => { const copy = [...prev]; copy[idx] = updated; return copy; });

  const saveOne = async (idx) => {
    const it = items[idx];
    const payload = {
      name: it.name,
      rarity: it.rarity,
      xpRequired: Number(it.xpRequired) || 0,
      description: it.description,
      emoji: it.emoji || undefined,
      imageUrl: it.imageUrl,
      theme: it.theme
    };
    await base44.entities.CustomPet.create(payload);
  };

  const saveAll = async () => {
    if (!items.length) return;
    setSavingAll(true);
    const payloads = items.map((it) => ({
      name: it.name,
      rarity: it.rarity,
      xpRequired: Number(it.xpRequired) || 0,
      description: it.description,
      emoji: it.emoji || undefined,
      imageUrl: it.imageUrl,
      theme: it.theme
    }));
    await base44.entities.CustomPet.bulkCreate(payloads);
    setSavingAll(false);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen relative">
        <LockedOverlay featureLabel="Bulk Pet Creator" message="Admins only." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><UploadCloud className="w-5 h-5 text-indigo-500" /> Bulk Pet Creator</h1>
        <Button onClick={saveAll} disabled={!items.length || savingAll} className="gap-2"><Save className="w-4 h-4" /> {savingAll ? "Saving..." : "Save All"}</Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 grid gap-3">
          <div className="grid md:grid-cols-3 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="text-sm text-slate-600">Lore / guidance (optional)</label>
              <Textarea placeholder="Paste lore or style guidance; helps AI tailor names/descriptions/themes."
                value={lore} onChange={(e) => setLore(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-slate-600">Default rarity for uploads</label>
              <Select value={rarity} onValueChange={(v) => setRarity(v)}>
                <SelectTrigger><SelectValue placeholder="Rarity" /></SelectTrigger>
                <SelectContent>
                  {RARITIES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" />
              <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md border bg-white text-slate-700">
                <UploadCloud className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload 1–10 images"}
              </span>
            </label>
            <Button onClick={handleGenerate} disabled={!items.length || generating} className="gap-2">
              {generating ? (<Loader2 className="w-4 h-4 animate-spin" />) : (<Wand2 className="w-4 h-4" />)}
              {generating ? "Generating Details..." : "Generate Details"}
            </Button>
          </div>
          <p className="text-xs text-slate-500">AI uses attached images and lore to propose names, descriptions, rarity, XP, and theme colors. Not everything will be cute; tone is mixed (tech, magic, scholarly, sporty).</p>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it, idx) => (
            <PetPreviewCard
              key={it.id}
              value={it}
              onChange={(v) => changeAt(idx, v)}
              onRemove={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
              onSave={async () => { await saveOne(idx); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}