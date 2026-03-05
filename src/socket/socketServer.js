const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const chatService = require('../features/chat/chat.service');

const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // ── JWT Auth Middleware for Socket.IO ──────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error: no token'));
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, { issuer: 'robin-app' });
      socket.userId = decoded.sub;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Authentication error: invalid token'));
    }
  });

  // ── Connection Handler ─────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const roomId = `support_${socket.userId}`;
    socket.join(roomId);
    console.log(`🔌 User ${socket.userId} connected — room: ${roomId}`);

    // Send message
    socket.on('chat:send', async (data) => {
      try {
        const message = await chatService.saveMessage({
          senderId: socket.userId,
          roomId,
          content: data.content,
          messageType: data.type ?? 'TEXT',
        });
        io.to(roomId).emit('chat:receive', message);
      } catch (err) {
        socket.emit('chat:error', { message: err.message });
      }
    });

    // Typing indicator
    socket.on('chat:typing', () => {
      socket.to(roomId).emit('chat:typing', { userId: socket.userId });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 User ${socket.userId} disconnected`);
    });
  });

  return io;
};

module.exports = { initSocketServer };
