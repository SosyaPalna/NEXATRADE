-- AlterTable
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "attachments" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Message_productId_createdAt_idx" ON "Message"("productId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Message_rfqId_createdAt_idx" ON "Message"("rfqId", "createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Message_senderId_createdAt_idx" ON "Message"("senderId", "createdAt");
