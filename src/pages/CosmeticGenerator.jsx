import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, Wand2, Save } from "lucide-react";
import CosmeticPreviewCard from "../components/cosmetics/CosmeticPreviewCard";
import LockedOverlay from "@/components/common/LockedOverlay";

const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];
const TYPES = ["hat", "glasses", "accessory", "background"];

export default function CosmeticGenerator() {
  const [admin, setAdmin] = useState(false);
  const [loadingAdmin, setLoadingAdmin] = useState(true);

  const [idea, setIdea] = useState("");
  const [lore, setLore] = useState("");
  const [type, setType] = useState("accessory");
  const [rarity, setRarity] = useState("common");
  const [variations, setVariations] = useState(3);
  const [price, setPrice] = useState(50);

  const [generating, setGenerating] = useState(false);
  const [items, setItems] = useState([]);
  const [savingAll, setSavingAll] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const profileId = localStorage.getItem("quest_profile_id");
        if (!profileId) { setLoadingAdmin(false); return; }
        const profiles = await base44.entities.UserProfile.filter({ id: profileId });
        const p = profiles?.[0];
        const isAdmin = p && (p.rank === "admin" || p.rank === "super_admin" || (typeof p.username === "string" && p.username.toLowerCase() === "crosby"));
        setAdmin(!!isAdmin);
      } catch (e) {
        console.error("Admin check failed", e);
      }
      setLoadingAdmin(false);
    })();
  }, []);

  const systemStyleNote = useMemo(() => (
    "Create concise, game-ready cosmetic concepts for a kid-friendly but not overly cutesy pet game. Mix tones (techy, mystical, sporty, scholarly)."
  ), []);

  const handleGenerate = async () => {
    if (!idea.trim()) return;
    setGenerating(true);
    setItems([]);

    // Ask LLM for N variants with image prompts
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

    // Generate images in parallel
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

      const next = variants.map((v, i) => ({
        id: `${Date.now()}_${i}`,
        name: v.name,
        description: v.description,
        cosmeticType: type,
        rarity,
        price,
        isLimited: false,
        imageUrl: imgs?.[i]?.url || ""
      }));
      setItems(next);
    } catch (e) {
      console.error("Image generation failed", e);
    }

    setGenerating(false);
  };

  const handleChange = (idx, updated) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = updated;
      return copy;
    });
  };

  const saveOne = async (idx) => {
    const it = items[idx];
    const payload = {
      name: it.name,
      description: it.description,
      cosmeticType: it.cosmeticType,
      imageUrl: it.imageUrl,
      price: Number(it.price) || 0,
      rarity: it.rarity,
      isLimited: !!it.isLimited,
      isActive: true
    };
    await base44.entities.PetCosmetic.create(payload);
  };

  const saveAll = async () => {
    if (!items.length) return;
    setSavingAll(true);
    try {
      const payloads = items.map((it) => ({
        name: it.name,
        description: it.description,
        cosmeticType: it.cosmeticType,
        imageUrl: it.imageUrl,
        price: Number(it.price) || 0,
        rarity: it.rarity,
        isLimited: !!it.isLimited,
        isActive: true
      }));
      await base44.entities.PetCosmetic.bulkCreate(payloads);
    } catch (e) {
      console.error("Bulk save failed", e);
    }
    setSavingAll(false);
  };

  if (loadingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="min-h-screen relative">
        <LockedOverlay featureLabel="Cosmetic Generator" message="Admins only." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500" /> AI Cosmetic Generator</h1>
        <Button onClick={saveAll} disabled={!items.length || savingAll} className="gap-2">
          <Save className="w-4 h-4" /> {savingAll ? "Saving..." : "Save All"}
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4 grid gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <Input placeholder="Cosmetic idea (e.g. cyber visor, wizard hat)" value={idea} onChange={(e) => setIdea(e.target.value)} />
            <div className="grid grid-cols-3 gap-2">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={rarity} onValueChange={setRarity}>
                <SelectTrigger><SelectValue placeholder="Rarity" /></SelectTrigger>
                <SelectContent>
                  {RARITIES.map((r) => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                </SelectContent>
              </Select>
              <Input type="number" min={1} max={8} value={variations} onChange={(e) => setVariations(Math.max(1, Math.min(8, Number(e.target.value)||1)))} />
            </div>
          </div>
          <Textarea placeholder="Optional lore / style guide (kept concise). Helps guide names/visuals."
            value={lore} onChange={(e) => setLore(e.target.value)} />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} placeholder="Default price" />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleGenerate} disabled={generating || !idea.trim()} className="gap-2">
              {generating ? (<Loader2 className="w-4 h-4 animate-spin" />) : (<Wand2 className="w-4 h-4" />)}
              {generating ? "Generating..." : "Generate"}
            </Button>
          </div>
          <p className="text-xs text-slate-500">Images are generated with a transparent background (no BG) and sticker-like style.</p>
        </CardContent>
      </Card>

      {items.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it, idx) => (
            <CosmeticPreviewCard
              key={it.id}
              value={it}
              onChange={(v) => handleChange(idx, v)}
              onRemove={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
              onSave={async () => { await saveOne(idx); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}