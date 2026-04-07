const KEY = 'salms_assignment_drafts';

function loadAll() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveAll(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function getDraft(studentId, assignmentId) {
  const all = loadAll();
  return all[studentId]?.[assignmentId] ?? null;
}

export function setDraft(studentId, assignmentId, draft) {
  const all = loadAll();
  if (!all[studentId]) all[studentId] = {};
  if (draft == null) {
    delete all[studentId][assignmentId];
    if (Object.keys(all[studentId]).length === 0) delete all[studentId];
  } else {
    all[studentId][assignmentId] = draft;
  }
  saveAll(all);
}
