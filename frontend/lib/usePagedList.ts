'use client';

import { useEffect, useMemo, useState } from 'react';

export const DEFAULT_PAGE_SIZE = 10;

/** Client-side pagination that resets to page 1 when `resetKey` changes (e.g. filters). */
export function usePagedList<T>(items: T[], resetKey: unknown, pageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  return { page: safePage, setPage, paged, pageSize, total: items.length };
}
