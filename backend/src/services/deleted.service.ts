import { Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ForbiddenError, NotFoundError, ValidationError } from '../utils/errors';
import { DeletedEntity, RestoreDeletedInput } from '../validators/deleted.validator';

type RawDeleted = {
  entity: DeletedEntity;
  recordId: string;
  label: string;
  ownerId: string;
  ownerName: string;
  deletedAt: Date;
  deletedBy: string | null;
};

const ownerInclude = { owner: { select: { id: true, name: true } } } as const;

async function resolveDeleterNames(rows: RawDeleted[]) {
  const ids = [...new Set(rows.map((r) => r.deletedBy).filter(Boolean))] as string[];
  if (!ids.length) return new Map<string, string>();
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  return new Map(users.map((u) => [u.id, u.name]));
}

function serialize(row: RawDeleted, deleterNames: Map<string, string>) {
  const deletedBy = row.deletedBy ?? '';
  return {
    id: `${row.entity}:${row.recordId}`,
    entity: row.entity,
    recordId: row.recordId,
    label: row.label,
    ownerId: row.ownerId,
    ownerName: row.ownerName,
    deletedAt: row.deletedAt.toISOString(),
    deletedBy,
    deletedByName: deletedBy ? deleterNames.get(deletedBy) ?? 'Unknown' : 'Unknown',
  };
}

function wants(entity: DeletedEntity | undefined, key: DeletedEntity) {
  return !entity || entity === key;
}

async function fetchDeleted(entity?: DeletedEntity): Promise<RawDeleted[]> {
  const rows: RawDeleted[] = [];

  if (wants(entity, 'goat')) {
    const goats = await prisma.goat.findMany({
      where: { deletedAt: { not: null } },
      include: ownerInclude,
      orderBy: { deletedAt: 'desc' },
    });
    for (const g of goats) {
      if (!g.deletedAt) continue;
      rows.push({
        entity: 'goat',
        recordId: g.id,
        label: `Goat ${g.tagNumber}`,
        ownerId: g.ownerId,
        ownerName: g.owner.name,
        deletedAt: g.deletedAt,
        deletedBy: g.deletedBy,
      });
    }
  }

  if (wants(entity, 'breeding')) {
    const breedings = await prisma.breeding.findMany({
      where: { deletedAt: { not: null } },
      include: {
        ...ownerInclude,
        femaleGoat: { select: { tagNumber: true } },
      },
      orderBy: { deletedAt: 'desc' },
    });
    for (const b of breedings) {
      if (!b.deletedAt) continue;
      rows.push({
        entity: 'breeding',
        recordId: b.id,
        label: `Breeding · female ${b.femaleGoat.tagNumber}`,
        ownerId: b.ownerId,
        ownerName: b.owner.name,
        deletedAt: b.deletedAt,
        deletedBy: b.deletedBy,
      });
    }
  }

  if (wants(entity, 'kid')) {
    const kids = await prisma.kid.findMany({
      where: { deletedAt: { not: null } },
      include: ownerInclude,
      orderBy: { deletedAt: 'desc' },
    });
    for (const k of kids) {
      if (!k.deletedAt) continue;
      rows.push({
        entity: 'kid',
        recordId: k.id,
        label: `Kid ${k.tagNumber}`,
        ownerId: k.ownerId,
        ownerName: k.owner.name,
        deletedAt: k.deletedAt,
        deletedBy: k.deletedBy,
      });
    }
  }

  if (wants(entity, 'goat-purchase')) {
    const purchases = await prisma.goatPurchase.findMany({
      where: { deletedAt: { not: null } },
      include: ownerInclude,
      orderBy: { deletedAt: 'desc' },
    });
    for (const p of purchases) {
      if (!p.deletedAt) continue;
      rows.push({
        entity: 'goat-purchase',
        recordId: p.id,
        label: `Purchase · tag ${p.tagNumber}`,
        ownerId: p.ownerId,
        ownerName: p.owner.name,
        deletedAt: p.deletedAt,
        deletedBy: p.deletedBy,
      });
    }
  }

  if (wants(entity, 'sale')) {
    const sales = await prisma.sale.findMany({
      where: { deletedAt: { not: null } },
      include: ownerInclude,
      orderBy: { deletedAt: 'desc' },
    });
    for (const s of sales) {
      if (!s.deletedAt) continue;
      rows.push({
        entity: 'sale',
        recordId: s.id,
        label: `Sale · tag ${s.tagNumber}`,
        ownerId: s.ownerId,
        ownerName: s.owner.name,
        deletedAt: s.deletedAt,
        deletedBy: s.deletedBy,
      });
    }
  }

  if (wants(entity, 'expense')) {
    const expenses = await prisma.expense.findMany({
      where: { deletedAt: { not: null } },
      include: ownerInclude,
      orderBy: { deletedAt: 'desc' },
    });
    for (const e of expenses) {
      if (!e.deletedAt) continue;
      rows.push({
        entity: 'expense',
        recordId: e.id,
        label: e.description,
        ownerId: e.ownerId,
        ownerName: e.owner.name,
        deletedAt: e.deletedAt,
        deletedBy: e.deletedBy,
      });
    }
  }

  if (wants(entity, 'worker')) {
    const workers = await prisma.worker.findMany({
      where: { deletedAt: { not: null } },
      include: ownerInclude,
      orderBy: { deletedAt: 'desc' },
    });
    for (const w of workers) {
      if (!w.deletedAt) continue;
      rows.push({
        entity: 'worker',
        recordId: w.id,
        label: `Worker · ${w.name}`,
        ownerId: w.ownerId,
        ownerName: w.owner.name,
        deletedAt: w.deletedAt,
        deletedBy: w.deletedBy,
      });
    }
  }

  if (wants(entity, 'inventory')) {
    const items = await prisma.inventoryItem.findMany({
      where: { deletedAt: { not: null } },
      include: ownerInclude,
      orderBy: { deletedAt: 'desc' },
    });
    for (const i of items) {
      if (!i.deletedAt) continue;
      rows.push({
        entity: 'inventory',
        recordId: i.id,
        label: `Inventory · ${i.name}`,
        ownerId: i.ownerId,
        ownerName: i.owner.name,
        deletedAt: i.deletedAt,
        deletedBy: i.deletedBy,
      });
    }
  }

  rows.sort((a, b) => b.deletedAt.getTime() - a.deletedAt.getTime());
  return rows;
}

