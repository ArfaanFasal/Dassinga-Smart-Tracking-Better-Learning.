/** @param {string} deadlineIso */
export function isOverdue(deadlineIso) {
  return new Date(deadlineIso).getTime() < Date.now();
}

/** Highlight window: due within next `days` (inclusive of today). */
export function isDueWithinDays(deadlineIso, days = 2) {
  const end = new Date(deadlineIso).getTime();
  const now = Date.now();
  if (end < now) return false;
  const ms = days * 24 * 60 * 60 * 1000;
  return end - now <= ms;
}
