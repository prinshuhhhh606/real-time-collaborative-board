const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { listComments, createComment } = require('../controllers/commentController');

const router = express.Router();

router.use(authMiddleware);

router.get('/tasks/:taskId/comments', listComments);
router.post('/tasks/:taskId/comments', createComment);

module.exports = router;
