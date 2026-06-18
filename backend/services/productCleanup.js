/**
 * Удаляем всю историю сообщений и блокировки, связанные с товаром.
 * Вызывается перед soft-delete продукта, т.к. Prisma-каскады при soft-delete не срабатывают.
 */
async function deleteProductChatHistory(prisma, productId) {
  await prisma.message.deleteMany({ where: { productId } })
  await prisma.chatBlock.deleteMany({
    where: { roomType: 'product', roomId: productId }
  })
  await prisma.productView.deleteMany({ where: { productId } })
}

module.exports = { deleteProductChatHistory }
