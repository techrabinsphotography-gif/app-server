const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const chatService = require('../features/chat/chat.service');
const notifSvc = require('../utils/notificationService');

const initSocketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // ── Inject io into notificationService ────────────────────────────────────
  notifSvc.setIo(io);

  // ── JWT Auth Middleware ────────────────────────────────────────────────────
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
    // Per-user chat room
    const chatRoom = `support_${socket.userId}`;
    socket.join(chatRoom);

    // Global broadcast room — every authenticated user joins
    socket.join('global_notifications');

    // Per-user personal notification room
    socket.join(`user_${socket.userId}`);

    console.log(`🔌 User ${socket.userId} connected → rooms: ${chatRoom}, user_${socket.userId}, global_notifications`);

    // ── Chat ────────────────────────────────────────────────────────────────
    socket.on('chat:send', async (data) => {
      try {
        const message = await chatService.saveMessage({
          senderId: socket.userId,
          roomId: chatRoom,
          content: data.content,
          messageType: data.type ?? 'TEXT',
        });
        io.to(chatRoom).emit('chat:receive', message);
      } catch (err) {
        socket.emit('chat:error', { message: err.message });
      }
    });

    socket.on('chat:typing', () => {
      socket.to(chatRoom).emit('chat:typing', { userId: socket.userId });
    });

    // ── Disconnect ──────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`🔌 User ${socket.userId} disconnected`);
    });
  });

  return io;
};

module.exports = { initSocketServer };
