'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Rabbit,
  Baby,
  TrendingUp,
  Wallet,
  Scale,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardService, type DashboardData } from '@/services/dashboard';
import { useToast } from '@/context/ToastContext';
import { PageHeader, StatCard, Card, Button } from '@/components/ui';
import { formatCurrency } from '@/lib/format';

const PIE_COLORS = ['#2d5a3d', '#c4a35a', '#8fa392', '#b42318'];

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
    return <p className="text-sm text-muted-fg">Loading dashboard…</p>;
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
          label="Total Sales"
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
          value={formatCurrency(Math.abs(profitOrLoss))}
          hint={isProfit ? 'Sales minus expenses' : 'Expenses exceed sales'}
          icon={<Scale className="h-5 w-5" />}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Sales vs Expenses</h2>
          <div className="h-56 w-full min-w-0 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.salesVsExpenses} margin={{ left: -10, right: 8 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={48} />
                <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="sales" fill="#2d5a3d" name="Sales" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#c4a35a" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Population Trend</h2>
          <div className="h-56 w-full min-w-0 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.population} margin={{ left: -10, right: 8 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={36} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="adults" stroke="#2d5a3d" name="Adults" strokeWidth={2} />
                <Line type="monotone" dataKey="kids" stroke="#c4a35a" name="Kids" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Gender Distribution</h2>
          <div className="h-56 w-full min-w-0 sm:h-64">
            {charts.gender.length === 0 ? (
              <p className="text-sm text-muted-fg">No goats yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.gender}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label
                  >
                    {charts.gender.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Animal Status</h2>
          <div className="h-56 w-full min-w-0 sm:h-64">
            {charts.status.length === 0 ? (
              <p className="text-sm text-muted-fg">No goats yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.status}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label
                  >
                    {charts.status.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

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
