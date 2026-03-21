import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send, Gift, Megaphone } from 'lucide-react';
import { toast } from 'sonner';
import { PETS } from '@/components/quest/PetCatalog';
import { THEMES } from '@/components/quest/ThemeCatalog';

export default function AdminLiveEvents({ users, customPets, customThemes, isSuperAdmin }) {
  // Bubble Pop
  const [launchingBubble, setLaunchingBubble] = useState(false);
  const [bubbleCount, setBubbleCount] = useState(15);
  const [eggChance, setEggChance] = useState(10);
  const [bubbleName, setBubbleName] = useState('Bubble Pop!');

  // Global Message
  const [sendingMessage, setSendingMessage] = useState(false);
  const [globalMessage, setGlobalMessage] = useState('');
  const [messageTitle, setMessageTitle] = useState('');

  // Global Gift
  const [sendingGift, setSendingGift] = useState(false);
  const [giftType, setGiftType] = useState('xp');
  const [giftValue, setGiftValue] = useState('50');
  const [giftItemId, setGiftItemId] = useState('');

  const launchBubblePop = async () => {
    setLaunchingBubble(true);
    try {
      // Deactivate any existing active events
      const activeEvents = await base44.entities.AdminEvent.filter({ isActive: true });
      for (const evt of activeEvents) {
        await base44.entities.AdminEvent.update(evt.id, { isActive: false });
      }

      // Create a new bubble pop event
      await base44.entities.AdminEvent.create({
        name: bubbleName || 'Bubble Pop!',
        type: 'bubble_pop',
        isActive: true,
        config: { bubbleCount: bubbleCount, eggChance: eggChance },
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString()
      });

      toast.success('Bubble Pop launched! All users will see it.');
    } catch (e) {
      toast.error('Failed to launch event');
    }
    setLaunchingBubble(false);
  };

  const sendGlobalMessage = async () => {
    if (!globalMessage.trim()) {
      toast.error('Enter a message');
      return;
    }
    setSendingMessage(true);
    try {
      const existing = await base44.entities.AppSetting.filter({ key: 'global_message' });
      const payload = {
        key: 'global_message',
        value: {
          title: messageTitle || 'Admin Message',
          body: globalMessage,
          active: true,
          sentAt: new Date().toISOString()
        }
      };
      if (existing.length > 0) {
        await base44.entities.AppSetting.update(existing[0].id, payload);
      } else {
        await base44.entities.AppSetting.create(payload);
      }
      toast.success('Global message sent!');
      setGlobalMessage('');
      setMessageTitle('');
    } catch (e) {
      toast.error('Failed to send message');
    }
    setSendingMessage(false);
  };

  const dismissGlobalMessage = async () => {
    try {
      const existing = await base44.entities.AppSetting.filter({ key: 'global_message' });
      if (existing.length > 0) {
        await base44.entities.AppSetting.update(existing[0].id, {
          value: { ...existing[0].value, active: false }
        });
        toast.success('Global message dismissed');
      }
    } catch (e) {
      toast.error('Failed to dismiss');
    }
  };

  const sendGlobalGift = async () => {
    if (users.length === 0) {
      toast.error('No users loaded');
      return;
    }
    const amount = parseInt(giftValue) || 0;
    if ((giftType === 'xp' || giftType === 'coins') && amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    if ((giftType === 'pet' || giftType === 'theme') && !giftItemId) {
      toast.error('Select an item');
      return;
    }

    setSendingGift(true);
    try {
      let successCount = 0;
      for (const user of users) {
        const updates = {};
        if (giftType === 'xp') {
          updates.xp = (user.xp || 0) + amount;
        } else if (giftType === 'coins') {
          updates.questCoins = (user.questCoins || 0) + amount;
        } else if (giftType === 'pet') {
          const owned = [...(user.unlockedPets || [])];
          if (!owned.includes(giftItemId)) {
            owned.push(giftItemId);
            updates.unlockedPets = owned;
          }
        } else if (giftType === 'theme') {
          const owned = [...(user.unlockedThemes || [])];
          if (!owned.includes(giftItemId)) {
            owned.push(giftItemId);
            updates.unlockedThemes = owned;
          }
        }
        if (Object.keys(updates).length > 0) {
          await base44.entities.UserProfile.update(user.id, updates);
          successCount++;
        }
      }

      // Also send a global message about the gift
      const giftLabel = giftType === 'xp' ? `${amount} XP` :
        giftType === 'coins' ? `${amount} Quest Coins` :
        giftType === 'pet' ? 'a Pet' : 'a Theme';

      const msgExisting = await base44.entities.AppSetting.filter({ key: 'global_message' });
      const msgPayload = {
        key: 'global_message',
        value: {
          title: '🎁 Global Gift!',
          body: `Everyone just received ${giftLabel}! Check your profile.`,
          active: true,
          sentAt: new Date().toISOString()
        }
      };
      if (msgExisting.length > 0) {
        await base44.entities.AppSetting.update(msgExisting[0].id, msgPayload);
      } else {
        await base44.entities.AppSetting.create(msgPayload);
      }

      toast.success(`Gift sent to ${successCount} users!`);
    } catch (e) {
      toast.error('Failed to send global gift');
    }
    setSendingGift(false);
  };

  return (
    <div className="space-y-6">
      {/* Launch Bubble Pop */}
      <div className="bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl p-5 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">🫧</span>
          <div>
            <h3 className="text-lg font-bold text-white">Launch Bubble Pop</h3>
            <p className="text-slate-400 text-sm">One-time popup on everyone's screen</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">Event Name</Label>
            <Input value={bubbleName} onChange={(e) => setBubbleName(e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">Bubble Count</Label>
            <Input type="number" value={bubbleCount} onChange={(e) => setBubbleCount(parseInt(e.target.value) || 15)} className="bg-slate-800/50 border-white/10 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">Egg Chance (%)</Label>
            <Input type="number" value={eggChance} onChange={(e) => setEggChance(parseInt(e.target.value) || 0)} className="bg-slate-800/50 border-white/10 text-white" />
          </div>
        </div>
        <Button onClick={launchBubblePop} disabled={launchingBubble} className="w-full bg-gradient-to-r from-indigo-500 to-purple-500">
          {launchingBubble ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
          Launch Now
        </Button>
      </div>

      {/* Global Message */}
      <div className="bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 rounded-2xl p-5 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Megaphone className="w-8 h-8 text-amber-400" />
          <div>
            <h3 className="text-lg font-bold text-white">Global Message</h3>
            <p className="text-slate-400 text-sm">Send a popup message to all users</p>
          </div>
        </div>
        <div className="space-y-3 mb-3">
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">Title</Label>
            <Input value={messageTitle} onChange={(e) => setMessageTitle(e.target.value)} placeholder="Announcement" className="bg-slate-800/50 border-white/10 text-white" />
          </div>
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">Message</Label>
            <Textarea value={globalMessage} onChange={(e) => setGlobalMessage(e.target.value)} placeholder="Type your message here..." className="bg-slate-800/50 border-white/10 text-white min-h-[80px]" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={sendGlobalMessage} disabled={sendingMessage} className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500">
            {sendingMessage ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Send Message
          </Button>
          <Button onClick={dismissGlobalMessage} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            Dismiss Active
          </Button>
        </div>
      </div>

      {/* Global Gift */}
      <div className="bg-gradient-to-br from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-2xl p-5 border border-white/10">
        <div className="flex items-center gap-3 mb-4">
          <Gift className="w-8 h-8 text-emerald-400" />
          <div>
            <h3 className="text-lg font-bold text-white">Global Gift</h3>
            <p className="text-slate-400 text-sm">Give everyone a gift at once ({users.length} users)</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="space-y-1">
            <Label className="text-slate-300 text-xs">Gift Type</Label>
            <Select value={giftType} onValueChange={(v) => { setGiftType(v); setGiftItemId(''); }}>
              <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="xp">XP</SelectItem>
                <SelectItem value="coins">Quest Coins</SelectItem>
                <SelectItem value="pet">Pet</SelectItem>
                <SelectItem value="theme">Theme</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(giftType === 'xp' || giftType === 'coins') && (
            <div className="space-y-1">
              <Label className="text-slate-300 text-xs">Amount</Label>
              <Input type="number" value={giftValue} onChange={(e) => setGiftValue(e.target.value)} className="bg-slate-800/50 border-white/10 text-white" />
            </div>
          )}

          {giftType === 'pet' && (
            <div className="space-y-1">
              <Label className="text-slate-300 text-xs">Select Pet</Label>
              <Select value={giftItemId} onValueChange={setGiftItemId}>
                <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                  <SelectValue placeholder="Choose pet" />
                </SelectTrigger>
                <SelectContent>
                  {PETS.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.emoji} {p.name}</SelectItem>
                  ))}
                  {customPets.map(p => (
                    <SelectItem key={p.id} value={`custom_${p.id}`}>{p.emoji || '🎁'} {p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {giftType === 'theme' && (
            <div className="space-y-1">
              <Label className="text-slate-300 text-xs">Select Theme</Label>
              <Select value={giftItemId} onValueChange={setGiftItemId}>
                <SelectTrigger className="bg-slate-800/50 border-white/10 text-white">
                  <SelectValue placeholder="Choose theme" />
                </SelectTrigger>
                <SelectContent>
                  {THEMES.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                  {customThemes.map(t => (
                    <SelectItem key={t.id} value={`custom_${t.id}`}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <Button onClick={sendGlobalGift} disabled={sendingGift} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500">
          {sendingGift ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Gift className="w-4 h-4 mr-2" />}
          Gift Everyone
        </Button>
      </div>
    </div>
  );
}