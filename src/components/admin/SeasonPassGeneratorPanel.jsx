import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Loader2, Sparkles, Wand2, Check, X, Edit2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import ActiveEggJobs from "@/components/admin/ActiveEggJobs";

const REWARD_TYPES = ["pet", "theme", "title", "coins", "magic_egg"];
const SPACING_LABELS = { 1: "Very Compact", 2: "Compact", 3: "Normal", 4: "Spaced", 5: "Very Far Apart" };

export default function SeasonPassGeneratorPanel({ adminProfile, customPets, customThemes, onSeasonCreated }) {
  const [step, setStep] = useState("input"); // input -> generating -> review -> saving
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Input fields
  const [theme, setTheme] = useState("");
  const [seasonName, setSeasonName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rewardCount, setRewardCount] = useState(10);
  const [spacing, setSpacing] = useState(3); // 1-5 scale

  // Generated rewards
  const [generatedRewards, setGeneratedRewards] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const handleGenerate = async () => {
    if (!theme.trim()) {
      toast.error("Enter a season theme!");
      return;
    }
    if (!startDate || !endDate) {
      toast.error("Set start and end dates!");
      return;
    }

    setLoading(true);
    setStep("generating");

    try {
      const spacingDesc = {
        1: "very close together, small XP gaps (50-100 XP between rewards)",
        2: "close together, modest XP gaps (100-200 XP between rewards)",
        3: "moderate spacing, balanced XP gaps (200-400 XP between rewards)",
        4: "spaced out, larger XP gaps (400-700 XP between rewards)",
        5: "very far apart, significant XP challenges (700-1500 XP between rewards)"
      }[spacing];

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are designing a 1Pass for a school gamification app called 1Planner.
        
Theme: "${theme}"
Number of rewards: ${rewardCount}
Reward spacing: ${spacingDesc}

Generate a complete season pass with:
1. A creative season name based on the theme (if not provided, generate one)
2. ${rewardCount} rewards distributed across the season

REWARD TYPES:
- "pet": A collectible creature (include name, description, emoji, rarity, and color theme)
- "theme": A UI color theme (include name and 4 hex colors: primary, secondary, accent, bg)
- "title": A display title the student can equip (just a short text like "Dragon Tamer" or "Star Scholar")
- "coins": Quest Coins currency (include amount, typically 25-200)
- "magic_egg": A special egg that lets students create their own pet

RULES:
- Start with lower-value rewards (common pets, small coin amounts, simple titles)
- End with high-value rewards (legendary pets, rare themes, large coin amounts)
- Mix reward types throughout - don't cluster all of one type
- Make rewards thematically connected to "${theme}"
- Ensure XP values are progressive and match the spacing preference
- For pets: include creative names, fun descriptions, fitting emojis, and cohesive color themes
- For themes: design color palettes that match the season theme`,
        response_json_schema: {
          type: "object",
          properties: {
            seasonName: { type: "string" },
            rewards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  xpRequired: { type: "number" },
                  type: { type: "string", enum: REWARD_TYPES },
                  name: { type: "string" },
                  value: { type: "string" },
                  // For pets
                  petData: {
                    type: "object",
                    properties: {
                      description: { type: "string" },
                      emoji: { type: "string" },
                      rarity: { type: "string", enum: ["common", "uncommon", "rare", "epic", "legendary"] },
                      theme: {
                        type: "object",
                        properties: {
                          primary: { type: "string" },
                          secondary: { type: "string" },
                          accent: { type: "string" },
                          bg: { type: "string" }
                        }
                      }
                    }
                  },
                  // For themes
                  themeData: {
                    type: "object",
                    properties: {
                      primaryColor: { type: "string" },
                      secondaryColor: { type: "string" },
                      accentColor: { type: "string" },
                      bgColor: { type: "string" },
                      rarity: { type: "string", enum: ["common", "uncommon", "rare", "epic", "legendary"] }
                    }
                  },
                  // For coins
                  coinAmount: { type: "number" }
                },
                required: ["xpRequired", "type", "name"]
              }
            }
          },
          required: ["seasonName", "rewards"]
        }
      });

      if (res?.seasonName) {
        setSeasonName(res.seasonName);
      }
      setGeneratedRewards(res?.rewards || []);
      setStep("review");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate 1Pass");
      setStep("input");
    }
    setLoading(false);
  };

  const handleSaveSeason = async () => {
    if (!seasonName.trim() || !startDate || !endDate || generatedRewards.length === 0) {
      toast.error("Missing required fields");
      return;
    }

    setSaving(true);

    try {
      // Process rewards - create pets/themes as needed
      const processedRewards = [];
      const petJobs = [];

      for (const reward of generatedRewards) {
        if (reward.type === "pet" && reward.petData) {
          // Queue pet for creation via generateMagicEggs
          petJobs.push({
            name: reward.name,
            description: reward.petData.description,
            emoji: reward.petData.emoji,
            rarity: reward.petData.rarity,
            theme: reward.petData.theme,
            xpRequired: reward.xpRequired
          });
          // Placeholder - will be updated after job completes
          processedRewards.push({
            xpRequired: reward.xpRequired,
            type: "pet",
            name: reward.name,
            value: `pending_${petJobs.length - 1}` // temporary
          });
        } else if (reward.type === "theme" && reward.themeData) {
          // Create theme directly
          const newTheme = await base44.entities.CustomTheme.create({
            name: reward.name,
            rarity: reward.themeData.rarity || "common",
            xpRequired: 0,
            description: `Season theme: ${reward.name}`,
            primaryColor: reward.themeData.primaryColor,
            secondaryColor: reward.themeData.secondaryColor,
            accentColor: reward.themeData.accentColor,
            bgColor: reward.themeData.bgColor
          });
          processedRewards.push({
            xpRequired: reward.xpRequired,
            type: "theme",
            name: reward.name,
            value: `custom_${newTheme.id}`
          });
        } else if (reward.type === "coins") {
          processedRewards.push({
            xpRequired: reward.xpRequired,
            type: "coins",
            name: reward.name,
            value: String(reward.coinAmount || 50)
          });
        } else if (reward.type === "magic_egg") {
          processedRewards.push({
            xpRequired: reward.xpRequired,
            type: "magic_egg",
            name: reward.name,
            value: "magic_egg"
          });
        } else if (reward.type === "title") {
          processedRewards.push({
            xpRequired: reward.xpRequired,
            type: "title",
            name: reward.name,
            value: reward.name
          });
        }
      }

      // If we have pets to create, start a job and wait for completion
      if (petJobs.length > 0) {
        const job = await base44.entities.EggGenerationJob.create({
          idea: `Season Pass: ${seasonName}`,
          totalCount: petJobs.length,
          concepts: petJobs,
          status: "pending",
          startedBy: adminProfile?.userId || "admin",
          startedByProfileId: adminProfile?.id,
          completedCount: 0,
          createdPetIds: [],
          createdThemeIds: []
        });

        // Fire the job
        toast.info(`Generating ${petJobs.length} pets with AI... this may take a minute.`);
        await base44.functions.invoke("generateMagicEggs", { jobId: job.id });

        // Fetch the completed job to get created pet IDs
        const completedJobs = await base44.entities.EggGenerationJob.filter({ id: job.id });
        const completedJob = completedJobs[0];
        const createdPetIds = completedJob?.createdPetIds || [];

        // Backfill pet reward values with actual IDs
        let petIdx = 0;
        for (let i = 0; i < processedRewards.length; i++) {
          if (processedRewards[i].value?.startsWith("pending_")) {
            processedRewards[i].value = createdPetIds[petIdx]
              ? `custom_${createdPetIds[petIdx]}`
              : "pending";
            petIdx++;
          }
        }
      }

      // Create the season
      const season = await base44.entities.Season.create({
        name: seasonName,
        startDate,
        endDate,
        isActive: true,
        rewards: processedRewards
      });

      toast.success("Season pass created!");
      onSeasonCreated?.(season);
      
      // Reset
      setStep("input");
      setTheme("");
      setSeasonName("");
      setStartDate("");
      setEndDate("");
      setRewardCount(10);
      setSpacing(3);
      setGeneratedRewards([]);

    } catch (e) {
      console.error(e);
      toast.error("Failed to save season");
    }
    setSaving(false);
  };

  const updateReward = (index, field, value) => {
    setGeneratedRewards(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const removeReward = (index) => {
    setGeneratedRewards(prev => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setStep("input");
    setGeneratedRewards([]);
  };

  const getRewardIcon = (type) => {
    const icons = { pet: "🐾", theme: "🎨", title: "🏷️", coins: "🪙", magic_egg: "🥚" };
    return icons[type] || "🎁";
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: "text-slate-400",
      uncommon: "text-green-400",
      rare: "text-blue-400",
      epic: "text-purple-400",
      legendary: "text-amber-400"
    };
    return colors[rarity] || "text-slate-400";
  };

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" /> AI 1Pass Generator
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
          <CardContent className="p-4 space-y-4">
            <p className="text-sm text-slate-400">Describe a theme and let AI generate a complete 1Pass with rewards, XP requirements, 1Pass Plus-ready rewards, and even new pets!</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Season Theme</Label>
                <Textarea
                  placeholder='e.g. "Ocean Adventures", "Space Explorers", "Mythical Creatures"'
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white min-h-[80px]"
                />
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Start Date</Label>
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">End Date</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-slate-700 border-slate-600 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Number of Rewards: {rewardCount}</Label>
                  <Slider value={[rewardCount]} onValueChange={([v]) => setRewardCount(v)} min={5} max={25} step={1} className="py-2" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Reward Spacing: {SPACING_LABELS[spacing]}</Label>
              <Slider value={[spacing]} onValueChange={([v]) => setSpacing(v)} min={1} max={5} step={1} className="py-2" />
              <p className="text-xs text-slate-500">
                {spacing <= 2 ? "Players will unlock rewards quickly" : spacing >= 4 ? "Rewards require significant XP investment" : "Balanced progression pace"}
              </p>
            </div>

            <Button onClick={handleGenerate} disabled={!theme.trim() || !startDate || !endDate} className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 gap-2">
              <Wand2 className="w-4 h-4" /> Generate 1Pass
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Generating */}
      {step === "generating" && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-amber-400" />
            <p className="text-white font-semibold text-lg">Generating "{theme}" 1Pass...</p>
            <p className="text-slate-400 text-sm mt-2">Creating {rewardCount} rewards with {SPACING_LABELS[spacing].toLowerCase()} spacing</p>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Review */}
      {step === "review" && (
        <div className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="space-y-2 flex-1 mr-4">
                  <Label className="text-slate-300">Season Name</Label>
                  <Input value={seasonName} onChange={(e) => setSeasonName(e.target.value)} className="bg-slate-700 border-slate-600 text-white text-lg font-semibold" />
                </div>
                <Button onClick={handleSaveSeason} disabled={saving} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? "Creating..." : "Create Season"}
                </Button>
              </div>

              <p className="text-sm text-slate-400 mb-3">{generatedRewards.length} rewards • {startDate} to {endDate}</p>

              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                <AnimatePresence>
                  {generatedRewards.map((reward, idx) => (
                    <motion.div
                      key={idx}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="bg-slate-700/60 rounded-lg p-3 flex items-center gap-3"
                    >
                      <div className="text-2xl">{getRewardIcon(reward.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium truncate">{reward.name}</span>
                          <span className="text-xs text-slate-400 capitalize">{reward.type}</span>
                          {reward.petData?.rarity && (
                            <span className={`text-xs capitalize ${getRarityColor(reward.petData.rarity)}`}>
                              {reward.petData.rarity}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-amber-400">{reward.xpRequired} XP</p>
                        {reward.petData?.description && (
                          <p className="text-xs text-slate-400 truncate">{reward.petData.description}</p>
                        )}
                      </div>
                      {reward.petData?.theme && (
                        <div className="flex gap-1">
                          {["primary", "secondary", "accent", "bg"].map(k => (
                            <div key={k} className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: reward.petData.theme[k] }} />
                          ))}
                        </div>
                      )}
                      {reward.themeData && (
                        <div className="flex gap-1">
                          {["primaryColor", "secondaryColor", "accentColor", "bgColor"].map(k => (
                            <div key={k} className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: reward.themeData[k] }} />
                          ))}
                        </div>
                      )}
                      {reward.type === "coins" && (
                        <span className="text-sm text-amber-400">{reward.coinAmount} 🪙</span>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => removeReward(idx)} className="text-red-400 hover:text-red-300 h-7 w-7 p-0">
                        <X className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {generatedRewards.filter(r => r.type === "pet").length > 0 && (
                <p className="text-xs text-amber-400 mt-3">
                  ⚡ {generatedRewards.filter(r => r.type === "pet").length} pet(s) will be generated with AI images when you create the season
                </p>
              )}
            </CardContent>
          </Card>

          <ActiveEggJobs adminProfile={adminProfile} />
        </div>
      )}
    </div>
  );
}