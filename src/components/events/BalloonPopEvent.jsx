import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function BalloonPopEvent({ event, profile, onClose }) {
  const [balloons, setBalloons] = useState([]);
  const [arrows, setArrows] = useState([]);
  const [popped, setPopped] = useState(0);
  const [eggsWon, setEggsWon] = useState(0);

  useEffect(() => {
    const count = event.config?.balloonCount || event.config?.bubbleCount || 12;
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: i,
        x: Math.random() * 80 + 10,
        y: 100 + Math.random() * 30, // start off screen bottom
        size: Math.random() * 36 + 36,
        color: pickColor(),
        popped: false
      });
    }
    setBalloons(arr);
  }, [event]);

  useEffect(() => {
    const t = setInterval(() => {
      setBalloons(prev => prev.map(b => b.popped ? b : { ...b, y: b.y - (0.4 + Math.random() * 0.6) }));
    }, 60);
    return () => clearInterval(t);
  }, []);

  const pickColor = () => {
    const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#a855f7', '#ec4899'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const shootArrowTo = async (balloon) => {
    if (balloon.popped) return;
    const arrowId = Math.random().toString(36).slice(2);
    setArrows(prev => [...prev, { id: arrowId, target: { x: balloon.x, y: balloon.y } }]);

    // after short flight, pop
    setTimeout(async () => {
      setArrows(prev => prev.filter(a => a.id !== arrowId));
      setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, popped: true } : b));
      setPopped(p => p + 1);

      const eggChance = event.config?.eggChance ?? 10;
      const won = Math.random() * 100 < eggChance;
      if (won && profile?.userId) {
        try {
          await base44.entities.MagicEgg.create({ userId: profile.userId });
          setEggsWon(e => e + 1);
          toast.success('🥚 You found a Magic Egg!');
        } catch {}
      }
    }, 400);
  };

  const allPopped = balloons.length > 0 && balloons.every(b => b.popped);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-gradient-to-br from-sky-900/95 via-indigo-900/95 to-fuchsia-900/95">
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-2 border border-white/20">
          <h2 className="text-white font-bold text-lg">🎈 {event.name}</h2>
          <p className="text-white/70 text-sm">Shoot the dart to pop the balloons!</p>
        </div>
        <button onClick={onClose} className="bg-white/10 backdrop-blur-xl rounded-full p-2 border border-white/20 text-white hover:bg-white/20">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl rounded-2xl px-6 py-2 border border-white/20 z-10 text-white flex gap-6">
        <div className="text-center">
          <p className="text-2xl font-bold">{popped}/{balloons.length}</p>
          <p className="text-xs text-white/70">Popped</p>
        </div>
        {eggsWon > 0 && (
          <div className="text-center">
            <p className="text-2xl font-bold">🥚 {eggsWon}</p>
            <p className="text-xs text-white/70">Eggs Won</p>
          </div>
        )}
      </div>

      {/* Balloons */}
      <div className="absolute inset-0 overflow-hidden">
        <AnimatePresence>
          {balloons.map(b => !b.popped && (
            <motion.div
              key={b.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={() => shootArrowTo(b)}
              className="absolute cursor-pointer"
              style={{ left: `${b.x}%`, top: `${b.y}%` }}
            >
              <div className="relative" style={{ width: b.size, height: b.size * 1.3 }}>
                <div className="w-full h-full rounded-full shadow-2xl" style={{ background: b.color }} />
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-0 h-0 border-x-8 border-x-transparent border-t-8" style={{ borderTopColor: b.color }} />
                <div className="absolute inset-2 rounded-full bg-white/30" />
                <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-white/60" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Arrows */}
        <AnimatePresence>
          {arrows.map(a => (
            <motion.div
              key={a.id}
              initial={{ x: '50%', y: '100%', opacity: 0 }}
              animate={{ x: `${a.target.x}%`, y: `${a.target.y}%`, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute text-white"
            >
              <ArrowUp className="w-6 h-6" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Completed message */}
      {allPopped && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
            <p className="text-6xl mb-4">🎉</p>
            <h2 className="text-2xl font-bold text-white mb-2">All Balloons Popped!</h2>
            <button onClick={onClose} className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white font-medium">Close</button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}