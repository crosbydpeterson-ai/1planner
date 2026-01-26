import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Wand2, Loader2, Sparkles, ArrowLeft, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function PetCreator() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [petName, setPetName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('');
  const [rarity, setRarity] = useState('uncommon');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#93c5fd');
  const [accentColor, setAccentColor] = useState('#f59e0b');
  const [bgColor, setBgColor] = useState('#f0f9ff');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    checkAccess();
    base44.analytics.track({ eventName: 'pet_creator_viewed' });

    // Add paste event listener
    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            setImageFile(blob);
            const reader = new FileReader();
            reader.onloadend = () => {
              setImagePreview(reader.result);
            };
            reader.readAsDataURL(blob);
            toast.success('Image pasted! 📋');
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const checkAccess = async () => {
    const profileId = localStorage.getItem('quest_profile_id');
    if (!profileId) {
      navigate(createPageUrl('Home'));
      return;
    }

    try {
      const profiles = await base44.entities.UserProfile.filter({ id: profileId });
      if (profiles.length === 0 || !profiles[0].isPetCreator) {
        toast.error('You do not have Pet Creator access');
        navigate(createPageUrl('Dashboard'));
        return;
      }
      setProfile(profiles[0]);
    } catch (e) {
      navigate(createPageUrl('Dashboard'));
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSavePet = async () => {
    if (!petName.trim()) {
      toast.error('Pet name is required');
      return;
    }
    if (!description.trim()) {
      toast.error('Description is required');
      return;
    }
    if (!emoji.trim() && !imageFile) {
      toast.error('Provide an emoji or upload an image');
      return;
    }

    setSaving(true);

    try {
      let imageUrl = '';
      
      // Upload image if provided
      if (imageFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: imageFile });
        imageUrl = uploadResult.file_url;
      }

      await base44.entities.CustomPet.create({
        name: petName.trim(),
        description: description.trim(),
        emoji: emoji.trim(),
        imageUrl: imageUrl,
        rarity: rarity,
        xpRequired: 999999,
        isGiftOnly: true,
        theme: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent: accentColor,
          bg: bgColor
        }
      });

      toast.success(`🎉 ${petName} created!`, {
        description: 'Pet saved successfully'
      });
      
      // Reset form
      setPetName('');
      setDescription('');
      setEmoji('');
      setRarity('uncommon');
      setPrimaryColor('#3b82f6');
      setSecondaryColor('#93c5fd');
      setAccentColor('#f59e0b');
      setBgColor('#f0f9ff');
      setImageFile(null);
      setImagePreview(null);
    } catch (e) {
      toast.error('Failed to save pet');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Pet Creator</h1>
              <p className="text-sm text-slate-500">Create magical creatures!</p>
            </div>
          </div>
        </motion.div>

        {/* Creator Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/40 space-y-4"
        >
          <div className="text-center mb-4">
            <span className="text-5xl">🥚✨</span>
          </div>

          {/* Pet Name */}
          <div className="space-y-2">
            <Label>Pet Name</Label>
            <Input
              value={petName}
              onChange={(e) => setPetName(e.target.value)}
              placeholder="e.g., Sparkle Dragon"
              className="bg-white/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A fun description of your pet..."
              className="min-h-[80px] bg-white/50"
            />
          </div>

          {/* Emoji */}
          <div className="space-y-2">
            <Label>Emoji (optional if image provided)</Label>
            <Input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              placeholder="🐉"
              className="bg-white/50"
              maxLength={2}
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Pet Image (optional)</Label>
            <div className="bg-indigo-50 rounded-lg p-3 mb-2">
              <p className="text-xs text-indigo-700">
                💡 <strong>Tip:</strong> Copy an image from Canva and press Ctrl+V (or Cmd+V) to paste it here!
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="bg-white/50"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border-2 border-white" />
              )}
            </div>
          </div>

          {/* Rarity */}
          <div className="space-y-2">
            <Label>Rarity</Label>
            <Select value={rarity} onValueChange={setRarity}>
              <SelectTrigger className="bg-white/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uncommon">Uncommon</SelectItem>
                <SelectItem value="rare">Rare</SelectItem>
                <SelectItem value="epic">Epic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Theme Colors */}
          <div className="space-y-3">
            <Label>Theme Colors</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-slate-500">Primary</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 bg-white/50"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Secondary</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="flex-1 bg-white/50"
                    placeholder="#93c5fd"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Accent</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="flex-1 bg-white/50"
                    placeholder="#f59e0b"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-slate-500">Background</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 bg-white/50"
                    placeholder="#f0f9ff"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          {petName && (
            <div 
              className="rounded-xl p-4 text-center"
              style={{ backgroundColor: bgColor }}
            >
              <div className="text-4xl mb-2">
                {imagePreview ? (
                  <img src={imagePreview} alt={petName} className="w-20 h-20 mx-auto object-cover rounded-lg" />
                ) : (
                  emoji || '🐾'
                )}
              </div>
              <h4 className="font-bold" style={{ color: primaryColor }}>{petName}</h4>
              <div className="flex justify-center gap-1 mt-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: primaryColor }} />
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: secondaryColor }} />
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: accentColor }} />
              </div>
            </div>
          )}

          <Button
            onClick={handleSavePet}
            disabled={saving}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Create Pet
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}