import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Megaphone, Gift, Sparkles } from 'lucide-react';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';

export default function AdminLiveEvents({ users, customPets, customThemes, isSuperAdmin }) {
  const [launchingBubble, setLaunchingBubble] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [giftType, setGiftType] = useState('xp');
  const [giftValue, setGiftValue] = useState('50');
  const [giftItemId, setGiftItemId] = useState('');
  const [sendingGift, setSendingGift] = useState(false);

  const handleLaunchBubblePop = async () => {
    setLaunchingBubble(true);
    try {
      const existing = await base44.entities.AdminEvent.filter({ type: 'bubble_pop', isActive: true });
      if (existing.length > 0) {
        await base44.entities.AdminEvent.update(existing[0].id, {
          isActive: true,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        });
      } else {
        await base44.entities.AdminEvent.create({
          name: 'Bubble Pop',
          type: 'bubble_pop',
          isActive: true,
          config: { bubbleCount: 15, eggChance: 10 },
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 5 * 60 * 1000).toISOString()
        });
      }
      toast.success('Bubble Pop launched!');
    } catch (e) {
      toast.error('Failed to launch event');
    }
    setLaunchingBubble(false);
  };

  const handleSendGlobalMessage = async () => {
    if (!globalMessage.trim()) return toast.error('Enter a message');
    setSendingMessage(true);
    try {
      const existing = await base44.entities.AppSetting.filter({ key: 'global_message' });
      const payload = { text: globalMessage.trim(), timestamp: new Date().toISOString(), dismissed: [] };
      if (existing.length > 0) {
        await base44.entities.AppSetting.update(existing[0].id, { value: payload });
      } else {
        await base44.entities.AppSetting.create({ key: 'global_message', value: payload });
      }
      toast.success('Global message sent!');
      setGlobalMessage('');
    } catch (e) {
      toast.error('Failed to send message');
    }
    setSendingMessage(false);
  };

  const handleDismissGlobalMessage = async () => {
    try {
      const existing = await base44.entities.AppSetting.filter({ key: 'global_message' });
      if (existing.length > 0) {
        await base44.entities.AppSetting.update(existing[0].id, { value: { text: '', timestamp: '', dismissed: [] } });
        toast.success('Message cleared');
      }
    } catch (e) {
      toast.error('Failed to clear message');
    }
  };

  const handleGlobalGift = async () => {
    if (users.length === 0) return toast.error('No users loaded');
    setSendingGift(true);
    try {
      const amount = parseInt(giftValue) || 0;
      for (const user of users) {
        if (giftType === 'xp') {
          await base44.entities.UserProfile.update(user.id, { xp: (user.xp || 0) + amount });
        } else if (giftType === 'coins') {
          await base44.entities.UserProfile.update(user.id, { questCoins: (user.questCoins || 0) + amount });
        } else if (giftType === 'pet' && giftItemId) {
          const unlocked = [...(user.unlockedPets || [])];
          if (!unlocked.includes(giftItemId)) unlocked.push(giftItemId);
          await base44.entities.UserProfile.update(user.id, { unlockedPets: unlocked });
        } else if (giftType === 'theme' && giftItemId) {
          const unlocked = [...(user.unlockedThemes || [])];
          if (!unlocked.includes(giftItemId)) unlocked.push(giftItemId);
          await base44.entities.UserProfile.update(user.id, { unlockedThemes: unlocked });
        }
      }
      toast.success(`Gift sent to ${users.length} users!`);
    } catch (e) {
      toast.error('Failed to send gift');
    }
    setSendingGift(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-400" />
        Live Events & Actions
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Launch Bubble Pop */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">🫧 Bubble Pop</h3>
          <p className="text-slate-400 text-sm mb-4">Launch a bubble pop event on everyone's screen.</p>
          <Button
            onClick={handleLaunchBubblePop}
            disabled={launchingBubble}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500"
          >
            {launchingBubble ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Launch Now
          </Button>
        </div>

        {/* Global Message */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Megaphone className="w-4 h-4" /> Global Message
          </h3>
          <Textarea
            value={globalMessage}
            onChange={(e) => setGlobalMessage(e.target.value)}
            placeholder="Message to show all users..."
            className="bg-slate-700 border-slate-600 mb-3"
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSendGlobalMessage}
              disabled={sendingMessage}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500"
              size="sm"
            >
              {sendingMessage ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
              Send
            </Button>
            <Button onClick={handleDismissGlobalMessage} variant="outline" size="sm" className="border-slate-600 text-slate-300">
              Clear
            </Button>
          </div>
        </div>

        {/* Global Gift */}
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Gift className="w-4 h-4" /> Gift All Users
          </h3>
          <div className="space-y-2 mb-3">
            <Select value={giftType} onValueChange={(v) => { setGiftType(v); setGiftItemId(''); }}>
              <SelectTrigger className="bg-slate-700 border-slate-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xp">XP</SelectItem>
                <SelectItem value="coins">Coins</SelectItem>
                <SelectItem value="pet">Pet</SelectItem>
                <SelectItem value="theme">Theme</SelectItem>
              </SelectContent>
            </Select>
            {(giftType === 'xp' || giftType === 'coins') && (
              <Input
                type="number"
                value={giftValue}
                onChange={(e) => setGiftValue(e.target.value)}
                placeholder="Amount"
                className="bg-slate-700 border-slate-600"
              />
            )}
            {giftType === 'pet' && (
              <Select value={giftItemId} onValueChange={setGiftItemId}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Select pet" />
                </SelectTrigger>
                <SelectContent>
                  {PETS.map(p => <SelectItem key={p.id} value={p.id}>{p.emoji} {p.name}</SelectItem>)}
                  {customPets.map(p => <SelectItem key={p.id} value={`custom_${p.id}`}>{p.emoji || '🎁'} {p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {giftType === 'theme' && (
              <Select value={giftItemId} onValueChange={setGiftItemId}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {THEMES.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  {customThemes.map(t => <SelectItem key={t.id} value={`custom_${t.id}`}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </div>
          <Button
            onClick={handleGlobalGift}
            disabled={sendingGift}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
            size="sm"
          >
            {sendingGift ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
            Gift to All ({users.length})
          </Button>
        </div>
      </div>
    </div>
  );
}