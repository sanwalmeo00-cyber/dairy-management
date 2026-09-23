import { Inbox, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from './Button';

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-fg">
        <Inbox className="h-5 w-5" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-fg">{description}</p>}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-4">
          <Button>{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-fg">
      <Loader2 className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong.',
  description = "We couldn't load this data.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 px-6 py-16 text-center">
      <AlertTriangle className="mb-3 h-6 w-6 text-danger" />
      <h3 className="text-base font-semibold text-red-900">{title}</h3>
      <p className="mt-1 text-sm text-red-700">{description}</p>
      {onRetry && (
        <Button className="mt-4" variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted ${className ?? 'h-4 w-full'}`} />;
}
