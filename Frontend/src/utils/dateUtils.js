export function formatDate(dateValue) {
  if (!dateValue) return 'No date';
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? 'No date' : date.toLocaleDateString();
}

export function isOverdue(dateValue) {
  if (!dateValue) return false;
  const deadline = new Date(dateValue);
  return deadline < new Date();
}
