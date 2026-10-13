
const express = require('express');

const { authMiddleware } = require('../middleware/authMiddleware');

const {
  createBoard,
  listBoards,
  getBoard,
  updateBoard,
  addMember,
  removeMember,
} = require('../controllers/boardController');

const { createTask } = require('../controllers/taskController');

const router = express.Router();

router.use(authMiddleware);

// Board routes
router.post('/', createBoard);
router.get('/', listBoards);
router.get('/:boardId', getBoard);
router.patch('/:boardId', updateBoard);

// Board member routes
router.post('/:boardId/members', addMember);
router.delete('/:boardId/members/:memberId', removeMember);

// Create a task inside a board
router.post('/:boardId/tasks', createTask);

module.exports = router;
