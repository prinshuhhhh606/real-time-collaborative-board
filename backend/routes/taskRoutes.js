
const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');

const {
  updateTask,
  moveTask,
  deleteTask,
} = require('../controllers/taskController');

const router = express.Router();

router.use(authMiddleware);

router.patch('/:taskId', updateTask);
router.patch('/:taskId/move', moveTask);
router.delete('/:taskId', deleteTask);

module.exports = router;
