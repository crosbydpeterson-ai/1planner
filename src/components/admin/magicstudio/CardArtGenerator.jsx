import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Sparkles, Check, X } from 'lucide-react';

const EXAMPLE = 'A tiny pixel dragon in a purple arcade';

// Optional AI artwork. Only the typed artwork description is sent — never the
// card number, PIN, barcode or linked account. Runs on click only.
export default function CardArtGenerator({ onApply }) {
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');

  const generate = async () => {
    const description = prompt.trim();
    if (!description) {
      setError('Describe the artwork first.');
      return;
    }
    setBusy(true);
    setError('');
    setPreview('');
    try {
      const res = await base44.integrations.Core.GenerateImage({ prompt: description });
      const url = res?.url || res?.data?.url;
      if (!url) throw new Error('no image returned');
      setPreview(url);
    } catch (e) {
      console.error('Card artwork generation failed:', e);
      setError('Artwork could not be generated. Your current design is unchanged and the templates still work.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={EXAMPLE}
          className="h-9 text-sm"
          onKeyDown={(e) => e.key === 'Enter' && !busy && generate()}
        />
        <Button type="button" size="sm" onClick={generate} disabled={busy} className="h-9 shrink-0 bg-violet-600 hover:bg-violet-700">
          {busy ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
          Generate
        </Button>
      </div>
      {!prompt && (
        <button type="button" onClick={() => setPrompt(EXAMPLE)} className="text-[11px] text-indigo-600 underline">
          Try “{EXAMPLE}”
        </button>
      )}
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

      {preview && (
        <div className="rounded-xl border border-slate-200 p-2 space-y-2">
          <img src={preview} alt="Generated card artwork" className="w-full h-28 object-cover rounded-lg" />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                onApply(preview);
                setPreview('');
              }}
            >
              <Check className="w-4 h-4 mr-1" /> Apply
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setPreview('')}>
              <X className="w-4 h-4 mr-1" /> Discard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}