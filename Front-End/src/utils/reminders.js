/**
 * Returns reminder label and whether the task should be highlighted as urgent (red).
 */
export function getDeadlineReminder(deadlineIso) {
  const now = Date.now();
  const end = new Date(deadlineIso).getTime();
  const diffMs = end - now;
  const hours = diffMs / (1000 * 60 * 60);

  if (diffMs < 0) {
    return { message: 'Overdue', urgent: true, highlightRed: true };
  }
  if (hours <= 6) {
    return { message: 'Due in few hours', urgent: true, highlightRed: true };
  }
  if (hours <= 24) {
    return { message: 'Due tomorrow', urgent: true, highlightRed: true };
  }
  if (hours <= 72) {
    return { message: 'Due soon', urgent: false, highlightRed: false };
  }
  return { message: '', urgent: false, highlightRed: false };
}
