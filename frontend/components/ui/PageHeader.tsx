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
    <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-muted-fg sm:max-w-2xl">{description}</p>
        )}
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
        {children}
        {action?.href && (
          <Link href={action.href} className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">{action.label}</Button>
          </Link>
        )}
        {action?.onClick && !action.href && (
          <Button className="w-full sm:w-auto" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}
