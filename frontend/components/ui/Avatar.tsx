import { cn } from '@/lib/format';

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-fg',
        className
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}
