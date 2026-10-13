const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { configureBoardSocket } = require('./boardSocket');
const { configurePresenceSocket } = require('./presenceSocket');

const initializeSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication required for socket connections.'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return next(new Error('User not found for socket connection.'));
      }

      socket.user = user;
      return next();
    } catch (error) {
      return next(new Error('Invalid socket token.'));
    }
  });

  configureBoardSocket(io);
  configurePresenceSocket(io);
};

module.exports = { initializeSocket };
