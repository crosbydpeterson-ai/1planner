import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ChefHat, Save, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const RARITY_COLORS = {
  common: 'text-slate-400', uncommon: 'text-green-400', rare: 'text-blue-400',
  epic: 'text-purple-400', legendary: 'text-yellow-400'
};

const RARITY_PRICES = { common: 30, uncommon: 50, rare: 80, epic: 120, legendary: 200 };

export default function KitchenAIPanel() {
  const [theme, setTheme] = useState('');
  const [count, setCount] = useState(4);
  const [generating, setGenerating] = useState(false);
  const [generatedItems, setGeneratedItems] = useState([]);
  const [savingAll, setSavingAll] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({ name: '', description: '', flavor: '', rarity: 'common', price: 50 });
  const [savingManual, setSavingManual] = useState(false);

  const generateFoodItems = async () => {
    if (!theme.trim()) { toast.error('Enter a food theme!'); return; }
    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create ${count} fun, kid-friendly food items for a 5th-grade gamified school planner app called 1Planner. Food theme: "${theme}".

When students feed these to their pets in the app, a new Legendary fusion pet is created. Make the food items exciting and themed!

For each food item:
- name: creative, kid-friendly food name matching the theme
- description: 1-2 fun sentences (exciting, school-themed humor is a bonus!)
- flavor: main flavor/theme in 2-4 words
- rarity: one of: common, uncommon, rare, epic, legendary (match rarity to how exciting/rare the food feels)
- imagePrompt: a detailed prompt for a cute cartoon food illustration (bright colors, white background, game icon style)

Return JSON.`,
        response_json_schema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  description: { type: 'string' },
                  flavor: { type: 'string' },
                  rarity: { type: 'string' },
                  imagePrompt: { type: 'string' }
                }
              }
            }
          }
        }
      });
      setGeneratedItems((result.items || []).map(item => ({ ...item, imageUrl: null, generatingImg: false, saved: false })));
    } catch (e) {
      toast.error('Generation failed: ' + e.message);
    }
    setGenerating(false);
  };

  const generateImageForItem = async (index) => {
    const item = generatedItems[index];
    setGeneratedItems(prev => prev.map((it, i) => i === index ? { ...it, generatingImg: true } : it));
    try {
      const result = await base44.integrations.Core.GenerateImage({
        prompt: item.imagePrompt || `Cute cartoon ${item.name} food item, ${item.flavor} theme, vibrant colors, white background, game icon style, kid-friendly`
      });
      setGeneratedItems(prev => prev.map((it, i) => i === index ? { ...it, imageUrl: result.url, generatingImg: false } : it));
    } catch {
      toast.error('Image generation failed');
      setGeneratedItems(prev => prev.map((it, i) => i === index ? { ...it, generatingImg: false } : it));
    }
  };

  const generateAllImages = async () => {
    for (let i = 0; i < generatedItems.length; i++) {
      if (!generatedItems[i].imageUrl && !generatedItems[i].generatingImg) {
        await generateImageForItem(i);
      }
    }
  };

  const saveItem = async (index) => {
    const item = generatedItems[index];
    try {
      await base44.entities.FoodItem.create({
        name: item.name,
        description: item.description,
        flavor: item.flavor,
        rarity: item.rarity || 'common',
        price: RARITY_PRICES[item.rarity] || 50,
        imageUrl: item.imageUrl || '',
        isActive: true,
      });
      setGeneratedItems(prev => prev.map((it, i) => i === index ? { ...it, saved: true } : it));
      toast.success(`${item.name} saved!`);
    } catch (e) {
      toast.error('Save failed: ' + e.message);
    }
  };

  const saveAll = async () => {
    setSavingAll(true);
    for (let i = 0; i < generatedItems.length; i++) {
      if (!generatedItems[i].saved) await saveItem(i);
    }
    setSavingAll(false);
    toast.success('All food items saved to database!');
  };

  const saveManual = async () => {
    if (!manualForm.name.trim() || !manualForm.flavor.trim()) { toast.error('Name and flavor are required'); return; }
    setSavingManual(true);
    try {
      await base44.entities.FoodItem.create({ ...manualForm, isActive: true });
      toast.success(`${manualForm.name} created!`);
      setManualForm({ name: '', description: '', flavor: '', rarity: 'common', price: 50 });
      setShowManualForm(false);
    } catch (e) {
      toast.error('Failed: ' + e.message);
    }
    setSavingManual(false);
  };

  return (
    <div className="bg-gradient-to-br from-orange-950/60 to-amber-950/60 rounded-2xl p-5 border border-orange-500/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ChefHat className="w-6 h-6 text-orange-400" />
          <div>
            <h3 className="text-white font-bold text-lg">🍽️ Kitchen AI</h3>
            <p className="text-slate-400 text-sm">Generate food items for the Pet Food system</p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={() => setShowManualForm(!showManualForm)}
          className="border-orange-500/40 text-orange-300">
          <Plus className="w-3 h-3 mr-1" />Manual
        </Button>
      </div>

      {showManualForm && (
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700 mb-4 space-y-3">
          <h4 className="text-white font-medium text-sm">Create Single Food Item</h4>
          <div className="grid grid-cols-2 gap-2">
            <Input value={manualForm.name} onChange={e => setManualForm({ ...manualForm, name: e.target.value })} placeholder="Food name" className="bg-slate-700 border-slate-600 text-white text-sm" />
            <Input value={manualForm.flavor} onChange={e => setManualForm({ ...manualForm, flavor: e.target.value })} placeholder="Flavor / theme" className="bg-slate-700 border-slate-600 text-white text-sm" />
          </div>
          <Input value={manualForm.description} onChange={e => setManualForm({ ...manualForm, description: e.target.value })} placeholder="Description..." className="bg-slate-700 border-slate-600 text-white text-sm" />
          <div className="grid grid-cols-2 gap-2">
            <Select value={manualForm.rarity} onValueChange={v => setManualForm({ ...manualForm, rarity: v, price: RARITY_PRICES[v] || 50 })}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['common', 'uncommon', 'rare', 'epic', 'legendary'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" value={manualForm.price} onChange={e => setManualForm({ ...manualForm, price: parseInt(e.target.value) || 0 })} placeholder="Price 🪙" className="bg-slate-700 border-slate-600 text-white text-sm" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={saveManual} disabled={savingManual} className="bg-orange-600">
              {savingManual ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
              Save Item
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowManualForm(false)} className="text-slate-400">Cancel</Button>
          </div>
        </div>
      )}

      {/* AI Generator */}
      <div className="space-y-3 mb-4">
        <div>
          <Label className="text-slate-300 text-sm mb-1">Food Theme / Concept</Label>
          <Input
            value={theme}
            onChange={e => setTheme(e.target.value)}
            placeholder="e.g. tropical smoothies, halloween candy, space pizza, underwater sushi..."
            className="bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <div className="flex items-center gap-3">
          <Label className="text-slate-300 text-sm whitespace-nowrap">Count:</Label>
          <div className="flex gap-1">
            {[2, 4, 6, 8].map(n => (
              <Button key={n} size="sm" variant={count === n ? 'default' : 'outline'}
                onClick={() => setCount(n)}
                className={count === n ? 'bg-orange-600 text-white' : 'border-slate-600 text-slate-300 h-8 w-8 p-0'}>
                {n}
              </Button>
            ))}
          </div>
        </div>
        <Button onClick={generateFoodItems} disabled={generating} className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 text-black font-semibold">
          {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><ChefHat className="w-4 h-4 mr-2" />Generate Food Items with AI</>}
        </Button>
      </div>

      {generatedItems.length > 0 && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={generateAllImages} className="bg-blue-600">🎨 Generate All Images</Button>
            <Button size="sm" onClick={saveAll} disabled={savingAll} className="bg-green-600">
              {savingAll ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
              Save All to DB
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setGeneratedItems([])} className="text-slate-400">Clear</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {generatedItems.map((item, i) => (
              <div key={i} className={`bg-slate-800 rounded-xl p-3 border transition-all ${item.saved ? 'border-green-500/50 bg-green-500/5' : 'border-slate-700'}`}>
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <button onClick={() => generateImageForItem(i)}
                        disabled={item.generatingImg}
                        className="w-16 h-16 rounded-lg bg-slate-700 flex items-center justify-center text-slate-400 text-xs hover:bg-slate-600 transition-colors border border-dashed border-slate-500">
                        {item.generatingImg ? <Loader2 className="w-4 h-4 animate-spin" /> : '🎨 Gen'}
                      </button>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      <p className="text-white font-medium text-sm">{item.name}</p>
                      {item.saved && <span className="text-green-400 text-xs">✓</span>}
                    </div>
                    <p className={`text-xs font-semibold capitalize ${RARITY_COLORS[item.rarity] || 'text-slate-400'}`}>{item.rarity} • {item.flavor}</p>
                    <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{item.description}</p>
                    <p className="text-slate-500 text-xs">{RARITY_PRICES[item.rarity] || 50} 🪙</p>
                  </div>
                </div>
                {!item.saved && (
                  <Button size="sm" onClick={() => saveItem(i)} className="mt-2 w-full bg-slate-700 hover:bg-slate-600 text-xs h-7">
                    <Save className="w-3 h-3 mr-1" />Save to Database
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}