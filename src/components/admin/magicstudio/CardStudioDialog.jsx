import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Download, RotateCcw, Save, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateCard } from '@/lib/magicCards';
import { PETS } from '@/components/quest/PetCatalog';
import { normalizeDesign, blankDesign, themeToDesign, getTemplate } from '@/lib/cardDesigns';
import { listCardThemes, deleteCardTheme } from '@/lib/cardThemes';
import { sanitizeCode128 } from '@/lib/code128';
import CardFront from '@/components/admin/magicstudio/CardFront';
import CardBack from '@/components/admin/magicstudio/CardBack';
import TemplateGrid from '@/components/admin/magicstudio/TemplateGrid';
import CardColors from '@/components/admin/magicstudio/CardColors';
import BackColors from '@/components/admin/magicstudio/BackColors';
import CardArtPicker from '@/components/admin/magicstudio/CardArtPicker';
import CardArtGenerator from '@/components/admin/magicstudio/CardArtGenerator';
import CardPrintSheet from '@/components/admin/magicstudio/CardPrintSheet';
import CardCapture from '@/components/admin/magicstudio/CardCapture';
import { downloadCardPdf } from '@/lib/cardPdf';

const loadOwnedPets = async () => {
  const profileId = localStorage.getItem('quest_profile_id');
  if (!profileId) return [];
  const rows = await base44.entities.UserProfile.filter({ id: profileId });
  const ids = rows[0]?.unlockedPets || [];
  if (ids.length === 0) return [];
  const customIds = ids.filter((id) => String(id).startsWith('custom_')).map((id) => String(id).replace('custom_', ''));
  let customs = [];
  if (customIds.length) {
    try {
      customs = await base44.entities.CustomPet.list();
    } catch (e) {
      console.error('Failed to load custom pets:', e);
    }
  }
  return ids
    .map((id) => {
      if (String(id).startsWith('custom_')) {
        const pet = customs.find((p) => p.id === String(id).replace('custom_', ''));
        return pet ? { id, name: pet.name, emoji: pet.emoji || '🐾', imageUrl: pet.imageUrl || '' } : null;
      }
      const pet = PETS.find((p) => p.id === id);
      return pet ? { id, name: pet.name, emoji: pet.emoji, imageUrl: '' } : null;
    })
    .filter(Boolean);
};

