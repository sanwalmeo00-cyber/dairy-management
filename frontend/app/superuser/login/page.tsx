'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button, Input, Card, FormError } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { validateLoginFields, type FieldErrors } from '@/lib/validation';

export default function SuperUserLoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [email, setEmail] = useState('superadmin@example.com');
  const [password, setPassword] = useState('password');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    const next = validateLoginFields(email, password);
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      setFormError('Please fix the highlighted fields and try again.');
      return;
    }

    const result = await login(email, password, 'superuser');
    if (!result.ok) {
      const message = result.message ?? 'Login failed.';
      if (message.toLowerCase().includes('account not found') || message.toLowerCase().includes('invalid')) {
        setFieldErrors({
          email: 'No Super Admin account found with this email.',
        });
      } else if (message.toLowerCase().includes('farm user')) {
        setFormError(message);
        setFieldErrors({
          email: 'This email belongs to a farm user. Use /login instead.',
        });
      } else if (message.toLowerCase().includes('inactive')) {
        setFieldErrors({ email: 'This account is inactive.' });
      } else {
        setFieldErrors({ password: message });
      }
      setFormError(message);
      return;
    }

    toast('Super Admin signed in');
    router.push('/dashboard');
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/login-farm-goats.jpg')" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(160deg, rgba(15, 26, 20, 0.72) 0%, rgba(26, 46, 34, 0.55) 50%, rgba(15, 26, 20, 0.7) 100%)',
        }}
        aria-hidden
      />
      <Card className="relative z-10 w-full max-w-md border-white/30 bg-white/95 shadow-lg backdrop-blur-sm">
        <div className="mb-6 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-wide text-primary">
            SMS DAIRY FARM
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Super Admin login</h1>
          <p className="mt-1 text-sm text-muted-fg">
            Sign in with your Super Admin credentials
          </p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormError message={formError} />
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((prev) => ({ ...prev, email: '' }));
              setFormError('');
            }}
            error={fieldErrors.email}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFieldErrors((prev) => ({ ...prev, password: '' }));
              setFormError('');
            }}
            error={fieldErrors.password}
          />
          <Button type="submit" className="w-full">
            Admin Login
          </Button>
        </form>
        <p className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-fg">
          Farm user?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Go to user login
          </Link>
        </p>
      </Card>
    </div>
  );
}
