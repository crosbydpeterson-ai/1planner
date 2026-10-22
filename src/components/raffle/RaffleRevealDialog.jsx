import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Sparkles, Ticket } from 'lucide-react';
import PetAvatar from '@/components/quest/PetAvatar';
import { deliveryLabel } from '@/lib/raffleLogic';

const MOTION_KEY = 'raffle_reduce_motion';

const TONE_CLASS = {
  ready: 'bg-emerald-50 text-emerald-700',
  waiting: 'bg-amber-50 text-amber-700',
  attention: 'bg-rose-50 text-rose-700',
};

/**
 * Opens a saved prize with a short ticket animation. Purely presentational:
 * the prize was already chosen and delivered by the draw, so replaying the
 * animation can never hand out a second one.
 */
export default function RaffleRevealDialog({ open, onClose, result }) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [stage, setStage] = useState('closed');
  const timers = useRef([]);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(MOTION_KEY) : null;
    const prefers =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    setReduceMotion(stored === null ? !!prefers : stored === '1');
  }, []);

  const play = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    if (reduceMotion) {
      setStage('open');
      return;
    }
    setStage('closed');
    timers.current.push(setTimeout(() => setStage('opening'), 320));
    timers.current.push(setTimeout(() => setStage('open'), 1100));
  }, [reduceMotion]);

  useEffect(() => {
    if (open) play();
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [open, play]);

  const toggleReduceMotion = (value) => {
    setReduceMotion(value);
    try {
      window.localStorage.setItem(MOTION_KEY, value ? '1' : '0');
    } catch (e) {
      /* private mode — the choice simply does not persist */
    }
  };

  if (!result) return null;

  const delivery = deliveryLabel(result);
  const petId = result.rewardType === 'pet' ? result.rewardData?.petId : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose?.()}>
      <DialogContent className="max-w-md bg-gradient-to-b from-indigo-50 to-white border-indigo-100">
        <DialogHeader>
          <DialogTitle className="text-center text-slate-800">
            {stage === 'open' ? 'Your prize' : 'Opening your ticket…'}
          </DialogTitle>
        </DialogHeader>

        {stage !== 'open' ? (
          <div className="py-8 flex flex-col items-center gap-4">
            <motion.div
              animate={
                stage === 'opening'
                  ? { rotate: [0, -3, 3, 0], scale: [1, 1.04, 1] }
                  : { y: [0, -6, 0] }
              }
              transition={{ duration: stage === 'opening' ? 0.7 : 1.6, repeat: stage === 'opening' ? 0 : Infinity }}
              className="w-56 h-32 rounded-2xl bg-white border-2 border-dashed border-indigo-300 shadow-lg flex items-center justify-center"
            >
              <div className="text-center">
                <Ticket className="w-8 h-8 text-indigo-400 mx-auto" />
                <p className="mt-1 text-xs font-semibold tracking-widest text-indigo-400">YOUR TICKET</p>
              </div>
            </motion.div>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => setStage('open')}>
                Skip animation
              </Button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={reduceMotion ? false : { scale: 0.85, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 20 }}
            className="space-y-4"
          >
            <div className="rounded-2xl bg-white border border-indigo-100 shadow-sm p-5 text-center space-y-2">
              <p className="text-xs uppercase tracking-widest text-indigo-400 flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> {result.raffleTitle || 'Raffle'}
              </p>
              <div className="flex items-center justify-center gap-3">
                {petId ? (
                  <PetAvatar petId={petId} size="lg" />
                ) : (
                  <span className="text-4xl">{result.prizeEmoji || '🎁'}</span>
                )}
                <p className="text-xl font-bold text-slate-800">{result.prizeLabel || 'Prize'}</p>
              </div>
              {Number.isFinite(Number(result.seq)) && (
                <p className="text-xs text-slate-400">
                  Winning ticket #{Number(result.seq) + 1}
                  {result.kind === 'everyone' ? ' • base reward' : ''}
                </p>
              )}
            </div>

            <div className={`text-sm rounded-xl px-3 py-2 text-center font-medium ${TONE_CLASS[delivery.tone] || TONE_CLASS.waiting}`}>
              {delivery.text}
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" className="rounded-xl" onClick={play}>
                <RefreshCw className="w-3.5 h-3.5 mr-1" /> Replay reveal
              </Button>
              <Badge variant="outline" className="border-indigo-200 text-indigo-500">
                Replaying never changes your prize
              </Badge>
            </div>

            <label className="flex items-center justify-between gap-2 text-xs text-slate-500">
              <span>Reduce the ticket animation</span>
              <Input
                type="checkbox"
                checked={reduceMotion}
                onChange={(e) => toggleReduceMotion(e.target.checked)}
                className="w-4 h-4 accent-indigo-500"
              />
            </label>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}