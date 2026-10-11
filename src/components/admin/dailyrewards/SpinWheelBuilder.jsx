import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';

const COLORS = [
  '#7c3aed', '#f59e0b', '#10b981', '#ef4444',
  '#8b5cf6', '#3b82f6', '#ec4899', '#14b8a6',
  '#f97316', '#84cc16',
];

const TYPE_ICONS = { xp: '⭐', coins: '🪙', pet: '🐾', theme: '🎨', title: '🏷️', default: '🎁' };

function segmentPath(cx, cy, r, startAngle, endAngle) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const x1 = cx + r * Math.cos(toRad(startAngle));
  const y1 = cy + r * Math.sin(toRad(startAngle));
  const x2 = cx + r * Math.cos(toRad(endAngle));
  const y2 = cy + r * Math.sin(toRad(endAngle));
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc},1 ${x2},${y2} Z`;
}

/**
 * Spin Wheel Builder — configure wheel prizes with a live preview.
 * Props: wheel, setWheel, allPets
 */
export default function SpinWheelBuilder({ wheel, setWheel, allPets }) {
  const prizes = wheel?.prizes || [];
  const enabled = !!wheel?.enabled;

  const totalWeight = useMemo(
    () => prizes.reduce((s, p) => s + Math.max(0, Number(p.weight) || 0), 0),
    [prizes]
  );

  const segments = useMemo(() => {
    if (!prizes.length || totalWeight <= 0) return [];
    let angle = 0;
    return prizes.map((p, i) => {
      const slice = (Math.max(0, Number(p.weight) || 0) / totalWeight) * 360;
      const seg = { ...p, startAngle: angle, endAngle: angle + slice, midAngle: angle + slice / 2, color: COLORS[i % COLORS.length] };
      angle += slice;
      return seg;
    });
  }, [prizes, totalWeight]);

  const updatePrize = (i, patch) => {
    const next = [...prizes];
    next[i] = { ...next[i], ...patch };
    setWheel({ ...wheel, prizes: next });
  };

  const addPrize = () => {
    setWheel({ ...wheel, prizes: [...prizes, { label: '100 XP', type: 'xp', amount: 100, weight: 1 }] });
  };

  const removePrize = (i) => {
    const next = [...prizes];
    next.splice(i, 1);
    setWheel({ ...wheel, prizes: next });
  };

  const previewSize = 200;
  const cx = previewSize / 2;
  const cy = previewSize / 2;
  const r = previewSize / 2 - 8;

  return (
    <div className="space-y-4">
      {/* Enable toggle */}
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-slate-200">Spin the Wheel</Label>
          <p className="text-xs text-slate-400 mt-0.5">Used when a daily reward slot is set to "Spin Wheel", and for bonus spins.</p>
        </div>
        <Select
          value={enabled ? 'on' : 'off'}
          onValueChange={(v) => setWheel({ ...wheel, enabled: v === 'on' })}
        >
          <SelectTrigger className="bg-slate-800 border-slate-700 text-white w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="off">Disabled</SelectItem>
            <SelectItem value="on">Enabled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {!enabled ? (
        <p className="text-sm text-slate-400 bg-slate-900 rounded-lg p-3 border border-slate-700">
          Wheel is disabled. Enable it to configure prizes.
        </p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Prize editor */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 text-sm font-medium">Prizes ({prizes.length})</span>
              <Button size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={addPrize}>
                <Plus className="w-3 h-3 mr-1" /> Add Prize
              </Button>
            </div>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {prizes.map((p, i) => (
                <div key={i} className="bg-slate-900 rounded-lg p-3 border border-slate-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full flex-shrink-0 border border-white/30" style={{ background: COLORS[i % COLORS.length] }} />
                    <Input
                      className="bg-slate-800 border-slate-700 text-white h-8 flex-1"
                      value={p.label || ''}
                      onChange={(e) => updatePrize(i, { label: e.target.value })}
                      placeholder="Prize label"
                    />
                    <Button size="icon" variant="ghost" className="text-red-400 h-8 w-8" onClick={() => removePrize(i)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={p.type} onValueChange={(v) => updatePrize(i, { type: v })}>
                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="xp">⭐ XP</SelectItem>
                        <SelectItem value="coins">🪙 Coins</SelectItem>
                        <SelectItem value="pet">🐾 Pet</SelectItem>
                        <SelectItem value="theme">🎨 Theme</SelectItem>
                        <SelectItem value="title">🏷️ Title</SelectItem>
                      </SelectContent>
                    </Select>
                    {p.type === 'pet' ? (
                      <Select value={p.value || ''} onValueChange={(v) => updatePrize(i, { value: v })}>
                        <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-8"><SelectValue placeholder="Pick pet…" /></SelectTrigger>
                        <SelectContent>
                          {allPets.map(pet => (
                            <SelectItem key={pet.id} value={pet.id}>{pet.emoji} {pet.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        className="bg-slate-800 border-slate-700 text-white h-8"
                        value={p.value || ''}
                        onChange={(e) => updatePrize(i, { value: e.target.value })}
                        placeholder={p.type === 'xp' || p.type === 'coins' ? 'Amount' : 'Value / text'}
                        type={p.type === 'xp' || p.type === 'coins' ? 'number' : 'text'}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-slate-400 text-xs whitespace-nowrap">Weight</Label>
                    <Input
                      className="bg-slate-800 border-slate-700 text-white h-8 w-24"
                      type="number"
                      value={p.weight || 0}
                      onChange={(e) => updatePrize(i, { weight: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="text-xs text-slate-400">
                      {totalWeight > 0 ? `${Math.round((Math.max(0, Number(p.weight) || 0) / totalWeight) * 100)}%` : '—'}
                    </span>
                  </div>
                </div>
              ))}
              {prizes.length === 0 && (
                <p className="text-slate-400 text-sm text-center py-4">No prizes yet. Add one to get started.</p>
              )}
            </div>
          </div>

          {/* Live preview */}
          <div className="flex flex-col items-center">
            <span className="text-slate-300 text-sm font-medium mb-2">Live Preview</span>
            {segments.length === 0 ? (
              <div className="w-[200px] h-[200px] rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-500 text-sm text-center px-4">
                Add prizes with weight to see the wheel
              </div>
            ) : (
              <svg width={previewSize} height={previewSize}>
                {segments.map((seg, i) => {
                  const segAngle = seg.endAngle - seg.startAngle;
                  const iconRad = (seg.midAngle * Math.PI) / 180;
                  const iconR = r * 0.6;
                  const ix = cx + iconR * Math.cos(iconRad);
                  const iy = cy + iconR * Math.sin(iconRad);
                  return (
                    <g key={i}>
                      <path
                        d={segmentPath(cx, cy, r, seg.startAngle, seg.endAngle)}
                        fill={seg.color}
                        stroke="white"
                        strokeWidth="1.5"
                      />
                      {segAngle > 20 && (
                        <text
                          x={ix} y={iy}
                          textAnchor="middle" dominantBaseline="middle"
                          fontSize="14"
                          transform={`rotate(${seg.midAngle + 90}, ${ix}, ${iy})`}
                        >
                          {TYPE_ICONS[seg.type] || TYPE_ICONS.default}
                        </text>
                      )}
                    </g>
                  );
                })}
                <circle cx={cx} cy={cy} r="14" fill="white" stroke="#7c3aed" strokeWidth="2" />
              </svg>
            )}
            {totalWeight > 0 && (
              <p className="text-xs text-slate-400 mt-2">Total weight: {totalWeight}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}