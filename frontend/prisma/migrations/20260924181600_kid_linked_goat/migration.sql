-- AlterTable
ALTER TABLE "Kid" ADD COLUMN "goatId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Kid_goatId_key" ON "Kid"("goatId");

-- AddForeignKey
ALTER TABLE "Kid" ADD CONSTRAINT "Kid_goatId_fkey" FOREIGN KEY ("goatId") REFERENCES "Goat"("id") ON DELETE SET NULL ON UPDATE CASCADE;
