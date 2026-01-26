import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Save, RotateCcw } from 'lucide-react';
import PetAvatar from '@/components/quest/PetAvatar';

export default function PetCosmeticCustomizer({ profile, onUpdate }) {
  const [positions, setPositions] = useState({});
  const [cosmetics, setCosmetics] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [saving, setSaving] = useState(false);
  const containerRef = useRef(null);

  const startDrag = (e, id) => {
    e.preventDefault();
    setDragging(id);
    if ('touches' in e && e.touches?.[0]) {
      updatePosFromPoint(e.touches[0].clientX, e.touches[0].clientY);
    } else if ('clientX' in e) {
      updatePosFromPoint(e.clientX, e.clientY);
    }
  };
  const stopDrag = () => setDragging(null);

  const updatePosFromPoint = (clientX, clientY) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    const nx = Math.max(0, Math.min(100, x));
    const ny = Math.max(0, Math.min(100, y));
    setPositions(prev => ({ ...prev, [dragging]: { x: nx, y: ny } }));
  };

  const handleMouseMove = (e) => updatePosFromPoint(e.clientX, e.clientY);
  const handleTouchMove = (e) => {
    e.preventDefault?.();
    e.preventDefault?.();
    if (!e.touches?.[0]) return;
    updatePosFromPoint(e.touches[0].clientX, e.touches[0].clientY);
  };

  // Track dragging globally so cursor can move outside the box
  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', stopDrag);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [dragging]);

  useEffect(() => {
    setPositions(profile.cosmeticPositions || {});
    loadCosmetics();
  }, [profile?.equippedCosmetics, profile?.equippedPetId]);

  // Keep dragging active even if pointer leaves the canvas
  useEffect(() => {
    if (!dragging) return;
    const mm = (e) => handleMouseMove(e);
    const mu = () => stopDrag();
    const tm = (e) => handleTouchMove(e);
    const tu = () => stopDrag();
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    window.addEventListener('touchmove', tm, { passive: false });
    window.addEventListener('touchend', tu);
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchend', tu);
    };
  }, [dragging]);

  // Keep dragging active even if pointer leaves the canvas
  useEffect(() => {
    if (!dragging) return;
    const mm = (e) => handleMouseMove(e);
    const mu = () => stopDrag();
    const tm = (e) => handleTouchMove(e);
    const tu = () => stopDrag();
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    window.addEventListener('touchmove', tm, { passive: false });
    window.addEventListener('touchend', tu);
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchend', tu);
    };
  }, [dragging]);

  // Keep dragging when pointer leaves the canvas
  React.useEffect(() => {
    if (!dragging) return;
    const mm = (e) => handleMouseMove(e);
    const mu = () => stopDrag();
    const tm = (e) => handleTouchMove(e);
    const tu = () => stopDrag();
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    window.addEventListener('touchmove', tm, { passive: false });
    window.addEventListener('touchend', tu);
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchend', tu);
    };
  }, [dragging]);

  // Continue dragging even when leaving the canvas
  useEffect(() => {
    if (!dragging) return;
    const mm = (e) => handleMouseMove(e);
    const mu = () => stopDrag();
    const tm = (e) => handleTouchMove(e);
    const tu = () => stopDrag();
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    window.addEventListener('touchmove', tm, { passive: false });
    window.addEventListener('touchend', tu);
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchend', tu);
    };
  }, [dragging]);

  // Keep dragging active even if pointer leaves the canvas
  useEffect(() => {
    if (!dragging) return;
    const mm = (e) => handleMouseMove(e);
    const mu = () => stopDrag();
    const tm = (e) => handleTouchMove(e);
    const tu = () => stopDrag();
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    window.addEventListener('touchmove', tm, { passive: false });
    window.addEventListener('touchend', tu);
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchend', tu);
    };
  }, [dragging]);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', stopDrag);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [dragging]);

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

  // HTML5 drag removed for smoother cross-browser behavior

  // Continue dragging even if pointer leaves the canvas
  useEffect(() => {
    if (!dragging) return;
    const mm = (e) => handleMouseMove(e);
    const mu = () => stopDrag();
    const tm = (e) => handleTouchMove(e);
    const tu = () => stopDrag();
    window.addEventListener('mousemove', mm);
    window.addEventListener('mouseup', mu);
    window.addEventListener('touchmove', tm, { passive: false });
    window.addEventListener('touchend', tu);
    return () => {
      window.removeEventListener('mousemove', mm);
      window.removeEventListener('mouseup', mu);
      window.removeEventListener('touchmove', tm);
      window.removeEventListener('touchend', tu);
    };
  }, [dragging]);

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


  const defaultPosFor = (cosmetic, idx) => {
    const map = { hat: { x: 50, y: 20 }, glasses: { x: 50, y: 45 }, accessory: { x: 50, y: 65 }, background: { x: 50, y: 50 } };
    return map[cosmetic.cosmeticType] || { x: 50, y: 30 + (idx * 15) };
  };

  const sizeFor = (type) => {
    switch (type) {
      case 'hat': return 'w-32 h-32';
      case 'glasses': return 'w-28 h-28';
      case 'accessory': return 'w-28 h-28';
      case 'background': return 'w-[28rem] h-[28rem]';
      default: return 'w-28 h-28';
    }
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

      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchMove={handleTouchMove}
        onTouchEnd={stopDrag}
        className="relative w-full h-80 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-dashed border-slate-300 mb-4 overflow-hidden select-none"
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{ transform: 'scale(3)', opacity: 0.95 }}>
            <PetAvatar petId={profile?.equippedPetId} cosmeticIds={[]} size="xl" />
          </div>
        </div>

        {cosmetics.map((c, idx) => {
          const pos = positions[c.id] || defaultPosFor(c, idx);
          return (
            <div
              key={c.id}
              onMouseDown={(e) => startDrag(e, c.id)}
              onTouchStart={(e) => startDrag(e, c.id)}
              style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', cursor: dragging === c.id ? 'grabbing' : 'grab', zIndex: c.cosmeticType === 'background' ? 0 : 20 }}
              className="transition-opacity hover:opacity-80"
            >
              {c.imageUrl ? (
                <img src={c.imageUrl} alt={c.name} className={`${sizeFor(c.cosmeticType)} pointer-events-none object-contain`} />
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