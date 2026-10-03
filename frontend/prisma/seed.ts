import { PrismaClient, Role } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';

const adapter = new PrismaLibSql({
  url: process.env.TURSO_DATABASE_URL!.replace(/^libsql:\/\//i, 'https://'),
  authToken: process.env.TURSO_AUTH_TOKEN,
});
const prisma = new PrismaClient({ adapter });

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin';

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: 'Super Admin',
      role: Role.SUPER_ADMIN,
      status: 'Active',
      passwordHash,
      deletedAt: null,
    },
    create: {
      id: 'admin-1',
      email: ADMIN_EMAIL,
      name: 'Super Admin',
      role: Role.SUPER_ADMIN,
      status: 'Active',
      passwordHash,
    },
  });

  console.log('Seeded Super Admin into Turso:');
  console.log(`  SUPER_ADMIN  ${superAdmin.email}  / ${ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
