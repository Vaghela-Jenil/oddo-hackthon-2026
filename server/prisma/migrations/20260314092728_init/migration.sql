/*
  Warnings:

  - You are about to drop the column `locationId` on the `Adjustment` table. All the data in the column will be lost.
  - You are about to drop the column `countedQty` on the `AdjustmentLine` table. All the data in the column will be lost.
  - You are about to drop the column `difference` on the `AdjustmentLine` table. All the data in the column will be lost.
  - You are about to drop the column `systemQty` on the `AdjustmentLine` table. All the data in the column will be lost.
  - You are about to drop the column `qty` on the `DeliveryLine` table. All the data in the column will be lost.
  - Added the required column `adjustedQty` to the `AdjustmentLine` table without a default value. This is not possible if the table is not empty.
  - Added the required column `locationId` to the `AdjustmentLine` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Adjustment" DROP CONSTRAINT "Adjustment_locationId_fkey";

-- AlterTable
ALTER TABLE "Adjustment" DROP COLUMN "locationId";

-- AlterTable
ALTER TABLE "AdjustmentLine" DROP COLUMN "countedQty",
DROP COLUMN "difference",
DROP COLUMN "systemQty",
ADD COLUMN     "adjustedQty" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "locationId" TEXT NOT NULL,
ADD COLUMN     "reason" TEXT;

-- AlterTable
ALTER TABLE "DeliveryLine" DROP COLUMN "qty",
ADD COLUMN     "deliveredQty" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "requestedQty" DECIMAL(65,30) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastLogin" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "AdjustmentLine" ADD CONSTRAINT "AdjustmentLine_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
