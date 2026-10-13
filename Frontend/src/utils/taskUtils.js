export function normalizeTask(task) {
  return {
    ...task,
    priority: task.priority || 'Medium',
    status: task.status || 'Todo',
    position: Number(task.position || 0),
    assignedTo: task.assignedTo || null,
  };
}

export function getFilteredTasks(tasks, filters) {
  return tasks.filter((task) => {
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.assignee !== 'all' && (task.assignedTo?._id || task.assignedTo) !== filters.assignee) return false;
    if (filters.due === 'overdue' && !task.dueDate) return false;
    return true;
  });
}
