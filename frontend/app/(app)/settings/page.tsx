'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { dashboardService } from '@/services/dashboard';
import { PageHeader, Card, Input, Button, Select } from '@/components/ui';
import type { FarmSettings } from '@/types/farm';

export default function SettingsPage() {
  const { currentUser, users, logout, switchPartner } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [farm, setFarm] = useState<FarmSettings | null>(null);

  useEffect(() => {
    void dashboardService.getSettings().then(setFarm);
  }, []);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Profile updated (mock)');
  };

  const handleFarmSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Farm settings saved (mock)');
  };

  const handlePasswordSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Password changed (mock)');
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div>
      <PageHeader title="Settings" description="Profile, farm preferences, and account." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-semibold">Profile</h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <Input label="Name" defaultValue={currentUser.name} name="name" />
            <Input label="Email" type="email" defaultValue={currentUser.email} name="email" />
            <Input label="Phone" defaultValue={currentUser.phone ?? ''} name="phone" />
            <Button type="submit">Save Profile</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Farm Settings</h2>
          {farm && (
            <form onSubmit={handleFarmSave} className="space-y-4">
              <Input label="Farm Name" defaultValue={farm.farmName} name="farmName" />
              <Input label="Location" defaultValue={farm.farmLocation} name="farmLocation" />
              <Input label="Currency" defaultValue={farm.currency} name="currency" disabled />
              <Button type="submit">Save Farm Settings</Button>
            </form>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Change Password</h2>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <Input label="Current Password" type="password" name="current" required />
            <Input label="New Password" type="password" name="new" required />
            <Input label="Confirm Password" type="password" name="confirm" required />
            <Button type="submit">Update Password</Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 font-semibold">Partner & Session</h2>
          <p className="mb-4 text-sm text-muted-fg">
            This demo farm has two partners. Switch partner from the header user menu to see
            view-only records owned by the other partner. Ownership on new records uses the active
            partner automatically.
          </p>
          <Select
            label="Switch partner (demo)"
            value={currentUser.id}
            onChange={(e) => {
              switchPartner(e.target.value);
              toast('Partner switched (mock)');
            }}
            options={users.map((u) => ({ label: u.name, value: u.id }))}
          />
          <div className="mt-4">
            <Button variant="danger" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
