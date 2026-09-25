-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdBy" TEXT,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sku" TEXT NOT NULL,
    "price" DECIMAL NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'liter',
    "stock" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "total" DECIMAL NOT NULL,
    "notes" TEXT,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Goat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tagNumber" TEXT NOT NULL,
    "name" TEXT,
    "breed" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "purchaseDate" DATETIME,
    "purchasePrice" DECIMAL,
    "currentValue" DECIMAL NOT NULL,
    "weight" DECIMAL NOT NULL,
    "color" TEXT NOT NULL,
    "healthStatus" TEXT NOT NULL,
    "vaccinationStatus" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "imageUrl" TEXT,
    "notes" TEXT,
    "fatherId" TEXT,
    "motherId" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Goat_fatherId_fkey" FOREIGN KEY ("fatherId") REFERENCES "Goat" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Goat_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Goat" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Goat_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Breeding" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "femaleGoatId" TEXT NOT NULL,
    "maleGoatId" TEXT,
    "breedingDate" DATETIME NOT NULL,
    "expectedDueDate" DATETIME NOT NULL,
    "actualBirthDate" DATETIME,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Breeding_femaleGoatId_fkey" FOREIGN KEY ("femaleGoatId") REFERENCES "Goat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Breeding_maleGoatId_fkey" FOREIGN KEY ("maleGoatId") REFERENCES "Goat" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Breeding_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Kid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tagNumber" TEXT NOT NULL,
    "name" TEXT,
    "gender" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "motherId" TEXT NOT NULL,
    "fatherId" TEXT,
    "goatId" TEXT,
    "weight" DECIMAL NOT NULL,
    "healthStatus" TEXT NOT NULL,
    "vaccinationStatus" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "imageUrl" TEXT,
    "notes" TEXT,
    "breedingId" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Kid_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Goat" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Kid_fatherId_fkey" FOREIGN KEY ("fatherId") REFERENCES "Goat" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Kid_goatId_fkey" FOREIGN KEY ("goatId") REFERENCES "Goat" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Kid_breedingId_fkey" FOREIGN KEY ("breedingId") REFERENCES "Breeding" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Kid_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GoatPurchase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "goatId" TEXT,
    "tagNumber" TEXT NOT NULL,
    "seller" TEXT NOT NULL,
    "purchasePrice" DECIMAL NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GoatPurchase_goatId_fkey" FOREIGN KEY ("goatId") REFERENCES "Goat" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "GoatPurchase_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "tagNumber" TEXT NOT NULL,
    "goatId" TEXT,
    "buyer" TEXT NOT NULL,
    "salePrice" DECIMAL NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Sale_goatId_fkey" FOREIGN KEY ("goatId") REFERENCES "Goat" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Sale_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Expense_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "salary" DECIMAL NOT NULL,
    "joiningDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Worker_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkerPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "forMonth" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkerPayment_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkerPayment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" DECIMAL NOT NULL,
    "minimumStock" DECIMAL NOT NULL,
    "cost" DECIMAL NOT NULL,
    "dailyUsage" DECIMAL,
    "expiryDate" DATETIME,
    "supplier" TEXT,
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "quantity" DECIMAL NOT NULL,
    "direction" TEXT NOT NULL,
    "reason" TEXT,
    "supplier" TEXT,
    "cost" DECIMAL,
    "notes" TEXT,
    "ownerId" TEXT NOT NULL,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InventoryTransaction_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryTransaction_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "Goat_tagNumber_key" ON "Goat"("tagNumber");

-- CreateIndex
CREATE INDEX "Goat_ownerId_idx" ON "Goat"("ownerId");

-- CreateIndex
CREATE INDEX "Goat_status_idx" ON "Goat"("status");

-- CreateIndex
CREATE INDEX "Goat_deletedAt_idx" ON "Goat"("deletedAt");

-- CreateIndex
CREATE INDEX "Goat_deletedAt_ownerId_idx" ON "Goat"("deletedAt", "ownerId");

-- CreateIndex
CREATE INDEX "Breeding_ownerId_idx" ON "Breeding"("ownerId");

-- CreateIndex
CREATE INDEX "Breeding_femaleGoatId_idx" ON "Breeding"("femaleGoatId");

-- CreateIndex
CREATE INDEX "Breeding_status_idx" ON "Breeding"("status");

