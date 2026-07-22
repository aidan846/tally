export function compareVersions(left, right) {
  const normalize = value => String(value ?? '')
    .trim()
    .replace(/^v/i, '')
    .split('-')[0]
    .split('.')
    .slice(0, 3)
    .map(part => Number.parseInt(part, 10));
  const leftParts = normalize(left);
  const rightParts = normalize(right);
  if (leftParts.length === 0 || rightParts.length === 0 || [...leftParts, ...rightParts].some(Number.isNaN)) return 0;
  for (let index = 0; index < 3; index += 1) {
    const difference = (leftParts[index] || 0) - (rightParts[index] || 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }
  return 0;
}

export function isNewerVersion(candidate, current) {
  return compareVersions(candidate, current) > 0;
}
