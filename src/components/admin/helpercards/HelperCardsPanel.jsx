import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LifeBuoy, Plus, Printer, History, RefreshCw, PowerOff, Loader2, AlertTriangle, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import {
  HELPER_CARDS_UPDATED,
  listHelperCards,
  disableHelperCard,
  replaceHelperCard,
  maskHelperNumber,
} from '@/lib/helperCards';
import HelperCardFormDialog from './HelperCardFormDialog';
import HelperCardPrintDialog from './HelperCardPrintDialog';
import HelperCardHistoryDialog from './HelperCardHistoryDialog';
import QuickHelpDialog from '@/components/helper/QuickHelpDialog';
import { cardRewardLabel } from '@/lib/magicCardReward';

const ACTION_CHIPS = [
  { key: 'fixXp', label: 'XP' },
  { key: 'grantReward', label: 'Reward' },
  { key: 'giftSong', label: 'Song' },
  { key: 'resetPasscode', label: 'Passcode' },
  { key: 'switchAccount', label: 'Switch' },
];

const CONFIRM_COPY = {
  disable: {
    title: 'Disable this helper card?',
    body: 'It stops working immediately — a scan is refused, and a window already open on a student device can no longer confirm an action.',
  },
  replace: {
    title: 'Replace this helper card?',
    body: 'The current number is retired for good and a new card is created with the same admin and the same allowed actions, ready to print.',
  },
};

export default function HelperCardsPanel({ users = [], currentAdmin }) {
  const [cards, setCards] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [printCard, setPrintCard] = useState(null);
  const [historyCard, setHistoryCard] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const [busyId, setBusyId] = useState('');

  const refresh = async () => {
    try {
      setCards(await listHelperCards());
    } catch (e) {
      console.error('Failed to load helper cards:', e);
    }
  };

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener(HELPER_CARDS_UPDATED, onChange);
    return () => window.removeEventListener(HELPER_CARDS_UPDATED, onChange);
  }, []);

  const runPending = async () => {
    if (!pending) return;
    const { type, card } = pending;
    setBusyId(card.id);
    try {
      if (type === 'disable') {
        await disableHelperCard(card, currentAdmin?.username);
        toast.success('Helper card disabled');
      } else {
        const created = await replaceHelperCard(card, currentAdmin?.username);
        toast.success('Helper card replaced — print the new one');
        setPrintCard(created);
      }
      setPending(null);
    } catch (e) {
      console.error('Helper card update failed:', e);
      toast.error('Could not update the card');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-white font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" /> Helper Cards
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-xl">
              A helper card gives one admin one action at a time on a student's device. Every confirmed action is
              recorded below, and a disabled card cannot confirm anything — even from a window that is already open.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHelpOpen(true)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <LifeBuoy className="w-4 h-4 mr-2" /> Quick Help
            </Button>
            <Button
              size="sm"
              onClick={() => { setEditing(null); setFormOpen(true); }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" /> New card
            </Button>
          </div>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center">
          <CreditCard className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No helper cards yet. Create one, print it, and keep it with an admin.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => (
            <div key={card.id} className="bg-slate-800 rounded-xl border border-slate-700 p-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-white truncate">{card.nickname || 'Helper card'}</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        card.enabled
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-slate-600/20 text-slate-400 border-slate-600'
                      }`}
                    >
                      {card.enabled ? 'active' : 'disabled'}
                    </span>
                    <div className="flex gap-1">
                      {ACTION_CHIPS.filter((chip) => card.actions?.[chip.key]).map((chip) => (
                        <span key={chip.key} className="text-[10px] text-slate-300 bg-slate-700 rounded-full px-2 py-0.5">
                          {chip.label}
                        </span>
                      ))}
                      {card.reward?.type && (
                        <span className="text-[10px] text-amber-200 bg-amber-500/15 border border-amber-500/30 rounded-full px-2 py-0.5">
                          🎁 {cardRewardLabel(card.reward)}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">{maskHelperNumber(card.number)}</p>
                  <p className="text-[11px] text-slate-500">{card.adminUsername || 'unassigned admin'}</p>
                  {!card.enabled && card.disabledAt && (
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Disabled {new Date(card.disabledAt).toLocaleDateString()} by {card.disabledBy || 'admin'}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {busyId === card.id && <Loader2 className="w-4 h-4 animate-spin text-slate-400 mr-1" />}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPrintCard(card)}
                    className="h-8 text-slate-300 hover:text-white hover:bg-slate-700"
                  >
                    <Printer className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setHistoryCard(card)}
                    className="h-8 text-slate-300 hover:text-white hover:bg-slate-700"
                  >
                    <History className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setEditing(card); setFormOpen(true); }}
                    className="h-8 text-slate-300 hover:text-white hover:bg-slate-700"
                  >
                    Edit
                  </Button>
                  {card.enabled && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPending({ type: 'replace', card })}
                        className="h-8 text-slate-300 hover:text-white hover:bg-slate-700"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setPending({ type: 'disable', card })}
                        className="h-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <PowerOff className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <HelperCardFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        card={editing}
        users={users}
        currentAdmin={currentAdmin}
        onSaved={(saved) => {
          setFormOpen(false);
          refresh();
          if (saved) setPrintCard(saved);
        }}
      />

      <HelperCardPrintDialog open={!!printCard} card={printCard} onClose={() => setPrintCard(null)} />

      <HelperCardHistoryDialog open={!!historyCard} card={historyCard} onClose={() => setHistoryCard(null)} />

      <QuickHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />

      <Dialog open={!!pending} onOpenChange={(next) => !next && setPending(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> {CONFIRM_COPY[pending?.type]?.title}
            </DialogTitle>
            <DialogDescription className="text-slate-400">{CONFIRM_COPY[pending?.type]?.body}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setPending(null)}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button onClick={runPending} disabled={!!busyId} className="bg-red-600 hover:bg-red-700">
              {busyId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {pending?.type === 'replace' ? 'Replace card' : 'Disable card'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}