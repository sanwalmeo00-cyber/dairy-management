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
  LoadingState,
  Pagination,
  FormError,
  Modal,
  Select,
} from '@/components/ui';
import { usePagedList } from '@/lib/usePagedList';
import { ApiError } from '@/lib/api';
import {
  fieldErrorsFromApi,
  validateCreateUserFields,
  validateUpdateUserFields,
  type FieldErrors,
} from '@/lib/validation';

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
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');

  const [editing, setEditing] = useState<User | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'Inactive'>('Active');
  const [editSaving, setEditSaving] = useState(false);
  const [editFieldErrors, setEditFieldErrors] = useState<FieldErrors>({});
  const [editFormError, setEditFormError] = useState('');

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

  const { page, setPage, paged, pageSize, total } = usePagedList(filtered, search);

  function clearFieldError(field: string) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFormError('');
  }

  function clearEditFieldError(field: string) {
    setEditFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setEditFormError('');
  }

  function openEdit(user: User) {
    setEditing(user);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone ?? '');
    setEditPassword('');
    setEditStatus((user.status ?? 'Active') === 'Inactive' ? 'Inactive' : 'Active');
    setEditFieldErrors({});
    setEditFormError('');
  }

  function closeEdit() {
    if (editSaving) return;
    setEditing(null);
    setEditPassword('');
    setEditFieldErrors({});
    setEditFormError('');
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    const next = validateCreateUserFields({ name, email, phone, password });
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      setFormError('Please fix the highlighted fields and try again.');
      return;
    }

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
      setFieldErrors({});
      setFormError('');
    } catch (err) {
      if (err instanceof ApiError) {
        const fromApi = fieldErrorsFromApi(err.errors);
        if (Object.keys(fromApi).length > 0) {
          setFieldErrors(fromApi);
          setFormError(err.message || 'Please fix the highlighted fields and try again.');
        } else if (err.status === 409 || /already|exists/i.test(err.message)) {
          setFieldErrors({ email: err.message || 'Email already exists.' });
          setFormError(err.message || 'Email already exists.');
        } else {
          setFormError(err.message || 'Could not create user');
        }
        toast(err.message || 'Could not create user', 'error');
      } else {
        const message = err instanceof Error ? err.message : 'Could not create user';
        setFormError(message);
        toast(message, 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  async function onUpdate(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditFormError('');

    const next = validateUpdateUserFields({
      name: editName,
      email: editEmail,
      phone: editPhone,
      password: editPassword,
    });
    setEditFieldErrors(next);
    if (Object.keys(next).length > 0) {
      setEditFormError('Please fix the highlighted fields and try again.');
      return;
    }

    const canChangeStatus =
      editing.role !== 'SUPER_ADMIN' && editing.id !== currentUser.id;

    setEditSaving(true);
    try {
      const updated = await usersService.update(editing.id, {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim() || undefined,
        ...(editPassword.trim() ? { password: editPassword } : {}),
        ...(canChangeStatus ? { status: editStatus } : {}),
      });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      toast(`${updated.name} updated`);
      setEditing(null);
      setEditPassword('');
      setEditFieldErrors({});
      setEditFormError('');
    } catch (err) {
      if (err instanceof ApiError) {
        const fromApi = fieldErrorsFromApi(err.errors);
        if (Object.keys(fromApi).length > 0) {
          setEditFieldErrors(fromApi);
          setEditFormError(err.message || 'Please fix the highlighted fields and try again.');
        } else if (err.status === 409 || /already|exists/i.test(err.message)) {
          setEditFieldErrors({ email: err.message || 'Email already exists.' });
          setEditFormError(err.message || 'Email already exists.');
        } else {
          setEditFormError(err.message || 'Could not update user');
        }
        toast(err.message || 'Could not update user', 'error');
      } else {
        const message = err instanceof Error ? err.message : 'Could not update user';
        setEditFormError(message);
        toast(message, 'error');
      }
    } finally {
      setEditSaving(false);
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

  const canEditStatus =
    editing != null &&
    editing.role !== 'SUPER_ADMIN' &&
    editing.id !== currentUser.id;

  return (
    <div>
      <PageHeader
        title="Users"
        description="Create farm users and edit their details anytime. Activate or deactivate access as needed."
      />

      <div className="mb-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h2 className="mb-4 text-base font-semibold">Create user</h2>
          <form onSubmit={(e) => void onCreate(e)} className="space-y-3" noValidate>
            <FormError message={formError} />
            <Input
              label="Full Name"
              required
              value={name}
              disabled={saving}
              error={fieldErrors.name}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError('name');
              }}
            />
            <Input
              label="Email"
              type="email"
              required
              value={email}
              disabled={saving}
              error={fieldErrors.email}
              hint={!fieldErrors.email ? 'Use a full email, ending with .com' : undefined}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError('email');
              }}
            />
            <Input
              label="Phone"
              value={phone}
              disabled={saving}
              error={fieldErrors.phone}
              onChange={(e) => {
                setPhone(e.target.value);
                clearFieldError('phone');
              }}
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              disabled={saving}
              error={fieldErrors.password}
              hint={
                !fieldErrors.password
                  ? 'Min 8 characters — share with the user for login'
                  : undefined
              }
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
              }}
            />
            <p className="text-xs text-muted-fg">Role is always User (not choosable).</p>
            <Button type="submit" className="w-full" loading={saving} loadingText="Creating…">
              Create User
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
          {loading ? (
            <LoadingState label="Loading users…" />
          ) : (
            <>
              <Table
                data={paged}
                rowKey={(u) => u.id}
                empty={
                  <EmptyState title="No users" description="Create a user to get started." />
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
                      const canToggle =
                        u.id !== currentUser.id && u.role !== 'SUPER_ADMIN';
                      const active = (u.status ?? 'Active') === 'Active';
                      return (
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(u)}
                          >
                            Edit
                          </Button>
                          {canToggle && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void toggleStatus(u)}
                            >
                              {active ? 'Deactivate' : 'Activate'}
                            </Button>
                          )}
                        </div>
                      );
                    },
                  },
                ]}
              />
              <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>

      <Modal
        open={editing != null}
        onClose={closeEdit}
        title={editing ? `Edit ${editing.name}` : 'Edit user'}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              disabled={editSaving}
              onClick={closeEdit}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-user-form"
              className="w-full sm:w-auto"
              loading={editSaving}
              loadingText="Saving…"
            >
              Save changes
            </Button>
          </div>
        }
      >
        <form
          id="edit-user-form"
          onSubmit={(e) => void onUpdate(e)}
          className="space-y-3"
          noValidate
        >
          <FormError message={editFormError} />
          <Input
            label="Full Name"
            required
            value={editName}
            disabled={editSaving}
            error={editFieldErrors.name}
            onChange={(e) => {
              setEditName(e.target.value);
              clearEditFieldError('name');
            }}
          />
          <Input
            label="Email"
            type="email"
            required
            value={editEmail}
            disabled={editSaving}
            error={editFieldErrors.email}
            onChange={(e) => {
              setEditEmail(e.target.value);
              clearEditFieldError('email');
            }}
          />
          <Input
            label="Phone"
            value={editPhone}
            disabled={editSaving}
            error={editFieldErrors.phone}
            onChange={(e) => {
              setEditPhone(e.target.value);
              clearEditFieldError('phone');
            }}
          />
          <Input
            label="New password"
            type="password"
            value={editPassword}
            disabled={editSaving}
            error={editFieldErrors.password}
            hint={
              !editFieldErrors.password
                ? 'Leave blank to keep the current password'
                : undefined
            }
            onChange={(e) => {
              setEditPassword(e.target.value);
              clearEditFieldError('password');
            }}
          />
          {canEditStatus ? (
            <Select
              label="Status"
              value={editStatus}
              disabled={editSaving}
              onChange={(e) => setEditStatus(e.target.value as 'Active' | 'Inactive')}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
            />
          ) : (
            <p className="text-xs text-muted-fg">
              Status cannot be changed for Super Admin or your own account.
            </p>
          )}
        </form>
      </Modal>
    </div>
  );
}
