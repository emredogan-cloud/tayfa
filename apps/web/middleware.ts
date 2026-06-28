import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { RateLimit } from '@tayfa/shared/constants';
import { consumeRateLimit, rateLimitHeaders } from './lib/ratelimit.js';

/**
 * Edge middleware — runs before every matched request. Four jobs, all edge-safe
 * (no Node-only deps, no DB):
 *
 *  1. AUTH  — refresh the Supabase session cookie so Server Components/handlers
 *             read a fresh JWT (Supabase SSR pattern).
 *  2. GEO   — resolve coarse geo from Vercel's edge headers and forward it as
 *             `x-tayfa-geo-*` so the feed can default its center without asking
 *             the browser for precise location.
 *  3. RATE  — a coarse per-IP ceiling on the BFF (`/api/*`) as defence-in-depth;
 *             per-action limits live inside the handlers.
 *  4. BOTID — placeholder hook for Vercel BotID / bot management.
 *
 * This NEVER handles precise location — that is released only by the BFF via
 * `canReleasePreciseLocation`.
 */

// Coarse global ceiling; per-action limits (OTP, reports, etc.) are enforced in
// the handlers using the spine's `RATE_LIMITS`.
const GLOBAL_API_LIMIT: RateLimit = { action: 'api.global', max: 120, windowSeconds: 60 };

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() ?? 'unknown';
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/** Placeholder for Vercel BotID / managed bot detection. */
function isLikelyBot(req: NextRequest): boolean {
  // Real integration: Vercel BotID classification header / @vercel/bot check.
  // Until wired, treat an explicit verified-bot header as the only signal.
  return req.headers.get('x-vercel-bot') === 'true';
}

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const isApi = req.nextUrl.pathname.startsWith('/api/');

  // Block obvious bots from write surfaces early (placeholder logic).
  if (isApi && isLikelyBot(req) && req.method !== 'GET') {
    return NextResponse.json(
      { error: { code: 'bot_blocked', message: 'Automated traffic blocked' } },
      { status: 403 },
    );
  }

  // (3) Rate-limit the BFF per IP. Fail-open on limiter error — never wedge the app.
  if (isApi) {
    try {
      const result = await consumeRateLimit(GLOBAL_API_LIMIT, clientIp(req));
      if (!result.success) {
        return NextResponse.json(
          { error: { code: 'rate_limited', message: 'Too many requests' } },
          { status: 429, headers: rateLimitHeaders(result) },
        );
      }
    } catch {
      // Limiter unavailable — allow the request; handler-level limits still apply.
    }
  }

  // (2) Forward coarse geo from the edge onto request headers for downstream use.
  const requestHeaders = new Headers(req.headers);
  const lat = req.headers.get('x-vercel-ip-latitude');
  const lng = req.headers.get('x-vercel-ip-longitude');
  const city = req.headers.get('x-vercel-ip-city');
  const country = req.headers.get('x-vercel-ip-country');
  if (lat) requestHeaders.set('x-tayfa-geo-lat', lat);
  if (lng) requestHeaders.set('x-tayfa-geo-lng', lng);
  if (city) requestHeaders.set('x-tayfa-geo-city', decodeURIComponent(city));
  if (country) requestHeaders.set('x-tayfa-geo-country', country);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  // (1) Refresh the Supabase auth session (writes refreshed cookies onto `res`).
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnon) {
    const supabase = createServerClient(supabaseUrl, supabaseAnon, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(toSet: { name: string; value: string; options?: CookieOptions }[]) {
          for (const { name, value, options } of toSet) {
            res.cookies.set({ name, value, ...(options ?? {}) });
          }
        },
      },
    });
    // Touch the user to trigger a token refresh when needed.
    await supabase.auth.getUser();
  }

  return res;
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|monitoring|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
