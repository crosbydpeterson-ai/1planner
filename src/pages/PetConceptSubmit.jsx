import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wand2, Loader2, Sparkles, ArrowLeft, Upload, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { checkContentSafe, SAFE_PROMPT_SUFFIX } from '@/components/community/petmojiModeration';

export default function PetConceptSubmit() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eggs, setEggs] = useState([]);

  // Form
  const [petName, setPetName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('');
  const [rarity, setRarity] = useState('uncommon');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#93c5fd');
  const [accentColor, setAccentColor] = useState('#f59e0b');
  const [bgColor, setBgColor] = useState('#f0f9ff');

  // Image
  const [imageMode, setImageMode] = useState('upload'); // 'upload' or 'ai'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    init();
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
  }, []);

  const init = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) { navigate('/'); return; }
    const profiles = await base44.entities.UserProfile.filter({ id: profileId });
    if (profiles.length === 0) { navigate('/Dashboard'); return; }
    setProfile(profiles[0]);
    const userEggs = await base44.entities.MagicEgg.filter({ userId: profiles[0].userId, isUsed: false });
    setEggs(userEggs);
    setLoading(false);
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

  const handleSubmit = async () => {
    if (!petName.trim()) { toast.error('Pet name is required'); return; }
    if (!description.trim()) { toast.error('Description is required'); return; }

    const nameCheck = checkContentSafe(petName);
    if (!nameCheck.safe) { toast.error(nameCheck.reason); return; }
    const descCheck = checkContentSafe(description);
    if (!descCheck.safe) { toast.error(descCheck.reason); return; }

    let finalImageUrl = '';
    let imageSource = 'uploaded';
    let usedEggId = '';

    setSaving(true);

    if (imageMode === 'upload' && imageFile) {
      const uploadResult = await base44.integrations.Core.UploadFile({ file: imageFile });
      finalImageUrl = uploadResult.file_url;
      imageSource = 'uploaded';
    } else if (imageMode === 'ai' && aiImageUrl) {
      finalImageUrl = aiImageUrl;
      imageSource = 'ai_generated';
      // Consume a magic egg for AI generation
      if (eggs.length > 0) {
        const egg = eggs[0];
        await base44.entities.MagicEgg.update(egg.id, {
          isUsed: true,
          hatchedByProfileId: profile.id,
          hatchedByUsername: profile.username,
        });
        usedEggId = egg.id;
        setEggs(eggs.filter(e => e.id !== egg.id));
      }
    }

    await base44.entities.PetConcept.create({
      name: petName.trim(),
      description: description.trim(),
      imageUrl: finalImageUrl,
      imageSource,
      emoji: emoji.trim(),
      rarity,
      theme: { primary: primaryColor, secondary: secondaryColor, accent: accentColor, bg: bgColor },
      submittedByProfileId: profile.id,
      submittedByUsername: profile.username,
      status: 'pending',
      magicEggId: usedEggId,
    });

    toast.success('Pet concept submitted! An admin will review it soon.');
    setPetName(''); setDescription(''); setEmoji(''); setImageFile(null); setImagePreview(null); setAiPrompt(''); setAiImageUrl(null);
    setSaving(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-lg mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/Dashboard')} className="rounded-xl"><ArrowLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Sparkles className="w-6 h-6 text-white" /></div>
            <div><h1 className="text-xl font-bold text-slate-800">Pet Concept Lab</h1><p className="text-sm text-slate-500">Design a pet &amp; submit for review!</p></div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/40 space-y-5">
          {/* Name & Description */}
          <div className="space-y-2">
            <Label>Pet Name</Label>
            <Input value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="e.g. Sparkle Dragon" className="bg-white/50" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A fun description of your pet..." className="min-h-[80px] bg-white/50" />
          </div>
          <div className="space-y-2">
            <Label>Emoji (optional)</Label>
            <Input value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="🐉" className="bg-white/50" maxLength={2} />
          </div>

          {/* Image Mode Picker */}
          <div className="space-y-3">
            <Label>Pet Image</Label>
            <div className="flex gap-2">
              <Button size="sm" variant={imageMode === 'upload' ? 'default' : 'outline'} onClick={() => setImageMode('upload')}
                className={imageMode === 'upload' ? 'bg-indigo-600' : ''}>
                <Upload className="w-4 h-4 mr-1" /> Upload / Paste
              </Button>
              <Button size="sm" variant={imageMode === 'ai' ? 'default' : 'outline'} onClick={() => setImageMode('ai')}
                className={imageMode === 'ai' ? 'bg-purple-600' : ''}>
                <Wand2 className="w-4 h-4 mr-1" /> AI Generate
              </Button>
            </div>

            {imageMode === 'upload' && (
              <div className="space-y-2">
                <div className="bg-indigo-50 rounded-lg p-3">
                  <p className="text-xs text-indigo-700">💡 <strong>Tip:</strong> Copy an image from Canva and press Ctrl+V to paste it here!</p>
                </div>
                <Input type="file" accept="image/*" onChange={handleFileChange} className="bg-white/50" />
                {imagePreview && <img src={imagePreview} alt="Preview" className="w-24 h-24 object-cover rounded-lg border-2 border-white mx-auto" />}
              </div>
            )}

            {imageMode === 'ai' && (
              <div className="space-y-3">
                {eggs.length === 0 ? (
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-amber-700">🥚 You need a <strong>Magic Egg</strong> to use AI generation. Get one from the shop!</p>
                  </div>
                ) : (
                  <div className="bg-purple-50 rounded-lg p-3">
                    <p className="text-xs text-purple-700">🤖 AI will generate an image based on your description. Costs <strong>1 Magic Egg</strong>. You have <strong>{eggs.length}</strong>.</p>
                  </div>
                )}
                <Textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} placeholder="Describe the pet's look (or leave blank to use description above)..." className="min-h-[60px] bg-white/50" />
                <Button onClick={handleAiGenerate} disabled={generating || eggs.length === 0} className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                  {generating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Wand2 className="w-4 h-4 mr-2" />Generate with AI</>}
                </Button>
                {aiImageUrl && (
                  <div className="text-center space-y-2">
                    <img src={aiImageUrl} alt="AI Preview" className="w-24 h-24 object-cover rounded-lg border-2 border-white mx-auto" />
                    <Button size="sm" variant="outline" onClick={handleAiGenerate} disabled={generating}>🔄 Regenerate</Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rarity */}
          <div className="space-y-2">
            <Label>Rarity</Label>
            <Select value={rarity} onValueChange={setRarity}>
              <SelectTrigger className="bg-white/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="common">Common</SelectItem>
                <SelectItem value="uncommon">Uncommon</SelectItem>
                <SelectItem value="rare">Rare</SelectItem>
                <SelectItem value="epic">Epic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Theme Colors */}
          <div className="space-y-3">
            <Label className="flex items-center gap-1"><Palette className="w-4 h-4" /> Theme Colors</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Primary', val: primaryColor, set: setPrimaryColor },
                { label: 'Secondary', val: secondaryColor, set: setSecondaryColor },
                { label: 'Accent', val: accentColor, set: setAccentColor },
                { label: 'Background', val: bgColor, set: setBgColor },
              ].map(({ label, val, set }) => (
                <div key={label}>
                  <Label className="text-xs text-slate-500">{label}</Label>
                  <div className="flex gap-2">
                    <Input type="color" value={val} onChange={(e) => set(e.target.value)} className="w-10 h-9 p-1" />
                    <Input type="text" value={val} onChange={(e) => set(e.target.value)} className="flex-1 bg-white/50 text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          {petName && (
            <div className="rounded-xl p-4 text-center" style={{ backgroundColor: bgColor }}>
              <div className="text-4xl mb-2">
                {(imageMode === 'upload' && imagePreview) ? <img src={imagePreview} alt={petName} className="w-20 h-20 mx-auto object-cover rounded-lg" />
                  : (imageMode === 'ai' && aiImageUrl) ? <img src={aiImageUrl} alt={petName} className="w-20 h-20 mx-auto object-cover rounded-lg" />
                  : emoji || '🐾'}
              </div>
              <h4 className="font-bold" style={{ color: primaryColor }}>{petName}</h4>
              <div className="flex justify-center gap-1 mt-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: primaryColor }} />
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: secondaryColor }} />
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: accentColor }} />
              </div>
            </div>
          )}

          <Button onClick={handleSubmit} disabled={saving} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : <><Sparkles className="w-4 h-4 mr-2" />Submit Pet Concept</>}
          </Button>
          <p className="text-xs text-slate-500 text-center">Your concept will be reviewed by an admin. If approved, you'll get the pet + theme!</p>
        </motion.div>
      </div>
    </div>
  );
}