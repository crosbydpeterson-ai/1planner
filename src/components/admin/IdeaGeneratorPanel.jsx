import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Lightbulb, X, Wand2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { colorStyle } from "@/components/theme/themeUtils";
import ActiveEggJobs from "@/components/admin/ActiveEggJobs";

const RARITIES = ["common", "uncommon", "rare", "epic", "legendary"];
const XP_BY_RARITY = { common: 0, uncommon: 200, rare: 600, epic: 1200, legendary: 2000 };

export default function IdeaGeneratorPanel({ adminProfile, onCreated }) {
  const [theme, setTheme] = useState("");
  const [rarity, setRarity] = useState("rare");
  const [count, setCount] = useState(6);
  const [ideas, setIdeas] = useState([]);      // step 1 result: list of {name, description, emoji, theme, rarity, selected}
  const [step, setStep] = useState("input");    // input -> ideas -> submitting
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  // Step 2: Submit selected ideas to backend job for image gen + saving
  const handleSubmitToBackend = async () => {
    const selected = ideas.filter(i => i.selected);
    if (!selected.length) {
      toast.error("Select at least one idea!");
      return;
    }
    setSubmitting(true);

    try {
      const concepts = selected.map(idea => ({
        name: idea.name,
        description: idea.description,
        emoji: idea.emoji,
        rarity: idea.rarity,
        theme: idea.theme
      }));

      const job = await base44.entities.EggGenerationJob.create({
        idea: theme || "Brainstormed ideas",
        totalCount: concepts.length,
        concepts,
        status: "pending",
        startedBy: adminProfile?.userId || "admin",
        startedByProfileId: adminProfile?.id,
        completedCount: 0,
        createdPetIds: [],
        createdThemeIds: []
      });

      // Fire-and-forget the backend function
      base44.functions.invoke("generateMagicEggs", { jobId: job.id });
      toast.success("Job started! Track progress below.");

      // Reset to input
      setIdeas([]);
      setTheme("");
      setStep("input");
    } catch (e) {
      toast.error("Failed to start job");
      console.error(e);
    }
    setSubmitting(false);
  };

  const handleReset = () => {
    setStep("input");
    setIdeas([]);
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
                <Button onClick={handleSubmitToBackend} disabled={!ideas.some(i => i.selected) || submitting} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  {submitting ? "Starting..." : "Generate Selected"}
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

      {/* Job tracker */}
      <ActiveEggJobs adminProfile={adminProfile} onComplete={() => onCreated?.()} />
    </div>
  );
}