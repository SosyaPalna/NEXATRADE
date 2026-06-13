-- CreateTable
CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tenantId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Review_tenantId_authorId_key" ON "Review"("tenantId", "authorId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Review_tenantId_idx" ON "Review"("tenantId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Review_authorId_idx" ON "Review"("authorId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
