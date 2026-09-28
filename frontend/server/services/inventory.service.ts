import { Prisma, Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import {
  CreateInventoryItemInput,
  StockInInput,
  StockOutInput,
  UpdateInventoryItemInput,
} from '../validators/inventory.validator';
import { paymentMethodFromAccount, WALLET_ACCOUNT } from '@/lib/moneyAccount';
import { setRecordAccount } from '../utils/account';
import { assertWalletCanSpend } from '../utils/wallet';

const ownerInclude = {
  owner: { select: { id: true, name: true } },
} as const;

type ItemRow = Prisma.InventoryItemGetPayload<{ include: typeof ownerInclude }>;
type TxnRow = Prisma.InventoryTransactionGetPayload<{ include: typeof ownerInclude }>;

/** Marker in Expense.notes so cashbook rows link back to stock-in. */
export const STOCK_IN_EXPENSE_PREFIX = 'Auto from inventory stock-in:';

function expenseNoteFor(txnId: string, userNotes?: string | null) {
  const marker = `${STOCK_IN_EXPENSE_PREFIX}${txnId}`;
  const extra = userNotes?.trim();
  return extra ? `${marker}\n${extra}` : marker;
}

function expenseCategoryForInventory(category: string): string {
  switch (category) {
    case 'Goat Feed':
      return 'Feed';
    case 'Medicine':
    case 'Vaccines':
      return 'Medicine';
    case 'Equipment':
      return 'Equipment';
    default:
      return 'Other';
  }
}

function deriveStatus(currentStock: number) {
  if (currentStock <= 0) return 'Out of Stock';
  return 'In Stock';
}

function serializeItem(row: ItemRow) {
  const currentStock = Number(row.currentStock);
  const minimumStock = Number(row.minimumStock);
  const dailyUsage = row.dailyUsage != null ? Number(row.dailyUsage) : null;

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    unit: row.unit,
    currentStock,
    minimumStock,
    cost: Number(row.cost),
    dailyUsage: dailyUsage ?? undefined,
    daysLeft:
      dailyUsage != null && dailyUsage > 0 ? Math.floor(currentStock / dailyUsage) : null,
    expiryDate: row.expiryDate ? row.expiryDate.toISOString().slice(0, 10) : undefined,
    expiryStatus: undefined as string | undefined,
    supplier: row.supplier ?? undefined,
    notes: row.notes ?? undefined,
    status: deriveStatus(currentStock),
    ownerId: row.ownerId,
    ownerName: row.owner.name,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    deletedBy: row.deletedBy ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function serializeTxn(row: TxnRow) {
  return {
    id: row.id,
    itemId: row.itemId,
    date: row.date.toISOString().slice(0, 10),
    quantity: Number(row.quantity),
    direction: row.direction as 'in' | 'out',
    reason: row.reason ?? undefined,
    supplier: row.supplier ?? undefined,
    cost: row.cost != null ? Number(row.cost) : undefined,
    notes: row.notes ?? undefined,
    ownerId: row.ownerId,
    ownerName: row.owner.name,
    deletedAt: row.deletedAt?.toISOString() ?? null,
    deletedBy: row.deletedBy ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function assertCanModify(ownerId: string, userId: string, role: Role) {
  if (role === Role.SUPER_ADMIN || role === Role.ADMIN) return;
  if (ownerId !== userId) {
    throw new ForbiddenError('You cannot modify another user’s record');
  }
}

export class InventoryService {
  async findAll() {
    const rows = await prisma.inventoryItem.findMany({
      where: { deletedAt: null },
      include: ownerInclude,
      orderBy: { name: 'asc' },
    });
    return rows.map(serializeItem);
  }

  async findById(id: string) {
    const row = await prisma.inventoryItem.findFirst({
      where: { id, deletedAt: null },
      include: ownerInclude,
    });
    if (!row) throw new NotFoundError('Inventory item not found');
    return serializeItem(row);
  }

  async create(input: CreateInventoryItemInput, ownerId: string) {
    const row = await prisma.inventoryItem.create({
      data: {
        name: input.name.trim(),
        category: input.category,
        unit: input.unit.trim(),
        currentStock: input.currentStock ?? 0,
        minimumStock: input.minimumStock ?? 0,
        cost: input.cost ?? 0,
        dailyUsage: input.dailyUsage ?? undefined,
        expiryDate: input.expiryDate ? new Date(input.expiryDate) : undefined,
        supplier: input.supplier ?? undefined,
        notes: input.notes ?? undefined,
        ownerId,
      },
      include: ownerInclude,
    });
    return serializeItem(row);
  }

  async update(id: string, input: UpdateInventoryItemInput, userId: string, role: Role) {
    const existing = await prisma.inventoryItem.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Inventory item not found');
    assertCanModify(existing.ownerId, userId, role);

    const row = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.category !== undefined && { category: input.category }),
        ...(input.unit !== undefined && { unit: input.unit.trim() }),
        ...(input.currentStock !== undefined && { currentStock: input.currentStock }),
        ...(input.minimumStock !== undefined && { minimumStock: input.minimumStock }),
        ...(input.cost !== undefined && { cost: input.cost }),
        ...(input.dailyUsage !== undefined && { dailyUsage: input.dailyUsage }),
        ...(input.expiryDate !== undefined && {
          expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
        }),
        ...(input.supplier !== undefined && { supplier: input.supplier }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      include: ownerInclude,
    });
    return serializeItem(row);
  }

  async remove(id: string, userId: string, role: Role) {
    const existing = await prisma.inventoryItem.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Inventory item not found');
    assertCanModify(existing.ownerId, userId, role);

    const row = await prisma.inventoryItem.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
      include: ownerInclude,
    });
    return serializeItem(row);
  }

  async stockIn(id: string, input: StockInInput, ownerId: string, role: Role) {
    const existing = await prisma.inventoryItem.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Inventory item not found');
    assertCanModify(existing.ownerId, ownerId, role);

    await assertWalletCanSpend(input.cost, 'this inventory purchase');

    const paymentMethod = paymentMethodFromAccount(WALLET_ACCOUNT);

    const txn = await prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { id },
        data: {
          currentStock: { increment: input.quantity },
          ...(input.supplier != null && input.supplier !== ''
            ? { supplier: input.supplier }
            : {}),
        },
      });

      const created = await tx.inventoryTransaction.create({
        data: {
          itemId: id,
          date: new Date(input.date),
          quantity: input.quantity,
          direction: 'in',
          reason: input.reason ?? 'Stock In',
          supplier: input.supplier ?? undefined,
          cost: input.cost,
          notes: input.notes ?? undefined,
          ownerId,
        },
        include: ownerInclude,
      });

      const expense = await tx.expense.create({
        data: {
          date: new Date(input.date),
          description: `Stock in · ${existing.name} (${input.quantity} ${existing.unit})`,
          category: expenseCategoryForInventory(existing.category),
          amount: input.cost,
          paymentMethod,
          notes: expenseNoteFor(created.id, input.notes),
          ownerId,
        },
      });
      await setRecordAccount(tx, 'Expense', expense.id, WALLET_ACCOUNT);

      return created;
    });

    return {
      item: await this.findById(id),
      transaction: serializeTxn(txn),
    };
  }

  async stockOut(id: string, input: StockOutInput, ownerId: string, role: Role) {
    const existing = await prisma.inventoryItem.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Inventory item not found');
    assertCanModify(existing.ownerId, ownerId, role);

    const current = Number(existing.currentStock);
    if (input.quantity > current) {
      throw new ValidationError(
        `Insufficient stock. Available: ${current} ${existing.unit}`
      );
    }

    const [, txn] = await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id },
        data: { currentStock: { decrement: input.quantity } },
      }),
      prisma.inventoryTransaction.create({
        data: {
          itemId: id,
          date: new Date(input.date),
          quantity: input.quantity,
          direction: 'out',
          reason: 'Stock Out',
          notes: input.notes ?? undefined,
          ownerId,
        },
        include: ownerInclude,
      }),
    ]);

    return {
      item: await this.findById(id),
      transaction: serializeTxn(txn),
    };
  }

  async findTransactions(itemId: string) {
    await this.findById(itemId);
    const rows = await prisma.inventoryTransaction.findMany({
      where: { itemId, deletedAt: null },
      include: ownerInclude,
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rows.map(serializeTxn);
  }
}

export const inventoryService = new InventoryService();
