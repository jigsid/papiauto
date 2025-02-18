/*
  Warnings:

  - You are about to drop the column `customerId` on the `Subscription` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Subscription_customerId_key";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "customerId",
ALTER COLUMN "plan" SET DEFAULT 'PRO';

-- CreateTable
CREATE TABLE "ProcessedComment" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "commentId" TEXT NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "automationId" UUID NOT NULL,

    CONSTRAINT "ProcessedComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedComment_automationId_commentId_key" ON "ProcessedComment"("automationId", "commentId");

-- AddForeignKey
ALTER TABLE "ProcessedComment" ADD CONSTRAINT "ProcessedComment_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
