import { cn } from '@/lib/format';
import type { TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, required, ...props }: TextareaProps) {
  const areaId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={areaId} className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      <textarea
        id={areaId}
        required={required}
        className={cn(
          'min-h-24 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none transition placeholder:text-muted-fg focus:border-primary focus:ring-2 focus:ring-ring/20',
          error && 'border-danger',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
