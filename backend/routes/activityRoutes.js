const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { listBoardActivity } = require('../controllers/activityController');

const router = express.Router();

router.use(authMiddleware);

router.get('/boards/:boardId/activity', listBoardActivity);

module.exports = router;
