'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button, Input, Card, FormError } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { validateRegisterFields, type FieldErrors } from '@/lib/validation';

export default function RegisterPage() {
  const { register } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState('');

  function clearField(key: string) {
    setFieldErrors((prev) => ({ ...prev, [key]: '' }));
    setFormError('');
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');

    const next = validateRegisterFields({ name, email, password, confirm });
    setFieldErrors(next);
    if (Object.keys(next).length > 0) {
      setFormError('Please fix the highlighted fields and try again.');
      return;
    }

    const ok = register({ name, email, password });
    if (!ok) {
      setFieldErrors({ email: 'This email is already registered. Try logging in instead.' });
      setFormError('Email already exists.');
      toast('Email already exists', 'error');
      return;
    }
    toast('Account created (mock)');
    router.push('/dashboard');
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 20% 20%, #dce8d8 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, #e8dfc8 0%, transparent 45%), #f4f6f2',
        }}
      />
      <Card className="relative z-10 w-full max-w-md">
        <div className="mb-6">
          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-wide text-primary">
            SMS DAIRY FARM
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Create account</h1>
          <p className="mt-1 text-sm text-muted-fg">Role is assigned by the farm — not chosen here.</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormError message={formError} />
          <Input
            label="Full Name"
            name="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearField('name');
            }}
            error={fieldErrors.name}
          />
          <Input
            label="Email"
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearField('email');
            }}
            error={fieldErrors.email}
          />
          <Input
            label="Password"
            type="password"
            name="password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearField('password');
            }}
            error={fieldErrors.password}
            hint={!fieldErrors.password ? 'At least 6 characters' : undefined}
          />
          <Input
            label="Confirm Password"
            type="password"
            name="confirm"
            required
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              clearField('confirm');
            }}
            error={fieldErrors.confirm}
          />
          <Button type="submit" className="w-full">
            Register
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-fg">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Login
          </Link>
        </p>
        <p className="mt-6 border-t border-border pt-4 text-center text-xs text-muted-fg">
          Super Admin?{' '}
          <Link href="/superuser/login" className="font-medium text-primary hover:underline">
            Sign in here
          </Link>
        </p>
      </Card>
    </div>
  );
}
