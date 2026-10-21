import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { PETS } from '@/components/quest/PetCatalog';
import { CUSTOM_PET_PREFIX, customPetStorageId, isCustomPetId, planRedemption, redeemError } from '@/lib/redeemReward';

export default function RedeemCodeInput({ profile, onRedeemed }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // {success, warning?, message}
  const inFlight = useRef(false);

  // Read the code and the student's profile together, so both sides of the
  // later checks come from the same fresh read.
  const readFresh = async (normalized) => {
    const [codes, profiles] = await Promise.all([
      base44.entities.RedeemCode.filter({ code: normalized }),
      base44.entities.UserProfile.filter({ id: profile.id }),
    ]);
    return { entry: codes[0], me: profiles[0] };
  };

  // Every reason a code must not be consumed. Throws a user-facing error.
  const checkRedeemable = (entry, me) => {
    if (!entry || !entry.isActive) throw redeemError('Code not found or no longer active.');
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) throw redeemError('This code has expired.');

    const usedBy = entry.usedBy || [];
    if (entry.maxUses != null && usedBy.length >= entry.maxUses) {
      throw redeemError('This code has reached its maximum uses.');
    }
    if (usedBy.includes(me.id)) throw redeemError('You have already redeemed this code.');
  };

  // Built-in pets come from the catalog; custom pets live in the database as
  // CustomPet rows and are stored on the profile with their `custom_` prefix.
  const resolvePet = async (rewardType, rewardData) => {
    if (rewardType !== 'pet') return null;
    const petId = typeof rewardData?.petId === 'string' ? rewardData.petId : '';
    if (!petId) return null;

    if (isCustomPetId(petId)) {
      const customId = petId.slice(CUSTOM_PET_PREFIX.length);
      const found = await base44.entities.CustomPet.filter({ id: customId });
      const pet = found[0];
      return pet ? { id: customPetStorageId(customId), name: pet.name, emoji: pet.emoji } : null;
    }

    const pet = PETS.find((p) => p.id === petId);
    return pet ? { id: pet.id, name: pet.name, emoji: pet.emoji } : null;
  };

  const redeem = async () => {
    const normalized = code.trim().toUpperCase();
    if (!normalized || !profile?.id || inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setResult(null);

    let rewardApplied = false;
    let partlyApplied = false;

    try {
      // Fail fast on a dead code before doing anything at all.
      const first = await readFresh(normalized);
      checkRedeemable(first.entry, first.me || profile);

      // Then reload both rows and re-check, so what we act on is what is stored
      // right now — not what was on screen when the button was pressed.
      const { entry, me } = await readFresh(normalized);
      const freshProfile = me || profile;
      checkRedeemable(entry, freshProfile);

      const needsSeasons =
        entry.rewardType === 'onepassplus' && Number(entry.rewardData?.seasons) > 0;
      const seasons = needsSeasons ? await base44.entities.Season.list('-created_date') : [];

      const plan = planRedemption({
        rewardType: entry.rewardType,
        rewardData: entry.rewardData,
        profile: freshProfile,
        seasons,
        resolvedPet: await resolvePet(entry.rewardType, entry.rewardData),
      });

      if (plan.foodItem) {
        const existing = await base44.entities.FoodInventory.filter({
          userProfileId: freshProfile.id,
          itemId: plan.foodItem.itemId,
        });
        if (existing.length > 0) {
          await base44.entities.FoodInventory.update(existing[0].id, {
            quantity: (existing[0].quantity || 0) + plan.foodItem.quantity,
          });
        } else {
          await base44.entities.FoodInventory.create({
            userProfileId: freshProfile.id,
            itemId: plan.foodItem.itemId,
            quantity: plan.foodItem.quantity,
          });
        }
        partlyApplied = true; // the item has landed even if a later step fails
      }

      if (Object.keys(plan.updateData).length > 0) {
        await base44.entities.UserProfile.update(freshProfile.id, plan.updateData);
      }
      rewardApplied = true;
      partlyApplied = false;

      // Mark the code used, from the freshly read list.
      const usedBy = entry.usedBy || [];
      if (usedBy.includes(freshProfile.id)) throw redeemError('You have already redeemed this code.');
      await base44.entities.RedeemCode.update(entry.id, { usedBy: [...usedBy, freshProfile.id] });

      setResult({ success: true, message: plan.message });
      setCode('');
      onRedeemed?.();
    } catch (err) {
      console.error('Redeem failed', err);
      if (err?.userFacing) {
        setResult({ success: false, message: err.message });
      } else if (rewardApplied) {
        setResult({
          success: false,
          warning: true,
          message: 'Your reward was applied, but the code could not be marked as used. Please tell an admin so they can check it.',
        });
      } else if (partlyApplied) {
        setResult({
          success: false,
          warning: true,
          message: 'Part of this reward may have been applied. Please tell an admin before trying this code again.',
        });
      } else {
        setResult({
          success: false,
          message: 'That code could not be redeemed just now. It has not been used — please try again.',
        });
      }
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  };

  const tone = result?.warning
    ? 'bg-amber-50 text-amber-700'
    : result?.success
      ? 'bg-green-50 text-green-700'
      : 'bg-red-50 text-red-700';
  const Icon = result?.warning ? AlertTriangle : result?.success ? CheckCircle2 : AlertCircle;

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
        <div className={`mt-3 flex items-center gap-2 text-sm rounded-xl px-3 py-2 ${tone}`}>
          <Icon className="w-4 h-4 shrink-0" />
          {result.message}
        </div>
      )}
    </div>
  );
}