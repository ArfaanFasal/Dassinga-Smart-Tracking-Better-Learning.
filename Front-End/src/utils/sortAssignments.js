import { PRIORITY_ORDER } from './constants';

/**
 * Smart sort: deadline nearest first, then priority (High > Medium > Low).
 */
export function sortAssignments(list) {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const dateA = new Date(a.deadline).getTime();
    const dateB = new Date(b.deadline).getTime();
    if (dateA !== dateB) return dateA - dateB;
    const pa = PRIORITY_ORDER[a.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.priority] ?? 99;
    return pa - pb;
  });
}

/** Priority High → Low, then nearest deadline */
export function sortAssignmentsByPriorityThenDeadline(list) {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 99;
    const pb = PRIORITY_ORDER[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    return new Date(a.deadline) - new Date(b.deadline);
  });
}
