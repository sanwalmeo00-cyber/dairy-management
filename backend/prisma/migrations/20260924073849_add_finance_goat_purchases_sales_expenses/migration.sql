-- CreateTable
CREATE TABLE "GoatPurchase" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "goatId" TEXT,
    "tagNumber" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "purchasePrice" DECIMAL(12,2) NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoatPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "buyer" TEXT NOT NULL,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoatPurchase_ownerId_idx" ON "GoatPurchase"("ownerId");

-- CreateIndex
CREATE INDEX "GoatPurchase_tagNumber_idx" ON "GoatPurchase"("tagNumber");

-- CreateIndex
CREATE INDEX "GoatPurchase_deletedAt_idx" ON "GoatPurchase"("deletedAt");

-- CreateIndex
CREATE INDEX "Sale_ownerId_idx" ON "Sale"("ownerId");

-- CreateIndex
CREATE INDEX "Sale_tagNumber_idx" ON "Sale"("tagNumber");

-- CreateIndex
CREATE INDEX "Sale_deletedAt_idx" ON "Sale"("deletedAt");

-- CreateIndex
CREATE INDEX "Expense_ownerId_idx" ON "Expense"("ownerId");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_deletedAt_idx" ON "Expense"("deletedAt");

-- AddForeignKey
ALTER TABLE "GoatPurchase" ADD CONSTRAINT "GoatPurchase_goatId_fkey" FOREIGN KEY ("goatId") REFERENCES "Goat"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GoatPurchase" ADD CONSTRAINT "GoatPurchase_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
