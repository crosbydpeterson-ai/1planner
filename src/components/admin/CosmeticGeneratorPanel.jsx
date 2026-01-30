import React, { useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, Wand2, Save } from "lucide-react";
import CosmeticPreviewCard from "@/components/cosmetics/CosmeticPreviewCard";

const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];
const TYPES = ["hat", "glasses", "accessory", "background"];

export default function CosmeticGeneratorPanel({ onCreated }) {
  const [idea, setIdea] = useState("");
  const [lore, setLore] = useState("");
  const [type, setType] = useState("accessory");
  const [rarity, setRarity] = useState("common");
  const [variations, setVariations] = useState(3);
  const [price, setPrice] = useState(50);

  const [generating, setGenerating] = useState(false);
  const [items, setItems] = useState([]); // {id(local), name, ..., imageUrl, savedId?}
  const [savingAll, setSavingAll] = useState(false);

  // debounce timers per local id
  const timersRef = useRef({});

  const systemStyleNote = useMemo(() => (
    "Create concise, game-ready cosmetic concepts for a kid-friendly but not overly cutesy pet game. Mix tones (techy, mystical, sporty, scholarly)."
  ), []);

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setGenerating(true);
    setItems([]);

    const schema = {
      type: "object",
      properties: {
        variants: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              description: { type: "string" },
              image_prompt: { type: "string" }
            },
            required: ["name", "description", "image_prompt"]
          }
        }
      },
      required: ["variants"]
    };

    const prompt = [
      `Task: Propose ${variations} cosmetic variants for pet game.`,
      `Base idea: ${idea}`,
      lore ? `Lore (guidance, optional): ${lore}` : "",
      `Cosmetic type: ${type}. Rarity target: ${rarity}.`,
      "Style & tone: Not everything is cute. Include variety: tech/computer vibes, magic, scholarly/books, sporty, etc.",
      "Each variant needs:",
      "- name (max 3 words)",
      "- description (max 20 words)",
      "- image_prompt: a visual description for an AI image model",
      "Image constraints for image_prompt: vector sticker style, flat lighting, bold clean shapes, high contrast, crisp edges, transparent background, NO background, no drop shadow, centered subject, no text",
      "Return JSON only."
    ].filter(Boolean).join("\n");

    let variants = [];
    try {
      const llm = await base44.integrations.Core.InvokeLLM({
        prompt: `${systemStyleNote}\n\n${prompt}`,
        add_context_from_internet: false,
        response_json_schema: schema
      });
      variants = llm?.variants || [];
    } catch (e) {
      console.error("LLM generation failed", e);
      setGenerating(false);
      return;
    }

    try {
      const imgs = await Promise.all(
        variants.map((v) => {
          const fullPrompt = [
            v.image_prompt,
            `type: ${type}`,
            `rarity: ${rarity}`,
            "style: vector sticker, no outline unless essential",
            "background: transparent, NO background, png",
            "composition: centered, clear silhouette",
          ].join(", ");
          return base44.integrations.Core.GenerateImage({ prompt: fullPrompt });
        })
      );

      // Build local items
      const local = variants.map((v, i) => ({
        id: `${Date.now()}_${i}`,
        name: v.name,
        description: v.description,
        cosmeticType: type,
        rarity,
        price,
        isLimited: false,
        imageUrl: imgs?.[i]?.url || "",
        savedId: null
      }));

      setItems(local);

      // Auto-save immediately (bulk create)
      const payloads = local.map((it) => ({
        name: it.name,
        description: it.description,
        cosmeticType: it.cosmeticType,
        imageUrl: it.imageUrl,
        price: Number(it.price) || 0,
        rarity: it.rarity,
        isLimited: !!it.isLimited,
        isActive: true
      }));

      const created = await base44.entities.PetCosmetic.bulkCreate(payloads);
      // Map created ids back
      const withIds = local.map((it, idx) => ({ ...it, savedId: created[idx]?.id || null }));
      setItems(withIds);
      onCreated && onCreated(created);
    } catch (e) {
      console.error("Generation/save failed", e);
    }

    setGenerating(false);
  };

  const queueAutoUpdate = (idx, updated) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = updated;
      return copy;
    });

    const localId = updated.id;
    clearTimeout(timersRef.current[localId]);
    timersRef.current[localId] = setTimeout(async () => {
      const it = updated;
      if (!it.savedId) return; // not saved yet
      try {
        await base44.entities.PetCosmetic.update(it.savedId, {
          name: it.name,
          description: it.description,
          cosmeticType: it.cosmeticType,
          imageUrl: it.imageUrl,
          price: Number(it.price) || 0,
          rarity: it.rarity,
          isLimited: !!it.isLimited,
          isActive: true
        });
      } catch (e) {
        console.error("Auto-update failed", e);
      }
    }, 600);
  };

  const saveOne = async (idx) => {
    const it = items[idx];
    // Create if missing savedId, else update
    if (!it.savedId) {
      const created = await base44.entities.PetCosmetic.create({
        name: it.name,
        description: it.description,
        cosmeticType: it.cosmeticType,
        imageUrl: it.imageUrl,
        price: Number(it.price) || 0,
        rarity: it.rarity,
        isLimited: !!it.isLimited,
        isActive: true
      });
      setItems((prev) => {
        const copy = [...prev];
        copy[idx] = { ...it, savedId: created.id };
        return copy;
      });
      onCreated && onCreated([created]);
      return;
    }
    await base44.entities.PetCosmetic.update(it.savedId, {
      name: it.name,
      description: it.description,
      cosmeticType: it.cosmeticType,
      imageUrl: it.imageUrl,
      price: Number(it.price) || 0,
      rarity: it.rarity,
      isLimited: !!it.isLimited,
      isActive: true
    });
  };

  const saveAll = async () => {
    if (!items.length) return;
    setSavingAll(true);
    try {
      // create unsaved
      const unsaved = items.filter((i) => !i.savedId);
      if (unsaved.length) {
        const created = await base44.entities.PetCosmetic.bulkCreate(unsaved.map((it) => ({
          name: it.name,
          description: it.description,
          cosmeticType: it.cosmeticType,
          imageUrl: it.imageUrl,
          price: Number(it.price) || 0,
          rarity: it.rarity,
          isLimited: !!it.isLimited,
          isActive: true
        })));
        // update local ids
        setItems((prev) => prev.map((it) => {
          if (it.savedId) return it;
          const createdMatch = created.shift();
          return { ...it, savedId: createdMatch?.id || null };
        }));
        onCreated && onCreated(created || []);
      }
      // update saved
      const updates = items.filter((i) => i.savedId).map((it) =>
        base44.entities.PetCosmetic.update(it.savedId, {
          name: it.name,
          description: it.description,
          cosmeticType: it.cosmeticType,
          imageUrl: it.imageUrl,
          price: Number(it.price) || 0,
          rarity: it.rarity,
          isLimited: !!it.isLimited,
          isActive: true
        })
      );
      await Promise.all(updates);
    } catch (e) {
      console.error("Save all failed", e);
    }
    setSavingAll(false);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-400" /> AI Cosmetic Generator</h2>
        <Button onClick={saveAll} disabled={!items.length || savingAll} className="gap-2">
          <Save className="w-4 h-4" /> {savingAll ? "Saving..." : "Save All"}
        </Button>
      </div>

      <Card className="mb-4 bg-slate-800 border-slate-700">
        <CardContent className="p-4 grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <Input placeholder="Cosmetic idea (e.g. cyber visor, wizard hat)" value={idea} onChange={(e) => setIdea(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
            <div className="grid grid-cols-3 gap-2">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={rarity} onValueChange={setRarity}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue placeholder="Rarity" /></SelectTrigger>
                <SelectContent>
                  {RARITIES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                </SelectContent>
              </Select>
              <Input type="number" min={1} max={8} value={variations} onChange={(e) => setVariations(Math.max(1, Math.min(8, Number(e.target.value)||1)))} className="bg-slate-700 border-slate-600 text-white" />
            </div>
          </div>
          <Textarea placeholder="Optional lore / style guide (kept concise). Helps guide names/visuals." value={lore} onChange={(e) => setLore(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Default price" className="bg-slate-700 border-slate-600 text-white" />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleGenerate} disabled={generating || !idea.trim()} className="gap-2">
              {generating ? (<Loader2 className="w-4 h-4 animate-spin" />) : (<Wand2 className="w-4 h-4" />)}
              {generating ? "Generating..." : "Generate"}
            </Button>
          </div>
          <p className="text-xs text-slate-400">Images are generated with a transparent background (no BG) and sticker-like style.</p>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it, idx) => (
            <CosmeticPreviewCard
              key={it.id}
              value={it}
              onChange={(v) => queueAutoUpdate(idx, v)}
              onRemove={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
              onSave={async () => { await saveOne(idx); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}