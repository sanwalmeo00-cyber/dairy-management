import { AlertCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/format';

export function FormError({
  message,
  className,
}: {
  message?: string | null;
  className?: string;
}) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800',
        className
      )}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

export function FieldHint({ children }: { children: ReactNode }) {
  return <p className="text-xs text-muted-fg">{children}</p>;
}
