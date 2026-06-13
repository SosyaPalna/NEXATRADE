const prisma = require('./prisma');

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
    const existingMessage = await prisma.message.findFirst({
      where: { productId: roomId, senderId: tenantId },
      select: { id: true }
    });
    return !!existingMessage;
  }

  return false;
}

function getRoomName(roomType, roomId) {
  return `${roomType}:${roomId}`;
}

module.exports = { canJoinRoom, getRoomName };
