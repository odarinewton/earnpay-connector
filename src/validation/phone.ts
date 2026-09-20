import { ensureText } from './strings';

export function normalizePhoneE164(value: unknown, field = 'phone'): string {
  const raw = ensureText(value, field);
  const normalized = raw.replace(/\s+/g, '').replace(/\u00A0/g, '');

  if (!/^\+?[1-9]\d{8,15}$/.test(normalized)) {
    throw new Error(`${field} must be a valid international phone number in E.164 format.`);
  }

  return normalized.startsWith('+') ? normalized : `+${normalized}`;
}
