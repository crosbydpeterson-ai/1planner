import React, { useState } from 'react';
import { Plus, Trash2, Copy, RefreshCw, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LOCKABLE_FEATURES, generateCodeString } from '@/lib/featureLocks';
import { toast } from 'sonner';

export default function SecretCodeManager({ featureLocks, setFeatureLocks }) {
  const codes = featureLocks?.codes || [];

  const addCode = () => {
    const newCode = {
      code: generateCodeString(8),
      feature: 'all',
      label: '',
      maxUses: 0,
      uses: 0,
      active: true,
      expiresAt: '',
      createdAt: new Date().toISOString(),
    };
    setFeatureLocks(prev => ({
      ...prev,
      codes: [...(prev.codes || []), newCode],
    }));
    toast.success('Code created — remember to save!');
  };

  const updateCode = (index, field, value) => {
    setFeatureLocks(prev => {
      const codes = [...(prev.codes || [])];
      codes[index] = { ...codes[index], [field]: value };
      return { ...prev, codes };
    });
  };

  const removeCode = (index) => {
    setFeatureLocks(prev => ({
      ...prev,
      codes: (prev.codes || []).filter((_, i) => i !== index),
    }));
    toast.info('Code removed — remember to save!');
  };

  const toggleActive = (index) => {
    setFeatureLocks(prev => {
      const codes = [...(prev.codes || [])];
      codes[index] = { ...codes[index], active: !codes[index].active };
      return { ...prev, codes };
    });
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`Copied: ${code}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-white font-semibold flex items-center gap-2"><Ticket className="w-5 h-5 text-amber-400" />Secret Unlock Codes</h3>
            <p className="text-slate-400 text-sm mt-1">Generate codes users can enter on the lock page to instantly unlock a feature</p>
          </div>
          <Button onClick={addCode} className="bg-gradient-to-r from-amber-500 to-orange-500">
            <Plus className="w-4 h-4 mr-1" />New Code
          </Button>
        </div>

        {codes.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Ticket className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No secret codes yet</p>
            <p className="text-xs mt-1">Create codes that unlock features when entered on the lock page</p>
          </div>
        )}
      </div>

      {/* Code list */}
      <div className="space-y-3">
        {codes.map((entry, index) => (
          <div key={index} className={`bg-slate-800 rounded-2xl p-4 border ${entry.active ? 'border-slate-700' : 'border-slate-800 opacity-60'}`}>
            <div className="flex items-center gap-3 mb-3">
              {/* Code display */}
              <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-4 py-2 border border-slate-600 flex-1">
                <span className="text-lg font-mono font-bold text-amber-300 tracking-wider">{entry.code}</span>
                <button onClick={() => copyCode(entry.code)} className="ml-auto text-slate-400 hover:text-white">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => updateCode(index, 'code', generateCodeString(8))} className="text-slate-400 hover:text-white">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Active toggle */}
              <button onClick={() => toggleActive(index)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border ${entry.active ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                {entry.active ? '● Active' : '○ Inactive'}
              </button>

              <button onClick={() => removeCode(index)} className="text-red-400 hover:text-red-300 p-2">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <Label className="text-slate-400 text-xs">Label (internal)</Label>
                <Input value={entry.label || ''} onChange={e => updateCode(index, 'label', e.target.value)}
                  placeholder="Summer promo" className="bg-slate-700 border-slate-600 text-white text-sm" />
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Unlocks</Label>
                <select value={entry.feature} onChange={e => updateCode(index, 'feature', e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
                  <option value="all">All Features</option>
                  {LOCKABLE_FEATURES.map(f => (
                    <option key={f.key} value={f.key}>{f.emoji} {f.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Max uses (0 = ∞)</Label>
                <Input type="number" value={entry.maxUses || 0} onChange={e => updateCode(index, 'maxUses', parseInt(e.target.value) || 0)}
                  className="bg-slate-700 border-slate-600 text-white text-sm" />
              </div>
              <div>
                <Label className="text-slate-400 text-xs">Expires (optional)</Label>
                <Input type="date" value={entry.expiresAt ? entry.expiresAt.split('T')[0] : ''} onChange={e => updateCode(index, 'expiresAt', e.target.value ? new Date(e.target.value).toISOString() : '')}
                  className="bg-slate-700 border-slate-600 text-white text-sm" />
              </div>
            </div>

            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span>Uses: <span className="text-white font-medium">{entry.uses || 0}{entry.maxUses ? ` / ${entry.maxUses}` : ''}</span></span>
              <span>Created: {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : '—'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}