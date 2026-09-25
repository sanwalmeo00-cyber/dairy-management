-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "goatId" TEXT;

-- CreateIndex
CREATE INDEX "Sale_goatId_idx" ON "Sale"("goatId");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_goatId_fkey" FOREIGN KEY ("goatId") REFERENCES "Goat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
