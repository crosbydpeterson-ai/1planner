import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Crown, ChevronRight } from 'lucide-react';
import { getPetName } from '@/components/quest/petUtils';
import { getPetTheme, PETS } from '@/components/quest/PetCatalog';
import { isCustomId } from '@/lib/widgetAssets';
import { loadPetById } from '@/lib/dashboardData';
import PetAvatar from '@/components/quest/PetAvatar';
import WidgetShell from './WidgetShell';

/**
 * Pet spotlight — the equipped pet, its title and its theme colours.
 *
 * Read-only: viewing never equips anything. Rendering reuses the app's existing
 * PetAvatar (which already handles built-in and custom pets, images and
 * equipped cosmetics), so a custom pet looks exactly as it does elsewhere.
 */
export default function PetSpotlightWidget({ profile }) {
  const petId = profile?.equippedPetId || null;
  const [petRecord, setPetRecord] = useState(null);
  const [loadingPet, setLoadingPet] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!petId || !isCustomId(petId)) {
      setPetRecord(null);
      return () => { cancelled = true; };
    }
    setLoadingPet(true);
    loadPetById(String(petId).replace('custom_', ''))
      .then((record) => { if (!cancelled) setPetRecord(record); })
      .catch(() => { if (!cancelled) setPetRecord(null); })
      .finally(() => { if (!cancelled) setLoadingPet(false); });
    return () => { cancelled = true; };
  }, [petId]);

  const changeLink = (
    <Link
      to="/Rewards"
      className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700 shrink-0"
    >
      {petId ? 'Change' : 'Choose a pet'} <ChevronRight className="w-4 h-4" aria-hidden="true" />
    </Link>
  );

  if (!petId) {
    return (
      <WidgetShell
        icon={Star}
        title="Pet Spotlight"
        action={changeLink}
        empty="Choose a pet"
        emptyHint="Your companion shows up here once you equip one."
      />
    );
  }

  const builtIn = isCustomId(petId) ? null : PETS.find((p) => p.id === petId) || null;
  const displayName = builtIn
    ? builtIn.name
    : loadingPet
      ? 'Loading…'
      : getPetName(petId, petRecord ? { [petRecord.id]: petRecord } : {});
  const themeColors = builtIn?.theme || petRecord?.theme || getPetTheme(petId) || null;

  return (
    <WidgetShell icon={Star} title="Pet Spotlight" action={changeLink}>
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white/40 border border-white/40 p-2 shrink-0">
          <PetAvatar
            petId={petId}
            cosmeticIds={profile?.equippedCosmetics || []}
            cosmeticPositions={profile?.cosmeticPositions || {}}
            size="lg"
          />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-400">Equipped companion</p>
          <p className="font-semibold text-slate-800 truncate">{displayName}</p>
          {profile?.equippedTitle ? (
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium text-amber-700 bg-amber-100/80 border border-amber-200/70 rounded-full px-2 py-0.5">
              <Crown className="w-3 h-3" aria-hidden="true" /> {profile.equippedTitle}
            </span>
          ) : (
            <p className="text-xs text-slate-400 mt-1">No title equipped</p>
          )}
        </div>
      </div>

      {themeColors ? (
        <div className="mt-3 pt-3 border-t border-white/20">
          <p className="text-xs text-slate-400 mb-2">Pet theme</p>
          <div className="flex gap-1">
            {[themeColors.primary, themeColors.secondary, themeColors.accent].filter(Boolean).map((color, i) => (
              <div
                key={`${color}-${i}`}
                className="w-6 h-6 rounded-full shadow-lg ring-1 ring-white/30"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </WidgetShell>
  );
}