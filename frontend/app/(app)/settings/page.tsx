'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { settingsService } from '@/services/settings';
import { PageHeader, Card, Input, Button } from '@/components/ui';

export default function SettingsPage() {
  const { currentUser, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleProfileSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    try {
      const updated = await settingsService.updateProfile({
        name: String(fd.get('name') ?? '').trim(),
        phone: String(fd.get('phone') ?? '').trim() || null,
      });
      refreshUser(updated);
      toast('Profile updated');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    }
  };

  const handlePasswordSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const newPassword = String(fd.get('new') ?? '');
    const confirmPassword = String(fd.get('confirm') ?? '');
    if (newPassword !== confirmPassword) {
      toast('New passwords do not match', 'error');
      return;
    }
    try {
      await settingsService.changePassword({
        currentPassword: String(fd.get('current') ?? ''),
        newPassword,
        confirmPassword,
      });
      toast('Password updated');
      form.reset();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update password', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div>
      <PageHeader title="Settings" description="Your account and password." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Profile</h2>
          <form key={currentUser.id + currentUser.name + (currentUser.phone ?? '')} onSubmit={(e) => void handleProfileSave(e)} className="space-y-4">
            <Input label="Name" defaultValue={currentUser.name} name="name" required />
            <Input label="Email" type="email" defaultValue={currentUser.email} name="email" disabled />
            <Input label="Phone" defaultValue={currentUser.phone ?? ''} name="phone" />
            <Input
              label="Role"
              defaultValue={currentUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'User'}
              disabled
            />
            <Button type="submit">Save Profile</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Change Password</h2>
          <form onSubmit={(e) => void handlePasswordSave(e)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              name="current"
              required
              autoComplete="current-password"
            />
            <Input
              label="New Password"
              type="password"
              name="new"
              required
              autoComplete="new-password"
              minLength={8}
            />
            <Input
              label="Confirm Password"
              type="password"
              name="confirm"
              required
              autoComplete="new-password"
              minLength={8}
            />
            <Button type="submit">Update Password</Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-2 font-semibold">Session</h2>
          <p className="mb-4 text-sm text-muted-fg">Sign out of SMS Dairy Farm on this device.</p>
          <Button variant="danger" onClick={handleLogout}>
            Log out
          </Button>
        </Card>
      </div>
    </div>
  );
}
