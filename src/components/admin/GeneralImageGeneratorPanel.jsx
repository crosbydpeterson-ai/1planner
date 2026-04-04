import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Image as ImageIcon, Wand2, Download } from 'lucide-react';

export default function GeneralImageGeneratorPanel() {
  const [prompt, setPrompt] = useState('');
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setImageUrl('');

    const fullPrompt = [prompt.trim(), notes.trim()].filter(Boolean).join('. ');
    const result = await base44.integrations.Core.GenerateImage({ prompt: fullPrompt });
    setImageUrl(result?.url || '');
    setGenerating(false);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <ImageIcon className="w-4 h-4 text-cyan-400" />
        <h2 className="text-lg font-semibold text-white">General Image Generator</h2>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4 space-y-4">
          <p className="text-sm text-slate-400">Generate any image from a prompt, not just pets.</p>

          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want..."
            className="bg-slate-700 border-slate-600 text-white"
          />

          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional style notes, colors, mood, composition..."
            className="bg-slate-700 border-slate-600 text-white min-h-[90px]"
          />

          <div className="flex justify-end">
            <Button onClick={handleGenerate} disabled={generating || !prompt.trim()} className="gap-2 bg-cyan-600 hover:bg-cyan-700">
              {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              {generating ? 'Generating...' : 'Generate Image'}
            </Button>
          </div>

          {imageUrl && (
            <div className="space-y-3 pt-2 border-t border-slate-700">
              <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-700">
                <img src={imageUrl} alt="Generated" className="w-full max-h-[420px] object-contain" />
              </div>
              <div className="flex justify-end">
                <a href={imageUrl} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="gap-2 border-slate-600 text-slate-200">
                    <Download className="w-4 h-4" />
                    Open Image
                  </Button>
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}