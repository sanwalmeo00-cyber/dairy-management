export type FieldErrors = Record<string, string>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function validateLoginFields(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!email.trim()) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(email)) {
    errors.email = 'Enter a valid email address (e.g. name@example.com).';
  }

  if (!password) {
    errors.password = 'Password is required.';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  return errors;
}

export function validateRegisterFields(input: {
  name: string;
  email: string;
  password: string;
  confirm: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.name.trim()) {
    errors.name = 'Full name is required.';
  } else if (input.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (!input.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(input.email)) {
    errors.email = 'Enter a valid email address (e.g. name@example.com).';
  }

  if (!input.password) {
    errors.password = 'Password is required.';
  } else if (input.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  if (!input.confirm) {
    errors.confirm = 'Please confirm your password.';
  } else if (input.password !== input.confirm) {
    errors.confirm = 'Passwords do not match.';
  }

  return errors;
}
