/**
 * Wipe all Turso data and create a fresh Super Admin.
 * Credentials: admin@gmail.com / admin
 */
import { PrismaClient, Role } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import bcrypt from 'bcryptjs';

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
if (!url || !authToken) {
  console.error('TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are required (.env.local)');
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaLibSql({
    url: url.replace(/^libsql:\/\//i, 'https://'),
    authToken,
  }),
});

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin';
const ADMIN_NAME = 'Super Admin';

async function wipeAll() {
  // Leaf → parent order (respect FKs)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.workerPayment.deleteMany();
  await prisma.worker.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.goatPurchase.deleteMany();
  await prisma.milkRecord.deleteMany();
  await prisma.kid.deleteMany();
  await prisma.breeding.deleteMany();
  await prisma.goat.updateMany({ data: { fatherId: null, motherId: null } });
  await prisma.goat.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  console.log('Wiping all database records…');
  await wipeAll();

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const admin = await prisma.user.create({
    data: {
      id: 'admin-1',
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      phone: null,
      role: Role.SUPER_ADMIN,
      status: 'Active',
      passwordHash,
    },
  });

  console.log('Database reset complete.');
  console.log(`  SUPER_ADMIN  ${admin.email}  /  ${ADMIN_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
