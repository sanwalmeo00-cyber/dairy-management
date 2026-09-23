import { cn } from '@/lib/format';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, required, ...props }: InputProps) {
  const inputId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      <input
        id={inputId}
        required={required}
        className={cn(
          'h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none transition placeholder:text-muted-fg focus:border-primary focus:ring-2 focus:ring-ring/20',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
          className
        )}
        aria-invalid={error ? true : undefined}
        {...props}
      />
      {error && <p className="text-xs font-medium text-red-700">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-fg">{hint}</p>}
    </div>
  );
}
