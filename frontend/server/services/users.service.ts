import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';
import prisma from '../database/prisma';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../utils/errors';
import {
  ChangePasswordInput,
  CreateUserInput,
  SetUserStatusInput,
  UpdateMeInput,
  UpdateUserInput,
} from '../validators/users.validator';

const userSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  status: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class UsersService {
  async findAll() {
    return prisma.user.findMany({
      where: { deletedAt: null },
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Active farm partners for attributing cashbook money in/out. */
  async findFinanceOptions() {
    return prisma.user.findMany({
      where: {
        deletedAt: null,
        status: 'Active',
        role: { not: Role.SUPER_ADMIN },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const user = await prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userSelect,
    });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async createBySuperAdmin(input: CreateUserInput, createdBy: string) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictError('Email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    return prisma.user.create({
      data: {
        email: input.email.toLowerCase().trim(),
        name: input.name.trim(),
        phone: input.phone?.trim() || null,
        passwordHash,
        role: Role.USER,
        status: 'Active',
        createdBy,
      },
      select: userSelect,
    });
  }

  async update(id: string, input: UpdateUserInput) {
    await this.findById(id);
    return prisma.user.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.status !== undefined && { status: input.status }),
      },
      select: userSelect,
    });
  }

  async updateMe(userId: string, input: UpdateMeInput) {
    await this.findById(userId);
    return prisma.user.update({
      where: { id: userId },
      data: {
        name: input.name.trim(),
        phone: input.phone?.trim() || null,
      },
      select: userSelect,
    });
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new NotFoundError('User not found');

    const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedError('Current password is incorrect');
    }
    if (input.currentPassword === input.newPassword) {
      throw new ValidationError('New password must be different from current password');
    }

    const passwordHash = await bcrypt.hash(input.newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return { changed: true };
  }

  async setStatus(id: string, input: SetUserStatusInput, actorId: string) {
    const user = await this.findById(id);

    if (user.role === Role.SUPER_ADMIN) {
      throw new ForbiddenError('Cannot change Super Admin status');
    }
    if (user.id === actorId) {
      throw new ForbiddenError('You cannot deactivate your own account');
    }

    return prisma.user.update({
      where: { id },
      data: { status: input.status },
      select: userSelect,
    });
  }
}

export const usersService = new UsersService();
