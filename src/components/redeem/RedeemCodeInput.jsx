import React, { useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Gift, Loader2, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { PETS } from '@/components/quest/PetCatalog';
import PetAvatar from '@/components/quest/PetAvatar';
import { CUSTOM_PET_PREFIX, customPetStorageId, isCustomPetId, planRedemption, redeemError } from '@/lib/redeemReward';

/**
 * The redemption form itself. `variant="plain"` drops the outer card so it can
 * sit inside a dialog without looking like a card nested in a card.
 */
export default function RedeemCodeInput({
  profile,
  onRedeemed,
  variant = 'card',
  autoFocus = false,
  onBusyChange,
}) {
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
    onBusyChange?.(true);
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

      const resolvedPet = await resolvePet(entry.rewardType, entry.rewardData);
      const plan = planRedemption({
        rewardType: entry.rewardType,
        rewardData: entry.rewardData,
        profile: freshProfile,
        seasons,
        resolvedPet,
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

      // The pet travelled with the plan, so its artwork can be shown without
      // writing anything extra to the profile.
      setResult({
        success: true,
        message: plan.message,
        pet: entry.rewardType === 'pet' ? resolvedPet : null,
      });
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
      onBusyChange?.(false);
    }
  };

  const tone = result?.warning
    ? 'bg-amber-50 text-amber-700'
    : result?.success
      ? 'bg-green-50 text-green-700'
      : 'bg-red-50 text-red-700';
  const Icon = result?.warning ? AlertTriangle : result?.success ? CheckCircle2 : AlertCircle;

  const isPlain = variant === 'plain';

  return (
    <div className={isPlain ? 'space-y-3' : 'bg-white rounded-2xl border border-slate-100 shadow-sm p-5'}>
      {!isPlain && (
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-indigo-500" />
          <h3 className="font-semibold text-slate-800">Redeem a Code</h3>
        </div>
      )}
      {/* A plain text field: codes use letters, digits, underscores and hyphens. */}
      <div className="flex gap-2">
        <Input
          placeholder="Enter code..."
          value={code}
          onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && redeem()}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          aria-label="Reward code"
          className="uppercase placeholder:normal-case rounded-xl font-mono tracking-wider"
        />
        <Button onClick={redeem} disabled={loading || !code.trim()} className="rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}
        </Button>
      </div>

      {result && (
        <div className={`${isPlain ? '' : 'mt-3'} flex items-center gap-3 text-sm rounded-xl px-3 py-2 ${tone}`}>
          {result.pet ? (
            <PetAvatar petId={result.pet.id} size="lg" className="shrink-0" />
          ) : (
            <Icon className="w-4 h-4 shrink-0" />
          )}
          <span className="font-medium">{result.message}</span>
        </div>
      )}
    </div>
  );
}