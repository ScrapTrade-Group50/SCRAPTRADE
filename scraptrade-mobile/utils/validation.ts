/** Client-side validation helpers for SCRAPTRADE forms. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GH_PHONE_RE = /^(0|\+233)[2-9]\d{8}$/;
const MOMO_RE = /^\d{10}$/;
/** Blocks HTML/script-ish payloads while allowing normal business names. */
const DANGEROUS_TEXT_RE = /[<>{}]|javascript:|on\w+=/i;

export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

export function required(value: string, label = 'This field'): string | null {
  if (!value.trim()) return `${label} is required.`;
  return null;
}

export function validateEmail(value: string): string | null {
  const empty = required(value, 'Email');
  if (empty) return empty;
  if (!EMAIL_RE.test(value.trim())) return 'Enter a valid email address (e.g. you@example.com).';
  if (value.length > 254) return 'Email is too long.';
  return null;
}

export function validatePassword(value: string, { min = 6 }: { min?: number } = {}): string | null {
  const empty = required(value, 'Password');
  if (empty) return empty;
  if (value.length < min) return `Password must be at least ${min} characters.`;
  if (value.length > 128) return 'Password is too long.';
  return null;
}

export function validatePasswordMatch(password: string, confirm: string): string | null {
  if (password !== confirm) return 'Passwords do not match.';
  return null;
}

/** Ghana mobile / MoMo style numbers: 10 digits starting with 0, or +233… */
export function validatePhone(value: string, { required: isRequired = false } = {}): string | null {
  const trimmed = value.trim().replace(/\s+/g, '');
  if (!trimmed) {
    return isRequired ? 'Phone number is required.' : null;
  }
  if (!GH_PHONE_RE.test(trimmed) && !MOMO_RE.test(trimmed)) {
    return 'Enter a valid Ghana phone number (e.g. 0241234567).';
  }
  return null;
}

export function validateMomoNumber(value: string): string | null {
  const digits = value.trim().replace(/\s+/g, '');
  if (!digits) return 'MoMo number is required.';
  if (!/^\d+$/.test(digits)) return 'MoMo number must contain digits only.';
  if (!MOMO_RE.test(digits)) return 'MoMo number must be exactly 10 digits.';
  return null;
}

export function validateRequiredText(
  value: string,
  label: string,
  { min = 2, max = 120 }: { min?: number; max?: number } = {}
): string | null {
  const empty = required(value, label);
  if (empty) return empty;
  const trimmed = value.trim();
  if (trimmed.length < min) return `${label} must be at least ${min} characters.`;
  if (trimmed.length > max) return `${label} must be ${max} characters or fewer.`;
  if (DANGEROUS_TEXT_RE.test(trimmed)) return `${label} contains invalid characters.`;
  return null;
}

/** Optional text: empty is OK; otherwise same length + safety checks. */
export function validateOptionalText(
  value: string,
  label: string,
  { max = 120 }: { max?: number } = {}
): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > max) return `${label} must be ${max} characters or fewer.`;
  if (DANGEROUS_TEXT_RE.test(trimmed)) return `${label} contains invalid characters.`;
  return null;
}

export function validatePositiveNumber(
  value: string,
  label: string,
  { max = 1_000_000 }: { max?: number } = {}
): string | null {
  const empty = required(value, label);
  if (empty) return empty;
  const n = Number(value);
  if (!Number.isFinite(n)) return `${label} must be a valid number.`;
  if (n <= 0) return `${label} must be greater than zero.`;
  if (n > max) return `${label} is unrealistically high.`;
  return null;
}

export function firstError(errors: FieldErrors): string | null {
  const values = Object.values(errors).filter(Boolean);
  return values[0] ?? null;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.values(errors).some(Boolean);
}
