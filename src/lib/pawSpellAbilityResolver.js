// Resolves which abilities each side has based on their equipped skins / pets.
// Returns: { w: { [pieceType]: { category, name, description, icon, needsTarget, source } }, b: {...} }

import { base44 } from '@/api/base44Client';
import { PET_TYPES } from './pawSpellConstants';

const PET_TYPE_LIST = Object.values(PET_TYPES);

// Abilities that need a target square / piece selection
const NEEDS_TARGET = new Set([
  'fire/sprite', 'fire/golem', 'fire/gryphon', 'fire/wisp', 'fire/dragon',
  'ice/sprite', 'ice/wisp', 'ice/dragon',
  'storm/sprite', 'storm/golem', 'storm/gryphon', 'storm/dragon',
  'nature/sprite', 'nature/gryphon', 'nature/wisp',
  'shadow/sprite', 'shadow/gryphon', 'shadow/dragon',
  'light/gryphon', 'light/wisp',
  'ocean/sprite', 'ocean/golem', 'ocean/gryphon', 'ocean/wisp',
  'chaos/gryphon',
  'time/golem',
]);

export function abilityNeedsTarget(category, pieceType) {
  return NEEDS_TARGET.has(`${category}/${pieceType}`);
}

// Cache abilities lookup
let _abilitiesCache = null;
async function loadAllAbilities() {
  if (_abilitiesCache) return _abilitiesCache;
  const all = await base44.entities.PawSpellAbility.list();
  _abilitiesCache = {};
  for (const a of all) {
    _abilitiesCache[`${a.category}/${a.pieceType}`] = a;
  }
  return _abilitiesCache;
}

/**
 * Given equippedSkins {petType: skinId} and petSkinMap (for pet_ pseudo-skins),
 * resolve the ability for each piece type.
 */
export async function resolveAbilitiesForSide(equippedSkins, petSkinMap = {}) {
  if (!equippedSkins) return {};
  const abilitiesMap = await loadAllAbilities();
  const result = {};

  for (const petType of PET_TYPE_LIST) {
    const skinId = equippedSkins[petType];
    if (!skinId) continue;

    let abilityCategory = null;
    let source = null;

    if (skinId.startsWith('pet_')) {
      // Pet-derived skin — load CustomPet
      const petId = skinId.replace('pet_', '');
      const pets = await base44.entities.CustomPet.filter({ id: petId });
      if (pets[0]?.abilityCategory) {
        abilityCategory = pets[0].abilityCategory;
        source = { type: 'pet', name: pets[0].name, imageUrl: pets[0].imageUrl };
      }
    } else {
      const skins = await base44.entities.PawSpellSkin.filter({ id: skinId });
      if (skins[0]?.abilityCategory) {
        abilityCategory = skins[0].abilityCategory;
        source = { type: 'skin', name: skins[0].name, imageUrl: skins[0].imageUrl };
      }
    }

    if (!abilityCategory) continue;
    const ability = abilitiesMap[`${abilityCategory}/${petType}`];
    if (!ability) continue;

    result[petType] = {
      category: abilityCategory,
      pieceType: petType,
      name: ability.name,
      description: ability.description,
      icon: ability.icon || '✨',
      needsTarget: abilityNeedsTarget(abilityCategory, petType),
      source,
    };
  }

  return result;
}