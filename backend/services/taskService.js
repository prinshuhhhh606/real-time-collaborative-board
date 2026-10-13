const Task = require('../models/Task');
const Board = require('../models/Board');
const { ApiError } = require('../utils/ApiError');

const TASK_STATUSES = ['Todo', 'In Progress', 'Review', 'Done'];

const normalizeTaskPosition = (value) => {
  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 0) {
    throw new ApiError(400, 'Position must be a non-negative integer.');
  }
  return numericValue;
};

const reorderTasksForStatus = async (boardId, status, taskId, newPosition) => {
  const tasks = await Task.find({ boardId, status }).sort({ position: 1, createdAt: 1 });
  const sourceIndex = tasks.findIndex((task) => task._id.toString() === taskId.toString());

  if (sourceIndex === -1) {
    return;
  }

  const [targetTask] = tasks.splice(sourceIndex, 1);
  const targetIndex = Math.min(Math.max(newPosition, 0), tasks.length);
  tasks.splice(targetIndex, 0, targetTask);

  for (let index = 0; index < tasks.length; index += 1) {
    tasks[index].position = index;
  }

  await Promise.all(tasks.map((task) => task.save()));
};

const moveTaskBetweenStatuses = async ({ boardId, taskId, status, position }) => {
  const task = await Task.findById(taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found.');
  }

  const safePosition = normalizeTaskPosition(position);
  const safeStatus = TASK_STATUSES.includes(status) ? status : task.status;

  if (task.boardId.toString() !== boardId.toString()) {
    throw new ApiError(400, 'Task does not belong to this board.');
  }

  const sourceStatus = task.status;
  const sameStatus = sourceStatus === safeStatus;

  if (sameStatus) {
    await reorderTasksForStatus(boardId, safeStatus, taskId, safePosition);
    return Task.findById(taskId).populate('assignedTo', 'name email avatar');
  }

  const sourceTasks = await Task.find({ boardId, status: sourceStatus }).sort({ position: 1, createdAt: 1 });
  const nextSourceTasks = sourceTasks.filter((item) => item._id.toString() !== taskId.toString());

  nextSourceTasks.forEach((item, index) => {
    item.position = index;
  });

  await Promise.all(nextSourceTasks.map((item) => item.save()));

  const targetTasks = await Task.find({ boardId, status: safeStatus }).sort({ position: 1, createdAt: 1 });
  const newTargetTasks = [...targetTasks];
  const insertionIndex = Math.min(Math.max(safePosition, 0), newTargetTasks.length);
  newTargetTasks.splice(insertionIndex, 0, task);

  task.status = safeStatus;
  task.position = insertionIndex;

  for (let index = 0; index < newTargetTasks.length; index += 1) {
    const taskItem = newTargetTasks[index];
    if (taskItem._id.toString() === taskId.toString()) {
      taskItem.position = index;
      taskItem.status = safeStatus;
    } else {
      taskItem.position = index;
    }
  }

  await Promise.all(newTargetTasks.map((item) => item.save()));

  return Task.findById(taskId).populate('assignedTo', 'name email avatar');
};

module.exports = {
  TASK_STATUSES,
  normalizeTaskPosition,
  reorderTasksForStatus,
  moveTaskBetweenStatuses,
};
