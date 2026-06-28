/**
 * RFC4122 v4 UUID. Used for client-generated idempotency keys (dedupe message
 * sends on retry). Prefers the platform crypto when present, falls back to a
 * Math.random generator — adequate for idempotency keys (not for secrets).
 */
export function uuidv4(): string {
  const cryptoObj = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (cryptoObj?.randomUUID) return cryptoObj.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
