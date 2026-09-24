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

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    const next = validateLoginFields(email, password);
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      setFormError('Please fix the highlighted fields and try again.');
      return;
    }

    const result = await login(email, password, 'user');
    if (!result.ok) {
      const message = result.message ?? 'Login failed.';
      if (message.toLowerCase().includes('inactive')) {
        setFieldErrors({ email: 'This account is inactive. Contact Super Admin.' });
      } else if (message.toLowerCase().includes('super admin')) {
        setFormError(message);
        setFieldErrors({});
      } else if (message.toLowerCase().includes('invalid')) {
        setFieldErrors({ password: 'Wrong email or password. Contact Super Admin if you forgot it.' });
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
    <Card className="w-full max-w-md border-white/40 bg-white/95 shadow-lg backdrop-blur-sm">
      <div className="mb-6 text-center">
        <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-wide text-primary">
          SMS DAIRY FARM
        </p>
        <h1 className="mt-1 text-2xl font-semibold">User sign in</h1>
        <p className="mt-1 text-sm text-muted-fg">
          Sign in with credentials from Super Admin
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
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/images/login-farm-goats.jpg')" }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(160deg, rgba(26, 36, 24, 0.55) 0%, rgba(45, 90, 61, 0.35) 45%, rgba(26, 36, 24, 0.5) 100%)',
        }}
        aria-hidden
      />
      <div className="relative z-10 w-full max-w-md">
        <Suspense fallback={<Card className="w-full max-w-md bg-white/95 p-8 backdrop-blur-sm">Loading…</Card>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
