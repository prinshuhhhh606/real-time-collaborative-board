const Activity = require('../models/Activity');
const Board = require('../models/Board');
const { ApiError } = require('../utils/ApiError');
const { asyncHandler } = require('../utils/asyncHandler');
const { isBoardMember } = require('../services/boardService');

const listBoardActivity = asyncHandler(async (req, res) => {
  const board = await Board.findOne({ _id: req.params.boardId, 'members.user': req.user._id });
  if (!board) {
    throw new ApiError(403, 'Access denied. You are not a member of this board.');
  }

  const activities = await Activity.find({ boardId: req.params.boardId }).populate('actor', 'name email avatar').sort({ createdAt: -1 }).limit(50);
  res.status(200).json({ success: true, activities });
});

module.exports = { listBoardActivity };
