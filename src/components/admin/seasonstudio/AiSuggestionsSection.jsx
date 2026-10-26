import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { REWARD_TYPE_LIST, REWARD_TYPES, makeRewardId } from '@/lib/seasonStudio';
import { createSeasonRewardAsset } from '@/lib/seasonAiAssets';

const today = () => new Date().toISOString().slice(0, 10);

// Every field one reward idea can carry, so a suggestion comes back rich enough
// to be created for real when the admin approves it.
const IDEA_FIELDS = {
  type: { type: 'string' },
  label: { type: 'string' },
  name: { type: 'string' },
  rarity: { type: 'string' },
  description: { type: 'string' },
  emoji: { type: 'string' },
  amount: { type: 'number' },
  colors: {
    type: 'object',
    properties: {
      primary: { type: 'string' },
      secondary: { type: 'string' },
      accent: { type: 'string' },
      bg: { type: 'string' },
    },
  },
};

/** What applying this idea will really do — shown before the admin approves it. */
function describeIdea(idea) {
  const icon = REWARD_TYPES[idea?.type]?.icon || '🎁';
  const label = idea?.name || idea?.label || REWARD_TYPES[idea?.type]?.label || 'Reward';
  if (idea?.type === 'pet') return `${icon} ${label} — AI creates the pet`;
  if (idea?.type === 'theme') return `${icon} ${label} — AI creates the theme`;
  if (idea?.type === 'title') return `${icon} “${label}” — title added to the season`;
  if (idea?.type === 'coins') return `${icon} ${idea?.amount || 50} Quest Coins`;
  if (idea?.type === 'song' || idea?.type === 'playlist') return `${icon} ${label} — pick a real one in Rewards`;
  if (idea?.type === 'food') return `${icon} ${label} — pick a real one in Rewards`;
  return `${icon} ${label}`;
}

/**
 * Optional AI help for building a season.
 *
 * Suggesting writes nothing. Applying is the approval step and does the work:
 * a title becomes the season's title text, a pet is created for real (artwork
 * and all) and added to the catalogue, a theme is created with a real palette,
 * and a coin tier gets its amount. The season itself is auto-saved by the
 * studio, so applied suggestions are never lost.
 */
