import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { PETS } from '@/components/quest/PetCatalog';

export default function RedeemCodeInput({ profile, onRedeemed }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // {success, message, rewardType, rewardData}

  const redeem = async () => {
    if (!code.trim() || !profile?.id) return;
    setLoading(true);
    setResult(null);

    const normalized = code.trim().toUpperCase();

    // Find the code
    const codes = await base44.entities.RedeemCode.filter({ code: normalized });
    const entry = codes[0];

    if (!entry || !entry.isActive) {
      setResult({ success: false, message: 'Code not found or no longer active.' });
      setLoading(false);
      return;
    }

    // Check expiry
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) {
      setResult({ success: false, message: 'This code has expired.' });
      setLoading(false);
      return;
    }

    // Check max uses
    const usedBy = entry.usedBy || [];
    if (entry.maxUses != null && usedBy.length >= entry.maxUses) {
      setResult({ success: false, message: 'This code has reached its maximum uses.' });
      setLoading(false);
      return;
    }

    // Check already redeemed
    if (usedBy.includes(profile.id)) {
      setResult({ success: false, message: 'You have already redeemed this code.' });
      setLoading(false);
      return;
    }

    // Apply reward
    const rd = entry.rewardData || {};
    let updateData = {};
    let successMsg = '';

    if (entry.rewardType === 'pet') {
      const pet = PETS.find(p => p.id === rd.petId);
      if (!pet) { setResult({ success: false, message: 'Invalid reward data.' }); setLoading(false); return; }
      const alreadyOwned = (profile.unlockedPets || []).includes(rd.petId);
      if (alreadyOwned) { setResult({ success: false, message: `You already own ${pet.emoji} ${pet.name}!` }); setLoading(false); return; }
      updateData.unlockedPets = [...(profile.unlockedPets || []), rd.petId];
      successMsg = `You unlocked ${pet.emoji} ${pet.name}!`;

    } else if (entry.rewardType === 'feature_unlock') {
      // Store unlocked features on profile as unlockedFeatures array
      const feat = rd.feature;
      const already = (profile.unlockedFeatures || []).includes(feat);
      if (already) { setResult({ success: false, message: `You already have access to that feature.` }); setLoading(false); return; }
      updateData.unlockedFeatures = [...(profile.unlockedFeatures || []), feat];
      const labels = { games: '🎮 Games', shop: '🛍️ Shop', market: '💰 Market', pets: '🐾 Pets', battlePass: '✨ 1Pass', kitchen: '🍳 Kitchen' };
      successMsg = `You unlocked ${labels[feat] || feat}!`;

    } else if (entry.rewardType === 'xp') {
      updateData.xp = (profile.xp || 0) + (rd.amount || 0);
      successMsg = `You earned +${rd.amount} XP!`;

    } else if (entry.rewardType === 'coins') {
      updateData.questCoins = (profile.questCoins || 0) + (rd.amount || 0);
      successMsg = `You earned +${rd.amount} Quest Coins!`;

    } else if (entry.rewardType === 'food_item') {
      // Grant food item via FoodInventory
      const existing = await base44.entities.FoodInventory.filter({ userProfileId: profile.id, itemId: rd.itemId });
      if (existing.length > 0) {
        await base44.entities.FoodInventory.update(existing[0].id, { quantity: (existing[0].quantity || 0) + (rd.quantity || 1) });
      } else {
        await base44.entities.FoodInventory.create({ userProfileId: profile.id, itemId: rd.itemId, quantity: rd.quantity || 1 });
      }
      successMsg = `You received a food item!`;
    }

    // Save profile changes
    if (Object.keys(updateData).length > 0) {
      await base44.entities.UserProfile.update(profile.id, updateData);
    }

    // Mark code as used
    await base44.entities.RedeemCode.update(entry.id, { usedBy: [...usedBy, profile.id] });

    setResult({ success: true, message: successMsg, rewardType: entry.rewardType });
    setCode('');
    onRedeemed?.();
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Gift className="w-5 h-5 text-indigo-500" />
        <h3 className="font-semibold text-slate-800">Redeem a Code</h3>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Enter code..."
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && redeem()}
          className="uppercase placeholder:normal-case rounded-xl font-mono tracking-wider"
        />
        <Button onClick={redeem} disabled={loading || !code.trim()} className="rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}
        </Button>
      </div>

      {result && (
        <div className={`mt-3 flex items-center gap-2 text-sm rounded-xl px-3 py-2 ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {result.message}
        </div>
      )}
    </div>
  );
}