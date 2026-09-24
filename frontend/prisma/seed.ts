import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'password';

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@example.com' },
    update: {
      name: 'Super Admin',
      phone: '0300-0000000',
      role: Role.SUPER_ADMIN,
      status: 'Active',
      passwordHash,
      deletedAt: null,
    },
    create: {
      id: 'admin-1',
      email: 'superadmin@example.com',
      name: 'Super Admin',
      phone: '0300-0000000',
      role: Role.SUPER_ADMIN,
      status: 'Active',
      passwordHash,
    },
  });

  const partnerA = await prisma.user.upsert({
    where: { email: 'partnera@example.com' },
    update: {
      name: 'Partner A',
      phone: '0300-1112233',
      role: Role.USER,
      status: 'Active',
      createdBy: superAdmin.id,
      passwordHash,
      deletedAt: null,
    },
    create: {
      id: 'user-1',
      email: 'partnera@example.com',
      name: 'Partner A',
      phone: '0300-1112233',
      role: Role.USER,
      status: 'Active',
      createdBy: superAdmin.id,
      passwordHash,
    },
  });

  const partnerB = await prisma.user.upsert({
    where: { email: 'partnerb@example.com' },
    update: {
      name: 'Partner B',
      phone: '0300-4455667',
      role: Role.USER,
      status: 'Active',
      createdBy: superAdmin.id,
      passwordHash,
      deletedAt: null,
    },
    create: {
      id: 'user-2',
      email: 'partnerb@example.com',
      name: 'Partner B',
      phone: '0300-4455667',
      role: Role.USER,
      status: 'Active',
      createdBy: superAdmin.id,
      passwordHash,
    },
  });

  console.log('Seeded users into Neon:');
  console.log(`  SUPER_ADMIN  ${superAdmin.email}  / ${DEFAULT_PASSWORD}`);
  console.log(`  USER         ${partnerA.email}     / ${DEFAULT_PASSWORD}`);
  console.log(`  USER         ${partnerB.email}     / ${DEFAULT_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
