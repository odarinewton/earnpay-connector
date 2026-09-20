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

export function normalizeReference(value: unknown, field = 'reference'): string {
  const raw = ensureText(value, field);
  if (raw.length < 3 || raw.length > 120) {
    throw new Error(`${field} must be between 3 and 120 characters.`);
  }

  return raw;
}
