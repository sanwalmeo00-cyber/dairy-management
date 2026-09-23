'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  PageHeader,
  SearchInput,
  Table,
  Badge,
  Button,
  Input,
  Card,
  EmptyState,
  statusTone,
} from '@/components/ui';

export default function UsersPage() {
  const { isSuperAdmin, users, createUser, setUserStatus, currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!isSuperAdmin) {
      router.replace('/dashboard');
    }
  }, [isSuperAdmin, router]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      if (u.role === 'SUPER_ADMIN') return true;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? '').includes(q)
      );
    });
  }, [users, search]);

  function onCreate(e: FormEvent) {
    e.preventDefault();
    const result = createUser({ name, email, phone: phone || undefined });
    if (!result.ok) {
      toast(result.message ?? 'Could not create user', 'error');
      return;
    }
    toast(`User ${name} created`);
    setName('');
    setEmail('');
    setPhone('');
  }

  if (!isSuperAdmin) return null;

  return (
    <div>
      <PageHeader
        title="Users"
        description="Super Admin can create farm users. Users cannot edit or delete each other’s data."
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-4 text-base font-semibold">Create user</h2>
          <form onSubmit={onCreate} className="space-y-3">
            <Input
              label="Full Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <p className="text-xs text-muted-fg">Role is always User (not choosable).</p>
            <Button type="submit" className="w-full">
              Create User
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search users…"
            className="mb-4 max-w-sm"
          />
          <Table
            data={filtered}
            rowKey={(u) => u.id}
            empty={<EmptyState title="No users" description="Create a user to get started." />}
            columns={[
              { key: 'name', header: 'Name', render: (u) => u.name },
              { key: 'email', header: 'Email', render: (u) => u.email },
              { key: 'phone', header: 'Phone', render: (u) => u.phone || '—' },
              {
                key: 'role',
                header: 'Role',
                render: (u) => (
                  <Badge tone={u.role === 'SUPER_ADMIN' ? 'info' : 'neutral'}>{u.role}</Badge>
                ),
              },
              {
                key: 'status',
                header: 'Status',
                render: (u) => (
                  <Badge tone={statusTone(u.status ?? 'Active')}>{u.status ?? 'Active'}</Badge>
                ),
              },
              {
                key: 'actions',
                header: '',
                className: 'text-right',
                render: (u) => {
                  if (u.id === currentUser.id || u.role === 'SUPER_ADMIN') return null;
                  const active = (u.status ?? 'Active') === 'Active';
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setUserStatus(u.id, active ? 'Inactive' : 'Active');
                        toast(`${u.name} marked ${active ? 'Inactive' : 'Active'}`);
                      }}
                    >
                      {active ? 'Deactivate' : 'Activate'}
                    </Button>
                  );
                },
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
