import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, RotateCcw } from 'lucide-react';
import { PETS } from './PetCatalog';

export default function PetCosmeticCustomizer({ profile, onUpdate }) {
  const [positions, setPositions] = useState({});
  const [cosmetics, setCosmetics] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPositions(profile.cosmeticPositions || {});
    loadCosmetics();
  }, [profile?.equippedCosmetics, profile?.equippedPetId]);

  const loadCosmetics = async () => {
    const ids = profile?.equippedCosmetics || [];
    if (!ids.length) { setCosmetics([]); return; }
    try {
      const items = await Promise.all(
        ids.map(id => base44.entities.PetCosmetic.filter({ id }).then(r => r[0]).catch(() => null))
      );
      setCosmetics(items.filter(Boolean));
    } catch (e) {
      console.error('Error loading cosmetics:', e);
    }
  };

  const onDrag = (e, cosmeticId) => {
    if (e.clientX === 0 && e.clientY === 0) return;
    const container = e.currentTarget.parentElement;
    const rect = container.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPositions(prev => ({ ...prev, [cosmeticId]: { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } }));
  };

  const handleReset = () => {
    setPositions({});
    toast.success('Positions reset to default');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.UserProfile.update(profile.id, { cosmeticPositions: positions });
      toast.success('Cosmetic positions saved!');
      onUpdate?.();
    } catch (e) {
      toast.error('Failed to save positions');
    }
    setSaving(false);
  };

  const petEmoji = (() => {
    if (profile?.equippedPetId?.startsWith('custom_')) return '🐾';
    const pet = PETS.find(p => p.id === profile?.equippedPetId);
    return pet?.emoji || '🟢';
  })();

  const defaultPosFor = (cosmetic, idx) => {
    const map = { hat: { x: 50, y: 20 }, glasses: { x: 50, y: 45 }, accessory: { x: 50, y: 65 }, background: { x: 50, y: 50 } };
    return map[cosmetic.cosmeticType] || { x: 50, y: 30 + (idx * 15) };
  };

  return (
    <Card className="bg-white rounded-xl p-6 shadow-md border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-slate-700">🎨 Customize Your Pet Icon</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <p className="text-sm text-slate-600 mb-4">Drag your cosmetics to position them perfectly on your pet. This is how you appear on the leaderboard and in the Admin panel.</p>

      <div className="relative w-full h-80 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-dashed border-slate-300 mb-4 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-9xl opacity-90">{petEmoji}</div>
        </div>

        {cosmetics.map((c, idx) => {
          const pos = positions[c.id] || defaultPosFor(c, idx);
          return (
            <div
              key={c.id}
              draggable
              onDrag={(e) => onDrag(e, c.id)}
              style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', cursor: 'grab', zIndex: c.cosmeticType === 'background' ? 0 : 10 }}
              className="transition-opacity hover:opacity-80"
            >
              {c.imageUrl ? (
                <img src={c.imageUrl} alt={c.name} className="w-16 h-16 pointer-events-none object-contain" />
              ) : (
                <div className="text-4xl pointer-events-none">🎨</div>
              )}
            </div>
          );
        })}

        {cosmetics.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-400">
            No cosmetics equipped yet. Equip some on the Collection page.
          </div>
        )}
      </div>

      <div className="text-xs text-slate-500 text-center">You can equip up to 3 cosmetics. Edit in Collection, then position here.</div>
    </Card>
  );
}