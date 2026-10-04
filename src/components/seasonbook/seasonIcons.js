// Pick a seasonal emoji based on the season name
export function getSeasonEmoji(name) {
  const n = (name || '').toLowerCase();
  if (/trick|treat|halloween|spook|pumpkin/.test(n)) return '🎃';
  if (/winter|snow|frost|christmas|wish/.test(n)) return '❄️';
  if (/cozy|cabin|home/.test(n)) return '🏡';
  if (/spring|bloom|garden|flower/.test(n)) return '🌸';
  if (/summer|beach|sun/.test(n)) return '☀️';
  if (/fall|autumn|harvest/.test(n)) return '🍂';
  if (/gift|present|holiday/.test(n)) return '🎁';
  if (/love|valentine|heart/.test(n)) return '💖';
  return '✨';
}