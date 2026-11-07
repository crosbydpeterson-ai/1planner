import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Save, RefreshCw } from 'lucide-react';
import CardFront from '@/components/admin/magicstudio/CardFront';
import { createCardTheme } from '@/lib/cardThemes';
import { CARD_TEMPLATE_IDS, getTemplate } from '@/lib/cardDesigns';

// The model must answer with a real art style, or the theme would have no
// artwork to draw. Colours are plain hex so they can be edited afterwards.
const THEME_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', description: 'Two or three words, e.g. Candy Comet' },
    blurb: { type: 'string', description: 'Max six words describing the look' },
    templateId: { type: 'string', enum: CARD_TEMPLATE_IDS, description: 'the base card look to draw the theme on' },
    colors: {
      type: 'object',
      properties: {
        primary: { type: 'string', description: 'hex' },
        secondary: { type: 'string', description: 'hex' },
        accent: { type: 'string', description: 'hex' },
        ink: { type: 'string', description: 'darkest hex, used behind the card' },
      },
      required: ['primary', 'secondary', 'accent', 'ink'],
    },
    text: { type: 'string', description: 'hex text colour that stays readable on the artwork' },
    sticker: { type: 'string', description: 'one emoji that fits the theme' },
    artPrompt: { type: 'string', description: 'one sentence describing background artwork, no text' },
  },
  required: ['name', 'blurb', 'templateId', 'colors', 'text', 'sticker', 'artPrompt'],
};

const AI_PROMPT = (idea) => `You design collectible trading card themes for a kids' learning app.
Create one original theme inspired by: "${idea}".
Pick the base card look from the allowed list that best carries the idea.
Choose a bold, appealing palette: a main colour, a second colour, an accent, and a very dark ink colour.
The text colour must contrast strongly against those colours so a card is always readable.
The art prompt should describe a beautiful wide card background: scene, colours, mood, no lettering.`;

export default function CardThemeAI({ onSaved }) {
  const [idea, setIdea] = useState('');
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    setBusy(true);
    setDraft(null);
    try {
      const theme = await base44.integrations.Core.InvokeLLM({
        prompt: AI_PROMPT(idea.trim() || 'something surprising and fun'),
        response_json_schema: THEME_SCHEMA,
      });
      let backgroundUri = '';
      try {
        const art = await base44.integrations.Core.GenerateImage({
          prompt: `${theme.artPrompt} Wide landscape card background artwork, vibrant, no text, no letters, no logos, no people.`,
        });
        backgroundUri = art?.url || art?.data?.url || '';
      } catch (e) {
        console.error('Theme artwork generation failed:', e);
      }
      setDraft({ ...theme, backgroundUri });
    } catch (e) {
      console.error('Theme generation failed:', e);
      toast.error('The theme could not be generated. Try again with another idea.');
    } finally {
      setBusy(false);
    }
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const profileId = localStorage.getItem('quest_profile_id');
      let createdBy = '';
      if (profileId) {
        const rows = await base44.entities.UserProfile.filter({ id: profileId });
        createdBy = rows[0]?.username || '';
      }
      await createCardTheme({ ...draft, createdBy });
      toast.success(`“${draft.name}” saved to your themes`);
      setDraft(null);
      setIdea('');
      onSaved?.();
    } catch (e) {
      console.error('Failed to save card theme:', e);
      toast.error('Could not save this theme');
    } finally {
      setSaving(false);
    }
  };

  const previewDesign = draft && {
    templateId: getTemplate(draft.templateId).id,
    colors: draft.colors,
    textColor: draft.text,
    backgroundUri: draft.backgroundUri,
    sticker: draft.sticker,
    petId: '',
    petEmoji: '',
    petImageUrl: '',
  };

  return (
    <div className="space-y-2 rounded-xl border border-violet-200 bg-violet-50/50 p-2.5">
      <div className="flex gap-2">
        <Input
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="e.g. underwater arcade, sparkly dragons"
          className="h-9 text-sm bg-white"
          onKeyDown={(e) => e.key === 'Enter' && !busy && generate()}
        />
        <Button
          type="button"
          size="sm"
          onClick={generate}
          disabled={busy}
          className="h-9 shrink-0 bg-violet-600 hover:bg-violet-700"
        >
          {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
          {busy ? 'Designing' : 'Generate'}
        </Button>
      </div>

      {draft && (
        <div className="rounded-xl border border-slate-200 bg-white p-2 space-y-2">
          <div className="flex justify-center">
            <CardFront name={draft.name} design={previewDesign} scale={0.42} shine />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">{draft.name}</p>
            <p className="text-[11px] text-slate-500">{draft.blurb}</p>
            {!draft.backgroundUri && (
              <p className="text-[10px] text-amber-700">Artwork did not come back, so the theme uses its colours and pattern.</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={save} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save theme
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={generate} disabled={busy || saving}>
              <RefreshCw className="w-4 h-4 mr-1" /> Retry
            </Button>
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-500">
        Saved themes appear for every card. Artwork never includes a card number or PIN.
      </p>
    </div>
  );
}