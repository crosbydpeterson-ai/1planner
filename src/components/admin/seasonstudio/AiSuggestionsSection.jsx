import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { REWARD_TYPE_LIST, REWARD_TYPES, makeRewardId } from '@/lib/seasonStudio';

const today = () => new Date().toISOString().slice(0, 10);

/**
 * Optional AI help. It only ever proposes — every suggestion is applied or
 * rejected by hand, nothing is written to a season, no images are generated and
 * no asset IDs are invented (asset slots come back empty for the admin to fill).
 */
export default function AiSuggestionsSection({ draft, onPatch, now }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState([]);

  const generate = async () => {
    if (!prompt.trim()) {
      toast.error('Describe the season you want ideas for');
      return;
    }
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are helping a school event manager plan a 1Pass season for a gamified classroom app.
Today is ${today()}.
Theme idea: "${prompt}"

Propose:
- a short season name (max 4 words)
- a one sentence description
- a start date and end date in YYYY-MM-DD format, inside the next 12 months
- 4 to 6 tiers, each with an XP threshold (start around 150 and grow steadily)
- for each tier one Free reward idea and one 1Pass Plus reward idea. Use ONLY these reward types: ${REWARD_TYPE_LIST.join(', ')}.
  Never invent asset IDs or file names — only suggest a type and a short label.
Do not suggest coin amounts above 500 and do not repeat the same threshold twice.`,
        response_json_schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            startDate: { type: 'string' },
            endDate: { type: 'string' },
            tiers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  xpRequired: { type: 'number' },
                  free: { type: 'object', properties: { type: { type: 'string' }, label: { type: 'string' } } },
                  plus: { type: 'object', properties: { type: { type: 'string' }, label: { type: 'string' } } },
                },
              },
            },
          },
        },
      });

      const next = [];
      if (result?.name) next.push({ key: 'name', field: 'name', title: 'Season name', value: result.name, apply: { name: result.name } });
      if (result?.description) next.push({ key: 'description', field: 'description', title: 'Description', value: result.description, apply: { description: result.description } });
      if (result?.startDate && result?.endDate) {
        next.push({
          key: 'dates',
          field: 'dates',
          title: 'Dates',
          value: `${result.startDate} → ${result.endDate}`,
          apply: { startDate: result.startDate, endDate: result.endDate },
        });
      }
      (result?.tiers || []).forEach((tier, index) => {
        const xp = Number(tier?.xpRequired);
        if (!Number.isFinite(xp) || xp <= 0) return;
        const slot = (idea, lane) => {
          const type = REWARD_TYPE_LIST.includes(idea?.type) ? idea.type : lane === 'plus' ? 'theme' : 'coins';
          const meta = REWARD_TYPES[type];
          return {
            id: makeRewardId(),
            lane,
            type,
            value: type === 'coins' ? '50' : '',
            name: idea?.label || meta.label,
          };
        };
        next.push({
          key: `tier-${index}`,
          field: 'tier',
          title: `Tier ${index + 1} · ${xp} XP`,
          value: `${tier?.free?.label || 'Free reward'} / ${tier?.plus?.label || 'Plus reward'}`,
          apply: { tier: { xpRequired: xp, free: [slot(tier?.free, 'free')], plus: [slot(tier?.plus, 'plus')] } },
          applyTier: true,
        });
      });

      if (next.length === 0) {
        toast.error('No usable suggestions came back — try describing it differently');
      } else {
        setProposals(next);
        toast.success('Suggestions ready — apply or reject each one');
      }
    } catch (e) {
      console.error(e);
      toast.error('Could not get suggestions');
    }
    setLoading(false);
  };

  const apply = (proposal) => {
    if (proposal.applyTier) onPatch({ tiers: [...(draft.tiers || []), proposal.apply.tier] });
    else onPatch(proposal.apply);
    setProposals((list) => list.filter((item) => item.key !== proposal.key));
  };

  const reject = (proposal) => setProposals((list) => list.filter((item) => item.key !== proposal.key));

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
        <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-purple-200">
          <Sparkles className="h-4 w-4" /> Suggest with AI
        </h4>
        <p className="mt-1 text-[11px] text-purple-200/70">
          Ideas only. Nothing is saved until you apply it and save the season yourself, and asset slots always come back empty so you pick real ones.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A cozy winter study festival"
            className="min-w-[220px] flex-1 border-slate-600 bg-slate-900/70 text-white"
          />
          <Button type="button" onClick={generate} disabled={loading} className="bg-gradient-to-r from-purple-600 to-fuchsia-600">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Suggest
          </Button>
        </div>
      </div>

      {proposals.length > 0 && (
        <div className="space-y-2">
          {proposals.map((proposal) => (
            <div key={proposal.key} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{proposal.title}</p>
                <p className="truncate text-sm text-white">{proposal.value}</p>
              </div>
              <div className="flex gap-1">
                <Button type="button" size="sm" onClick={() => apply(proposal)} className="bg-emerald-600 hover:bg-emerald-500">
                  <Check className="mr-1 h-3 w-3" /> Apply
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => reject(proposal)} className="border-slate-600 text-slate-300">
                  <X className="mr-1 h-3 w-3" /> Reject
                </Button>
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setProposals([])}
            className="text-slate-400 hover:text-white"
          >
            Discard all suggestions
          </Button>
        </div>
      )}
    </div>
  );
}