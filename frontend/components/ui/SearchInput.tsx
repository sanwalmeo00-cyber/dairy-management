import { Search } from 'lucide-react';
import { cn } from '@/lib/format';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-fg" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-border bg-card pr-3 pl-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/20"
      />
    </div>
  );
}
