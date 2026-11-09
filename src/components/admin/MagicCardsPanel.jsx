import React, { useEffect, useMemo, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScanLine, Plus, Pencil, Hash, UserRoundPlus, Loader2, CreditCard, Shield, Palette, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { MAGIC_CARDS_UPDATED, listCards, updateCard } from '@/lib/magicCards';
import { cardRewardLabel } from '@/lib/magicCardReward';
import MagicCardFormDialog from '@/components/admin/MagicCardFormDialog';
import CardStudioDialog from '@/components/admin/magicstudio/CardStudioDialog';
import CardPrintSheet from '@/components/admin/magicstudio/CardPrintSheet';
import { normalizeDesign } from '@/lib/cardDesigns';
import { Checkbox } from '@/components/ui/checkbox';
import { useTeachers } from '@/hooks/useTeachers';

const isAdminProfile = (p) => p?.rank === 'admin' || p?.rank === 'super_admin';

export default function MagicCardsPanel({ users = [] }) {
  const { teachers } = useTeachers();
  const [cards, setCards] = useState([]);
  const [extraProfiles, setExtraProfiles] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [studioCard, setStudioCard] = useState(null);
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [printItems, setPrintItems] = useState([]);
  const attemptedLookups = useRef(new Set());

  const refresh = async () => {
    try {
      setCards(await listCards());
    } catch (e) {
      console.error('Failed to load magic cards:', e);
    }
  };

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(MAGIC_CARDS_UPDATED, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(MAGIC_CARDS_UPDATED, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  // Any account can be linked — admins included — so every profile is offered once.
  const profiles = useMemo(() => {
    const byId = new Map();
    [...users, ...extraProfiles].forEach((p) => {
      if (p?.id && !byId.has(p.id)) byId.set(p.id, p);
    });
    return [...byId.values()].sort((a, b) =>
      (a.username || '').localeCompare(b.username || '')
    );
  }, [users, extraProfiles]);

  const profileFor = (card) =>
    profiles.find((p) => p.id === card.profileId) || null;

  const profileName = (card) =>
    profileFor(card)?.username || card.profileUsername || 'missing account';

  // A card can point at an account that is missing from the loaded list; fetch it
  // once so the row never claims the account is gone when it is not.
  useEffect(() => {
    const known = new Set(profiles.map((p) => p.id));
    const missing = [...new Set(cards.map((c) => c.profileId))].filter(
      (id) => id && !known.has(id) && !attemptedLookups.current.has(id)
    );
    if (missing.length === 0) return;
    missing.forEach((id) => attemptedLookups.current.add(id));
    let cancelled = false;
    (async () => {
      try {
        const found = await Promise.all(
          missing.map((id) =>
            base44.entities.UserProfile.filter({ id })
              .then((rows) => rows[0] || null)
              .catch(() => null)
          )
        );
        if (!cancelled) {
          const resolved = found.filter(Boolean);
          if (resolved.length) setExtraProfiles((prev) => [...prev, ...resolved]);
        }
      } catch (e) {
        console.error('Failed to load linked accounts:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [cards, profiles]);

  const toggleCard = async (card, enabled) => {
    await updateCard(card.id, { enabled });
    refresh();
    toast.success(enabled ? 'Card enabled' : 'Card disabled');
  };

  // Bulk printing: every ticked card goes onto the same sheets, up to six per
  // page, each keeping its own artwork.
  const allSelected = cards.length > 0 && selectedIds.length === cards.length;

  const toggleSelected = (id) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const printSelected = () => {
    const chosen = cards.filter((card) => selectedIds.includes(card.id));
    setPrintItems(
      chosen.map((card) => ({
        card,
        design: normalizeDesign(card.design),
        name: card.design?.displayName?.trim() || card.nickname || 'Magic Card',
      }))
    );
  };

  // A fake, no-admin test profile so the demo has something to open.
  const createTestProfile = async () => {
    setCreatingDemo(true);
    try {
      const existing = profiles.find((p) => p.username === 'magic-tester');
      if (existing) {
        toast.info('Test profile already exists');
        setCreatingDemo(false);
        return;
      }
      const profile = await base44.entities.UserProfile.create({
        userId: `user_magic_${Date.now()}`,
        username: 'magic-tester',
        mathTeacher: teachers.math[0]?.id || 'demo',
        readingTeacher: teachers.reading[0]?.id || 'demo',
        xp: 120,
        seasonXp: 30,
        questCoins: 45,
        gems: 3,
        rank: 'user',
        hiddenFromLeaderboard: true,
        tutorialCompleted: true,
        unlockedPets: [],
        unlockedThemes: ['default'],
        equippedThemeId: 'default',
        claimedSeasonRewards: [],
        completedAssignments: [],
        unlockedFeatures: [],
      });
      setExtraProfiles((prev) => [...prev, profile]);
      toast.success('Test profile "magic-tester" created');
    } catch (e) {
      console.error('Failed to create test profile:', e);
      toast.error('Could not create the test profile');
    }
    setCreatingDemo(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-white font-bold flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-indigo-400" /> Magic Login
              <Badge variant="outline" className="text-[10px] font-medium text-amber-300 border-amber-500/50 bg-amber-500/10">
                Works on any device
              </Badge>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Link a card to any account — link admins too. A card with no PIN opens its account in one scan.
              Cards are saved here, so any device that scans one sees the same list.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={createTestProfile} disabled={creatingDemo} className="border-slate-600 text-slate-300 hover:bg-slate-700">
              {creatingDemo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserRoundPlus className="w-4 h-4 mr-2" />}
              Test profile
            </Button>
            <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Add card
            </Button>
          </div>
        </div>
      </div>

      {cards.length > 0 && (
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-3 flex items-center justify-between gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <Checkbox
              checked={allSelected}
              onCheckedChange={() => setSelectedIds(allSelected ? [] : cards.map((c) => c.id))}
            />
            Select all
            <span className="text-slate-500">
              · {selectedIds.length} of {cards.length} selected
            </span>
          </label>
          <Button
            size="sm"
            onClick={printSelected}
            disabled={selectedIds.length === 0}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Printer className="w-4 h-4 mr-2" />
            {selectedIds.length > 0
              ? `Print ${selectedIds.length} card${selectedIds.length === 1 ? '' : 's'}`
              : 'Print cards'}
          </Button>
        </div>
      )}

      <div className="bg-slate-800 rounded-2xl border border-slate-700 divide-y divide-slate-700/70">
        {cards.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-60" />
            No magic cards yet. Add one by scanning a barcode or QR code, or typing its number.
          </div>
        ) : (
          cards.map((card) => (
            <div key={card.id} className="p-4 flex items-center gap-3 flex-wrap">
              <Checkbox
                checked={selectedIds.includes(card.id)}
                onCheckedChange={() => toggleSelected(card.id)}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold truncate">{card.nickname || 'Untitled card'}</span>
                  {card.pinHash ? (
                    <Badge variant="outline" className="text-[10px] text-purple-300 border-purple-500/50 bg-purple-500/10">
                      <Hash className="w-3 h-3 mr-1" /> PIN set
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] text-emerald-300 border-emerald-500/50 bg-emerald-500/10">
                      No PIN
                    </Badge>
                  )}
                  {card.reward?.type && (
                    <Badge variant="outline" className="text-[10px] text-amber-300 border-amber-500/50 bg-amber-500/10">
                      🎁 {cardRewardLabel(card.reward)}
                    </Badge>
                  )}
                  {!card.enabled && (
                    <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-600">Disabled</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono tracking-wide mt-1">{card.number}</p>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  Opens: {profileName(card)}
                  {isAdminProfile(profileFor(card)) && (
                    <Badge variant="outline" className="text-[10px] text-sky-300 border-sky-500/50 bg-sky-500/10">
                      <Shield className="w-3 h-3 mr-1" /> Admin
                    </Badge>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={!!card.enabled} onCheckedChange={(v) => toggleCard(card, v)} />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStudioCard(card)}
                  className="border-indigo-500/60 text-indigo-200 hover:bg-indigo-500/15"
                >
                  <Palette className="w-4 h-4 mr-1" /> Customize Card
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditing(card); setDialogOpen(true); }}
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Pencil className="w-4 h-4 mr-1" /> Edit
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <MagicCardFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        card={editing}
        profiles={profiles}
        onSaved={() => { refresh(); toast.success(editing ? 'Card updated' : 'Card added'); }}
      />

      <CardStudioDialog
        open={!!studioCard}
        onOpenChange={(v) => { if (!v) setStudioCard(null); }}
        card={studioCard}
        onSaved={refresh}
      />

      <CardPrintSheet
        open={printItems.length > 0}
        onClose={() => setPrintItems([])}
        items={printItems}
      />
    </div>
  );
}