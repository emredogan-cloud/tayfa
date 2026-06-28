import { z } from 'zod';
import * as Sentry from '@sentry/nextjs';

/**
 * BFF HTTP plumbing: a typed JSON error envelope, a Zod-aware request reader, and
 * an `apiHandler` wrapper that turns thrown errors into the right status. Every
 * server boundary parses with Zod (mission MANDATORY) and returns a stable shape:
 *
 *   success → { data: ... }
 *   failure → { error: { code, message, details? } }
 */

export interface ApiErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly details?: unknown;
  };
}

/** A thrown error a handler can use to short-circuit with a specific status. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const jsonHeaders = { 'content-type': 'application/json; charset=utf-8' } as const;

export function jsonOk<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify({ data }), { status, headers: jsonHeaders });
}

export function jsonError(
  status: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  const body: ApiErrorBody =
    details === undefined ? { error: { code, message } } : { error: { code, message, details } };
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

/** Parse a JSON request body against a Zod schema; throws ApiError(400) on failure. */
export async function parseJson<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, 'invalid_json', 'Request body must be valid JSON');
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError(400, 'validation_failed', 'Request failed validation', result.error.issues);
  }
  return result.data;
}

/**
 * Wrap a Route Handler so unhandled errors become typed responses instead of
 * leaking stack traces. ZodError → 400, ApiError → its status, anything else →
 * 500 (and reported to Sentry, never echoed to the client).
 */
export function apiHandler<Args extends unknown[]>(
  fn: (req: Request, ...args: Args) => Promise<Response>,
): (req: Request, ...args: Args) => Promise<Response> {
  return async (req, ...args) => {
    try {
      return await fn(req, ...args);
    } catch (e) {
      if (e instanceof ApiError) {
        return jsonError(e.status, e.code, e.message, e.details);
      }
      if (e instanceof z.ZodError) {
        return jsonError(400, 'validation_failed', 'Request failed validation', e.issues);
      }
      Sentry.captureException(e);
      return jsonError(500, 'internal_error', 'Something went wrong on our end');
    }
  };
}
