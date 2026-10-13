const Task = require('../models/Task');
const Board = require('../models/Board');
const { ApiError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');
const { z } = require('zod');
const { addActivity } = require('../services/activityService');
const { isBoardMember, ensureBoardPermission } = require('../services/boardService');
const { TASK_STATUSES, normalizeTaskPosition } = require('../services/taskService');

const taskCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().default(''),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional().default('Medium'),
  dueDate: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
  status: z.enum(['Todo', 'In Progress', 'Review', 'Done']).optional().default('Todo'),
  position: z.number().int().min(0).optional().default(0),
});

const taskUpdateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']).optional(),
  dueDate: z.string().nullable().optional(),
  assignedTo: z.string().nullable().optional(),
  status: z.enum(['Todo', 'In Progress', 'Review', 'Done']).optional(),
  position: z.number().int().min(0).optional(),
  version: z.number().int().min(1).optional(),
});

const createTask = asyncHandler(async (req, res) => {
  const payload = taskCreateSchema.parse(req.body);
  const boardId = req.params.boardId;
  const isMember = await isBoardMember(boardId, req.user._id);

  if (!isMember) {
    throw new ApiError(403, 'You do not have access to this board.');
  }

  const task = await Task.create({
    boardId,
    title: payload.title,
    description: payload.description,
    priority: payload.priority,
    dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
    assignedTo: payload.assignedTo || null,
    status: payload.status,
    position: normalizeTaskPosition(payload.position),
    createdBy: req.user._id,
    version: 1,
  });

  const saved = await Task.findById(task._id).populate('assignedTo', 'name email avatar').populate('createdBy', 'name email avatar');

  await addActivity({
    boardId,
    taskId: saved._id,
    actor: req.user._id,
    action: 'task_created',
    metadata: { title: saved.title, status: saved.status },
  });

  const io = req.app.get('io');
  io.to(boardId).emit('task:created', { task: saved, boardId });

  res.status(201).json({ success: true, task: saved });
});

const updateTask = asyncHandler(async (req, res) => {
  const payload = taskUpdateSchema.parse(req.body);
  const task = await Task.findById(req.params.taskId);

  if (!task) {
    throw new ApiError(404, 'Task not found.');
  }

  const member = await isBoardMember(task.boardId, req.user._id);
  if (!member) {
    throw new ApiError(403, 'You cannot edit tasks on this board.');
  }

  if (payload.version !== undefined && payload.version !== task.version) {
    throw new ApiError(409, 'Task version mismatch. Please refresh and try again.', {
      currentVersion: task.version,
    });
  }

  const updatePayload = { ...payload };
  delete updatePayload.version;

  if (updatePayload.dueDate !== undefined) {
    updatePayload.dueDate = updatePayload.dueDate ? new Date(updatePayload.dueDate) : null;
  }

  if (updatePayload.position !== undefined) {
    updatePayload.position = normalizeTaskPosition(updatePayload.position);
  }

  if (updatePayload.assignedTo === '') {
    updatePayload.assignedTo = null;
  }

  const previousStatus = task.status;
  Object.assign(task, updatePayload);
  task.version = (task.version || 0) + 1;
  await task.save();

  const populated = await Task.findById(task._id).populate('assignedTo', 'name email avatar').populate('createdBy', 'name email avatar');

  await addActivity({
    boardId: task.boardId,
    taskId: task._id,
    actor: req.user._id,
    action: previousStatus === task.status ? 'task_updated' : 'task_status_changed',
    metadata: {
      title: task.title,
      status: task.status,
      previousStatus,
    },
  });

  const io = req.app.get('io');
  io.to(task.boardId.toString()).emit('task:updated', { task: populated, boardId: task.boardId.toString() });

  res.status(200).json({ success: true, task: populated });
});

const moveTask = asyncHandler(async (req, res) => {
  const { status, position } = req.body;
  const taskId = req.params.taskId;
  const task = await Task.findById(taskId);

  if (!task) {
    throw new ApiError(404, 'Task not found.');
  }

  if (!TASK_STATUSES.includes(status)) {
    throw new ApiError(400, 'Invalid task status.');
  }

  const member = await isBoardMember(task.boardId, req.user._id);
  if (!member) {
    throw new ApiError(403, 'You cannot move tasks on this board.');
  }

  const normalizedPosition = normalizeTaskPosition(position);
  const previousStatus = task.status;

  const tasks = await Task.find({ boardId: task.boardId, status }).sort({ position: 1, createdAt: 1 });
  const taskIndex = tasks.findIndex((item) => item._id.toString() === taskId.toString());

  if (taskIndex === -1) {
    task.status = status;
    task.position = normalizedPosition;
    await task.save();
  } else {
    tasks.splice(taskIndex, 1);
    const insertionIndex = Math.min(Math.max(normalizedPosition, 0), tasks.length);
    tasks.splice(insertionIndex, 0, task);
    tasks.forEach((item, index) => {
      item.position = index;
    });
    await Promise.all(tasks.map((item) => item.save()));
  }

  const updatedTask = await Task.findById(taskId).populate('assignedTo', 'name email avatar');
  updatedTask.status = status;
  updatedTask.position = normalizedPosition;
  updatedTask.version += 1;
  await updatedTask.save();

  await addActivity({
    boardId: task.boardId,
    taskId: task._id,
    actor: req.user._id,
    action: 'task_moved',
    metadata: { from: previousStatus, to: status, position: normalizedPosition },
  });

  const io = req.app.get('io');
  io.to(task.boardId.toString()).emit('task:moved', { task: updatedTask, boardId: task.boardId.toString() });

  res.status(200).json({ success: true, task: updatedTask });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found.');
  }

  const canDelete = await ensureBoardPermission(task.boardId, req.user._id, ['owner', 'admin']);
  if (!canDelete && task.createdBy.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have permission to delete this task.');
  }

  await task.deleteOne();
  await addActivity({
    boardId: task.boardId,
    taskId: task._id,
    actor: req.user._id,
    action: 'task_deleted',
    metadata: { title: task.title },
  });

  const io = req.app.get('io');
  io.to(task.boardId.toString()).emit('task:deleted', { taskId: task._id.toString(), boardId: task.boardId.toString() });

  res.status(200).json({ success: true, message: 'Task deleted successfully.' });
});

module.exports = { createTask, updateTask, moveTask, deleteTask };
