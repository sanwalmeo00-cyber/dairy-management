import prisma from '../database/prisma';
import { cacheGet, cacheSet } from '../utils/cache';
import { isOnFarmStatus } from '@/lib/goatStatus';

const CACHE_KEY = 'dashboard:overview';
const CACHE_TTL_MS = 60_000;

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(d: Date) {
  return d.toLocaleString('en-US', { month: 'short' });
}

function lastNMonths(n: number) {
  const months: { key: string; label: string; start: Date; end: Date }[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
    months.push({ key: monthKey(start), label: monthLabel(start), start, end });
  }
  return months;
}

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toISOString().slice(0, 10);
}

async function buildDashboard() {
  const months = lastNMonths(6);
  const rangeStart = months[0].start;

  const [
    goats,
    kids,
    sales,
    expenses,
    salesInRange,
    expensesInRange,
    inventoryItems,
    recentGoats,
    recentSales,
    recentExpenses,
    recentBreedings,
    recentPayments,
    recentInventory,
  ] = await Promise.all([
    prisma.goat.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        tagNumber: true,
        gender: true,
        status: true,
        breed: true,
        currentValue: true,
        createdAt: true,
      },
    }),
    prisma.kid.findMany({
      where: { deletedAt: null },
      select: { id: true, createdAt: true, dateOfBirth: true },
    }),
    prisma.sale.findMany({
      where: { deletedAt: null },
      select: { salePrice: true, date: true, createdAt: true, tagNumber: true },
    }),
    prisma.expense.findMany({
      where: { deletedAt: null },
      select: { amount: true, date: true, createdAt: true, description: true },
    }),
    prisma.sale.findMany({
      where: { deletedAt: null, date: { gte: rangeStart } },
      select: { salePrice: true, date: true },
    }),
    prisma.expense.findMany({
      where: { deletedAt: null, date: { gte: rangeStart } },
      select: { amount: true, date: true },
    }),
    prisma.inventoryItem.findMany({
      where: { deletedAt: null },
      select: { currentStock: true, minimumStock: true },
    }),
    prisma.goat.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, tagNumber: true, createdAt: true },
    }),
    prisma.sale.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, tagNumber: true, createdAt: true },
    }),
    prisma.expense.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, description: true, createdAt: true },
    }),
    prisma.breeding.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, createdAt: true },
    }),
    prisma.workerPayment.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, type: true, createdAt: true },
    }),
    prisma.inventoryTransaction.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, direction: true, createdAt: true },
    }),
  ]);

  const activeGoats = goats.filter((g) => isOnFarmStatus(g.status));
  const totalSales = sales.reduce((s, r) => s + Number(r.salePrice), 0);
  const totalExpenses = expenses.reduce((s, r) => s + Number(r.amount), 0);
  const profitOrLoss = totalSales - totalExpenses;
  const lowStockItems = inventoryItems.filter(
    (i) => Number(i.currentStock) <= 0 || Number(i.currentStock) < Number(i.minimumStock)
  ).length;

  const salesVsExpenses = months.map((m) => {
    const monthSales = salesInRange
      .filter((r) => r.date >= m.start && r.date <= m.end)
      .reduce((s, r) => s + Number(r.salePrice), 0);
    const monthExpenses = expensesInRange
      .filter((r) => r.date >= m.start && r.date <= m.end)
      .reduce((s, r) => s + Number(r.amount), 0);
    return { month: m.label, sales: monthSales, expenses: monthExpenses };
  });

  const population = months.map((m) => {
    const adults = goats.filter((g) => g.createdAt <= m.end).length;
    const kidCount = kids.filter((k) => (k.dateOfBirth ?? k.createdAt) <= m.end).length;
    return { month: m.label, adults, kids: kidCount };
  });

  const genderMap = new Map<string, number>();
  for (const g of goats) {
    genderMap.set(g.gender, (genderMap.get(g.gender) ?? 0) + 1);
  }
  const gender = [...genderMap.entries()].map(([name, value]) => ({ name, value }));

  const statusMap = new Map<string, number>();
  for (const g of goats) {
    statusMap.set(g.status, (statusMap.get(g.status) ?? 0) + 1);
  }
  const status = [...statusMap.entries()].map(([name, value]) => ({ name, value }));

  const breedMap = new Map<string, number>();
  for (const g of goats) {
    const breed = g.breed || 'Other';
    breedMap.set(breed, (breedMap.get(breed) ?? 0) + 1);
  }
  const breeds = [...breedMap.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  type Act = { id: string; message: string; timeAgo: string; type: string; at: Date };
  const rawActivities: Act[] = [
    ...recentGoats.map((g) => ({
      id: `goat-${g.id}`,
      message: `Goat tagged ${g.tagNumber}`,
      timeAgo: timeAgo(g.createdAt),
      type: 'goat',
      at: g.createdAt,
    })),
    ...recentSales.map((s) => ({
      id: `sale-${s.id}`,
      message: `Sale recorded · tag ${s.tagNumber}`,
      timeAgo: timeAgo(s.createdAt),
      type: 'sale',
      at: s.createdAt,
    })),
    ...recentExpenses.map((e) => ({
      id: `expense-${e.id}`,
      message: `Expense · ${e.description}`,
      timeAgo: timeAgo(e.createdAt),
      type: 'expense',
      at: e.createdAt,
    })),
    ...recentBreedings.map((b) => ({
      id: `breeding-${b.id}`,
      message: 'Breeding planned',
      timeAgo: timeAgo(b.createdAt),
      type: 'breeding',
      at: b.createdAt,
    })),
    ...recentPayments.map((p) => ({
      id: `payment-${p.id}`,
      message: `Worker ${p.type.toLowerCase()} recorded`,
      timeAgo: timeAgo(p.createdAt),
      type: 'payment',
      at: p.createdAt,
    })),
    ...recentInventory.map((t) => ({
      id: `inv-${t.id}`,
      message: t.direction === 'in' ? 'Stock in recorded' : 'Stock out recorded',
      timeAgo: timeAgo(t.createdAt),
      type: 'inventory',
      at: t.createdAt,
    })),
  ];

  const activities = rawActivities
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 10)
    .map(({ id, message, timeAgo: ago, type }) => ({ id, message, timeAgo: ago, type }));

  return {
    stats: {
      totalGoats: goats.length,
      activeGoats: activeGoats.length,
      kids: kids.length,
      totalSales,
      totalExpenses,
      profitOrLoss,
      lowStockItems,
    },
    charts: {
      salesVsExpenses,
      population,
      gender,
      status,
      breeds,
    },
    activities,
    cachedAt: new Date().toISOString(),
  };
}

export type DashboardPayload = Awaited<ReturnType<typeof buildDashboard>>;

export class DashboardService {
  async getOverview(options?: { refresh?: boolean }) {
    if (!options?.refresh) {
      const cached = cacheGet<DashboardPayload>(CACHE_KEY);
      if (cached) {
        return { ...cached, fromCache: true as const };
      }
    }

    const data = await buildDashboard();
    cacheSet(CACHE_KEY, data, CACHE_TTL_MS);
    return { ...data, fromCache: false as const };
  }
}

export const dashboardService = new DashboardService();
