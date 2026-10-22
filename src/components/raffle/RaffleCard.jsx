import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, PartyPopper, Sparkles, Ticket } from 'lucide-react';
import { deliveryLabel, studentRaffleState } from '@/lib/raffleLogic';
import { loadStudentRaffles } from '@/lib/raffleData';
import RaffleRevealDialog from '@/components/raffle/RaffleRevealDialog';

const STATE_COPY = {
  entered: { title: "You're entered", tone: 'bg-indigo-50 text-indigo-600', emoji: '🎟️' },
  waiting: { title: 'The draw is happening', tone: 'bg-sky-50 text-sky-600', emoji: '🎲' },
  paused: { title: 'On hold', tone: 'bg-amber-50 text-amber-700', emoji: '⏸️' },
  none: { title: 'This draw is finished', tone: 'bg-slate-100 text-slate-600', emoji: '🍀' },
  not_entered: { title: 'You joined after entries closed', tone: 'bg-slate-100 text-slate-600', emoji: '🕒' },
  prize: { title: 'You won something!', tone: 'bg-emerald-50 text-emerald-700', emoji: '🎉' },
};

const stateMessage = (state, raffle) => {
  switch (state) {
    case 'entered':
      return `You have one entry${raffle?.status === 'ready' ? ' — the draw has not happened yet.' : '.'}`;
    case 'waiting':
      return 'Winners are being drawn now. Watch this card — it updates when your prize is saved.';
    case 'paused':
      return 'An admin has paused this raffle. Nothing is lost and your entry is still in.';
    case 'none':
      return 'Your name was not drawn this time. Thanks for taking part — there is always the next one!';
    case 'not_entered':
      return 'Entries for this raffle were locked before your account existed, so you were not in this draw.';
    default:
      return '';
  }
};

/**
 * The student-facing raffle card. Reads only — a prize is granted by the draw,
 * never by anything that happens here.
 */
export default function RaffleCard({ profile }) {
  const [data, setData] = useState(null);
  const [openResult, setOpenResult] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  useEffect(() => {
    if (!profile?.id) return;
    let alive = true;
    (async () => {
      try {
        const loaded = await loadStudentRaffles(profile.id);
        if (alive) setData(loaded);
      } catch (e) {
        console.error('Could not load raffles', e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [profile?.id]);

  const cards = useMemo(() => {
    if (!data) return [];
    return data.raffles
      .map((raffle) => ({
        raffle,
        ...studentRaffleState({ raffle, results: data.results, profileId: profile.id }),
      }))
      .filter((entry) => entry.state !== 'hidden');
  }, [data, profile?.id]);

  if (!data || cards.length === 0) return null;

  const featured =
    cards.find((c) => c.state === 'prize') ||
    cards.find((c) => c.state === 'waiting') ||
    cards.find((c) => c.state === 'entered') ||
    cards.find((c) => c.state === 'paused') ||
    cards[0];

  const history = data.results.slice(0, showAllHistory ? 20 : 3);
  const copy = STATE_COPY[featured.state] || STATE_COPY.entered;

  return (
    <div className="mb-6 space-y-3">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {featured.raffle.artworkUrl && (
          <img
            src={featured.raffle.artworkUrl}
            alt={featured.raffle.title}
            className="w-full h-32 object-cover"
          />
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-indigo-400 flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" /> Raffle
              </p>
              <h3 className="text-lg font-bold text-slate-800 truncate">{featured.raffle.title}</h3>
              {featured.raffle.description && (
                <p className="text-sm text-slate-500 mt-1">{featured.raffle.description}</p>
              )}
            </div>
            <Badge variant="outline" className={`${copy.tone} shrink-0 border-transparent`}>
              {copy.emoji} {copy.title}
            </Badge>
          </div>

          {featured.state === 'prize' ? (
            <div className="mt-4 flex items-center justify-between gap-3 bg-emerald-50 rounded-xl p-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl">{featured.prize.prizeEmoji || '🎁'}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate">
                    {featured.prize.prizeLabel || 'Prize'}
                  </p>
                  <p className="text-xs text-slate-500">{deliveryLabel(featured.prize).text}</p>
                </div>
              </div>
              <Button
                className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
                onClick={() => setOpenResult(featured.prize)}
              >
                <PartyPopper className="w-4 h-4 mr-1" /> Open
              </Button>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600">{stateMessage(featured.state, featured.raffle)}</p>
              <Badge variant="outline" className="border-slate-200 text-slate-500 shrink-0">
                {(featured.raffle.participants || []).length} entries
              </Badge>
            </div>
          )}

          {cards.length > 1 && (
            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
              {cards
                .filter((c) => c.raffle.id !== featured.raffle.id)
                .slice(0, 3)
                .map((c) => (
                  <div key={c.raffle.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-slate-600 truncate">{c.raffle.title}</span>
                    <span className="text-xs text-slate-400 shrink-0">
                      {c.state === 'prize' ? (
                        <button
                          type="button"
                          className="text-emerald-600 underline"
                          onClick={() => setOpenResult(c.prize)}
                        >
                          {c.prize.prizeLabel}
                        </button>
                      ) : (
                        (STATE_COPY[c.state] || STATE_COPY.entered).title
                      )}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Gift className="w-4 h-4 text-indigo-400" /> Prize history
            </p>
            {data.results.length > 3 && (
              <button
                type="button"
                className="text-xs text-indigo-500 underline"
                onClick={() => setShowAllHistory((v) => !v)}
              >
                {showAllHistory ? 'Show less' : `Show all (${data.results.length})`}
              </button>
            )}
          </div>
          <div className="mt-2 space-y-2">
            {history.map((result) => (
              <button
                key={result.id}
                type="button"
                onClick={() => setOpenResult(result)}
                className="w-full text-left flex items-center justify-between gap-2 bg-slate-50 hover:bg-slate-100 rounded-xl px-3 py-2"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span>{result.prizeEmoji || '🎁'}</span>
                  <span className="min-w-0">
                    <span className="block text-sm text-slate-700 truncate">
                      {result.prizeLabel || 'Prize'}
                    </span>
                    <span className="block text-xs text-slate-400 truncate">
                      {result.raffleTitle || 'Raffle'} •{' '}
                      {result.selectionSavedAt ? new Date(result.selectionSavedAt).toLocaleDateString() : ''}
                    </span>
                  </span>
                </span>
                <span className="text-xs text-slate-500 shrink-0">{deliveryLabel(result).text}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Tap any prize to see it again — replaying is just for fun and never
            adds a second reward.
          </p>
        </div>
      )}

      <RaffleRevealDialog open={!!openResult} onClose={() => setOpenResult(null)} result={openResult} />
    </div>
  );
}