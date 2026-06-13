-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ProductView" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ProductView_productId_ip_date_key" ON "ProductView"("productId", "ip", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProductView_tenantId_date_idx" ON "ProductView"("tenantId", "date");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "ProductView_productId_idx" ON "ProductView"("productId");

-- AddForeignKey
ALTER TABLE "ProductView" ADD CONSTRAINT "ProductView_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
