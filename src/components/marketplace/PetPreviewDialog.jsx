import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PetAvatar from '@/components/quest/PetAvatar';
import { getPetTheme } from '@/components/quest/PetCatalog';
import { base44 } from '@/api/base44Client';

export default function PetPreviewDialog({ petId, open, onOpenChange }) {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    const loadTheme = async () => {
      if (!petId) return;
      if (petId.startsWith('custom_')) {
        const id = petId.replace('custom_', '');
        const pets = await base44.entities.CustomPet.filter({ id });
        if (pets?.length && pets[0].theme) { setTheme(pets[0].theme); return; }
      }
      setTheme(getPetTheme(petId));
    };
    loadTheme();
  }, [petId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden">
        <div className="relative">
          <div className="h-40 w-full" style={{ background: `linear-gradient(135deg, ${theme?.bg || '#f8fafc'} 0%, ${theme?.secondary || '#a78bfa'} 100%)` }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <PetAvatar petId={petId} size="lg" />
          </div>
        </div>
        <DialogHeader>
          <DialogTitle className="text-center">Pet Preview</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}