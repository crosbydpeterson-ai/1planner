import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Upload, Wand2, Palette } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { checkContentSafe, SAFE_PROMPT_SUFFIX } from '@/components/community/petmojiModeration';

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

export default function PetConceptDialog({ open, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('');
  const [rarity, setRarity] = useState('uncommon');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#93c5fd');
  const [accentColor, setAccentColor] = useState('#f59e0b');
  const [bgColor, setBgColor] = useState('#f0f9ff');

  const [imageMode, setImageMode] = useState('upload');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [eggs, setEggs] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (open) loadData();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            setImageFile(blob);
            setImageMode('upload');
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(blob);
            toast.success('Image pasted!');
            e.preventDefault();
          }
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [open]);

  const loadData = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) return;
    const profiles = await base44.entities.UserProfile.filter({ id: profileId });
    if (profiles.length > 0) {
      setProfile(profiles[0]);
      const userEggs = await base44.entities.MagicEgg.filter({ userId: profiles[0].userId, isUsed: false });
      setEggs(userEggs);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleAiGenerate = async () => {
    if (eggs.length === 0) { toast.error('You need a Magic Egg for AI image generation!'); return; }
    const text = aiPrompt || description;
    if (!text.trim()) { toast.error('Enter a description for AI to generate'); return; }
    const check = checkContentSafe(text);
    if (!check.safe) { toast.error(check.reason); return; }
    setGenerating(true);
    setAiImageUrl(null);
    const prompt = `Create a beautiful, detailed character art of a pet creature: ${text.trim()}. Style: cute fantasy creature, vibrant colors, detailed illustration, game character art, clean design.${SAFE_PROMPT_SUFFIX}`;
    const result = await base44.integrations.Core.GenerateImage({ prompt });
    setAiImageUrl(result.url);
    setGenerating(false);
  };

  const resetForm = () => {
    setName(''); setDescription(''); setEmoji(''); setRarity('uncommon');
    setPrimaryColor('#3b82f6'); setSecondaryColor('#93c5fd'); setAccentColor('#f59e0b'); setBgColor('#f0f9ff');
    setImageFile(null); setImagePreview(null); setAiPrompt(''); setAiImageUrl(null);
    setImageMode('upload');
  };

  const handleSubmit = async () => {
    if (!name.trim() || !description.trim()) return;
    const nameCheck = checkContentSafe(name);
    if (!nameCheck.safe) { toast.error(nameCheck.reason); return; }
    const descCheck = checkContentSafe(description);
    if (!descCheck.safe) { toast.error(descCheck.reason); return; }

    setSubmitting(true);

    let finalImageUrl = '';
    let imageSource = 'uploaded';

    if (imageMode === 'upload' && imageFile) {
      const uploadResult = await base44.integrations.Core.UploadFile({ file: imageFile });
      finalImageUrl = uploadResult.file_url;
      imageSource = 'uploaded';
    } else if (imageMode === 'ai' && aiImageUrl) {
      finalImageUrl = aiImageUrl;
      imageSource = 'ai_generated';
      if (eggs.length > 0) {
        const egg = eggs[0];
        await base44.entities.MagicEgg.update(egg.id, {
          isUsed: true,
          hatchedByProfileId: profile?.id,
          hatchedByUsername: profile?.username,
        });
        setEggs(eggs.filter(e => e.id !== egg.id));
      }
    }

    await onSubmit({
      name: name.trim(),
      description: description.trim(),
      emoji: emoji.trim(),
      rarity,
      imageUrl: finalImageUrl,
      imageSource,
      theme: { primary: primaryColor, secondary: secondaryColor, accent: accentColor, bg: bgColor },
    });

    resetForm();
    setSubmitting(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="bg-[#2b2d31] border-[#1e1f22] text-[#dbdee1] max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5 text-amber-400" />
            Pet Concept Creator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {/* Name & Description */}
          <div>
            <Label className="text-[#b5bac1] text-xs">Pet Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Crystal Fox" className="bg-[#1e1f22] border-[#3f4147] text-[#dbdee1] mt-1" maxLength={40} />
          </div>
          <div>
            <Label className="text-[#b5bac1] text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe your pet idea..." className="bg-[#1e1f22] border-[#3f4147] text-[#dbdee1] mt-1 min-h-[70px]" maxLength={300} />
            <p className="text-[10px] text-[#6d6f78] mt-1">{description.length}/300</p>
          </div>
          <div>
            <Label className="text-[#b5bac1] text-xs">Emoji (optional)</Label>
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🐉" className="bg-[#1e1f22] border-[#3f4147] text-[#dbdee1] mt-1" maxLength={2} />
          </div>

          {/* Image Mode */}
          <div className="space-y-2">
            <Label className="text-[#b5bac1] text-xs">Pet Image</Label>
            <div className="flex gap-2">
              <Button size="sm" variant={imageMode === 'upload' ? 'default' : 'outline'} onClick={() => setImageMode('upload')}
                className={imageMode === 'upload' ? 'bg-indigo-600' : 'border-[#3f4147] text-[#b5bac1]'}>
                <Upload className="w-3 h-3 mr-1" /> Upload / Paste
              </Button>
              <Button size="sm" variant={imageMode === 'ai' ? 'default' : 'outline'} onClick={() => setImageMode('ai')}
                className={imageMode === 'ai' ? 'bg-purple-600' : 'border-[#3f4147] text-[#b5bac1]'}>
                <Wand2 className="w-3 h-3 mr-1" /> AI Generate
              </Button>
            </div>

            {imageMode === 'upload' && (
              <div className="space-y-2">
                <p className="text-[10px] text-[#949ba4] bg-[#1e1f22] rounded-lg px-3 py-2">💡 Copy an image and press Ctrl+V to paste!</p>
                <Input type="file" accept="image/*" onChange={handleFileChange} className="bg-[#1e1f22] border-[#3f4147] text-[#b5bac1] text-xs" />
                {imagePreview && <img src={imagePreview} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-[#3f4147] mx-auto" />}
              </div>
            )}

            {imageMode === 'ai' && (
              <div className="space-y-2">
                {eggs.length === 0 ? (
                  <p className="text-[10px] text-amber-400 bg-[#1e1f22] rounded-lg px-3 py-2">🥚 You need a Magic Egg to use AI generation. Get one from the shop!</p>
                ) : (
                  <p className="text-[10px] text-purple-300 bg-[#1e1f22] rounded-lg px-3 py-2">🤖 Costs 1 Magic Egg. You have {eggs.length}.</p>
                )}
                <Textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe the pet's look (or leave blank to use description)..." className="bg-[#1e1f22] border-[#3f4147] text-[#dbdee1] min-h-[50px]" />
                <Button onClick={handleAiGenerate} disabled={generating || eggs.length === 0} size="sm" className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                  {generating ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Generating...</> : <><Wand2 className="w-3 h-3 mr-1" />Generate with AI</>}
                </Button>
                {aiImageUrl && (
                  <div className="text-center space-y-1">
                    <img src={aiImageUrl} alt="AI Preview" className="w-20 h-20 object-cover rounded-lg border border-[#3f4147] mx-auto" />
                    <Button size="sm" variant="ghost" onClick={handleAiGenerate} disabled={generating} className="text-[#b5bac1] text-xs">🔄 Regenerate</Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rarity */}
          <div>
            <Label className="text-[#b5bac1] text-xs">Rarity</Label>
            <Select value={rarity} onValueChange={setRarity}>
              <SelectTrigger className="bg-[#1e1f22] border-[#3f4147] text-[#dbdee1] mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {RARITIES.map(r => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Theme Colors */}
          <div className="space-y-2">
            <Label className="text-[#b5bac1] text-xs flex items-center gap-1"><Palette className="w-3 h-3" /> Theme Colors</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Primary', val: primaryColor, set: setPrimaryColor },
                { label: 'Secondary', val: secondaryColor, set: setSecondaryColor },
                { label: 'Accent', val: accentColor, set: setAccentColor },
                { label: 'Background', val: bgColor, set: setBgColor },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <Label className="text-[9px] text-[#6d6f78]">{label}</Label>
                  <div className="flex gap-1">
                    <Input type="color" value={val} onChange={(e) => set(e.target.value)} className="w-8 h-7 p-0.5 bg-transparent border-[#3f4147]" />
                    <Input type="text" value={val} onChange={(e) => set(e.target.value)} className="flex-1 bg-[#1e1f22] border-[#3f4147] text-[#dbdee1] text-[10px] h-7" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {name && (
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: bgColor }}>
              <div className="text-3xl mb-1">
                {(imageMode === 'upload' && imagePreview) ? <img src={imagePreview} alt={name} className="w-16 h-16 mx-auto object-cover rounded-lg" />
                  : (imageMode === 'ai' && aiImageUrl) ? <img src={aiImageUrl} alt={name} className="w-16 h-16 mx-auto object-cover rounded-lg" />
                  : emoji || '🐾'}
              </div>
              <h4 className="font-bold text-sm" style={{ color: primaryColor }}>{name}</h4>
              <div className="flex justify-center gap-1 mt-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: primaryColor }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: secondaryColor }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accentColor }} />
              </div>
            </div>
          )}

          <p className="text-[10px] text-[#6d6f78]">
            Your pet idea will be posted in the community and sent to admins for review. If approved, it may become a real pet!
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-[#b5bac1]">Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim() || !description.trim()} className="bg-[#5865f2] hover:bg-[#4752c4]">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
            Submit Concept
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}