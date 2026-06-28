/**
 * Result<T, E> — explicit, exhaustive error handling without exceptions on
 * domain boundaries. Pure domain logic returns Result rather than throwing, so
 * callers must handle the failure case (the compiler enforces it).
 */

export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });
export const err = <E>(error: E): Err<E> => ({ ok: false, error });

export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> => r.ok;
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> => !r.ok;

/** Map the success value, leaving errors untouched. */
export const mapResult = <T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> =>
  r.ok ? ok(fn(r.value)) : r;

/** Unwrap or throw — use only at the outermost edge (tests, top-level handlers). */
export const unwrap = <T, E>(r: Result<T, E>): T => {
  if (r.ok) return r.value;
  throw new Error(`unwrap() called on Err: ${JSON.stringify(r.error)}`);
};

/** Exhaustiveness helper — makes a missing switch case a compile error. */
export const assertNever = (x: never): never => {
  throw new Error(`Unreachable: unexpected value ${JSON.stringify(x)}`);
};
