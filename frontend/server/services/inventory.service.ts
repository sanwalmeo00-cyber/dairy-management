import { Prisma, Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import {
  CreateInventoryItemInput,
  StockInInput,
  StockOutInput,
  UpdateInventoryItemInput,
} from '../validators/inventory.validator';

const ownerInclude = {
  owner: { select: { id: true, name: true } },
} as const;

type ItemRow = Prisma.InventoryItemGetPayload<{ include: typeof ownerInclude }>;
type TxnRow = Prisma.InventoryTransactionGetPayload<{ include: typeof ownerInclude }>;

function deriveStatus(currentStock: number, minimumStock: number) {
  if (currentStock <= 0) return 'Out of Stock';
  if (currentStock < minimumStock) return 'Low Stock';
  return 'In Stock';
}

function deriveDaysLeft(currentStock: number, dailyUsage: number | null) {
  if (dailyUsage == null || dailyUsage <= 0) return null;
  return Math.floor(currentStock / dailyUsage);
}

function deriveExpiryStatus(expiryDate: Date | null) {
  if (!expiryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDate);
  exp.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Expired';
  if (diffDays <= 30) return 'Expiring soon';
  return 'Ok';
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
    daysLeft: deriveDaysLeft(currentStock, dailyUsage),
    expiryDate: row.expiryDate ? row.expiryDate.toISOString().slice(0, 10) : undefined,
    expiryStatus: deriveExpiryStatus(row.expiryDate),
    supplier: row.supplier ?? undefined,
    notes: row.notes ?? undefined,
    status: deriveStatus(currentStock, minimumStock),
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
        currentStock: input.currentStock,
        minimumStock: input.minimumStock,
        cost: input.cost,
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

    const [, txn] = await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id },
        data: { currentStock: { increment: input.quantity } },
      }),
      prisma.inventoryTransaction.create({
        data: {
          itemId: id,
          date: new Date(input.date),
          quantity: input.quantity,
          direction: 'in',
          reason: input.reason ?? 'Stock In',
          supplier: input.supplier ?? undefined,
          cost: input.cost ?? undefined,
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
          reason: input.reason,
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
      orderBy: { date: 'desc' },
    });
    return rows.map(serializeTxn);
  }
}

export const inventoryService = new InventoryService();
