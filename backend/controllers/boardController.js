const Board = require('../models/Board');
const User = require('../models/User');
const Task = require('../models/Task');
const { ApiError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');
const { z } = require('zod');
const { getUserBoardList, getBoardDetails, ensureBoardPermission, getMemberRole } = require('../services/boardService');
const { addActivity } = require('../services/activityService');

const createBoardSchema = z.object({
  title: z.string().trim().min(3).max(120),
});

const updateBoardSchema = z.object({
  title: z.string().trim().min(3).max(120),
});

const createBoard = asyncHandler(async (req, res) => {
  const payload = createBoardSchema.parse(req.body);

  const board = await Board.create({
    title: payload.title,
    createdBy: req.user._id,
    members: [{ user: req.user._id, role: 'owner' }],
  });

  await addActivity({
    boardId: board._id,
    actor: req.user._id,
    action: 'board_created',
    metadata: { title: board.title },
  });

  const populated = await Board.findById(board._id).populate('createdBy', 'name email avatar').populate('members.user', 'name email avatar');
  res.status(201).json({ success: true, board: populated });
});

const listBoards = asyncHandler(async (req, res) => {
  const boards = await getUserBoardList(req.user._id);
  res.status(200).json({ success: true, boards });
});

const getBoard = asyncHandler(async (req, res) => {
  const board = await Board.findOne({
    _id: req.params.boardId,
    'members.user': req.user._id,
  }).populate('createdBy', 'name email avatar').populate('members.user', 'name email avatar');

  if (!board) {
    throw new ApiError(403, 'Access denied. You are not a member of this board.');
  }

  const tasks = await Task.find({ boardId: board._id }).populate('assignedTo', 'name email avatar').sort({ status: 1, position: 1, createdAt: 1 });

  res.status(200).json({
    success: true,
    board,
    tasks,
  });
});

const updateBoard = asyncHandler(async (req, res) => {
  const payload = updateBoardSchema.parse(req.body);
  const board = await Board.findOne({ _id: req.params.boardId, 'members.user': req.user._id });

  if (!board) {
    throw new ApiError(403, 'Access denied. You are not a member of this board.');
  }

  const canModify = await ensureBoardPermission(board._id, req.user._id, ['owner', 'admin']);
  if (!canModify) {
    throw new ApiError(403, 'Only board owners/admins can update board settings.');
  }

  board.title = payload.title;
  await board.save();

  await addActivity({
    boardId: board._id,
    actor: req.user._id,
    action: 'board_updated',
    metadata: { title: payload.title },
  });

  const populated = await Board.findById(board._id).populate('createdBy', 'name email avatar').populate('members.user', 'name email avatar');
  res.status(200).json({ success: true, board: populated });
});

const addMember = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, 'Email is required.');
  }

  const board = await Board.findOne({ _id: req.params.boardId, 'members.user': req.user._id });
  if (!board) {
    throw new ApiError(403, 'Access denied. You are not a member of this board.');
  }

  const canManageMembers = await ensureBoardPermission(board._id, req.user._id, ['owner', 'admin']);
  if (!canManageMembers) {
    throw new ApiError(403, 'Only owners or admins can add members.');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new ApiError(404, 'User not found with that email.');
  }

  const existingMember = board.members.some((member) => member.user.toString() === user._id.toString());
  if (existingMember) {
    throw new ApiError(409, 'User is already a member of this board.');
  }

  board.members.push({ user: user._id, role: 'member' });
  await board.save();

  await addActivity({
    boardId: board._id,
    actor: req.user._id,
    action: 'member_added',
    metadata: { memberId: user._id, email: user.email },
  });

  const populated = await Board.findById(board._id).populate('createdBy', 'name email avatar').populate('members.user', 'name email avatar');
  res.status(200).json({ success: true, board: populated, member: { _id: user._id, name: user.name, email: user.email } });
});

const removeMember = asyncHandler(async (req, res) => {
  const board = await Board.findOne({ _id: req.params.boardId, 'members.user': req.user._id });
  if (!board) {
    throw new ApiError(403, 'Access denied. You are not a member of this board.');
  }

  const canManageMembers = await ensureBoardPermission(board._id, req.user._id, ['owner', 'admin']);
  if (!canManageMembers) {
    throw new ApiError(403, 'Only owners or admins can remove members.');
  }

  const memberId = req.params.memberId;
  const currentUserId = req.user._id.toString();
  if (memberId === currentUserId) {
    throw new ApiError(400, 'You cannot remove yourself from the board.');
  }

  const member = board.members.find((item) => item.user.toString() === memberId);
  if (!member) {
    throw new ApiError(404, 'Member not found on this board.');
  }

  board.members = board.members.filter((item) => item.user.toString() !== memberId);
  await board.save();

  await addActivity({
    boardId: board._id,
    actor: req.user._id,
    action: 'member_removed',
    metadata: { memberId },
  });

  res.status(200).json({ success: true, message: 'Member removed successfully.' });
});

module.exports = {
  createBoard,
  listBoards,
  getBoard,
  updateBoard,
  addMember,
  removeMember,
};
