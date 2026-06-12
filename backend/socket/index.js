const { Server } = require('socket.io');
const cookie = require('cookie');
const prisma = require('../lib/prisma');
const { verifyAccessToken } = require('../utils/jwt');

function getRoomName(roomType, roomId) {
  return `${roomType}:${roomId}`;
}

function parseAccessTokenFromCookie(handshake) {
  const raw = handshake.headers?.cookie;
  if (!raw) return null;
  try {
    const parsed = cookie.parse(raw);
    return parsed.accessToken || null;
  } catch {
    return null;
  }
}

async function canJoinRoom(tenantId, roomType, roomId) {
  if (roomType === 'rfq') {
    const rfq = await prisma.rfq.findUnique({
      where: { id: roomId },
      select: { buyerId: true, quotes: { where: { sellerId: tenantId }, select: { id: true } } }
    });
    if (!rfq) return false;
    return rfq.buyerId === tenantId || rfq.quotes.length > 0;
  }

  if (roomType === 'product') {
    const product = await prisma.product.findUnique({
      where: { id: roomId },
      select: { tenantId: true }
    });
    if (!product) return false;
    if (product.tenantId === tenantId) return true;
    // Покупатель может писать, только если уже есть история сообщений
    const existingMessage = await prisma.message.findFirst({
      where: { productId: roomId, senderId: tenantId },
      select: { id: true }
    });
    return !!existingMessage;
  }

  return false;
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
  io.use(async (socket, next) => {
    const token = parseAccessTokenFromCookie(socket.handshake);
    if (!token) return next(new Error('No token'));

    const decoded = verifyAccessToken(token);
    if (decoded?.error) return next(new Error('Invalid token'));

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, isActive: true, tenantId: true, tenant: { select: { role: true } } }
      });
      if (!user || !user.isActive) return next(new Error('User inactive'));

      socket.userId = user.id;
      socket.tenantId = user.tenantId;
      socket.role = user.tenant?.role;
      next();
    } catch (err) {
      console.error('Socket auth error:', err.message);
      next(new Error('Auth error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Connected: ${socket.tenantId}`);

    // Каждый пользователь присоединяется к своей персональной комнате для уведомлений
    socket.join(`tenant:${socket.tenantId}`);

    // Присоединение к универсальной комнате (rfq или product)
    socket.on('join:room', async ({ type, id }) => {
      const allowed = await canJoinRoom(socket.tenantId, type, id);
      if (!allowed) {
        return socket.emit('error', { message: 'Нет доступа к чату' });
      }
      const room = getRoomName(type, id);
      socket.join(room);
      console.log(`📡 ${socket.tenantId} joined room ${room}`);
    });

    // Отправка сообщения
    socket.on('message:send', async ({ roomType, roomId, content }) => {
      if (!content?.trim() || !roomType || !roomId) return;

      const allowed = await canJoinRoom(socket.tenantId, roomType, roomId);
      if (!allowed) {
        return socket.emit('error', { message: 'Нет доступа для отправки сообщения' });
      }

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
        const allowed = await canJoinRoom(socket.tenantId, roomType, roomId);
        if (!allowed) {
          return socket.emit('error', { message: 'Нет доступа к истории сообщений' });
        }

        const where = {};
        if (roomType === 'rfq') where.rfqId = roomId;
        else if (roomType === 'product') where.productId = roomId;
        else return;

        const messages = await prisma.message.findMany({
          where,
          include: { sender: { select: { name: true, role: true } } },
          orderBy: { createdAt: 'asc' },
          take: Math.min(parseInt(limit) || 50, 100),
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
