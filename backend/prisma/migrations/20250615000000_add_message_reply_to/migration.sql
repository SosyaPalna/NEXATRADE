-- AlterTable
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "replyToId" TEXT;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Message_replyToId_idx" ON "Message"("replyToId");
