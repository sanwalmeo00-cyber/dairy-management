'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { usersService } from '@/services/users';
import type { User } from '@/types/farm';
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
  const { isSuperAdmin, currentUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await usersService.getAll());
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load users', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!isSuperAdmin) {
      router.replace('/dashboard');
      return;
    }
    void loadUsers();
  }, [isSuperAdmin, router, loadUsers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? '').includes(q)
      );
    });
  }, [users, search]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const created = await usersService.create({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });
      setUsers((prev) => [created, ...prev]);
      toast(`User created. Share email + password with ${created.name}.`);
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not create user', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user: User) {
    const next = (user.status ?? 'Active') === 'Active' ? 'Inactive' : 'Active';
    try {
      const updated = await usersService.setStatus(user.id, next);
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      toast(`${updated.name} marked ${updated.status}`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update status', 'error');
    }
  }

  if (!isSuperAdmin) return null;

  return (
    <div>
      <PageHeader
        title="Users"
        description="Create farm users and share their login credentials. Activate or deactivate access anytime."
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-4 text-base font-semibold">Create user</h2>
          <form onSubmit={(e) => void onCreate(e)} className="space-y-3">
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
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              hint="Min 8 characters — share with the user for login"
            />
            <p className="text-xs text-muted-fg">Role is always User (not choosable).</p>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? 'Creating…' : 'Create User'}
            </Button>
          </form>
        </Card>

        <div className="lg:col-span-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search users…"
            className="mb-4 w-full sm:max-w-sm"
          />
          <Table
            data={filtered}
            rowKey={(u) => u.id}
            empty={
              <EmptyState
                title={loading ? 'Loading…' : 'No users'}
                description={loading ? 'Fetching from the server.' : 'Create a user to get started.'}
              />
            }
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
                      onClick={() => void toggleStatus(u)}
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
