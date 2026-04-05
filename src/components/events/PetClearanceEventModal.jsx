import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Expandable list of event pets (custom_ prefix = CustomPet ID)
const EVENT_PETS = [
  { id: 'custom_696e37288ff62b308c37e509', name: 'Ad Blocker Pet' }
];

export default function PetClearanceEventModal({ open, onClaim, onClose }) {
  const [phase, setPhase] = useState('ad'); // 'ad' | 'claiming' | 'claimed'
  const [claimedPet] = useState(EVENT_PETS[Math.floor(Math.random() * EVENT_PETS.length)]);

  const handleClaim = async () => {
    setPhase('claiming');
    await new Promise(r => setTimeout(r, 400));
    setPhase('claimed');
    onClaim(claimedPet);
  };

  const handleClose = () => {
    setPhase('ad');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden border-4 border-yellow-400 rounded-2xl shadow-2xl">
        <AnimatePresence mode="wait">
          {phase === 'ad' && (
            <motion.div
              key="ad"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-300 p-6 text-center"
            >
              {/* Fake ad badge */}
              <div className="inline-block bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full mb-3 animate-pulse">
                ⚡ SPONSORED ⚡
              </div>

              <h1 className="text-3xl font-black text-slate-900 leading-tight">
                🎉 PET CLEARANCE EVENT! 🎉
              </h1>
              <p className="text-lg font-bold text-slate-800 mt-2">
                Free pet for 1Planner users!
              </p>
              <p className="text-sm font-semibold text-red-700 bg-white/60 rounded-lg px-3 py-1 mt-1 inline-block">
                ⏰ Limited time! Don't miss out!
              </p>

              <div className="mt-4 text-5xl">🐾</div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4"
              >
                <Button
                  onClick={handleClaim}
                  className="w-full bg-green-500 hover:bg-green-600 text-white text-xl font-black py-6 rounded-xl shadow-lg border-b-4 border-green-700"
                >
                  👆 CLAIM PET 👆
                </Button>
              </motion.div>

              <p className="text-xs text-slate-600 mt-3 italic">
                This is a joke. 1Planner has no ads.
              </p>
            </motion.div>
          )}

          {phase === 'claiming' && (
            <motion.div
              key="claiming"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-gradient-to-br from-yellow-300 via-orange-300 to-pink-300 p-10 text-center"
            >
              <div className="text-5xl animate-bounce">🐾</div>
              <p className="mt-4 font-bold text-slate-800 text-lg">Claiming…</p>
            </motion.div>
          )}

          {phase === 'claimed' && (
            <motion.div
              key="claimed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="text-6xl mb-4"
              >
                🐱
              </motion.div>

              <p className="text-slate-500 italic text-sm">You fell for a fake ad…</p>
              <p className="text-slate-700 font-semibold mt-1">Good news: we don't do those.</p>
              <p className="text-2xl font-black text-emerald-600 mt-3">
                🐾 +Pet unlocked
              </p>
              <p className="text-sm text-slate-500 mt-1">{claimedPet.name} added to your collection!</p>

              <Button onClick={handleClose} className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold">
                Nice, thanks!
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}