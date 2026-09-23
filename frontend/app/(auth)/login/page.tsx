'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useState } from 'react';
import { Button, Input, Card, FormError } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { validateLoginFields, type FieldErrors } from '@/lib/validation';

function LoginForm() {
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('partnera@example.com');
  const [password, setPassword] = useState('password');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    const next = validateLoginFields(email, password);
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      setFormError('Please fix the highlighted fields and try again.');
      return;
    }

    const result = login(email, password, 'user');
    if (!result.ok) {
      const message = result.message ?? 'Login failed.';
      if (message.toLowerCase().includes('account not found')) {
        setFieldErrors({
          email: 'No account found with this email. Check the spelling or register.',
        });
      } else if (message.toLowerCase().includes('inactive')) {
        setFieldErrors({ email: 'This account is inactive. Contact Super Admin.' });
      } else if (message.toLowerCase().includes('super admin')) {
        setFormError(message);
        setFieldErrors({});
      } else {
        setFieldErrors({ password: message });
      }
      setFormError(message);
      return;
    }

    toast('Welcome back');
    router.push(params.get('next') || '/dashboard');
  }

  return (
    <Card className="w-full max-w-md">
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">Green Meadow</p>
        <h1 className="mt-1 text-2xl font-semibold">User sign in</h1>
        <p className="mt-1 text-sm text-muted-fg">
          For farm users — try partnera@example.com or partnerb@example.com
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
          hint={!fieldErrors.email ? 'Use the full email, ending with .com' : undefined}
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
          Login
        </Button>
      </form>
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-primary hover:underline">
          Forgot Password
        </Link>
        <Link href="/register" className="text-primary hover:underline">
          Go to Register
        </Link>
      </div>
      <p className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-fg">
        Super Admin?{' '}
        <Link href="/superuser/login" className="font-medium text-primary hover:underline">
          Sign in here
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 20%, #dce8d8 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, #e8dfc8 0%, transparent 45%), #f4f6f2',
        }}
      />
      <div className="relative z-10 w-full max-w-md">
        <Suspense fallback={<Card className="w-full max-w-md p-8">Loading…</Card>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
