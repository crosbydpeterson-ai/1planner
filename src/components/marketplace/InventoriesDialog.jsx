import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import PetAvatar from '@/components/quest/PetAvatar';
import { getPetName } from '@/components/quest/petUtils';

export default function InventoriesDialog({ open, onOpenChange, currentProfileId }) {
  const [profiles, setProfiles] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [customMap, setCustomMap] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      try {
        const list = await base44.entities.UserProfile.list();
        // Sort by username, keep nulls last
        const sorted = [...list].sort((a, b) => (a.username || '').localeCompare(b.username || ''));
        setProfiles(sorted);
        setSelected(sorted.find(p => p.id !== currentProfileId) || sorted[0] || null);
        // Preload all custom pets for name mapping
        const cps = await base44.entities.CustomPet.list();
        const map = {};
        cps.forEach((p) => { map[p.id] = p; });
        setCustomMap(map);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, currentProfileId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(p => (p.username || '').toLowerCase().includes(q));
  }, [profiles, search]);

  const pets = useMemo(() => Array.isArray(selected?.unlockedPets) ? selected.unlockedPets : [], [selected]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Player Inventories</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 border rounded-lg p-2 max-h-80 overflow-y-auto">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search players..." className="mb-2" />
            <div className="space-y-1">
              {loading && <div className="text-sm text-slate-500">Loading...</div>}
              {!loading && filtered.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className={`w-full text-left px-3 py-2 rounded-md transition ${selected?.id === p.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}`}
                >
                  <div className="text-sm font-medium">{p.username || 'Unnamed Player'}</div>
                  <div className="text-xs text-slate-500">{p.id}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            {selected ? (
              <div>
                <div className="mb-3">
                  <div className="text-sm text-slate-500">Viewing inventory for</div>
                  <div className="text-lg font-semibold">{selected.username || 'Unnamed Player'}</div>
                </div>
                {pets.length === 0 ? (
                  <div className="text-slate-500 text-sm">No pets yet.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {pets.map((pid) => (
                      <div key={pid} className="border rounded-lg p-3 flex flex-col items-center gap-2 bg-white">
                        <PetAvatar petId={pid} size="md" />
                        <div className="text-sm text-slate-700 text-center">{getPetName(pid, customMap)}</div>
                        <div className="text-[10px] text-slate-400 break-all">{pid}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-500 text-sm">Select a player to view their pets.</div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}