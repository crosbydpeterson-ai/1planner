import { PETS } from './PetCatalog';

export function getPetName(petId, customPetsById = {}) {
  if (!petId) return 'Unknown Pet';
  if (typeof petId !== 'string') return String(petId);
  if (petId.startsWith('custom_')) {
    const id = petId.replace('custom_', '');
    return customPetsById[id]?.name || 'Custom Pet';
  }
  const found = PETS.find(p => p.id === petId);
  return found?.name || petId;
}

export function collectCustomIds(petIds = []) {
  const set = new Set();
  petIds.forEach(pid => {
    if (typeof pid === 'string' && pid.startsWith('custom_')) {
      set.add(pid.replace('custom_', ''));
    }
  });
  return Array.from(set);
}