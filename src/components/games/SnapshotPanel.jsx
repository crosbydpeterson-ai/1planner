import React, { useState } from 'react';
import { History, RotateCcw, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

export default function SnapshotPanel({ gameId, gameCode, snapshots = [], onRevert, onSnapshotSaved }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [reverting, setReverting] = useState(null);

  const handleSave = async () => {
    if (!gameId || !gameCode) return;
    setSaving(true);
    const newSnapshot = {
      label: label.trim() || `Version ${snapshots.length + 1}`,
      code: gameCode,
      savedAt: new Date().toISOString(),
    };
    const updated = [...snapshots, newSnapshot];
    await base44.entities.MiniGame.update(gameId, { codeSnapshots: updated });
    setLabel('');
    setSaving(false);
    onSnapshotSaved?.(updated);
  };

  const handleRevert = async (snapshot, index) => {
    setReverting(index);
    onRevert(snapshot.code);
    if (gameId) {
      await base44.entities.MiniGame.update(gameId, { gameCode: snapshot.code });
    }
    setReverting(null);
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  };

  return (
    <div className="border-t border-slate-100">
      <button
        className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4" />
          <span>Snapshots {snapshots.length > 0 && `(${snapshots.length})`}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {/* Save current snapshot */}
          <div className="flex gap-2">
            <Input
              placeholder="Snapshot label (optional)"
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="rounded-lg text-xs h-8"
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <Button
              onClick={handleSave}
              disabled={saving || !gameId || !gameCode}
              size="sm"
              className="h-8 px-2 rounded-lg bg-indigo-500 text-white shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Snapshot list */}
          {snapshots.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-2">No snapshots yet</p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {[...snapshots].reverse().map((snap, i) => {
                const realIndex = snapshots.length - 1 - i;
                return (
                  <div key={realIndex} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-1.5 gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 truncate">{snap.label}</p>
                      <p className="text-xs text-slate-400">{formatDate(snap.savedAt)}</p>
                    </div>
                    <button
                      onClick={() => handleRevert(snap, realIndex)}
                      disabled={reverting === realIndex}
                      className="shrink-0 text-indigo-500 hover:text-indigo-700 p-1 rounded"
                      title="Revert to this version"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}