'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/format';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  /** Show eye icon to reveal/hide password (for type="password"). */
  passwordToggle?: boolean;
}

export function Input({
  label,
  error,
  hint,
  className,
  id,
  required,
  passwordToggle = false,
  type,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password' || passwordToggle;
  const showToggle = passwordToggle || type === 'password';
  const inputType = showToggle && isPassword ? (visible ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          required={required}
          type={inputType}
          className={cn(
            'h-11 w-full rounded-lg border border-border bg-card px-3 text-base outline-none transition placeholder:text-muted-fg focus:border-primary focus:ring-2 focus:ring-ring/20 sm:h-10 sm:text-sm',
            showToggle && 'pr-11',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        />
        {showToggle && (
          <button
            type="button"
            className="absolute top-1/2 right-1.5 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-fg hover:bg-muted hover:text-foreground"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs font-medium text-red-700">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-fg">{hint}</p>}
    </div>
  );
}
