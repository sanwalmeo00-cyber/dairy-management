import { Prisma, Role } from '@prisma/client';
import prisma from '../database/prisma';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { CreateWorkerInput, UpdateWorkerInput } from '../validators/workers.validator';

const ownerInclude = {
  owner: { select: { id: true, name: true } },
} as const;

function serialize(row: Prisma.WorkerGetPayload<{ include: typeof ownerInclude }>) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    role: row.role,
    salary: Number(row.salary),
    joiningDate: row.joiningDate.toISOString().slice(0, 10),
    status: row.status,
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

export class WorkersService {
  async findAll() {
    const rows = await prisma.worker.findMany({
      where: { deletedAt: null },
      include: ownerInclude,
      orderBy: { name: 'asc' },
    });
    return rows.map(serialize);
  }

  async findById(id: string) {
    const row = await prisma.worker.findFirst({
      where: { id, deletedAt: null },
      include: ownerInclude,
    });
    if (!row) throw new NotFoundError('Worker not found');
    return serialize(row);
  }

  async create(input: CreateWorkerInput, ownerId: string) {
    const row = await prisma.worker.create({
      data: {
        name: input.name.trim(),
        phone: input.phone.trim(),
        role: input.role.trim(),
        salary: input.salary,
        joiningDate: new Date(input.joiningDate),
        status: input.status,
        notes: input.notes ?? undefined,
        ownerId,
      },
      include: ownerInclude,
    });
    return serialize(row);
  }

  async update(id: string, input: UpdateWorkerInput, userId: string, role: Role) {
    const existing = await prisma.worker.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Worker not found');
    assertCanModify(existing.ownerId, userId, role);

    const row = await prisma.worker.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.phone !== undefined && { phone: input.phone.trim() }),
        ...(input.role !== undefined && { role: input.role.trim() }),
        ...(input.salary !== undefined && { salary: input.salary }),
        ...(input.joiningDate !== undefined && { joiningDate: new Date(input.joiningDate) }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.notes !== undefined && { notes: input.notes }),
      },
      include: ownerInclude,
    });
    return serialize(row);
  }

  async remove(id: string, userId: string, role: Role) {
    const existing = await prisma.worker.findFirst({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundError('Worker not found');
    assertCanModify(existing.ownerId, userId, role);

    const row = await prisma.worker.update({
      where: { id },
      data: { deletedAt: new Date(), deletedBy: userId },
      include: ownerInclude,
    });
    return serialize(row);
  }

  async monthSummary(workerId: string, month: string) {
    const worker = await this.findById(workerId);
    const payments = await prisma.workerPayment.findMany({
      where: { workerId, forMonth: month, deletedAt: null },
    });

    const advances = payments
      .filter((p) => p.type === 'Advance')
      .reduce((s, p) => s + Number(p.amount), 0);
    const salaryPaid = payments
      .filter((p) => p.type === 'Salary')
      .reduce((s, p) => s + Number(p.amount), 0);
    const bonuses = payments
      .filter((p) => p.type === 'Bonus')
      .reduce((s, p) => s + Number(p.amount), 0);
    const other = payments
      .filter((p) => p.type === 'Other')
      .reduce((s, p) => s + Number(p.amount), 0);

    const monthlySalary = worker.salary;
    const balanceDue = Math.max(0, monthlySalary - advances - salaryPaid);

    return {
      workerId,
      month,
      monthlySalary,
      advances,
      salaryPaid,
      bonuses,
      other,
      balanceDue,
      totalPaid: advances + salaryPaid + bonuses + other,
    };
  }
}

export const workersService = new WorkersService();
