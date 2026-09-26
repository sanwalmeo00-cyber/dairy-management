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

export function validateCreateUserFields(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!input.name.trim()) {
    errors.name = 'Full name is required.';
  } else if (input.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  } else if (input.name.trim().length > 100) {
    errors.name = 'Name must be at most 100 characters.';
  }

  if (!input.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!isValidEmail(input.email)) {
    errors.email = 'Enter a valid email address (e.g. name@example.com).';
  }

  if (input.phone?.trim() && input.phone.trim().length > 32) {
    errors.phone = 'Phone must be at most 32 characters.';
  }

  if (!input.password) {
    errors.password = 'Password is required.';
  } else if (input.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  return errors;
}

/** Map Zod flatten / API error payload into field → message. */
export function fieldErrorsFromApi(errors: unknown): FieldErrors {
  const out: FieldErrors = {};
  if (!errors || typeof errors !== 'object') return out;

  const payload = errors as {
    fieldErrors?: Record<string, string[] | undefined>;
  };

  if (payload.fieldErrors && typeof payload.fieldErrors === 'object') {
    for (const [key, messages] of Object.entries(payload.fieldErrors)) {
      const first = Array.isArray(messages) ? messages.find(Boolean) : undefined;
      if (first) out[key] = first;
    }
  }

  return out;
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
