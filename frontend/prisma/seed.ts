import { PrismaClient, Role } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = 'password';

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // Only Super Admin is seeded. Farm users are created by Super Admin in the app.
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

  // Remove demo partner accounts if they still exist
  await prisma.user.updateMany({
    where: {
      email: { in: ['partnera@example.com', 'partnerb@example.com'] },
      deletedAt: null,
    },
    data: { deletedAt: new Date(), deletedBy: superAdmin.id, status: 'Inactive' },
  });

  console.log('Seeded Super Admin only into Turso:');
  console.log(`  SUPER_ADMIN  ${superAdmin.email}  / ${DEFAULT_PASSWORD}`);
  console.log('Farm users: create via Users page (Super Admin).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
