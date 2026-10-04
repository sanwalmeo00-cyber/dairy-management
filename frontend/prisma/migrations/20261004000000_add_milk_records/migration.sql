-- CreateTable
CREATE TABLE "MilkRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "quantityKg" DECIMAL NOT NULL,
    "session" TEXT NOT NULL DEFAULT 'Morning',
    "goatId" TEXT,
    "tagNumber" TEXT,
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MilkRecord_goatId_fkey" FOREIGN KEY ("goatId") REFERENCES "Goat" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MilkRecord_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MilkRecord_ownerId_idx" ON "MilkRecord"("ownerId");

-- CreateIndex
CREATE INDEX "MilkRecord_date_idx" ON "MilkRecord"("date");

-- CreateIndex
CREATE INDEX "MilkRecord_goatId_idx" ON "MilkRecord"("goatId");

-- CreateIndex
CREATE INDEX "MilkRecord_deletedAt_idx" ON "MilkRecord"("deletedAt");

-- CreateIndex
CREATE INDEX "MilkRecord_deletedAt_ownerId_idx" ON "MilkRecord"("deletedAt", "ownerId");
