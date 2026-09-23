import { cn } from '@/lib/format';
import type { SelectHTMLAttributes } from 'react';

interface Option {
  label: string;
  value: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Option[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  options,
  placeholder,
  className,
  id,
  required,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      <select
        id={selectId}
        required={required}
        className={cn(
          'h-10 w-full rounded-lg border border-border bg-card px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20',
          error && 'border-danger',
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
