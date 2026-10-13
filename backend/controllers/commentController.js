const Comment = require('../models/Comment');
const Task = require('../models/Task');
const { ApiError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');
const { z } = require('zod');
const { isBoardMember } = require('../services/boardService');
const { addActivity } = require('../services/activityService');

const commentSchema = z.object({
  text: z.string().trim().min(1).max(2000),
});

const listComments = asyncHandler(async (req, res) => {
  const comments = await Comment.find({ taskId: req.params.taskId }).populate('author', 'name email avatar').sort({ createdAt: 1 });
  res.status(200).json({ success: true, comments });
});

const createComment = asyncHandler(async (req, res) => {
  const payload = commentSchema.parse(req.body);
  const task = await Task.findById(req.params.taskId);

  if (!task) {
    throw new ApiError(404, 'Task not found.');
  }

  const member = await isBoardMember(task.boardId, req.user._id);
  if (!member) {
    throw new ApiError(403, 'You do not have access to this task.');
  }

  const comment = await Comment.create({
    taskId: task._id,
    boardId: task.boardId,
    author: req.user._id,
    text: payload.text,
  });

  const populated = await Comment.findById(comment._id).populate('author', 'name email avatar');

  await addActivity({
    boardId: task.boardId,
    taskId: task._id,
    actor: req.user._id,
    action: 'comment_added',
    metadata: { text: payload.text },
  });

  const io = req.app.get('io');
  io.to(task.boardId.toString()).emit('comment:created', { comment: populated, boardId: task.boardId.toString() });

  res.status(201).json({ success: true, comment: populated });
});

module.exports = { listComments, createComment };
