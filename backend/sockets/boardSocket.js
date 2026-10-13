const jwt = require('jsonwebtoken');
const Board = require('../models/Board');
const User = require('../models/User');
const Task = require('../models/Task');

const verifyBoardAccess = async (boardId, userId) => {
  const board = await Board.findOne({ _id: boardId, 'members.user': userId }).populate('members.user', 'name email avatar');
  return board;
};

const configureBoardSocket = (io) => {
  io.on('connection', (socket) => {
    socket.on('board:join', async (boardId) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
        if (!token) {
          socket.emit('error', { message: 'Authentication required.' });
          return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          socket.emit('error', { message: 'User not found.' });
          return;
        }

        const board = await verifyBoardAccess(boardId, user._id);
        if (!board) {
          socket.emit('error', { message: 'You are not a member of this board.' });
          return;
        }

        socket.join(boardId);
        socket.data.user = user;
        socket.data.boardId = boardId;

        const tasks = await Task.find({ boardId: board._id }).populate('assignedTo', 'name email avatar').sort({ status: 1, position: 1, createdAt: 1 });

        socket.emit('board:sync', {
          board: { ...board.toObject(), members: board.members },
          tasks,
          onlineUsers: Array.from(io.sockets.adapter.rooms.get(boardId)?.values?.() || []).map(() => user._id.toString()),
        });

        socket.to(boardId).emit('presence:update', {
          user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar },
          status: 'online',
          boardId,
        });
      } catch (error) {
        socket.emit('error', { message: 'Board access could not be verified.' });
      }
    });

    socket.on('typing:start', ({ boardId, taskId }) => {
      if (!socket.data.user || !boardId) return;
      socket.to(boardId).emit('typing:start', {
        user: { _id: socket.data.user._id, name: socket.data.user.name, avatar: socket.data.user.avatar },
        boardId,
        taskId,
      });
    });

    socket.on('typing:stop', ({ boardId, taskId }) => {
      if (!socket.data.user || !boardId) return;
      socket.to(boardId).emit('typing:stop', {
        user: { _id: socket.data.user._id, name: socket.data.user.name, avatar: socket.data.user.avatar },
        boardId,
        taskId,
      });
    });

    socket.on('disconnect', () => {
      if (!socket.data.boardId) return;
      socket.to(socket.data.boardId).emit('presence:update', {
        user: { _id: socket.data.user?._id, name: socket.data.user?.name },
        status: 'offline',
        boardId: socket.data.boardId,
      });
    });
  });
};

module.exports = { configureBoardSocket };
