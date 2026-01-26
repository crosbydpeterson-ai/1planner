import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { PETS } from './PetCatalog';

export default function PetAvatar({ petId, cosmeticIds = [], cosmeticPositions = {}, size = 'md', className = '' }) {
  const [cosmetics, setCosmetics] = useState([]);
  const [customPet, setCustomPet] = useState(null);

  const sizes = {
    sm: { container: 'w-8 h-8', pet: 'text-lg', cosmetic: 'w-6 h-6' },
    md: { container: 'w-12 h-12', pet: 'text-2xl', cosmetic: 'w-9 h-9' },
    lg: { container: 'w-16 h-16', pet: 'text-3xl', cosmetic: 'w-14 h-14' },
    xl: { container: 'w-24 h-24', pet: 'text-5xl', cosmetic: 'w-20 h-20' }
  };

  const sizeClasses = sizes[size];

  useEffect(() => {
    loadCosmetics();
    loadCustomPet();
  }, [petId, cosmeticIds]);

  const loadCosmetics = async () => {
    if (!cosmeticIds || cosmeticIds.length === 0) {
      setCosmetics([]);
      return;
    }
    
    try {
      const allCosmetics = await base44.entities.PetCosmetic.list();
      const equipped = allCosmetics.filter(c => cosmeticIds.includes(c.id));
      setCosmetics(equipped);
    } catch (e) {
      console.error('Error loading cosmetics:', e);
    }
  };

  const loadCustomPet = async () => {
    if (!petId || !petId.startsWith('custom_')) {
      setCustomPet(null);
      return;
    }
    
    try {
      const customPetId = petId.replace('custom_', '');
      const pets = await base44.entities.CustomPet.filter({ id: customPetId });
      if (pets.length > 0) {
        setCustomPet(pets[0]);
      }
    } catch (e) {
      console.error('Error loading custom pet:', e);
    }
  };

  // Get pet emoji or image
  let petDisplay;
  if (petId && petId.startsWith('custom_')) {
    if (customPet?.imageUrl) {
      petDisplay = <img src={customPet.imageUrl} alt={customPet?.name} className={`${sizeClasses.container} object-contain`} />;
    } else {
      petDisplay = <span className={sizeClasses.pet}>{customPet?.emoji || '🎁'}</span>;
    }
  } else {
    const pet = PETS.find(p => p.id === petId) || PETS[0];
    petDisplay = <span className={sizeClasses.pet}>{pet.emoji}</span>;
  }

  return (
    <div className={`relative ${sizeClasses.container} ${className}`}>
      {/* Pet */}
      <div className="absolute inset-0 flex items-center justify-center z-10">
        {petDisplay}
      </div>
      
      {/* Cosmetics overlay */}
      {cosmetics.map((cosmetic, index) => {
        // Use custom position if available, otherwise use default based on type
        const customPos = cosmeticPositions[cosmetic.id];
        const zIndex = cosmetic.cosmeticType === 'background' ? 'z-0' : 'z-30';

        // Default positions if no custom position set
        const defaultPositions = {
          hat: { x: 50, y: 20 },
          glasses: { x: 50, y: 45 },
          accessory: { x: 50, y: 65 },
          background: { x: 50, y: 50 }
        };

        const pos = customPos || defaultPositions[cosmetic.cosmeticType] || { x: 50, y: 30 + (index * 15) };

        return (
          <img
            key={cosmetic.id}
            src={cosmetic.imageUrl}
            alt={cosmetic.name}
            className={`absolute ${sizeClasses.cosmetic} ${zIndex} pointer-events-none`}
            style={{ 
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              filter: cosmetic.cosmeticType === 'background' ? 'opacity(0.3)' : 'none'
            }}
          />
        );
      })}
    </div>
  );
}