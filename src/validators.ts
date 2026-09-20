export function ensureText(value: unknown, field: string): string {
  if (typeof value !== 'string') {
    throw new Error(`${field} must be a string.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${field} is required.`);
  }

  return trimmed;
}

export function normalizePhoneE164(value: unknown, field = 'phone'): string {
  const raw = ensureText(value, field);
  const normalized = raw.replace(/\s+/g, '').replace(/\u00A0/g, '');

  if (!/^\+?[1-9]\d{8,15}$/.test(normalized)) {
    throw new Error(`${field} must be a valid international phone number in E.164 format.`);
  }

  return normalized.startsWith('+') ? normalized : `+${normalized}`;
}

export function normalizeReference(value: unknown, field = 'reference'): string {
  const raw = ensureText(value, field);
  if (raw.length < 3 || raw.length > 120) {
    throw new Error(`${field} must be between 3 and 120 characters.`);
  }

  return raw;
}

export function ensurePositiveInteger(value: unknown, field: string): number {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    throw new Error(`${field} must be a positive integer.`);
  }

  return Number(value);
}

export function ensureSessionToken(value: unknown, field = 'sessionToken'): string {
  return ensureText(value, field);
}

export function ensureObject(value: unknown, field: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${field} must be an object.`);
  }

  return value as Record<string, unknown>;
}
