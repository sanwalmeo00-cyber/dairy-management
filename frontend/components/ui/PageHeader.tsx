import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button } from './Button';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: { label: string; href?: string; onClick?: () => void };
  children?: ReactNode;
}

export function PageHeader({ title, description, action, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-fg">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {action?.href && (
          <Link href={action.href}>
            <Button>{action.label}</Button>
          </Link>
        )}
        {action?.onClick && !action.href && (
          <Button onClick={action.onClick}>{action.label}</Button>
        )}
      </div>
    </div>
  );
}
