'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { Button, Input, Card, FormError } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { isValidEmail } from '@/lib/validation';

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email is required.');
      setFormError('Please enter your email address.');
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError('Enter a valid email address (e.g. name@example.com).');
      setFormError('Please fix the highlighted field and try again.');
      return;
    }

    setSent(true);
    toast('Reset link sent (mock)');
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
          <h1 className="mt-1 text-2xl font-semibold">Forgot password</h1>
          <p className="mt-1 text-sm text-muted-fg">
            Enter your email and we&apos;ll send a reset link (mock).
          </p>
        </div>
        {sent ? (
          <div className="space-y-4">
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              If an account exists for <strong>{email}</strong>, a reset link has been sent.
            </p>
            <Link href="/login">
              <Button className="w-full">Back to Login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormError message={formError} />
            <Input
              label="Email"
              type="email"
              name="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
                setFormError('');
              }}
              error={emailError}
            />
            <Button type="submit" className="w-full">
              Send Reset Link
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            Back to Login
          </Link>
        </p>
      </Card>
    </div>
  );
}