-- CreateIndex
CREATE INDEX "Breeding_deletedAt_idx" ON "Breeding"("deletedAt");

-- CreateIndex
CREATE INDEX "Breeding_deletedAt_ownerId_idx" ON "Breeding"("deletedAt", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Kid_tagNumber_key" ON "Kid"("tagNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Kid_goatId_key" ON "Kid"("goatId");

-- CreateIndex
CREATE INDEX "Kid_ownerId_idx" ON "Kid"("ownerId");

-- CreateIndex
CREATE INDEX "Kid_motherId_idx" ON "Kid"("motherId");

-- CreateIndex
CREATE INDEX "Kid_status_idx" ON "Kid"("status");

-- CreateIndex
CREATE INDEX "Kid_deletedAt_idx" ON "Kid"("deletedAt");

-- CreateIndex
CREATE INDEX "Kid_deletedAt_ownerId_idx" ON "Kid"("deletedAt", "ownerId");

-- CreateIndex
CREATE INDEX "GoatPurchase_ownerId_idx" ON "GoatPurchase"("ownerId");

-- CreateIndex
CREATE INDEX "GoatPurchase_tagNumber_idx" ON "GoatPurchase"("tagNumber");

-- CreateIndex
CREATE INDEX "GoatPurchase_deletedAt_idx" ON "GoatPurchase"("deletedAt");

-- CreateIndex
CREATE INDEX "GoatPurchase_deletedAt_ownerId_idx" ON "GoatPurchase"("deletedAt", "ownerId");

-- CreateIndex
CREATE INDEX "Sale_ownerId_idx" ON "Sale"("ownerId");

-- CreateIndex
CREATE INDEX "Sale_tagNumber_idx" ON "Sale"("tagNumber");

-- CreateIndex
CREATE INDEX "Sale_goatId_idx" ON "Sale"("goatId");

-- CreateIndex
CREATE INDEX "Sale_deletedAt_idx" ON "Sale"("deletedAt");

-- CreateIndex
CREATE INDEX "Sale_deletedAt_ownerId_idx" ON "Sale"("deletedAt", "ownerId");

-- CreateIndex
CREATE INDEX "Expense_ownerId_idx" ON "Expense"("ownerId");

-- CreateIndex
CREATE INDEX "Expense_category_idx" ON "Expense"("category");

-- CreateIndex
CREATE INDEX "Expense_deletedAt_idx" ON "Expense"("deletedAt");

-- CreateIndex
CREATE INDEX "Expense_deletedAt_ownerId_idx" ON "Expense"("deletedAt", "ownerId");

-- CreateIndex
CREATE INDEX "Worker_ownerId_idx" ON "Worker"("ownerId");

-- CreateIndex
CREATE INDEX "Worker_status_idx" ON "Worker"("status");

-- CreateIndex
CREATE INDEX "Worker_deletedAt_idx" ON "Worker"("deletedAt");

-- CreateIndex
CREATE INDEX "Worker_deletedAt_ownerId_idx" ON "Worker"("deletedAt", "ownerId");

-- CreateIndex
CREATE INDEX "WorkerPayment_workerId_idx" ON "WorkerPayment"("workerId");

-- CreateIndex
CREATE INDEX "WorkerPayment_forMonth_idx" ON "WorkerPayment"("forMonth");

-- CreateIndex
CREATE INDEX "WorkerPayment_ownerId_idx" ON "WorkerPayment"("ownerId");

-- CreateIndex
CREATE INDEX "WorkerPayment_deletedAt_idx" ON "WorkerPayment"("deletedAt");

-- CreateIndex
CREATE INDEX "InventoryItem_ownerId_idx" ON "InventoryItem"("ownerId");

-- CreateIndex
CREATE INDEX "InventoryItem_category_idx" ON "InventoryItem"("category");

-- CreateIndex
CREATE INDEX "InventoryItem_deletedAt_idx" ON "InventoryItem"("deletedAt");

-- CreateIndex
CREATE INDEX "InventoryItem_deletedAt_ownerId_idx" ON "InventoryItem"("deletedAt", "ownerId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_itemId_idx" ON "InventoryTransaction"("itemId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_ownerId_idx" ON "InventoryTransaction"("ownerId");

-- CreateIndex
CREATE INDEX "InventoryTransaction_deletedAt_idx" ON "InventoryTransaction"("deletedAt");

