-- CreateIndex
CREATE INDEX "Breeding_deletedAt_ownerId_idx" ON "Breeding"("deletedAt", "ownerId");

-- CreateIndex
CREATE INDEX "Expense_deletedAt_ownerId_idx" ON "Expense"("deletedAt", "ownerId");

-- CreateIndex
CREATE INDEX "Goat_deletedAt_ownerId_idx" ON "Goat"("deletedAt", "ownerId");

-- CreateIndex
CREATE INDEX "GoatPurchase_deletedAt_ownerId_idx" ON "GoatPurchase"("deletedAt", "ownerId");

-- CreateIndex
CREATE INDEX "InventoryItem_deletedAt_ownerId_idx" ON "InventoryItem"("deletedAt", "ownerId");

-- CreateIndex
CREATE INDEX "Kid_deletedAt_ownerId_idx" ON "Kid"("deletedAt", "ownerId");

-- CreateIndex
CREATE INDEX "Sale_deletedAt_ownerId_idx" ON "Sale"("deletedAt", "ownerId");

-- CreateIndex
CREATE INDEX "Worker_deletedAt_ownerId_idx" ON "Worker"("deletedAt", "ownerId");
