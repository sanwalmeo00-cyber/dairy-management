'use client';

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
import { Card } from '@/components/ui';
import { formatCurrency } from '@/lib/format';
import type { DashboardData } from '@/services/dashboard';

const PIE_COLORS = ['#2d5a3d', '#c4a35a', '#8fa392', '#b42318'];

export function DashboardCharts({ charts }: { charts: DashboardData['charts'] }) {
  return (
    <div className="mb-6 grid gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="mb-4 font-semibold">Animal Sales vs Expenses</h2>
        <div className="h-56 w-full min-w-0 sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={charts.salesVsExpenses} margin={{ left: -10, right: 8 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={48} />
              <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="sales" fill="#2d5a3d" name="Animal sales" radius={[4, 4, 0, 0]} />
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
  );
}
