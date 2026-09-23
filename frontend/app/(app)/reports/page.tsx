'use client';

import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { dashboardService } from '@/services/dashboard';
import { PageHeader, Card, Input, Select, Button } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/format';

const PIE_COLORS = ['#2d5a3d', '#c4a35a', '#8fa392', '#b42318'];

export default function ReportsPage() {
  const { toast } = useToast();
  const [charts, setCharts] = useState<Awaited<ReturnType<typeof dashboardService.getCharts>> | null>(
    null
  );
  const [from, setFrom] = useState('2025-04-01');
  const [to, setTo] = useState('2026-09-30');
  const [reportType, setReportType] = useState('financial');

  useEffect(() => {
    void dashboardService.getCharts().then(setCharts);
  }, []);

  if (!charts) return <p className="text-sm text-muted-fg">Loading reports…</p>;

  return (
    <div>
      <PageHeader title="Reports" description="Generate insights for farm performance." />

      <Card className="mb-6">
        <h2 className="mb-4 font-semibold">Filters</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <Select
            label="Report type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            options={[
              { label: 'Financial', value: 'financial' },
              { label: 'Herd', value: 'herd' },
              { label: 'Inventory', value: 'inventory' },
            ]}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => toast(`Report generated (${from} – ${to}, mock)`)}>Generate</Button>
          <Button variant="outline" onClick={() => toast('Export started (mock PDF/CSV)')}>
            Export
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Sales vs Expenses</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.salesVsExpenses}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                <Legend />
                <Bar dataKey="sales" fill="#2d5a3d" name="Sales" />
                <Bar dataKey="expenses" fill="#c4a35a" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Breed Distribution</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.breeds} dataKey="value" nameKey="name" outerRadius={90} label>
                  {charts.breeds.map((_, i) => (
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
          <h2 className="mb-4 font-semibold">Gender Split</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.gender} dataKey="value" nameKey="name" outerRadius={90} label>
                  {charts.gender.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold">Population Trend</h2>
          <p className="mb-2 text-sm text-muted-fg">
            Adults vs kids over recent months (mock data).
          </p>
          <ul className="space-y-1 text-sm">
            {charts.population.map((p) => (
              <li key={p.month} className="flex justify-between border-b border-border py-1">
                <span>{p.month}</span>
                <span>
                  {p.adults} adults · {p.kids} kids
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
