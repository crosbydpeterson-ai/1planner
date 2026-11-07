import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ScanLine, Plus, Pencil, Hash, UserRoundPlus, Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { MAGIC_CARDS_UPDATED, listCards, updateCard } from '@/lib/magicCards';
import MagicCardFormDialog from '@/components/admin/MagicCardFormDialog';
import { useTeachers } from '@/hooks/useTeachers';

const isTestProfile = (p) => p.rank !== 'admin' && p.rank !== 'super_admin';

export default function MagicCardsPanel({ users = [] }) {
  const { teachers } = useTeachers();
  const [cards, setCards] = useState(() => listCards());
  const [extraProfiles, setExtraProfiles] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [creatingDemo, setCreatingDemo] = useState(false);

  const refresh = () => setCards(listCards());

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

  const profiles = useMemo(
    () => [...users, ...extraProfiles].filter(isTestProfile),
    [users, extraProfiles]
  );

  const profileName = (card) =>
    profiles.find((p) => p.id === card.profileId)?.username || card.profileUsername || 'missing profile';

  const toggleCard = (card, enabled) => {
    updateCard(card.id, { enabled });
    toast.success(enabled ? 'Card enabled' : 'Card disabled');
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
                This browser only
              </Badge>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              A card with no PIN opens its test profile in one scan. Cards are stored in this browser only —
              never in the database — and are separate from regular sign-in.
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

      <div className="bg-slate-800 rounded-2xl border border-slate-700 divide-y divide-slate-700/70">
        {cards.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-60" />
            No magic cards yet. Add one by scanning a barcode or QR code, or typing its number.
          </div>
        ) : (
          cards.map((card) => (
            <div key={card.id} className="p-4 flex items-center gap-3 flex-wrap">
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
                  {!card.enabled && (
                    <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-600">Disabled</Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono tracking-wide mt-1">{card.number}</p>
                <p className="text-xs text-slate-500 mt-0.5">Opens: {profileName(card)}</p>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={!!card.enabled} onCheckedChange={(v) => toggleCard(card, v)} />
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
    </div>
  );
}