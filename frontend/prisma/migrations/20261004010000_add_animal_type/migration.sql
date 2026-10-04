-- AlterTable
ALTER TABLE "Goat" ADD COLUMN "animalType" TEXT NOT NULL DEFAULT 'Goat';

-- CreateIndex
CREATE INDEX "Goat_animalType_idx" ON "Goat"("animalType");
