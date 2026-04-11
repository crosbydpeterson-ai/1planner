import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const RARITY_COLORS = {
  common: 'border-slate-300 bg-slate-50',
  uncommon: 'border-green-400 bg-green-50',
  rare: 'border-blue-400 bg-blue-50',
  epic: 'border-purple-400 bg-purple-50',
  legendary: 'border-yellow-400 bg-yellow-50'
};

const RARITY_GLOW = {
  common: '',
  uncommon: 'shadow-green-200/50',
  rare: 'shadow-blue-200/50',
  epic: 'shadow-purple-300/60',
  legendary: 'shadow-yellow-300/70'
};

const RARITY_BADGE = {
  common: 'bg-slate-200 text-slate-700',
  uncommon: 'bg-green-100 text-green-700',
  rare: 'bg-blue-100 text-blue-700',
  epic: 'bg-purple-100 text-purple-700',
  legendary: 'bg-yellow-100 text-yellow-800'
};

export default function VendingMachine({ foodItems, profile, onPurchase }) {
  const [dispensing, setDispensing] = useState(null);
  const [dispensedItem, setDispensedItem] = useState(null);

  const handleBuy = async (item) => {
    if ((profile?.questCoins || 0) < item.price) {
      toast.error('Not enough Quest Coins!');
      return;
    }
    setDispensing(item.id);
    setDispensedItem(null);

    // Simulate vending animation
    await new Promise(r => setTimeout(r, 1200));
    
    const success = await onPurchase(item);
    if (success) {
      setDispensedItem(item);
    }
    setDispensing(null);
  };

  return (
    <div className="relative">
      {/* Machine Frame */}
      <div className="bg-gradient-to-b from-orange-600 via-orange-700 to-orange-900 rounded-3xl p-1.5 shadow-2xl">
        <div className="bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-[20px] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 p-3 text-center">
            <h2 className="text-slate-900 font-black text-xl tracking-wider uppercase">
              🍽️ Pet Food Machine
            </h2>
            <p className="text-slate-800/70 text-xs font-bold">Insert Quest Coins • Get Food!</p>
          </div>

          {/* Display Window */}
          <div className="p-4">
            <div className="bg-slate-950/80 rounded-2xl p-4 border-2 border-slate-600/50 min-h-[280px]">
              {foodItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                  <span className="text-5xl mb-3">🍽️</span>
                  <p className="font-semibold">Machine Empty!</p>
                  <p className="text-xs mt-1">Check back later for new food.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {foodItems.map((item, idx) => {
                    const isDispensing = dispensing === item.id;
                    const canAfford = (profile?.questCoins || 0) >= item.price;
                    
                    return (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.06 }}
                      >
                        <motion.button
                          onClick={() => handleBuy(item)}
                          disabled={isDispensing || dispensing || !canAfford}
                          whileHover={canAfford && !dispensing ? { scale: 1.05, y: -2 } : {}}
                          whileTap={canAfford && !dispensing ? { scale: 0.95 } : {}}
                          className={`w-full rounded-xl border-2 p-2.5 transition-all text-left relative overflow-hidden
                            ${RARITY_COLORS[item.rarity] || RARITY_COLORS.common}
                            ${!canAfford && !isDispensing ? 'opacity-50 grayscale' : ''}
                            ${isDispensing ? 'animate-pulse' : ''}
                            shadow-lg ${RARITY_GLOW[item.rarity] || ''}
                          `}
                        >
                          {/* Item slot code */}
                          <div className="flex flex-col items-center gap-1.5">
                            {item.imageUrl ? (
                              <motion.img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-14 h-14 rounded-lg object-cover"
                                animate={isDispensing ? { y: [0, -10, 60], opacity: [1, 1, 0] } : {}}
                                transition={{ duration: 0.8 }}
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-lg bg-orange-100 flex items-center justify-center text-2xl">
                                🍽️
                              </div>
                            )}
                            <p className="text-xs font-bold text-slate-800 truncate w-full text-center leading-tight">
                              {item.name}
                            </p>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${RARITY_BADGE[item.rarity] || RARITY_BADGE.common}`}>
                              {item.rarity}
                            </span>
                            <div className="flex items-center gap-1 bg-amber-100 rounded-full px-2 py-0.5">
                              <Coins className="w-3 h-3 text-amber-600" />
                              <span className="text-xs font-black text-amber-800">{item.price}</span>
                            </div>
                          </div>

                          {isDispensing && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-xl"
                            >
                              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                            </motion.div>
                          )}
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Dispensed Item Popup */}
          <AnimatePresence>
            {dispensedItem && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="mx-4 mb-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-4 text-white text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ duration: 0.5 }}
                  className="text-4xl mb-2"
                >
                  🎉
                </motion.div>
                <p className="font-bold">You got {dispensedItem.name}!</p>
                <p className="text-green-100 text-xs mt-1">Check your food inventory to feed it to a pet.</p>
                <Button
                  size="sm"
                  onClick={() => setDispensedItem(null)}
                  className="mt-2 bg-white/20 hover:bg-white/30 text-white"
                >
                  Nice!
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Coin Slot */}
          <div className="bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-3 bg-slate-800 rounded-full border border-slate-500" />
              <span className="text-slate-400 text-xs font-bold uppercase">Coin Slot</span>
            </div>
            <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-full">
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="text-amber-300 font-black">{profile?.questCoins || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}