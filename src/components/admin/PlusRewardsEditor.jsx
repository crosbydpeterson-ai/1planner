import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Wand2, Plus, X, Save, Crown, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PETS } from "@/components/quest/PetCatalog";

const REWARD_TYPES = ["pet", "theme", "title", "coins", "magic_egg"];

export default function PlusRewardsEditor({ season, customPets, customThemes, adminProfile, onSeasonUpdated }) {
  const [mode, setMode] = useState(null); // null, 'ai', 'manual'
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Current rewards split
  const allRewards = season?.rewards || [];
  const freeRewards = allRewards.filter((_, i) => i % 2 === 0);
  const plusRewards = allRewards.filter((_, i) => i % 2 === 1);

  const [editedPlusRewards, setEditedPlusRewards] = useState(plusRewards);

  const addManualReward = () => {
    const lastXp = editedPlusRewards.length > 0 ? editedPlusRewards[editedPlusRewards.length - 1].xpRequired : 0;
    setEditedPlusRewards([...editedPlusRewards, {
      xpRequired: lastXp + 100,
      type: "coins",
      name: "",
      value: "50"
    }]);
  };

  const updateReward = (index, field, value) => {
    setEditedPlusRewards(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const removeReward = (index) => {
    setEditedPlusRewards(prev => prev.filter((_, i) => i !== index));
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) { toast.error("Describe the Plus rewards theme"); return; }
    setGenerating(true);

    try {
      const freeInfo = freeRewards.map((r, i) => `${r.xpRequired} XP: ${r.name} (${r.type})`).join("\n");

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are designing 1Pass Plus (premium tier) rewards for a school gamification app.
        
Season: "${season.name}"
Theme prompt: "${aiPrompt}"

Here are the FREE track rewards already set:
${freeInfo}

Generate ${freeRewards.length} PLUS rewards that:
- Match XP thresholds from the free track (use the same xpRequired values)
- Are MORE valuable/exciting than free rewards at the same level
- Include exclusive pets, rare themes, bigger coin amounts, special titles
- Feel premium and worth having 1Pass Plus for
- Are thematically connected to "${aiPrompt}"

REWARD TYPES: pet, theme, title, coins, magic_egg
For pets: include petData with name, description, emoji, rarity, and theme colors
For themes: include themeData with primaryColor, secondaryColor, accentColor, bgColor, rarity
For coins: include coinAmount (number)
For titles: value should be the title text`,
        response_json_schema: {
          type: "object",
          properties: {
            rewards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  xpRequired: { type: "number" },
                  type: { type: "string" },
                  name: { type: "string" },
                  value: { type: "string" },
                  petData: {
                    type: "object",
                    properties: {
                      description: { type: "string" },
                      emoji: { type: "string" },
                      rarity: { type: "string" },
                      theme: {
                        type: "object",
                        properties: { primary: { type: "string" }, secondary: { type: "string" }, accent: { type: "string" }, bg: { type: "string" } }
                      }
                    }
                  },
                  themeData: {
                    type: "object",
                    properties: { primaryColor: { type: "string" }, secondaryColor: { type: "string" }, accentColor: { type: "string" }, bgColor: { type: "string" }, rarity: { type: "string" } }
                  },
                  coinAmount: { type: "number" }
                }
              }
            }
          }
        }
      });

      setEditedPlusRewards(res?.rewards || []);
      setMode("review");
      toast.success("Plus rewards generated!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate Plus rewards");
    }
    setGenerating(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Process pet and theme rewards — create entities
      const processedPlus = [];
      const petJobs = [];

      for (const reward of editedPlusRewards) {
        if (reward.type === "pet" && reward.petData) {
          petJobs.push({
            name: reward.name,
            description: reward.petData.description,
            emoji: reward.petData.emoji,
            rarity: reward.petData.rarity,
            theme: reward.petData.theme,
            xpRequired: reward.xpRequired
          });
          processedPlus.push({ xpRequired: reward.xpRequired, type: "pet", name: reward.name, value: `pending_${petJobs.length - 1}` });
        } else if (reward.type === "theme" && reward.themeData) {
          const newTheme = await base44.entities.CustomTheme.create({
            name: reward.name, rarity: reward.themeData.rarity || "rare", xpRequired: 0,
            description: `1Pass Plus: ${reward.name}`,
            primaryColor: reward.themeData.primaryColor, secondaryColor: reward.themeData.secondaryColor,
            accentColor: reward.themeData.accentColor, bgColor: reward.themeData.bgColor
          });
          processedPlus.push({ xpRequired: reward.xpRequired, type: "theme", name: reward.name, value: `custom_${newTheme.id}` });
        } else if (reward.type === "coins") {
          processedPlus.push({ xpRequired: reward.xpRequired, type: "coins", name: reward.name, value: String(reward.coinAmount || reward.value || 50) });
        } else if (reward.type === "magic_egg") {
          processedPlus.push({ xpRequired: reward.xpRequired, type: "magic_egg", name: reward.name, value: "magic_egg" });
        } else if (reward.type === "title") {
          processedPlus.push({ xpRequired: reward.xpRequired, type: "title", name: reward.name, value: reward.value || reward.name });
        } else {
          // Already processed reward (has a value like custom_xxx)
          processedPlus.push({ xpRequired: reward.xpRequired, type: reward.type, name: reward.name, value: reward.value });
        }
      }

      // Generate pets if needed
      if (petJobs.length > 0) {
        const job = await base44.entities.EggGenerationJob.create({
          idea: `1Pass Plus: ${season.name}`, totalCount: petJobs.length, concepts: petJobs,
          status: "pending", startedBy: adminProfile?.userId || "admin",
          startedByProfileId: adminProfile?.id, completedCount: 0, createdPetIds: [], createdThemeIds: []
        });
        toast.info(`Generating ${petJobs.length} Plus pets with AI...`);
        await base44.functions.invoke("generateMagicEggs", { jobId: job.id });
        const completedJobs = await base44.entities.EggGenerationJob.filter({ id: job.id });
        const createdPetIds = completedJobs[0]?.createdPetIds || [];
        let petIdx = 0;
        for (let i = 0; i < processedPlus.length; i++) {
          if (processedPlus[i].value?.startsWith("pending_")) {
            processedPlus[i].value = createdPetIds[petIdx] ? `custom_${createdPetIds[petIdx]}` : "pending";
            petIdx++;
          }
        }
      }

      // Rebuild interleaved: free[0], plus[0], free[1], plus[1], ...
      const newRewards = [];
      const maxLen = Math.max(freeRewards.length, processedPlus.length);
      for (let i = 0; i < maxLen; i++) {
        if (i < freeRewards.length) newRewards.push(freeRewards[i]);
        if (i < processedPlus.length) newRewards.push(processedPlus[i]);
      }

      await base44.entities.Season.update(season.id, { rewards: newRewards });
      toast.success("1Pass Plus rewards saved!");
      onSeasonUpdated?.({ ...season, rewards: newRewards });
      setMode(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save Plus rewards");
    }
    setSaving(false);
  };

  const getRewardIcon = (type) => {
    const icons = { pet: "🐾", theme: "🎨", title: "🏷️", coins: "🪙", magic_egg: "🥚" };
    return icons[type] || "🎁";
  };

  if (!season) return null;

  return (
    <Card className="bg-gradient-to-br from-fuchsia-900/40 to-purple-900/40 border-yellow-500/30">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-yellow-400" />
            <h3 className="text-white font-bold">1Pass Plus Rewards</h3>
            <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">{season.name}</span>
          </div>
          <span className="text-xs text-slate-400">{plusRewards.length} plus / {freeRewards.length} free rewards</span>
        </div>

        {!mode && (
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => setMode("ai")} className="bg-gradient-to-r from-purple-500 to-pink-500 gap-2">
              <Wand2 className="w-4 h-4" /> Generate with AI
            </Button>
            <Button onClick={() => { setEditedPlusRewards([...plusRewards]); setMode("manual"); }} className="bg-slate-700 hover:bg-slate-600 gap-2">
              <Plus className="w-4 h-4" /> Edit Manually
            </Button>
          </div>
        )}

        {mode === "ai" && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-slate-300">Plus Rewards Theme</Label>
              <Textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                placeholder='e.g. "Golden premium creatures" or "Exclusive legendary set"'
                className="bg-slate-800 border-slate-600 text-white min-h-[80px]" />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAIGenerate} disabled={generating} className="bg-gradient-to-r from-purple-500 to-pink-500 flex-1 gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generating ? "Generating..." : "Generate Plus Rewards"}
              </Button>
              <Button variant="outline" onClick={() => setMode(null)} className="border-slate-600 text-slate-300">Cancel</Button>
            </div>
          </div>
        )}

        {(mode === "manual" || mode === "review") && (
          <div className="space-y-3">
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {editedPlusRewards.map((reward, idx) => (
                <div key={idx} className="bg-slate-800/60 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-yellow-400 font-bold">Plus #{idx + 1} — {getRewardIcon(reward.type)} {reward.type}</span>
                    <Button size="sm" variant="ghost" onClick={() => removeReward(idx)} className="h-6 text-red-400"><X className="w-3 h-3" /></Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <Input type="number" value={reward.xpRequired} onChange={(e) => updateReward(idx, "xpRequired", parseInt(e.target.value) || 0)} placeholder="XP" className="bg-slate-700 border-slate-600 text-white text-xs h-8" />
                    <Select value={reward.type} onValueChange={(v) => updateReward(idx, "type", v)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-xs h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {REWARD_TYPES.map(t => <SelectItem key={t} value={t}>{getRewardIcon(t)} {t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Input value={reward.name} onChange={(e) => updateReward(idx, "name", e.target.value)} placeholder="Name" className="bg-slate-700 border-slate-600 text-white text-xs h-8" />
                    {reward.type === "pet" ? (
                      <Select value={reward.value || ""} onValueChange={(v) => updateReward(idx, "value", v)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-xs h-8"><SelectValue placeholder="Pick pet" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ai_generate">🤖 AI Generate</SelectItem>
                          {PETS.map(p => <SelectItem key={p.id} value={p.id}>{p.emoji} {p.name}</SelectItem>)}
                          {customPets.map(p => <SelectItem key={p.id} value={`custom_${p.id}`}>{p.emoji || "🎁"} {p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : reward.type === "theme" ? (
                      <Select value={reward.value || ""} onValueChange={(v) => updateReward(idx, "value", v)}>
                        <SelectTrigger className="bg-slate-700 border-slate-600 text-xs h-8"><SelectValue placeholder="Pick theme" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ai_generate">🤖 AI Generate</SelectItem>
                          {customThemes.map(t => <SelectItem key={t.id} value={`custom_${t.id}`}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : reward.type === "coins" ? (
                      <Input type="number" value={reward.coinAmount || reward.value} onChange={(e) => { updateReward(idx, "coinAmount", parseInt(e.target.value) || 0); updateReward(idx, "value", e.target.value); }} placeholder="Amount" className="bg-slate-700 border-slate-600 text-white text-xs h-8" />
                    ) : (
                      <Input value={reward.value || ""} onChange={(e) => updateReward(idx, "value", e.target.value)} placeholder="Value" className="bg-slate-700 border-slate-600 text-white text-xs h-8" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button onClick={addManualReward} variant="outline" size="sm" className="w-full border-dashed border-slate-600 text-slate-400 gap-2">
              <Plus className="w-3 h-3" /> Add Plus Reward
            </Button>

            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving} className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-slate-900 gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Saving..." : "Save Plus Rewards"}
              </Button>
              <Button variant="outline" onClick={() => setMode(null)} className="border-slate-600 text-slate-300">Cancel</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}