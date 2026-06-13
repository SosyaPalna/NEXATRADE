-- CreateTable
CREATE TABLE IF NOT EXISTS "ChatBlock" (
    "id" TEXT NOT NULL,
    "roomType" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,

    CONSTRAINT "ChatBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ChatBlock_roomType_roomId_blockerId_blockedId_key" ON "ChatBlock"("roomType", "roomId", "blockerId", "blockedId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChatBlock_roomType_roomId_idx" ON "ChatBlock"("roomType", "roomId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ChatBlock_blockerId_idx" ON "ChatBlock"("blockerId");

-- AddForeignKey
ALTER TABLE "ChatBlock" ADD CONSTRAINT "ChatBlock_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatBlock" ADD CONSTRAINT "ChatBlock_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
