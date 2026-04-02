import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Wand2, Save, Trash2, Lock, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SAFE_PROMPT_SUFFIX } from "@/components/community/petmojiModeration";

export default function BulkPetMojiCreatorPanel({ onCreated }) {
  const [idea, setIdea] = useState("");
  const [count, setCount] = useState(3);
  const [isExclusive, setIsExclusive] = useState(false);
  const [items, setItems] = useState([]);
  const [generatingConcepts, setGeneratingConcepts] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [imageProgress, setImageProgress] = useState(0);

  const handleGenerateConcepts = async () => {
    if (!idea.trim()) { toast.error("Describe a petmoji theme first"); return; }
    setGeneratingConcepts(true);

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
              imagePrompt: { type: "string" },
            },
            required: ["name", "description", "imagePrompt"],
          },
        },
      },
      required: ["petmojis"],
    };

    const prompt = [
      `Generate exactly ${count} unique emoji-style reaction sticker concepts for a kid-friendly school game chat.`,
      `Theme/idea: ${idea.trim()}`,
      "Each should be a different reaction/emotion/action (e.g. happy, sad, laughing, thumbs up, sleeping, angry, celebrating, confused, love, cool).",
      "For each provide:",
      "- name: short 1-3 word emoji label (e.g. 'Happy Dance', 'Big Sad', 'Mind Blown')",
      "- description: what the sticker shows (<=15 words)",
      "- imagePrompt: detailed prompt for AI image generation. Must describe a small square emoji-style sticker with kawaii/chibi style, vibrant colors, expressive face, transparent background feel. Include specific pose, expression, and action details.",
      "Keep everything fun, clean, and school-appropriate.",
    ].join("\n");

    const res = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schema,
    });

    const concepts = res?.petmojis || [];
    setItems(concepts.map((c, idx) => ({
      id: `${Date.now()}_${idx}`,
      name: c.name,
      description: c.description,
      imagePrompt: c.imagePrompt,
      imageUrl: null,
      isActive: true,
      isExclusive,
    })));
    setGeneratingConcepts(false);
  };

  const handleGenerateAllImages = async () => {
    const pending = items.filter((it) => !it.imageUrl);
    if (!pending.length) { toast.error("All items already have images"); return; }
    setGeneratingImages(true);
    setImageProgress(0);

    // Build promises for all pending items in parallel
    const promises = items.map(async (item, i) => {
      if (item.imageUrl) return; // skip already generated
      const fullPrompt = `${item.imagePrompt} Style: kawaii emoji sticker, transparent background feel, vibrant colors, simple clean design, expressive face, chibi proportions. Make it look like a chat reaction emoji.${SAFE_PROMPT_SUFFIX}`;
      const result = await base44.integrations.Core.GenerateImage({ prompt: fullPrompt });
      setItems((prev) => {
        const copy = [...prev];
        copy[i] = { ...copy[i], imageUrl: result.url };
        return copy;
      });
      setImageProgress((prev) => prev + 1);
    });

    await Promise.all(promises);
    setGeneratingImages(false);
    toast.success("All images generated!");
  };

  const generateOneImage = async (idx) => {
    const it = items[idx];
    if (!it.imagePrompt) return;
    setItems((prev) => { const c = [...prev]; c[idx] = { ...c[idx], imageUrl: null, _generating: true }; return c; });
    const fullPrompt = `${it.imagePrompt} Style: kawaii emoji sticker, transparent background feel, vibrant colors, simple clean design, expressive face, chibi proportions. Make it look like a chat reaction emoji.${SAFE_PROMPT_SUFFIX}`;
    const result = await base44.integrations.Core.GenerateImage({ prompt: fullPrompt });
    setItems((prev) => { const c = [...prev]; c[idx] = { ...c[idx], imageUrl: result.url, _generating: false }; return c; });
  };

  const changeAt = (idx, field, value) =>
    setItems((prev) => { const c = [...prev]; c[idx] = { ...c[idx], [field]: value }; return c; });

  const removeAt = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const saveOne = async (idx) => {
    const it = items[idx];
    if (!it.name.trim()) { toast.error("Name is required"); return; }
    if (!it.imageUrl) { toast.error("Generate an image first"); return; }
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
    const valid = items.filter((it) => it.name.trim() && it.imageUrl);
    if (!valid.length) { toast.error("Need named petmojis with images"); return; }
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

  const readyCount = items.filter((it) => it.imageUrl && it.name.trim()).length;

  return (
    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-5">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🎨</span>
        <div>
          <h3 className="text-lg font-bold text-white">Bulk Petmoji Creator</h3>
          <p className="text-slate-400 text-sm">Describe a theme → AI generates concepts & images → save all</p>
        </div>
      </div>

      {/* Step 1: Idea + count */}
      <Card className="bg-slate-700/50 border-slate-600">
        <CardContent className="p-4 space-y-3">
          <div>
            <label className="text-sm text-slate-300 font-medium">Petmoji Theme / Idea</label>
            <Textarea
              placeholder="e.g. A cute fire dragon doing different reactions, A sleepy cloud cat in various moods, Pixel art robot emotions..."
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white min-h-[80px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-300">Count:</label>
              <div className="flex gap-1">
                {[2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <Button
                    key={n}
                    size="sm"
                    variant={count === n ? "default" : "outline"}
                    onClick={() => setCount(n)}
                    className={count === n ? "bg-pink-600 h-7 px-2" : "border-slate-600 text-slate-300 h-7 px-2"}
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-700/50 rounded-lg px-3 py-2">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <div>
                <p className="text-sm text-white font-medium">Exclusive</p>
                <p className="text-[10px] text-slate-400">Only visible to gifted users</p>
              </div>
            </div>
            <Switch checked={isExclusive} onCheckedChange={setIsExclusive} />
          </div>

          <Button
            onClick={handleGenerateConcepts}
            disabled={generatingConcepts || !idea.trim()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
          >
            {generatingConcepts ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating Concepts...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" />Generate {count} Petmoji Concepts</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Step 2: Concepts generated, generate images */}
      {items.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">
              {readyCount}/{items.length} ready to save
              {generatingImages && ` • Generating images... (${imageProgress}/${items.length})`}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleGenerateAllImages}
                disabled={generatingImages || items.every((it) => it.imageUrl)}
                className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-500"
                size="sm"
              >
                {generatingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {generatingImages ? "Generating..." : "Generate All Images"}
              </Button>
              <Button onClick={saveAll} disabled={!readyCount || savingAll} className="gap-2" size="sm">
                <Save className="w-4 h-4" /> {savingAll ? "Saving..." : `Save All (${readyCount})`}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((it, idx) => (
              <div key={it.id} className="bg-slate-700/60 rounded-xl p-3 relative group">
                {/* Image area */}
                <div className="w-16 h-16 mx-auto mb-2 rounded-lg bg-slate-600/50 flex items-center justify-center overflow-hidden">
                  {it._generating ? (
                    <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
                  ) : it.imageUrl ? (
                    <img src={it.imageUrl} alt={it.name} className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <button onClick={() => generateOneImage(idx)} className="text-slate-400 hover:text-pink-400 transition-colors" title="Generate image">
                      <Wand2 className="w-5 h-5" />
                    </button>
                  )}
                </div>

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
                    >
                      <Lock className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => changeAt(idx, "isActive", !it.isActive)}
                      className={`p-1 rounded ${it.isActive ? "text-emerald-400" : "text-slate-500"}`}
                    >
                      {it.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-1">
                    {it.imageUrl && (
                      <Button size="icon" variant="ghost" className="h-6 w-6 text-pink-400 hover:text-pink-300" onClick={() => generateOneImage(idx)} title="Regenerate">
                        <Wand2 className="w-3 h-3" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-6 w-6 text-emerald-400 hover:text-emerald-300" onClick={() => saveOne(idx)} title="Save this one">
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
        </>
      )}
    </div>
  );
}