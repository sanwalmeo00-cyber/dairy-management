import { cn } from '@/lib/format';
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  className?: string;
  /** Hide this column in the mobile card list (still shown on desktop). */
  hideOnMobile?: boolean;
  render: (row: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  empty?: ReactNode;
  /** Clicking a row (outside buttons/links) opens detail. */
  onRowClick?: (row: T) => void;
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest('button, a, input, select, textarea, label, [data-stop-row-click]')
  );
}

export function Table<T>({ columns, data, rowKey, empty, onRowClick }: TableProps<T>) {
  if (data.length === 0) {
    return <>{empty}</>;
  }

  const clickable = Boolean(onRowClick);
  const mobileColumns = columns.filter((col) => !col.hideOnMobile);

  const handleActivate = (row: T, e: MouseEvent | KeyboardEvent) => {
    if (!onRowClick) return;
    if ('key' in e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
    } else if (isInteractiveTarget(e.target)) {
      return;
    }
    onRowClick(row);
  };

  return (
    <>
      {/* Mobile: compact list rows */}
      <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card md:hidden">
        {data.map((row) => {
          const actionCol = mobileColumns.find((c) => !c.header);
          const infoCols = mobileColumns.filter((c) => c.header);
          const actionContent = actionCol?.render(row);
          const hasActions = actionContent != null && actionContent !== false;

          return (
            <div
              key={rowKey(row)}
              role={clickable ? 'button' : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={(e) => handleActivate(row, e)}
              onKeyDown={(e) => handleActivate(row, e)}
              className={cn(
                'px-3 py-3 touch-manipulation',
                clickable && 'cursor-pointer transition-colors active:bg-muted/50'
              )}
            >
              {hasActions ? (
                <div
                  data-stop-row-click
                  className="-mr-1 -mt-1 mb-1 flex items-center justify-end gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  {actionContent}
                </div>
              ) : null}
              <dl className="min-w-0 space-y-1">
                {infoCols.map((col) => {
                  const content = col.render(row);
                  if (content == null || content === false) return null;
                  return (
                    <div key={col.key} className="flex items-baseline justify-between gap-3 text-sm">
                      <dt className="shrink-0 text-xs text-muted-fg">{col.header}</dt>
                      <dd
                        className={cn(
                          'min-w-0 text-right font-medium break-words',
                          col.className
                        )}
                      >
                        {content}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          );
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden w-full overflow-x-auto rounded-xl border border-border bg-card md:block">
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
              <tr
                key={rowKey(row)}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={(e) => handleActivate(row, e)}
                onKeyDown={(e) => handleActivate(row, e)}
                className={cn(
                  'border-b border-border last:border-0 hover:bg-muted/40',
                  clickable && 'cursor-pointer'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('whitespace-nowrap px-4 py-3', col.className)}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
