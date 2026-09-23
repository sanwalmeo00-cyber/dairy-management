import { cn } from '@/lib/format';
import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
}

export function Table<T>({ columns, data, rowKey, empty }: TableProps<T>) {
  if (data.length === 0) {
    return <>{empty}</>;
  }

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border bg-card">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-border bg-muted/60">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'whitespace-nowrap px-4 py-3 font-medium text-muted-fg',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={rowKey(row)} className="border-b border-border last:border-0 hover:bg-muted/40">
              {columns.map((col) => (
                <td key={col.key} className={cn('whitespace-nowrap px-4 py-3', col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
