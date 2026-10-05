// Single source of truth for the gem price of an egg in the Shop's Loot Eggs tab.
// Uses shopGemPrice (the authoritative field for the Shop tab), preserving
// intentionally configured zero prices. Falls back to the schema default of 2
// only when the field is missing or not a number.
export function getEggShopPrice(egg) {
  if (!egg) return 0;
  return typeof egg.shopGemPrice === 'number' ? egg.shopGemPrice : 2;
}