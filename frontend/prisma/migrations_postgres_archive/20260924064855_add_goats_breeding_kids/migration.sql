-- CreateTable
CREATE TABLE "Goat" (
    "id" TEXT NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "name" TEXT,
    "breed" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "purchaseDate" DATE,
    "purchasePrice" DECIMAL(12,2),
    "currentValue" DECIMAL(12,2) NOT NULL,
    "weight" DECIMAL(8,2) NOT NULL,
    "color" TEXT NOT NULL,
    "healthStatus" TEXT NOT NULL,
    "vaccinationStatus" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "imageUrl" TEXT,
    "notes" TEXT,
    "fatherId" TEXT,
    "motherId" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Breeding" (
    "id" TEXT NOT NULL,
    "femaleGoatId" TEXT NOT NULL,
    "maleGoatId" TEXT,
    "breedingDate" DATE NOT NULL,
    "expectedDueDate" DATE NOT NULL,
    "actualBirthDate" DATE,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Breeding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kid" (
    "id" TEXT NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "name" TEXT,
    "gender" TEXT NOT NULL,
    "dateOfBirth" DATE NOT NULL,
    "motherId" TEXT NOT NULL,
    "fatherId" TEXT,
    "weight" DECIMAL(8,2) NOT NULL,
    "healthStatus" TEXT NOT NULL,
    "vaccinationStatus" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "breedingId" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Kid_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Goat_tagNumber_key" ON "Goat"("tagNumber");

-- CreateIndex
CREATE INDEX "Goat_ownerId_idx" ON "Goat"("ownerId");

-- CreateIndex
CREATE INDEX "Goat_status_idx" ON "Goat"("status");

-- CreateIndex
CREATE INDEX "Goat_deletedAt_idx" ON "Goat"("deletedAt");

-- CreateIndex
CREATE INDEX "Breeding_ownerId_idx" ON "Breeding"("ownerId");

-- CreateIndex
CREATE INDEX "Breeding_femaleGoatId_idx" ON "Breeding"("femaleGoatId");

-- CreateIndex
CREATE INDEX "Breeding_status_idx" ON "Breeding"("status");

-- CreateIndex
CREATE INDEX "Breeding_deletedAt_idx" ON "Breeding"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Kid_tagNumber_key" ON "Kid"("tagNumber");

-- CreateIndex
CREATE INDEX "Kid_ownerId_idx" ON "Kid"("ownerId");

-- CreateIndex
CREATE INDEX "Kid_motherId_idx" ON "Kid"("motherId");

-- CreateIndex
CREATE INDEX "Kid_status_idx" ON "Kid"("status");

-- CreateIndex
CREATE INDEX "Kid_deletedAt_idx" ON "Kid"("deletedAt");

-- AddForeignKey
ALTER TABLE "Goat" ADD CONSTRAINT "Goat_fatherId_fkey" FOREIGN KEY ("fatherId") REFERENCES "Goat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goat" ADD CONSTRAINT "Goat_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Goat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goat" ADD CONSTRAINT "Goat_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breeding" ADD CONSTRAINT "Breeding_femaleGoatId_fkey" FOREIGN KEY ("femaleGoatId") REFERENCES "Goat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breeding" ADD CONSTRAINT "Breeding_maleGoatId_fkey" FOREIGN KEY ("maleGoatId") REFERENCES "Goat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Breeding" ADD CONSTRAINT "Breeding_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kid" ADD CONSTRAINT "Kid_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Goat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kid" ADD CONSTRAINT "Kid_fatherId_fkey" FOREIGN KEY ("fatherId") REFERENCES "Goat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kid" ADD CONSTRAINT "Kid_breedingId_fkey" FOREIGN KEY ("breedingId") REFERENCES "Breeding"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kid" ADD CONSTRAINT "Kid_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
