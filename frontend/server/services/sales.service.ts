import { Prisma, Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { CreateSaleInput, UpdateSaleInput } from '../validators/sales.validator';
import {
  normalizeMoneyAccount,
  paymentMethodFromAccount,
} from '@/lib/moneyAccount';
import { setRecordAccount } from '../utils/account';

const ownerInclude = {
  owner: { select: { id: true, name: true } },
} as const;

type SaleRow = Prisma.SaleGetPayload<{ include: typeof ownerInclude }>;

function serialize(row: SaleRow) {
  const account = normalizeMoneyAccount(
    (row as SaleRow & { account?: string | null }).account
  );
  return {
    id: row.id,
    date: row.date.toISOString().slice(0, 10),
    tagNumber: row.tagNumber,
    goatId: row.goatId ?? undefined,
    buyer: row.buyer,
    salePrice: Number(row.salePrice),
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod,
    account,
    notes: row.notes ?? undefined,
    ownerId: row.ownerId,
    ownerName: row.owner.name,
    addedById: row.ownerId,
    addedByName: row.owner.name,
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

function resolveAccountAndMethod(input: {
  account?: string | null;
  paymentMethod?: string | null;
}) {
  const account = normalizeMoneyAccount(input.account);
  const paymentMethod =
    input.paymentMethod?.trim() || paymentMethodFromAccount(account);
  return { account, paymentMethod };
}

export class SalesService {
  async findAll() {
    const rows = await prisma.sale.findMany({
      where: { deletedAt: null },
      include: ownerInclude,
      orderBy: { date: 'desc' },
    });
    return rows.map(serialize);
  }

  async findById(id: string) {
    const row = await prisma.sale.findFirst({
      where: { id, deletedAt: null },
      include: ownerInclude,
    });
    if (!row) throw new NotFoundError('Sale not found');
    return serialize(row);
  }

  async create(input: CreateSaleInput, addedById: string, goatId?: string | null) {
    const { account, paymentMethod } = resolveAccountAndMethod(input);
    const row = await prisma.sale.create({
      data: {
        date: new Date(input.date),
        tagNumber: input.tagNumber?.trim() || '—',
        goatId: goatId ?? undefined,
        buyer: input.buyer.trim(),
        salePrice: input.salePrice,
        paymentStatus: input.paymentStatus,
        paymentMethod,
        notes: input.notes ?? undefined,
        ownerId: addedById,
      },
      include: ownerInclude,
    });
    await setRecordAccount(prisma, 'Sale', row.id, account);
    return serialize({ ...row, account } as SaleRow & { account: string });
  }

  async update(id: string, input: UpdateSaleInput, userId: string, role: Role) {
    const existing = await prisma.sale.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Sale not found');
    assertCanModify(existing.ownerId, userId, role);

    const accountPatch =
      input.account !== undefined || input.paymentMethod !== undefined
        ? resolveAccountAndMethod({
            account: input.account ?? (existing as { account?: string }).account,
            paymentMethod: input.paymentMethod,
          })
        : null;

    const row = await prisma.sale.update({
      where: { id },
      data: {
        ...(input.date !== undefined && { date: new Date(input.date) }),
        ...(input.tagNumber !== undefined && {
          tagNumber: input.tagNumber?.trim() || '—',
        }),
        ...(input.buyer !== undefined && { buyer: input.buyer.trim() }),
        ...(input.salePrice !== undefined && { salePrice: input.salePrice }),
        ...(input.paymentStatus !== undefined && { paymentStatus: input.paymentStatus }),
        ...(accountPatch && { paymentMethod: accountPatch.paymentMethod }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      include: ownerInclude,
    });
    if (accountPatch) {
      await setRecordAccount(prisma, 'Sale', id, accountPatch.account);
    }
    return serialize({
      ...row,
      account: accountPatch?.account ?? (row as { account?: string }).account,
    } as SaleRow & { account?: string });
  }

  async remove(id: string, userId: string, role: Role) {
    const existing = await prisma.sale.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Sale not found');
    assertCanModify(existing.ownerId, userId, role);

    const row = await prisma.sale.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
      include: ownerInclude,
    });
    return serialize(row);
  }
}

export const salesService = new SalesService();