function assertCanRestore(ownerId: string, userId: string, role: Role) {
  if (role === Role.SUPER_ADMIN || role === Role.ADMIN) return;
  if (ownerId !== userId) {
    throw new ForbiddenError('You cannot restore another user’s record');
  }
}

export class DeletedService {
  async findAll(userId: string, role: Role, entity?: DeletedEntity) {
    const rows = await fetchDeleted(entity);
    const visible =
      role === Role.SUPER_ADMIN || role === Role.ADMIN
        ? rows
        : rows.filter((r) => r.ownerId === userId || r.deletedBy === userId);
    const names = await resolveDeleterNames(visible);
    return visible.map((r) => serialize(r, names));
  }

  async restore(input: RestoreDeletedInput, userId: string, role: Role) {
    const { entity, recordId } = input;
    const clear = { deletedAt: null, deletedBy: null };

    switch (entity) {
      case 'goat': {
        const row = await prisma.goat.findFirst({
          where: { id: recordId, deletedAt: { not: null } },
        });
        if (!row) throw new NotFoundError('Deleted goat not found');
        assertCanRestore(row.ownerId, userId, role);
        await prisma.goat.update({ where: { id: recordId }, data: clear });
        break;
      }
      case 'breeding': {
        const row = await prisma.breeding.findFirst({
          where: { id: recordId, deletedAt: { not: null } },
        });
        if (!row) throw new NotFoundError('Deleted breeding record not found');
        assertCanRestore(row.ownerId, userId, role);
        await prisma.breeding.update({ where: { id: recordId }, data: clear });
        break;
      }
      case 'kid': {
        const row = await prisma.kid.findFirst({
          where: { id: recordId, deletedAt: { not: null } },
        });
        if (!row) throw new NotFoundError('Deleted kid not found');
        assertCanRestore(row.ownerId, userId, role);
        await prisma.kid.update({ where: { id: recordId }, data: clear });
        break;
      }
      case 'goat-purchase': {
        const row = await prisma.goatPurchase.findFirst({
          where: { id: recordId, deletedAt: { not: null } },
        });
        if (!row) throw new NotFoundError('Deleted goat purchase not found');
        assertCanRestore(row.ownerId, userId, role);
        await prisma.goatPurchase.update({ where: { id: recordId }, data: clear });
        break;
      }
      case 'sale': {
        const row = await prisma.sale.findFirst({
          where: { id: recordId, deletedAt: { not: null } },
        });
        if (!row) throw new NotFoundError('Deleted sale not found');
        assertCanRestore(row.ownerId, userId, role);
        await prisma.sale.update({ where: { id: recordId }, data: clear });
        break;
      }
      case 'expense': {
        const row = await prisma.expense.findFirst({
          where: { id: recordId, deletedAt: { not: null } },
        });
        if (!row) throw new NotFoundError('Deleted expense not found');
        assertCanRestore(row.ownerId, userId, role);
        await prisma.expense.update({ where: { id: recordId }, data: clear });
        break;
      }
      case 'worker': {
        const row = await prisma.worker.findFirst({
          where: { id: recordId, deletedAt: { not: null } },
        });
        if (!row) throw new NotFoundError('Deleted worker not found');
        assertCanRestore(row.ownerId, userId, role);
        await prisma.worker.update({ where: { id: recordId }, data: clear });
        break;
      }
      case 'inventory': {
        const row = await prisma.inventoryItem.findFirst({
          where: { id: recordId, deletedAt: { not: null } },
        });
        if (!row) throw new NotFoundError('Deleted inventory item not found');
        assertCanRestore(row.ownerId, userId, role);
        await prisma.inventoryItem.update({ where: { id: recordId }, data: clear });
        break;
      }
      default:
        throw new ValidationError('Unsupported entity type');
    }

    return { entity, recordId, restored: true };
  }
}

export const deletedService = new DeletedService();
