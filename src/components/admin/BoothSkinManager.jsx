import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { Image, Sparkles, Trash2, Gift } from 'lucide-react';

export default function BoothSkinManager() {
  const [prompt, setPrompt] = useState('stylized arcade booth banner, neon lights, 1024x512');
  const [loading, setLoading] = useState(false);
  const [skins, setSkins] = useState([]);
  const [showGift, setShowGift] = useState(false);
  const [giftUsername, setGiftUsername] = useState('');
  const [selectedSkin, setSelectedSkin] = useState(null);

  const load = async () => {
    const list = await base44.entities.BoothSkin.list('-created_date');
    setSkins(list);
  };
  useEffect(() => { load(); }, []);

  const genAI = async () => {
    setLoading(true);
    try {
      const { url } = await base44.integrations.Core.GenerateImage({ prompt: `high quality game booth banner, ${prompt}` });
      await base44.entities.BoothSkin.create({ name: `AI Booth ${new Date().toLocaleDateString()}`, description: 'AI generated booth skin', imageUrl: url, source: 'ai', rarity: 'rare', isTradable: true, isActive: true });
      await load();
    } finally {
      setLoading(false);
    }
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      await base44.entities.BoothSkin.create({ name: file.name.replace(/\.[^.]+$/, ''), description: 'Uploaded booth skin', imageUrl: reader.result, source: 'uploaded', rarity: 'uncommon', isTradable: true, isActive: true });
      await load();
    };
    reader.readAsDataURL(file);
  };

  const gift = async () => {
    if (!selectedSkin || !giftUsername.trim()) return;
    const users = await base44.entities.UserProfile.list();
    const u = users.find(x => (x.username || '').toLowerCase() === giftUsername.trim().toLowerCase());
    if (!u) return alert('User not found');
    const unlocked = Array.isArray(u.unlockedBoothSkins) ? u.unlockedBoothSkins : [];
    if (!unlocked.includes(selectedSkin.id)) {
      await base44.entities.UserProfile.update(u.id, { unlockedBoothSkins: [...unlocked, selectedSkin.id] });
    }
    setShowGift(false);
    setGiftUsername('');
    setSelectedSkin(null);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-2 mb-3 text-white font-semibold">
          <Sparkles className="w-4 h-4" /> AI / Upload Booth Skins
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter AI prompt" className="bg-slate-700 border-slate-600 text-white" />
          <Button onClick={genAI} disabled={loading} className="bg-purple-600">
            {loading ? 'Generating...' : 'Generate with AI'}
          </Button>
          <div className="flex items-center gap-2">
            <Input type="file" accept="image/*" onChange={upload} className="bg-slate-700 border-slate-600 text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skins.map((s) => (
          <div key={s.id} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
            <div className="aspect-[2/1] w-full rounded-lg overflow-hidden bg-slate-900">
              <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <div className="text-white font-medium">{s.name}</div>
                <div className="text-xs text-slate-400 capitalize">{s.rarity}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-purple-300" onClick={() => { setSelectedSkin(s); setShowGift(true); }}>
                  <Gift className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-300" onClick={async () => { await base44.entities.BoothSkin.delete(s.id); await load(); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {skins.length === 0 && (
          <div className="col-span-full text-center text-slate-400">No booth skins yet</div>
        )}
      </div>

      <Dialog open={showGift} onOpenChange={setShowGift}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Gift Booth Skin</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input value={giftUsername} onChange={(e) => setGiftUsername(e.target.value)} placeholder="Recipient username" className="bg-slate-700 border-slate-600" />
            {selectedSkin && (
              <div className="text-slate-300 text-sm">Skin: {selectedSkin.name}</div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowGift(false)}>Cancel</Button>
            <Button onClick={gift} className="bg-purple-600">Gift</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}