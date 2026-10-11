import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Wand2, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_ICONS = { xp: '⭐', coins: '🪙', pet: '🐾', theme: '🎨', title: '🏷️' };

/**
 * AI Wheel Draft Generator — creates a DRAFT wheel from natural language.
 * The draft is loaded into the editor for full review. Nothing is published or activated.
 *
 * Props:
 * - open, onOpenChange
 * - allPets, allThemes: real assets for the AI to reference
 * - onDraftReady: callback when AI draft is generated
 */
export default function WheelAIDialog({ open, onOpenChange, allPets, allThemes, onDraftReady }) {
  const [instructions, setInstructions] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const petList = useMemo(() => allPets.map(p => `- ${p.id} (${p.name}${p.emoji ? ', ' + p.emoji : ''})`).join('\n'), [allPets]);
  const themeList = useMemo(() => allThemes.map(t => `- ${t.id} (${t.name})`).join('\n'), [allThemes]);

  const examples = [
    'Make a Halloween wheel with mostly small XP/coin rewards and a few existing pets',
    'Create a wheel with 8 prizes: 50% XP, 30% coins, and 20% rare pet rewards',
    'Design a winter holiday wheel with festive prizes and one legendary pet',
  ];

  const generate = async () => {
    if (!instructions.trim()) {
      toast.error('Please describe the wheel you want');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const prompt = `You are helping an admin create a spin wheel for a gamified learning app called 1Planner.

Available pets (use these EXACT IDs — never invent new ones):
${petList}

Available themes (use these EXACT IDs — never invent new ones):
${themeList}

Admin's request: "${instructions.trim()}"

Create a wheel configuration. Rules:
- Only use real asset IDs from the lists above. Never invent IDs.
- For pet prizes: set "value" to the pet ID, and "label" to the pet name.
- For theme prizes: set "value" to the theme ID, and "label" to the theme name.
- For xp/coins: set "amount" to the quantity, "label" to something like "+50 XP".
- For title prizes: set "value" to the title text.
- Each prize needs: type, label, icon (emoji), and weight (positive number, higher = more likely to win).
- Include a good mix: mostly common rewards (high weight) and a few rare ones (low weight).
- If a requested asset doesn't exist, substitute with XP/coins instead of using a fake ID.
- Give the wheel a fitting name and description.
- Set destination to "both" unless the request specifies daily or bonus.

Return a JSON object with: name, description, destination, prizes array.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            destination: { type: 'string', enum: ['daily', 'bonus', 'both'] },
            prizes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['xp', 'coins', 'pet', 'theme', 'title'] },
                  amount: { type: 'number' },
                  value: { type: 'string' },
                  label: { type: 'string' },
                  icon: { type: 'string' },
                  weight: { type: 'number' },
                },
                required: ['type', 'label', 'weight'],
              },
            },
          },
          required: ['name', 'prizes'],
        },
      });

      // Validate AI output — flag any fake asset IDs
      const draft = result;
      const petIds = new Set(allPets.map(p => p.id));
      const themeIds = new Set(allThemes.map(t => t.id));
      const warnings = [];

      if (draft.prizes) {
        draft.prizes = draft.prizes.map((p, i) => {
          // Validate pet/theme references
          if (p.type === 'pet' && p.value && !petIds.has(p.value)) {
            warnings.push(`Prize ${i + 1}: pet "${p.value}" not found — flagged for selection`);
            return { ...p, value: '', _flagged: 'Missing pet — select one in editor' };
          }
          if (p.type === 'theme' && p.value && !themeIds.has(p.value)) {
            warnings.push(`Prize ${i + 1}: theme "${p.value}" not found — flagged for selection`);
            return { ...p, value: '', _flagged: 'Missing theme — select one in editor' };
          }
          // Ensure icon
          if (!p.icon) p.icon = TYPE_ICONS[p.type] || '🎁';
          // Ensure weight
          if (!p.weight || p.weight <= 0) p.weight = 1;
          return p;
        });
      }

      draft.status = 'draft';
      draft._warnings = warnings;

      if (warnings.length > 0) {
        toast.warning(`Draft created with ${warnings.length} item(s) needing attention`);
      } else {
        toast.success('AI draft created — review and edit before saving');
      }

      onDraftReady?.(draft);
      onOpenChange(false);
      setInstructions('');
    } catch (e) {
      console.error('AI generation failed', e);
      setError('AI generation failed. Please try again or create manually.');
      toast.error('AI generation failed');
    }
    setGenerating(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wand2 className="w-5 h-5 text-purple-400" /> Create Wheel with AI</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-sm text-purple-200">
            <Sparkles className="w-4 h-4 inline mr-1" />
            The AI creates a <strong>draft</strong> you can fully edit. It never publishes, activates, or grants rewards. You review every field before saving.
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Describe the wheel you want</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Make a Halloween wheel with mostly small XP/coin rewards and a few existing pets"
              className="bg-slate-700 border-slate-600 min-h-[80px]"
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium">Examples:</p>
            {examples.map((ex, i) => (
              <button
                key={i}
                onClick={() => setInstructions(ex)}
                className="block w-full text-left text-xs text-slate-400 hover:text-purple-300 bg-slate-700/50 hover:bg-slate-700 rounded px-2 py-1.5 transition-colors"
              >
                "{ex}"
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
            </div>
          )}

          <p className="text-xs text-slate-500">
            The AI uses real pet and theme assets from your app. Any missing assets are flagged for you to select manually.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={generate} disabled={generating || !instructions.trim()} className="bg-purple-600 hover:bg-purple-700">
            {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</> : <><Wand2 className="w-4 h-4 mr-2" /> Generate Draft</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}