export default function CardStudioDialog({ open, onOpenChange, card, onSaved }) {
  const [tab, setTab] = useState('front');
  const [design, setDesign] = useState(blankDesign());
  const [pets, setPets] = useState([]);
  const [themes, setThemes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const captureRef = useRef({});

  useEffect(() => {
    if (!open) return;
    setTab('front');
    setDesign(normalizeDesign(card?.design));
    setPrintOpen(false);
    loadOwnedPets().then(setPets).catch((e) => console.error('Failed to load pets:', e));
    loadThemes();
  }, [open, card]);

  const loadThemes = () =>
    listCardThemes().then(setThemes).catch((e) => console.error('Failed to load card themes:', e));

  const removeTheme = async (theme) => {
    try {
      await deleteCardTheme(theme.id);
      setThemes((list) => list.filter((t) => t.id !== theme.id));
      if (design.themeId === theme.id) setDesign((d) => ({ ...d, themeId: '', themeName: '' }));
      toast.success(`“${theme.name}” removed from your themes`);
    } catch (e) {
      console.error('Failed to delete card theme:', e);
      toast.error('Could not delete that theme');
    }
  };

  const name = design.displayName?.trim() || card?.nickname || 'Magic Card';

  const persist = async (next, message) => {
    setSaving(true);
    try {
      await updateCard(card.id, { design: next });
      toast.success(message);
      onSaved?.();
    } catch (e) {
      console.error('Failed to save card design:', e);
      toast.error('Could not save the design');
    } finally {
      setSaving(false);
    }
  };

  const saveDesign = () => persist(normalizeDesign(design), 'Card design saved');

  const resetDesign = () => {
    const fresh = blankDesign();
    setDesign(fresh);
    persist(fresh, 'Design reset');
  };

  // One PDF holding both sides of the card, already sized for Letter paper.
  const downloadArtwork = async () => {
    setDownloading(true);
    try {
      const slug = name.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
      await downloadCardPdf(captureRef.current, `${slug}-magic-card.pdf`);
    } catch (e) {
      console.error('Card PDF export failed:', e);
      toast.error('Could not build the card PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Magic Card Studio</DialogTitle>
            <DialogDescription>
              Design the card face only. Its number, linked account, PIN and enabled state stay exactly as they are.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 md:grid-cols-[1.05fr_1fr]">
            <div className="space-y-3">
              <div className="inline-flex rounded-xl border border-slate-200 p-1">
                {['front', 'back'].map((side) => (
                  <button
                    key={side}
                    type="button"
                    onClick={() => setTab(side)}
                    className={cn(
                      'px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition',
                      tab === side ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    )}
                  >
                    {side}
                  </button>
                ))}
              </div>

              <div className="flex justify-center rounded-2xl bg-slate-100 p-4">
                {tab === 'front' ? (
                  <CardFront name={name} design={design} scale={0.62} shine />
                ) : (
                  <CardBack number={card?.number || ''} design={design} scale={0.62} />
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)}>
                  <Printer className="w-4 h-4 mr-1" /> Print Card
                </Button>
                <Button variant="outline" size="sm" onClick={downloadArtwork} disabled={downloading}>
                  {downloading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
                  Download Card PDF
                </Button>
              </div>

              <p className="text-[11px] text-slate-500">
                The download is one Letter PDF with both sides — the front on page 1 and the scannable back on page 2 —
                so it prints at wallet-card size even when the print dialog is blocked.
              </p>

              {card && sanitizeCode128(card.number) !== String(card.number) && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">
                  This number has characters a barcode can’t hold (like accented letters or emoji). The QR code
                  still carries it in full; the barcode covers only its plain characters. Typing the number always
                  opens the same account.
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Name on card</p>
                <Input
                  value={design.displayName}
                  onChange={(e) => setDesign({ ...design, displayName: e.target.value })}
                  placeholder={card?.nickname || 'Magic Card'}
                  className="h-9"
                />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Theme</p>
                <TemplateGrid
                  design={design}
                  themes={themes}
                  onThemeSaved={loadThemes}
                  onDeleteTheme={removeTheme}
                  onPickBuiltIn={(template) =>
                    setDesign((d) => ({
                      ...d,
                      templateId: template.id,
                      themeId: '',
                      themeName: '',
                      colors: { ...template.colors },
                      textColor: '',
                      backTextColor: '',
                      // A generated background image covers the theme artwork,
                      // so choosing a theme drops it and the theme shows through.
                      backgroundUri: '',
                    }))
                  }
                  onPickTheme={(theme) =>
                    setDesign((d) => ({ ...d, ...themeToDesign(theme), backTextColor: '' }))
                  }
                />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">Colors</p>
                <CardColors colors={design.colors} onChange={(colors) => setDesign({ ...design, colors })} />
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-1.5">
                  Back readability
                </p>
                <BackColors
                  design={design}
                  textFallback={design.textColor || getTemplate(design.templateId).text}
                  onChange={setDesign}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  The QR code always prints black on a white square, and the barcode always prints on a white plate,
                  so any bar colour you pick stays scannable.
                </p>
              </div>

              <CardArtPicker design={design} pets={pets} onChange={setDesign} />

              <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Generate background</p>
                <CardArtGenerator onApply={(url) => setDesign((d) => ({ ...d, backgroundUri: url }))} />
                {design.backgroundUri && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-500"
                    onClick={() => setDesign({ ...design, backgroundUri: '' })}
                  >
                    Remove generated background
                  </Button>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <Button onClick={saveDesign} disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  Save Design
                </Button>
                <Button variant="outline" onClick={resetDesign} disabled={saving}>
                  <RotateCcw className="w-4 h-4 mr-1" /> Reset Design
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Offscreen full-size front and back, used for the PDF download */}
      <CardCapture refs={captureRef} items={[{ card, design, name }]} />

      <CardPrintSheet
        open={printOpen}
        onClose={() => setPrintOpen(false)}
        items={[{ card, design, name }]}
      />
    </>
  );
}