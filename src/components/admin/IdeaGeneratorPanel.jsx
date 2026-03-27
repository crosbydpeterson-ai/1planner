import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Lightbulb, X, Sparkles, Wand2, Save, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { colorStyle } from "@/components/theme/themeUtils";

const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];
const XP_BY_RARITY = { common: 0, uncommon: 200, rare: 600, epic: 1200, legendary: 2000 };

export default function IdeaGeneratorPanel({ onCreated }) {
  const [theme, setTheme] = useState("");
  const [rarity, setRarity] = useState("rare");
  const [count, setCount] = useState(6);
  const [ideas, setIdeas] = useState([]);      // step 1 result: list of {name, description, emoji, theme, rarity, selected}
  const [pets, setPets] = useState([]);         // step 2 result: ideas + imageUrl
  const [step, setStep] = useState("input");    // input -> ideas -> generating -> preview -> saving
  const [loading, setLoading] = useState(false);
  const [generatingIdx, setGeneratingIdx] = useState(-1);
  const [savingAll, setSavingAll] = useState(false);

  // Step 1: Brainstorm ideas from theme
  const handleBrainstorm = async () => {
    if (!theme.trim()) return;
    setLoading(true);
    setStep("brainstorming");

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a magical creature designer for a school gamification app. 
A teacher wants to bulk-create pets based on this theme: "${theme}"

Generate exactly ${count} creative pet variation ideas based on this theme.
Each pet should be a unique spin/variation on the theme (e.g., if theme is "fruit hamster", you'd make "Pineapple Hamster", "Strawberry Hamster", "Blueberry Hamster", etc.)

RULES:
- Kid-friendly, school-appropriate only
- Creative, catchy names (2-3 words max)
- Fun short descriptions (1 sentence)
- A fitting emoji
- A cohesive color theme (4 hex colors)
- Mix up rarities across the set`,
      response_json_schema: {
        type: "object",
        properties: {
          pets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                emoji: { type: "string" },
                rarity: { type: "string", enum: RARITIES },
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
              required: ["name", "description", "emoji", "rarity", "theme"]
            }
          }
        },
        required: ["pets"]
      }
    });

    const generated = (res?.pets || []).map((p, i) => ({ ...p, id: `idea_${Date.now()}_${i}`, selected: true }));
    setIdeas(generated);
    setStep("ideas");
    setLoading(false);
  };

  const toggleIdea = (idx) => {
    setIdeas(prev => prev.map((idea, i) => i === idx ? { ...idea, selected: !idea.selected } : idea));
  };

  const removeIdea = (idx) => {
    setIdeas(prev => prev.filter((_, i) => i !== idx));
  };

  // Step 2: Generate images for selected ideas
  const handleGenerateAll = async () => {
    const selected = ideas.filter(i => i.selected);
    if (!selected.length) {
      toast.error("Select at least one idea!");
      return;
    }
    setStep("generating");
    const results = [];

    for (let i = 0; i < selected.length; i++) {
      setGeneratingIdx(i);
      const idea = selected[i];
      let imageUrl = "";

      try {
        const imagePrompt = `Cute cartoon pet character for a CHILDREN'S educational game: ${idea.name}. ${idea.description}. 
Style: adorable, friendly, colorful digital art, game mascot style, simple clean design, kid-friendly, Pixar-style cuteness.
Color scheme: primary ${idea.theme?.primary}, secondary ${idea.theme?.secondary}, accent ${idea.theme?.accent}.
White or transparent background, centered, high quality illustration.`;

        const imgRes = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
        imageUrl = imgRes?.url || "";
      } catch (e) {
        console.error("Image gen failed for", idea.name, e);
      }

      results.push({
        ...idea,
        imageUrl,
        xpRequired: XP_BY_RARITY[idea.rarity] || 0
      });
    }

    setGeneratingIdx(-1);
    setPets(results);
    setStep("preview");
  };

  const removePet = (idx) => {
    setPets(prev => prev.filter((_, i) => i !== idx));
  };

  // Step 3: Save all pets
  const handleSaveAll = async () => {
    if (!pets.length) return;
    setSavingAll(true);

    const petPayloads = pets.map(p => ({
      name: p.name,
      rarity: p.rarity,
      xpRequired: p.xpRequired || 0,
      description: p.description,
      emoji: p.emoji || undefined,
      imageUrl: p.imageUrl || "",
      isGiftOnly: true,
      theme: p.theme,
      createdSourceTab: "bulk_pet_creator",
      imageSource: p.imageUrl ? "ai_generated" : "emoji_only"
    }));

    const created = await base44.entities.CustomPet.bulkCreate(petPayloads);

    const themePayloads = pets.map(p => ({
      name: p.name,
      rarity: p.rarity || "common",
      xpRequired: 0,
      description: `Theme from ${p.name}`,
      primaryColor: p.theme?.primary || "#22c55e",
      secondaryColor: p.theme?.secondary || "#86efac",
      accentColor: p.theme?.accent || "#4ade80",
      bgColor: p.theme?.bg || "#f0fdf4"
    }));
    await base44.entities.CustomTheme.bulkCreate(themePayloads);

    onCreated && onCreated(created);
    toast.success(`${created.length} pets created!`);

    // Reset
    setPets([]);
    setIdeas([]);
    setTheme("");
    setStep("input");
    setSavingAll(false);
  };

  const handleReset = () => {
    setStep("input");
    setIdeas([]);
    setPets([]);
    setGeneratingIdx(-1);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" /> Idea Generator
        </h2>
        {step !== "input" && (
          <Button variant="outline" size="sm" onClick={handleReset} className="text-slate-300 border-slate-600 hover:bg-slate-700">
            Start Over
          </Button>
        )}
      </div>

      {/* STEP 1: Input */}
      {step === "input" && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-slate-400">Type a theme like "fruit hamster" or "space cats" and AI will brainstorm variations for you.</p>
            <div className="flex gap-3">
              <Input
                placeholder='e.g. "fruit hamster", "ocean dragons", "robot animals"'
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white flex-1"
                onKeyDown={(e) => e.key === "Enter" && handleBrainstorm()}
              />
              <Select value={String(count)} onValueChange={(v) => setCount(Number(v))}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[4, 6, 8, 10].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={handleBrainstorm} disabled={!theme.trim()} className="bg-amber-600 hover:bg-amber-700 gap-2">
                <Lightbulb className="w-4 h-4" /> Brainstorm
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Brainstorming spinner */}
      {step === "brainstorming" && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-amber-400" />
            <p className="text-white font-semibold">Brainstorming ideas for "{theme}"...</p>
            <p className="text-slate-400 text-sm mt-1">Making creative variations</p>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Review Ideas */}
      {step === "ideas" && (
        <div className="space-y-3">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-300">
                  <span className="text-white font-semibold">{ideas.filter(i => i.selected).length}</span> of {ideas.length} selected — remove any you don't want
                </p>
                <Button onClick={handleGenerateAll} disabled={!ideas.some(i => i.selected)} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gap-2">
                  <Wand2 className="w-4 h-4" /> Generate Selected
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence>
                  {ideas.map((idea, idx) => (
                    <motion.div
                      key={idea.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={`relative rounded-xl p-3 border transition-all cursor-pointer ${
                        idea.selected
                          ? "bg-slate-700 border-purple-500/50"
                          : "bg-slate-800/50 border-slate-700 opacity-50"
                      }`}
                      onClick={() => toggleIdea(idx)}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); removeIdea(idx); }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{idea.emoji}</span>
                        <div>
                          <h4 className="text-white font-semibold text-sm">{idea.name}</h4>
                          <span className="text-xs text-slate-400 capitalize">{idea.rarity}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-2">{idea.description}</p>
                      <div className="flex gap-1 mt-2">
                        {["primary", "secondary", "accent", "bg"].map(k => (
                          <div key={k} className="w-4 h-4 rounded-full border border-white/20" style={colorStyle(idea.theme?.[k] || "#888")} />
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: Generating images */}
      {step === "generating" && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-3">🥚✨</div>
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-purple-400" />
            <p className="text-white font-semibold">
              Generating pet {generatingIdx + 1} of {ideas.filter(i => i.selected).length}...
            </p>
            {generatingIdx >= 0 && (
              <p className="text-purple-300 mt-1">
                {ideas.filter(i => i.selected)[generatingIdx]?.name}
              </p>
            )}
            <div className="flex justify-center gap-2 mt-4">
              {ideas.filter(i => i.selected).map((idea, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i < generatingIdx ? "bg-green-500" : i === generatingIdx ? "bg-purple-400 animate-pulse" : "bg-slate-600"
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Preview generated pets */}
      {step === "preview" && (
        <div className="space-y-3">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-300">
                  <span className="text-white font-semibold">{pets.length}</span> pets ready to save
                </p>
                <Button onClick={handleSaveAll} disabled={!pets.length || savingAll} className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                  <Save className="w-4 h-4" /> {savingAll ? "Saving..." : "Save All Pets"}
                </Button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {pets.map((pet, idx) => (
                    <motion.div
                      key={pet.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative rounded-xl overflow-hidden border border-slate-600"
                    >
                      <button
                        onClick={() => removePet(idx)}
                        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="p-3 rounded-t-xl" style={colorStyle(pet.theme?.bg || "#f8fafc")}>
                        <div className="w-24 h-24 mx-auto rounded-xl overflow-hidden mb-2 bg-white/30">
                          {pet.imageUrl ? (
                            <img src={pet.imageUrl} alt={pet.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">{pet.emoji}</div>
                          )}
                        </div>
                        <h4 className="text-center font-bold text-sm" style={{ color: pet.theme?.primary || "#333" }}>{pet.name}</h4>
                        <p className="text-center text-xs text-slate-600 mt-1 line-clamp-2">{pet.description}</p>
                      </div>
                      <div className="bg-slate-700 p-2 flex items-center justify-between">
                        <span className="text-xs text-slate-300 capitalize">{pet.rarity}</span>
                        <div className="flex gap-1">
                          {["primary", "secondary", "accent"].map(k => (
                            <div key={k} className="w-3 h-3 rounded-full" style={colorStyle(pet.theme?.[k] || "#888")} />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}