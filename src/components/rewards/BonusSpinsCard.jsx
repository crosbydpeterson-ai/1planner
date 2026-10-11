import React from 'react';
import { Disc3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BonusSpinsCard({ tokens, onUseSpin, disabled = false }) {
  const count = Number(tokens || 0);
  if (count === 0) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-100 flex items-center gap-3">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-amber-50 flex items-center justify-center flex-shrink-0">
        <Disc3 className="w-6 h-6 text-purple-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-slate-800">Bonus spins</div>
        <div className="text-sm text-slate-500">
          {count} bonus spin{count !== 1 ? 's' : ''} available
        </div>
      </div>
      <Button
        variant="outline"
        className="border-purple-200 text-purple-600 hover:bg-purple-50 flex-shrink-0"
        onClick={onUseSpin}
        disabled={disabled}
      >
        Use bonus spin
      </Button>
    </div>
  );
}