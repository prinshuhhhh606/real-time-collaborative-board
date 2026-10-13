const Board = require('../models/Board');
const Task = require('../models/Task');
const User = require('../models/User');

const boardPopulated = [
  { path: 'createdBy', select: 'name email avatar' },
  { path: 'members.user', select: 'name email avatar' },
];

const findBoardWithAccess = async (boardId, userId) => {
  const board = await Board.findOne({
    _id: boardId,
    'members.user': userId,
  }).populate(boardPopulated);

  return board;
};

const getBoardDetails = async (boardId) => {
  const board = await Board.findById(boardId).populate(boardPopulated);
  if (!board) return null;

  const tasks = await Task.find({ boardId: board._id }).populate('assignedTo', 'name email avatar').sort({ status: 1, position: 1, createdAt: 1 });

  return { board, tasks };
};

const getUserBoardList = async (userId) => {
  const boards = await Board.find({ 'members.user': userId }).populate(boardPopulated).sort({ updatedAt: -1 });
  return boards;
};

const isBoardMember = async (boardId, userId) => {
  const board = await Board.findOne({ _id: boardId, 'members.user': userId });
  return Boolean(board);
};

const getMemberRole = async (boardId, userId) => {
  const board = await Board.findOne({ _id: boardId, 'members.user': userId });
  if (!board) return null;

  const member = board.members.find((item) => item.user.toString() === userId.toString());
  return member ? member.role : null;
};

const ensureBoardPermission = async (boardId, userId, allowedRoles = ['owner', 'admin']) => {
  const role = await getMemberRole(boardId, userId);
  if (!role) {
    return false;
  }

  return allowedRoles.includes(role);
};

module.exports = {
  boardPopulated,
  findBoardWithAccess,
  getBoardDetails,
  getUserBoardList,
  isBoardMember,
  getMemberRole,
  ensureBoardPermission,
};
