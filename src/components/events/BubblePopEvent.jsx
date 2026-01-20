import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export default function BubblePopEvent({ event, profile, onClose }) {
  const [bubbles, setBubbles] = useState([]);
  const [poppedCount, setPoppedCount] = useState(0);
  const [eggsWon, setEggsWon] = useState(0);

  useEffect(() => {
    const count = event.config?.bubbleCount || 15;
    const newBubbles = [];
    
    for (let i = 0; i < count; i++) {
      newBubbles.push({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 70 + 15,
        size: Math.random() * 40 + 30,
        color: getRandomColor(),
        delay: Math.random() * 0.5,
        popped: false
      });
    }
    setBubbles(newBubbles);
  }, [event]);

  const getRandomColor = () => {
    const colors = [
      'from-pink-400 to-purple-500',
      'from-blue-400 to-cyan-500',
      'from-green-400 to-emerald-500',
      'from-yellow-400 to-orange-500',
      'from-indigo-400 to-violet-500',
      'from-rose-400 to-pink-500',
      'from-teal-400 to-cyan-500'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handlePop = async (bubble) => {
    if (bubble.popped) return;

    setBubbles(prev => prev.map(b => 
      b.id === bubble.id ? { ...b, popped: true } : b
    ));
    setPoppedCount(prev => prev + 1);

    // 10% chance for magic egg (or custom chance from config)
    const eggChance = event.config?.eggChance || 10;
    const wonEgg = Math.random() * 100 < eggChance;

    if (wonEgg && profile) {
      try {
        await base44.entities.MagicEgg.create({ userId: profile.userId });
        setEggsWon(prev => prev + 1);
        toast.success('🥚 You found a Magic Egg!', {
          description: 'Check your Rewards to hatch it!'
        });
      } catch (e) {
        console.error('Failed to create egg:', e);
      }
    }
  };

  const allPopped = bubbles.length > 0 && bubbles.every(b => b.popped);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-900/95 via-purple-900/95 to-pink-900/95 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl px-4 py-2 border border-white/20">
          <h2 className="text-white font-bold text-lg">🫧 {event.name}</h2>
          <p className="text-white/70 text-sm">Pop the bubbles! 10% chance for Magic Egg</p>
        </div>
        <button
          onClick={onClose}
          className="bg-white/10 backdrop-blur-xl rounded-full p-2 border border-white/20 text-white hover:bg-white/20"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl rounded-2xl px-6 py-2 border border-white/20 z-10">
        <div className="flex items-center gap-6 text-white">
          <div className="text-center">
            <p className="text-2xl font-bold">{poppedCount}/{bubbles.length}</p>
            <p className="text-xs text-white/70">Popped</p>
          </div>
          {eggsWon > 0 && (
            <div className="text-center">
              <p className="text-2xl font-bold">🥚 {eggsWon}</p>
              <p className="text-xs text-white/70">Eggs Won!</p>
            </div>
          )}
        </div>
      </div>

      {/* Bubbles */}
      <AnimatePresence>
        {bubbles.map((bubble) => !bubble.popped && (
          <motion.div
            key={bubble.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: 1, 
              opacity: 1,
              y: [0, -10, 0, 10, 0]
            }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ 
              delay: bubble.delay,
              y: { repeat: Infinity, duration: 2 + Math.random() }
            }}
            onClick={() => handlePop(bubble)}
            className={`absolute cursor-pointer rounded-full bg-gradient-to-br ${bubble.color} shadow-2xl`}
            style={{
              left: `${bubble.x}%`,
              top: `${bubble.y}%`,
              width: bubble.size,
              height: bubble.size
            }}
          >
            <div className="absolute inset-2 rounded-full bg-white/30" />
            <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-white/60" />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* All popped message */}
      {allPopped && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 text-center">
            <p className="text-6xl mb-4">🎉</p>
            <h2 className="text-2xl font-bold text-white mb-2">All Done!</h2>
            <p className="text-white/70 mb-2">You popped all {bubbles.length} bubbles!</p>
            {eggsWon > 0 && (
              <p className="text-amber-300 font-semibold">🥚 You won {eggsWon} Magic Egg{eggsWon > 1 ? 's' : ''}!</p>
            )}
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}