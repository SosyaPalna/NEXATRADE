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
    // Любой авторизованный пользователь может писать владельцу товара.
    return !!product;
  }

  return false;
}

function getRoomName(roomType, roomId) {
  return `${roomType}:${roomId}`;
}

module.exports = { canJoinRoom, getRoomName };
