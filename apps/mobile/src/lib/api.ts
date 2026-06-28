import { ENV } from './env';

/**
 * Typed fetch client for the Tayfa BFF. The BFF is the ONLY backend the app
 * talks to for domain data; it is the trust boundary that Zod-validates every
 * request, enforces entitlements server-side (RevenueCat), and gates precise
 * location. The client therefore stays dumb: attach the auth token, send JSON,
 * surface typed errors.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Auth token provider, injected at app startup (see app/_layout.tsx). */
let tokenProvider: () => Promise<string | null> = async () => null;
export function setAuthTokenProvider(fn: () => Promise<string | null>): void {
  tokenProvider = fn;
}

type Query = Record<string, string | number | boolean | undefined | null>;

interface RequestOptions {
  readonly method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  readonly body?: unknown;
  readonly query?: Query;
  readonly signal?: AbortSignal;
}

function buildUrl(path: string, query?: Query): string {
  const base = ENV.apiUrl.replace(/\/$/, '');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options;
  const token = await tokenProvider();

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: signal ?? null,
    });
  } catch (cause) {
    throw new ApiError(0, 'Network request failed. Check your connection.', 'network_error', cause);
  }

  const isJson = response.headers.get('content-type')?.includes('application/json') ?? false;
  const payload: unknown = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errObj =
      typeof payload === 'object' && payload !== null ? (payload as Record<string, unknown>) : {};
    const message =
      typeof errObj.message === 'string' ? errObj.message : `Request failed (${response.status})`;
    const code = typeof errObj.code === 'string' ? errObj.code : undefined;
    throw new ApiError(response.status, message, code, payload);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, query?: Query, signal?: AbortSignal): Promise<T> =>
    request<T>(path, { method: 'GET', query, signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> =>
    request<T>(path, { method: 'POST', body, signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> =>
    request<T>(path, { method: 'PATCH', body, signal }),
  del: <T>(path: string, body?: unknown, signal?: AbortSignal): Promise<T> =>
    request<T>(path, { method: 'DELETE', body, signal }),
} as const;