export default function AiSuggestionsSection({ draft, onPatch, adminProfile, assets }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [proposals, setProposals] = useState([]);
  const [working, setWorking] = useState(null);

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
- for each tier one Free reward idea and one 1Pass Plus reward idea, using ONLY these reward types: ${REWARD_TYPE_LIST.join(', ')}.

Give every idea a short "label" for the manager, then fill in what its type needs:
- title: the exact title text the student unlocks goes in "name" (2-4 words, title case, no quotes).
- pet: invent a "name", a "rarity", a one sentence visual "description" and one "emoji". The app draws the pet from that description.
- theme: invent a "name", a "rarity" and four hex colours in "colors" that match the season.
- coins: give an "amount" between 25 and 500.
- song, playlist and food rewards are chosen from real assets later, so the label is enough.
Never invent asset IDs or file names. Keep the ideas varied, kid-friendly and school appropriate.`,
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
                  free: { type: 'object', properties: IDEA_FIELDS },
                  plus: { type: 'object', properties: IDEA_FIELDS },
                },
              },
            },
          },
        },
      });

      const idea = (raw, lane) => {
        const type = REWARD_TYPE_LIST.includes(raw?.type) ? raw.type : lane === 'plus' ? 'theme' : 'coins';
        return {
          type,
          label: String(raw?.label || raw?.name || '').trim(),
          name: String(raw?.name || '').trim(),
          rarity: raw?.rarity,
          description: raw?.description,
          emoji: raw?.emoji,
          amount: raw?.amount,
          colors: raw?.colors,
        };
      };

      const next = [];
      if (result?.name) next.push({ key: 'name', title: 'Season name', value: result.name, apply: { name: result.name } });
      if (result?.description) next.push({ key: 'description', title: 'Description', value: result.description, apply: { description: result.description } });
      if (result?.startDate && result?.endDate) {
        next.push({
          key: 'dates',
          title: 'Dates',
          value: `${result.startDate} → ${result.endDate}`,
          apply: { startDate: result.startDate, endDate: result.endDate },
        });
      }
      (result?.tiers || []).forEach((tier, index) => {
        const xp = Number(tier?.xpRequired);
        if (!Number.isFinite(xp) || xp <= 0) return;
        const free = idea(tier?.free, 'free');
        const plus = idea(tier?.plus, 'plus');
        next.push({
          key: `tier-${index}`,
          title: `Tier ${index + 1} · ${xp} XP`,
          value: `${describeIdea(free)}  /  ${describeIdea(plus)}`,
          xpRequired: xp,
          free,
          plus,
        });
      });

      if (next.length === 0) {
        toast.error('No usable suggestions came back — try describing it differently');
      } else {
        setProposals(next);
        toast.success('Suggestions ready — apply the ones you like');
      }
    } catch (e) {
      console.error(e);
      toast.error('Could not get suggestions');
    }
    setLoading(false);
  };

  // One reward slot: creates whatever the idea still needs, then keeps the slot
  // even if that creation failed, so the tier is never lost to one bad asset.
  const buildSlot = async (idea, lane, failed) => {
    const slot = { id: makeRewardId(), lane, type: idea.type, value: '', name: idea.name || idea.label || '' };
    if (!REWARD_TYPES[idea.type]?.needsValue) return { ...slot, name: idea.label || '' };
    try {
      const created = await createSeasonRewardAsset({ idea, lane, adminProfile });
      if (created.registered) assets?.registerAssets?.(created.registered);
      return { ...slot, value: created.value, name: created.name };
    } catch (e) {
      console.error('Could not create the asset for this suggestion', e);
      failed.push(idea.name || idea.label || idea.type);
      return slot;
    }
  };

  const apply = async (proposal) => {
    setWorking(proposal.key);
    const failed = [];
    try {
      const free = await buildSlot(proposal.free, 'free', failed);
      const plus = await buildSlot(proposal.plus, 'plus', failed);
      onPatch({ tiers: [...(draft.tiers || []), { xpRequired: proposal.xpRequired, free: [free], plus: [plus] }] });
      setProposals((list) => list.filter((item) => item.key !== proposal.key));
      if (failed.length) {
        toast.error(`Tier added, but ${failed.join(' and ')} could not be created — pick a real one in Rewards`);
      } else {
        toast.success('Tier added to the season');
      }
    } finally {
      setWorking(null);
    }
  };

  const reject = (proposal) => setProposals((list) => list.filter((item) => item.key !== proposal.key));
  const busy = loading || !!working;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
        <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-purple-200">
          <Sparkles className="h-4 w-4" /> Suggest with AI
        </h4>
        <p className="mt-1 text-[11px] text-purple-200/70">
          Suggesting writes nothing by itself. Applying a tier creates any missing pet or theme for real, fills in the title
          text and the coin amount, and the season saves automatically.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A cozy winter study festival"
            className="min-w-[220px] flex-1 border-slate-600 bg-slate-900/70 text-white"
          />
          <Button type="button" onClick={generate} disabled={busy} className="bg-gradient-to-r from-purple-600 to-fuchsia-600">
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
                <p className="text-sm text-white">{proposal.value}</p>
              </div>
              <div className="flex gap-1">
                <Button type="button" size="sm" onClick={() => apply(proposal)} disabled={busy} className="bg-emerald-600 hover:bg-emerald-500">
                  {working === proposal.key ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Check className="mr-1 h-3 w-3" />}
                  {working === proposal.key ? 'Creating…' : 'Approve'}
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => reject(proposal)} disabled={busy} className="border-slate-600 text-slate-300">
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
            disabled={busy}
            className="text-slate-400 hover:text-white"
          >
            Discard all suggestions
          </Button>
        </div>
      )}
    </div>
  );
}