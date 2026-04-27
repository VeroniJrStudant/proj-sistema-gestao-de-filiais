-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN "unitPriceCents" INTEGER NOT NULL DEFAULT 0;
