import React from 'react';
import { CARD_TEMPLATES, STICKERS, alpha } from '@/lib/cardDesigns';
import CardTemplateArt from '@/components/admin/magicstudio/CardTemplateArt';
import CardColors from '@/components/admin/magicstudio/CardColors';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// The look of a helper card: the same twelve art styles the magic cards use,
// a palette, a sticker and the name printed on the front. Purely visual — the
// number and the allowed actions live elsewhere in the form.
export default function HelperCardDesignFields({ design, onChange }) {
  const patch = (next) => onChange({ ...design, ...next });

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-slate-700">Card look</Label>
        <div className="mt-1 grid grid-cols-3 gap-2 max-h-[250px] overflow-y-auto pr-1">
          {CARD_TEMPLATES.map((template) => {
            const active = !design.themeId && design.templateId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                onClick={() =>
                  patch({
                    templateId: template.id,
                    colors: { ...template.colors },
                    textColor: template.text,
                    backgroundUri: '',
                    themeId: '',
                    themeName: '',
                  })
                }
                className={cn(
                  'rounded-xl border p-1.5 text-left transition',
                  active ? 'border-indigo-400 ring-2 ring-indigo-300 bg-indigo-50/60' : 'border-slate-200 hover:border-slate-300'
                )}
              >
                <div
                  className="relative overflow-hidden rounded-lg"
                  style={{ height: 46, border: `1px solid ${alpha(template.colors.primary, 0.6)}` }}
                >
                  <CardTemplateArt templateId={template.art} colors={template.colors} backgroundUri="" />
                  <span className="absolute inset-0 flex items-center justify-center text-base">{design.sticker || '🛠️'}</span>
                </div>
                <p className="mt-1 truncate text-[10px] font-semibold leading-tight text-slate-800">{template.name}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-slate-700">Colors</Label>
        <div className="mt-1">
          <CardColors colors={design.colors} onChange={(colors) => patch({ colors })} />
        </div>
      </div>

      <div>
        <Label className="text-slate-700">Sticker</Label>
        <div className="mt-1 flex flex-wrap gap-1 max-h-[92px] overflow-y-auto pr-1">
          {STICKERS.map((sticker) => (
            <button
              key={sticker}
              type="button"
              onClick={() => patch({ sticker })}
              className={cn(
                'h-8 w-8 rounded-lg border text-base leading-none transition',
                design.sticker === sticker
                  ? 'border-indigo-400 bg-indigo-50 ring-2 ring-indigo-200'
                  : 'border-slate-200 hover:bg-slate-50'
              )}
            >
              {sticker}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-slate-700">Name on the card</Label>
        <Input
          value={design.displayName || ''}
          onChange={(e) => patch({ displayName: e.target.value })}
          placeholder="Front desk"
          className="mt-1 h-10 rounded-xl"
        />
        <p className="text-[10px] text-slate-500 mt-1">Leave empty to print the card name instead.</p>
      </div>
    </div>
  );
}