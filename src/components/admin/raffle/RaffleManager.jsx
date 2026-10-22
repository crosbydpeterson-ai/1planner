import React, { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, PartyPopper, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTeachers } from '@/hooks/useTeachers';
import { useSubjects } from '@/hooks/useSubjects';
import { RAFFLE_STATUS, totalPrizeSlots } from '@/lib/raffleLogic';
import { deleteRaffle, listProfiles, listRaffles } from '@/lib/raffleData';
import RaffleEditorDialog from '@/components/admin/raffle/RaffleEditorDialog';
import RaffleDrawPanel from '@/components/admin/raffle/RaffleDrawPanel';

const STATUS_BADGE = {
  [RAFFLE_STATUS.DRAFT]: { label: 'Draft', className: 'bg-slate-500/15 text-slate-300 border-slate-500/40' },
  [RAFFLE_STATUS.READY]: { label: 'Locked — ready to draw', className: 'bg-sky-500/15 text-sky-300 border-sky-500/40' },
  [RAFFLE_STATUS.DRAWING]: { label: 'Drawing', className: 'bg-indigo-500/15 text-indigo-200 border-indigo-500/40' },
  [RAFFLE_STATUS.COMPLETED]: { label: 'Completed', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' },
};

/**
 * Raffle list and entry point. Nothing here draws: drawing lives in the console,
 * which always works from what is actually saved.
 */
export default function RaffleManager({ adminProfile, isSuperAdmin = false }) {
  const [raffles, setRaffles] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [customPets, setCustomPets] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(null);
  const { teachers } = useTeachers();
  const { subjects } = useSubjects();
  const actor = adminProfile?.username || 'admin';

  const reload = useCallback(async () => {
    try {
      setRaffles(await listRaffles());
    } catch (e) {
      console.error(e);
      setRaffles([]);
      toast.error('Could not load raffles');
    }
  }, []);

  useEffect(() => {
    reload();
    (async () => {
      try {
        setProfiles(await listProfiles());
      } catch (e) {
        console.error('Could not load profiles for eligibility', e);
      }
      try {
        setCustomPets(await base44.entities.CustomPet.list('-created_date'));
      } catch (e) {
        console.error('Could not load custom pets', e);
      }
    })();
  }, [reload]);

  const remove = async (raffle) => {
    try {
      await deleteRaffle(raffle.id);
      toast.success('Draft deleted');
      reload();
    } catch (e) {
      console.error(e);
      toast.error('Could not delete this draft');
    }
  };

  if (openId) {
    return (
      <RaffleDrawPanel
        raffleId={openId}
        profiles={profiles}
        customPets={customPets}
        canUsePlus={isSuperAdmin}
        actor={actor}
        onBack={() => setOpenId(null)}
        onChanged={reload}
        onEdit={(raffle) => setEditing({ raffle })}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            <PartyPopper className="w-5 h-5 text-indigo-300" /> Raffles
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Build the raffle as a draft, then lock the entries and draw. Winners are only chosen when you press
            Draw — opening or refreshing this panel never draws.
          </p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 shrink-0" onClick={() => setEditing({ raffle: null })}>
          <Plus className="w-4 h-4 mr-1" /> New raffle
        </Button>
      </div>

      {raffles === null ? (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading raffles…
        </div>
      ) : raffles.length === 0 ? (
        <p className="text-sm text-slate-400">
          No raffles yet. Create a draft, pick the prizes and who is eligible, and it will stay invisible to
          students until you lock it.
        </p>
      ) : (
        <div className="space-y-2">
          {raffles.map((raffle) => {
            const badge = STATUS_BADGE[raffle.status] || STATUS_BADGE[RAFFLE_STATUS.DRAFT];
            return (
              <div
                key={raffle.id}
                className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-white font-semibold truncate">{raffle.title}</h4>
                    <Badge variant="outline" className={badge.className}>
                      {badge.label}
                    </Badge>
                    {raffle.paused && (
                      <Badge variant="outline" className="bg-amber-500/15 text-amber-200 border-amber-500/40">
                        Paused
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-1">
                    {(raffle.participants || []).length} entries • {(raffle.plan || []).length} draw positions •{' '}
                    {totalPrizeSlots(raffle.prizes)} prizes configured
                    {raffle.prizeMode === 'everyone' || raffle.prizeMode === 'everyone_plus'
                      ? ' • everyone wins'
                      : ''}
                  </p>
                  {raffle.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{raffle.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-200"
                    onClick={() => setOpenId(raffle.id)}
                  >
                    Open console
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-300 hover:text-white"
                    onClick={() => setEditing({ raffle })}
                    title={raffle.status === RAFFLE_STATUS.DRAFT ? 'Edit' : 'View / copy'}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {raffle.status === RAFFLE_STATUS.DRAFT && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => remove(raffle)}
                      title="Delete draft"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-xs text-slate-500 border-t border-slate-800 pt-3 space-y-1">
        <p>
          Prizes are delivered through the same code redemption students already use, one hidden one-use code per
          winner, so no second way of granting rewards is introduced.
        </p>
        <p>
          Winner selection and reward delivery are stored separately, so “drawn” and “delivered” can never be
          confused.
        </p>
      </div>

      <RaffleEditorDialog
        open={!!editing}
        raffle={editing?.raffle || null}
        onClose={() => setEditing(null)}
        profiles={profiles}
        customPets={customPets}
        teachers={teachers}
        subjects={subjects}
        canUsePlus={isSuperAdmin}
        actor={actor}
        onSaved={() => {
          setEditing(null);
          reload();
        }}
      />
    </div>
  );
}