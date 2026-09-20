import { ensureText } from './strings';

export function ensureSessionToken(value: unknown, field = 'sessionToken'): string {
  return ensureText(value, field);
}
