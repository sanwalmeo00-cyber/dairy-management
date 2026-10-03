'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Rabbit, Baby, TrendingUp, Wallet, Scale, Plus } from 'lucide-react';
import { dashboardService, type DashboardData } from '@/services/dashboard';
import { useToast } from '@/context/ToastContext';
import { PageHeader, StatCard, Card, Button, LoadingState } from '@/components/ui';
import { formatCurrency } from '@/lib/format';

const DashboardCharts = dynamic(
  () =>
    import('@/components/dashboard/DashboardCharts').then((m) => m.DashboardCharts),
  {
    ssr: false,
    loading: () => (
      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card className="h-64 animate-pulse bg-muted/40"> </Card>
        <Card className="h-64 animate-pulse bg-muted/40"> </Card>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const { toast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async (refresh = false) => {
    setLoading(true);
    try {
      setData(await dashboardService.getAll({ refresh }));
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load dashboard', 'error');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !data) {
    return <LoadingState label="Loading dashboard…" />;
  }

  if (!data) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Overview of your farm operations." />
        <p className="text-sm text-muted-fg">Could not load dashboard data.</p>
        <Button className="mt-3" onClick={() => void load(true)}>
          Retry
        </Button>
      </div>
    );
  }

  const { stats, charts, activities } = data;

  const quickActions = [
    { label: 'Add Animal', href: '/goats/new' },
    { label: 'Record Birth', href: '/kids/new' },
    { label: 'Record Sale', href: '/cashbook/new?type=sale' },
    { label: 'Add Expense', href: '/cashbook/new?type=expense' },
    { label: 'Stock In', href: '/inventory/stock-in' },
  ];

  const profitOrLoss = stats.profitOrLoss ?? stats.totalSales - stats.totalExpenses;
  const isProfit = profitOrLoss >= 0;

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your farm operations.">
        <Button variant="outline" onClick={() => void load(true)}>
          Refresh
        </Button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Animals"
          value={String(stats.totalGoats)}
          hint={`${stats.activeGoats} active`}
          icon={<Rabbit className="h-5 w-5" />}
        />
        <StatCard label="Kids" value={String(stats.kids)} icon={<Baby className="h-5 w-5" />} />
        <StatCard
          label="Animal Sales"
          value={formatCurrency(stats.totalSales)}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <StatCard
          label="Total Expenses"
          value={formatCurrency(stats.totalExpenses)}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          label={isProfit ? 'Profit' : 'Loss'}
          value={
            isProfit
              ? formatCurrency(profitOrLoss)
              : `−${formatCurrency(Math.abs(profitOrLoss))}`
          }
          valueClassName={isProfit ? 'text-emerald-700' : 'text-red-700'}
          icon={<Scale className="h-5 w-5" />}
        />
      </div>

      <DashboardCharts charts={charts} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold">Recent Activity</h2>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-fg">No recent activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {activities.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                >
                  <p className="min-w-0 text-sm break-words">{a.message}</p>
                  <span className="shrink-0 text-xs text-muted-fg">{a.timeAgo}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Quick Actions</h2>
          <div className="flex flex-col gap-2">
            {quickActions.map((q) => (
              <Link key={q.href} href={q.href}>
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4" />
                  {q.label}
                </Button>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
