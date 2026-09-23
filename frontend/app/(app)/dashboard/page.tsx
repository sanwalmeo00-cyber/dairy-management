'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Rabbit,
  Baby,
  TrendingUp,
  Wallet,
  Landmark,
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
import { dashboardService } from '@/services/dashboard';
import { PageHeader, StatCard, Card, Button } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import type { ActivityItem } from '@/types/farm';

const PIE_COLORS = ['#2d5a3d', '#c4a35a', '#8fa392', '#b42318'];

export default function DashboardPage() {
  const [stats, setStats] = useState<Awaited<ReturnType<typeof dashboardService.getStats>> | null>(
    null
  );
  const [charts, setCharts] = useState<Awaited<ReturnType<typeof dashboardService.getCharts>> | null>(
    null
  );
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    void (async () => {
      setStats(await dashboardService.getStats());
      setCharts(await dashboardService.getCharts());
      setActivities(await dashboardService.getActivities());
    })();
  }, []);

  if (!stats || !charts) {
    return <p className="text-sm text-muted-fg">Loading dashboard…</p>;
  }

  const quickActions = [
    { label: 'Add Goat', href: '/goats/new' },
    { label: 'Record Sale', href: '/sales/new' },
    { label: 'Add Expense', href: '/expenses/new' },
    { label: 'Plan Breeding', href: '/breeding/new' },
    { label: 'Stock In', href: '/inventory/stock-in' },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your goat farm operations." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total Goats"
          value={String(stats.totalGoats)}
          hint={`${stats.activeGoats} active`}
          icon={<Rabbit className="h-5 w-5" />}
        />
        <StatCard
          label="Kids"
          value={String(stats.kids)}
          icon={<Baby className="h-5 w-5" />}
        />
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
          label="Farm Value"
          value={formatCurrency(stats.farmValue)}
          icon={<Landmark className="h-5 w-5" />}
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Sales vs Expenses</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.salesVsExpenses}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                <Legend />
                <Bar dataKey="sales" fill="#2d5a3d" name="Sales" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#c4a35a" name="Expenses" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Population Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.population}>
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="adults" stroke="#2d5a3d" name="Adults" strokeWidth={2} />
                <Line type="monotone" dataKey="kids" stroke="#c4a35a" name="Kids" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Gender Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.gender}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {charts.gender.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Goat Status</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.status}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label
                >
                  {charts.status.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="mb-4 font-semibold">Recent Activity</h2>
          <ul className="space-y-3">
            {activities.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <p className="text-sm">{a.message}</p>
                <span className="shrink-0 text-xs text-muted-fg">{a.timeAgo}</span>
              </li>
            ))}
          </ul>
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
