const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function getRoomName(roomType, roomId) {
  return `${roomType}:${roomId}`;
}

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

    // Каждый пользователь присоединяется к своей персональной комнате для уведомлений
    socket.join(`tenant:${socket.tenantId}`);

    // Присоединение к универсальной комнате (rfq или product)
    socket.on('join:room', ({ type, id }) => {
      const room = getRoomName(type, id);
      socket.join(room);
      console.log(`📡 ${socket.tenantId} joined room ${room}`);
    });

    // Отправка сообщения
    socket.on('message:send', async ({ roomType, roomId, content }) => {
      if (!content?.trim() || !roomType || !roomId) return;

      try {
        const data = {
          content: content.trim(),
          senderId: socket.tenantId,
        };
        if (roomType === 'rfq') data.rfqId = roomId;
        else if (roomType === 'product') data.productId = roomId;
        else return;

        const message = await prisma.message.create({
          data,
          include: { sender: { select: { name: true } } }
        });

        io.to(getRoomName(roomType, roomId)).emit('message:receive', message);

        // Определяем получателя сообщения и создаём уведомление
        try {
          let recipientId = null;
          let link = null;
          let title = '';

          if (roomType === 'rfq') {
            const rfq = await prisma.rfq.findUnique({ where: { id: roomId }, select: { buyerId: true, title: true } });
            if (rfq && rfq.buyerId !== socket.tenantId) {
              recipientId = rfq.buyerId;
              title = `Новое сообщение по заявке «${rfq.title}»`;
              link = `/rfq/${roomId}`;
            }
          } else if (roomType === 'product') {
            const product = await prisma.product.findUnique({ where: { id: roomId }, select: { tenantId: true, name: true } });
            if (product && product.tenantId !== socket.tenantId) {
              recipientId = product.tenantId;
              title = `Новое сообщение по товару «${product.name}»`;
              link = `/products/${roomId}`;
            }
          }

          if (recipientId) {
            const notification = await prisma.notification.create({
              data: {
                title,
                message: `${message.sender.name}: ${content.trim().slice(0, 120)}${content.trim().length > 120 ? '...' : ''}`,
                type: 'chat',
                link,
                recipientId,
                metadata: { roomType, roomId, senderId: socket.tenantId },
              },
            });
            io.to(`tenant:${recipientId}`).emit('notification:new', notification);
          }
        } catch (notifyErr) {
          console.error('❌ Notification error:', notifyErr.message);
        }
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
        const roomType = updated.rfqId ? 'rfq' : 'product';
        const roomId = updated.rfqId || updated.productId;
        io.to(getRoomName(roomType, roomId)).emit('message:edited', updated);
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
        const roomType = updated.rfqId ? 'rfq' : 'product';
        const roomId = updated.rfqId || updated.productId;
        io.to(getRoomName(roomType, roomId)).emit('message:deleted', updated);
      } catch (err) {
        console.error('❌ Delete error:', err.message);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Загрузка истории сообщений
    socket.on('messages:load', async ({ roomType, roomId, limit = 50 }) => {
      try {
        const where = {};
        if (roomType === 'rfq') where.rfqId = roomId;
        else if (roomType === 'product') where.productId = roomId;
        else return;

        const messages = await prisma.message.findMany({
          where,
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
