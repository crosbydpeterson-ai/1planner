import React, { useState } from 'react';
import { Sparkles, LayoutTemplate, Wand2 } from 'lucide-react';
import { CARD_TEMPLATES } from '@/lib/cardDesigns';
import { cn } from '@/lib/utils';
import ThemeTile from '@/components/admin/magicstudio/ThemeTile';
import CardThemeAI from '@/components/admin/magicstudio/CardThemeAI';

// Theme picker: built-in looks and saved AI themes side by side, each shown as a
// real card front so choosing one is obvious at a glance.
export default function TemplateGrid({ design, themes = [], onPickBuiltIn, onPickTheme, onDeleteTheme, onThemeSaved }) {
  const [tab, setTab] = useState('built-in');
  const [aiOpen, setAiOpen] = useState(false);

  const builtInActive = !design.themeId;
  const customActive = !!design.themeId;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex rounded-xl border border-slate-200 p-0.5">
          <button
            type="button"
            onClick={() => setTab('built-in')}
            className={cn('flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition',
              tab === 'built-in' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}
          >
            <LayoutTemplate className="w-3.5 h-3.5" /> Built-in
          </button>
          <button
            type="button"
            onClick={() => setTab('custom')}
            className={cn('flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg transition',
              tab === 'custom' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100')}
          >
            <Sparkles className="w-3.5 h-3.5" /> My themes
            {themes.length > 0 && (
              <span className="ml-0.5 rounded-full bg-indigo-100 px-1.5 text-[10px] text-indigo-700">{themes.length}</span>
            )}
          </button>
        </div>
        {tab === 'custom' && (
          <button
            type="button"
            onClick={() => setAiOpen((v) => !v)}
            className="flex items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-violet-700"
          >
            <Wand2 className="w-3.5 h-3.5" /> AI theme
          </button>
        )}
      </div>

      {tab === 'built-in' ? (
        <div className="grid grid-cols-3 gap-2 max-h-[290px] overflow-y-auto pr-1">
          {CARD_TEMPLATES.map((template) => (
            <ThemeTile
              key={template.id}
              label={template.name}
              blurb={template.blurb}
              active={builtInActive && design.templateId === template.id}
              design={{
                ...design,
                templateId: template.id,
                colors: template.colors,
                textColor: template.text,
                backgroundUri: '',
                themeId: '',
              }}
              onSelect={() => onPickBuiltIn(template)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {aiOpen && (
            <CardThemeAI
              onSaved={() => {
                setAiOpen(false);
                onThemeSaved?.();
              }}
            />
          )}
          {themes.length === 0 && !aiOpen ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
              <p className="text-xs font-semibold text-slate-700">No saved themes yet</p>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Generate one with AI and it is saved here for every card.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-[290px] overflow-y-auto pr-1">
              {themes.map((theme) => (
                <ThemeTile
                  key={theme.id}
                  label={theme.name}
                  blurb={theme.blurb || 'Saved theme'}
                  active={customActive && design.themeId === theme.id}
                  design={{
                    ...design,
                    templateId: theme.templateId,
                    colors: theme.colors || design.colors,
                    textColor: theme.text || '',
                    backgroundUri: theme.backgroundUri || '',
                    sticker: design.sticker || theme.sticker || '',
                    themeId: theme.id,
                  }}
                  onSelect={() => onPickTheme(theme)}
                  onDelete={() => onDeleteTheme?.(theme)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}