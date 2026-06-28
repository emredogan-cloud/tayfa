/**
 * Tiny className joiner. NativeWind composes className strings, so a later class
 * wins by Tailwind precedence; we just drop falsy values and concatenate. No
 * runtime dep — keeps the bundle lean.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  let out = '';
  for (const p of parts) {
    if (!p) continue;
    out = out ? `${out} ${p}` : p;
  }
  return out;
}
