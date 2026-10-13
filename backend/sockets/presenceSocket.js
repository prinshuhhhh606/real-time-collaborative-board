const User = require('../models/User');
const Board = require('../models/Board');

const configurePresenceSocket = (io) => {
  io.on('connection', (socket) => {
    socket.on('presence:board', async ({ boardId }) => {
      if (!socket.user) return;
      const isMember = await Board.findOne({ _id: boardId, 'members.user': socket.user._id });
      if (!isMember) return;

      socket.join(boardId);
      io.to(boardId).emit('presence:update', {
        user: {
          _id: socket.user._id,
          name: socket.user.name,
          avatar: socket.user.avatar,
        },
        boardId,
        status: 'online',
      });
    });
  });
};

module.exports = { configurePresenceSocket };
