import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { PETS } from './PetCatalog';

export default function PetAvatar({ petId, cosmeticIds = [], size = 'md', className = '' }) {
  const [cosmetics, setCosmetics] = useState([]);
  const [customPet, setCustomPet] = useState(null);

  const sizes = {
    sm: { container: 'w-8 h-8', pet: 'text-lg', cosmetic: 'w-5 h-5' },
    md: { container: 'w-12 h-12', pet: 'text-2xl', cosmetic: 'w-8 h-8' },
    lg: { container: 'w-16 h-16', pet: 'text-3xl', cosmetic: 'w-12 h-12' },
    xl: { container: 'w-24 h-24', pet: 'text-5xl', cosmetic: 'w-16 h-16' }
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
      <div className="absolute inset-0 flex items-center justify-center">
        {petDisplay}
      </div>
      
      {/* Cosmetics overlay */}
      {cosmetics.map((cosmetic) => {
        // Position cosmetics based on type
        const positions = {
          hat: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/4',
          glasses: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          accessory: 'bottom-0 right-0',
          background: 'inset-0'
        };

        const position = positions[cosmetic.cosmeticType] || 'top-0 right-0';
        const zIndex = cosmetic.cosmeticType === 'background' ? 'z-0' : 'z-10';

        return (
          <img
            key={cosmetic.id}
            src={cosmetic.imageUrl}
            alt={cosmetic.name}
            className={`absolute ${position} ${sizeClasses.cosmetic} ${zIndex} pointer-events-none`}
            style={{ 
              filter: cosmetic.cosmeticType === 'background' ? 'opacity(0.3)' : 'none'
            }}
          />
        );
      })}
    </div>
  );
}