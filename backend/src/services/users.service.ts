import prisma from '../database/prisma';
import { NotFoundError } from '../utils/errors';
import { UpdateUserInput } from '../validators/users.validator';

const userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class UsersService {
  async findAll() {
    return prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  }

  async update(id: string, input: UpdateUserInput) {
    await this.findById(id);
    return prisma.user.update({
      where: { id },
      data: input,
      select: userSelect,
    });
  }
}

export const usersService = new UsersService();
