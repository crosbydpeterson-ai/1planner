import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// prizes: [{ label, type: 'xp'|'coins'|'pet'|'theme'|'title', value?: string|number, amount?: number, weight: number }]
export default function SpinWheel({ prizes = [], onResult, disabled = false }) {
  const [spinning, setSpinning] = useState(false);
  const totalWeight = useMemo(() => prizes.reduce((s, p) => s + Math.max(0, Number(p.weight) || 0), 0), [prizes]);

  const pickPrize = () => {
    const r = Math.random() * totalWeight;
    let sum = 0;
    for (const p of prizes) {
      sum += Math.max(0, Number(p.weight) || 0);
      if (r <= sum) return p;
    }
    return prizes[prizes.length - 1];
  };

  const handleSpin = async () => {
    if (disabled || spinning || prizes.length === 0 || totalWeight <= 0) return;
    setSpinning(true);
    // Simple faux animation delay
    setTimeout(() => {
      const prize = pickPrize();
      onResult && onResult(prize);
      setSpinning(false);
    }, 1500);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-2 mb-3 bg-white/30 backdrop-blur-xl rounded-xl p-3 border border-white/20">
        {prizes.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between bg-white/50 rounded-lg px-3 py-2 text-sm">
            <div className="font-medium text-slate-700 truncate mr-2">{p.label}</div>
            <div className="text-slate-500 text-xs">{p.weight || 0}</div>
          </div>
        ))}
        {prizes.length === 0 && (
          <div className="col-span-2 text-center text-slate-500 text-sm">No prizes configured</div>
        )}
      </div>
      <Button onClick={handleSpin} disabled={disabled || spinning || prizes.length === 0 || totalWeight <= 0} className="w-full bg-purple-600 hover:bg-purple-700">
        {spinning ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Spinning...</>) : 'Spin the Wheel'}
      </Button>
    </div>
  );
}