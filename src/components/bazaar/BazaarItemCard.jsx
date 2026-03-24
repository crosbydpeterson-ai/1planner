import React from 'react';
import { motion } from 'framer-motion';
import { Cog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const RARITY_BADGE = {
  common: 'bg-slate-200 text-slate-700',
  uncommon: 'bg-green-200 text-green-800',
  rare: 'bg-blue-200 text-blue-800',
  epic: 'bg-purple-200 text-purple-800',
  legendary: 'bg-amber-200 text-amber-800',
};

const TYPE_EMOJI = {
  pet: '🐾',
  theme: '🎨',
  title: '👑',
  cosmetic: '🎩',
  magic_egg: '🥚',
};

export default function BazaarItemCard({ item, index, canAfford, onPurchase, rarityColors }) {
  const borderClass = rarityColors?.[item.rarity] || 'border-slate-200 bg-white';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`rounded-xl p-4 shadow-lg border-2 ${borderClass} hover:shadow-xl transition-shadow`}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{TYPE_EMOJI[item.itemType] || '⚙️'}</span>
          <div>
            <h3 className="font-bold text-slate-800">{item.name}</h3>
            <Badge className={`${RARITY_BADGE[item.rarity]} text-xs mt-1`}>
              {item.rarity}
            </Badge>
          </div>
        </div>
      </div>

      {item.description && (
        <p className="text-xs text-slate-500 mb-3">{item.description}</p>
      )}

      {item.stockRemaining !== null && item.stockRemaining !== undefined && (
        <p className="text-xs text-amber-600 mb-2">
          Only {item.stockRemaining} left!
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-slate-800">{item.cogwheelPrice}</span>
          <Cog className="w-5 h-5 text-amber-600" />
        </div>
        <Button
          onClick={() => onPurchase(item)}
          disabled={!canAfford}
          size="sm"
          className="bg-amber-600 hover:bg-amber-700"
        >
          Buy
        </Button>
      </div>
    </motion.div>
  );
}