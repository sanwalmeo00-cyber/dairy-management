'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { inventoryService } from '@/services/dashboard';
import type { InventoryItem } from '@/types/farm';
import {
  PageHeader,
  SearchInput,
  Select,
  Table,
  Badge,
  statusTone,
  Button,
  EmptyState,
} from '@/components/ui';
import { formatCurrency } from '@/lib/format';

export default function InventoryPage() {
  const [rows, setRows] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    void inventoryService.getAll().then(setRows);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((i) => {
      if (category && i.category !== category) return false;
      if (!q) return true;
      return i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q);
    });
  }, [rows, search, category]);

  return (
    <div>
      <PageHeader title="Inventory" description="Feed, medicine, and supplies on hand.">
        <Link href="/inventory/stock-in">
          <Button variant="outline">Stock In</Button>
        </Link>
        <Link href="/inventory/stock-out">
          <Button variant="outline">Stock Out</Button>
        </Link>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={search} onChange={setSearch} placeholder="Search items…" className="sm:max-w-xs" />
        <Select
          options={['Goat Feed', 'Medicine', 'Vaccines', 'Equipment', 'Other Supplies'].map((c) => ({
            label: c,
            value: c,
          }))}
          placeholder="All categories"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="sm:w-44"
        />
      </div>

      <Table
        data={filtered}
        rowKey={(i) => i.id}
        empty={<EmptyState title="No inventory items" description="Add stock to track supplies." />}
        columns={[
          { key: 'name', header: 'Item', render: (i) => i.name },
          { key: 'cat', header: 'Category', render: (i) => i.category },
          {
            key: 'stock',
            header: 'Stock',
            render: (i) => `${i.currentStock} ${i.unit}`,
          },
          { key: 'min', header: 'Minimum', render: (i) => `${i.minimumStock} ${i.unit}` },
          { key: 'cost', header: 'Unit Cost', render: (i) => formatCurrency(i.cost) },
          {
            key: 'status',
            header: 'Status',
            render: (i) => <Badge tone={statusTone(i.status)}>{i.status}</Badge>,
          },
          {
            key: 'owner',
            header: 'Owner',
            render: () => <Badge tone="neutral">Shared</Badge>,
          },
          {
            key: 'actions',
            header: '',
            className: 'text-right',
            render: (i) => (
              <Link href={`/inventory/${i.id}`}>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </Link>
            ),
          },
        ]}
      />
    </div>
  );
}
