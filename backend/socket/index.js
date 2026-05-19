const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware для аутентификации сокетов
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('No token'));
    
    const jwt = require('jsonwebtoken');
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.tenantId = decoded.tenantId;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.tenantId}`);

    // Присоединение к комнате конкретного RFQ
    socket.on('join:rfq', (rfqId) => {
      socket.join(`rfq:${rfqId}`);
      console.log(`📡 ${socket.tenantId} joined room rfq:${rfqId}`);
    });

    // Отправка сообщения
    socket.on('message:send', async ({ rfqId, content }) => {
      if (!content?.trim()) return;

      try {
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            senderId: socket.tenantId,
            rfqId,
          },
          include: { sender: { select: { name: true } } }
        });

        io.to(`rfq:${rfqId}`).emit('message:receive', message);
      } catch (err) {
        console.error('❌ Message error:', err.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Редактирование сообщения
    socket.on('message:edit', async ({ messageId, content }) => {
      if (!content?.trim()) return;
      try {
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message || message.senderId !== socket.tenantId) {
          return socket.emit('error', { message: 'Нет доступа' });
        }
        const updated = await prisma.message.update({
          where: { id: messageId },
          data: { content: content.trim(), isEdited: true, editedAt: new Date() },
          include: { sender: { select: { name: true } } }
        });
        io.to(`rfq:${message.rfqId}`).emit('message:edited', updated);
      } catch (err) {
        console.error('❌ Edit error:', err.message);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Удаление сообщения (мягкое)
    socket.on('message:delete', async ({ messageId }) => {
      try {
        const message = await prisma.message.findUnique({ where: { id: messageId } });
        if (!message || message.senderId !== socket.tenantId) {
          return socket.emit('error', { message: 'Нет доступа' });
        }
        const updated = await prisma.message.update({
          where: { id: messageId },
          data: { isDeleted: true },
          include: { sender: { select: { name: true } } }
        });
        io.to(`rfq:${message.rfqId}`).emit('message:deleted', updated);
      } catch (err) {
        console.error('❌ Delete error:', err.message);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Загрузка истории сообщений
    socket.on('messages:load', async ({ rfqId, limit = 50 }) => {
      try {
        const messages = await prisma.message.findMany({
          where: { rfqId },
          include: { sender: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
          take: limit,
        });
        socket.emit('messages:loaded', messages);
      } catch (err) {
        socket.emit('error', { message: 'Failed to load messages' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Disconnected: ${socket.tenantId}`);
    });
  });

  return io;
};

module.exports = initSocket;
