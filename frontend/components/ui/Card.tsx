import { cn } from '@/lib/format';
import type { ReactNode } from 'react';

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5 shadow-sm', className)}>
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm text-muted-fg">{label}</p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight">
          {value}
        </p>
        {hint && <p className="mt-1 text-xs text-muted-fg">{hint}</p>}
      </div>
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
      )}
    </Card>
  );
}
