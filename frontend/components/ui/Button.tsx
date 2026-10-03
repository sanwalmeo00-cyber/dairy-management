import { cn } from '@/lib/format';
import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  loading?: boolean;
  loadingText?: string;
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg hover:bg-primary-hover active:bg-primary-hover',
  secondary: 'bg-accent text-accent-fg hover:opacity-90 active:opacity-90',
  ghost: 'bg-transparent text-foreground hover:bg-muted active:bg-muted',
  danger: 'bg-danger text-danger-fg hover:opacity-90 active:opacity-90',
  outline: 'border border-border bg-card text-foreground hover:bg-muted active:bg-muted',
};

const sizes: Record<Size, string> = {
  sm: 'min-h-10 px-3 text-sm sm:min-h-8 sm:h-8 sm:text-xs',
  md: 'min-h-11 px-4 text-base sm:min-h-10 sm:h-10 sm:text-sm',
  lg: 'min-h-12 px-5 text-base sm:min-h-11 sm:h-11 sm:text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  loading = false,
  loadingText = 'Saving…',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition touch-manipulation disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}
