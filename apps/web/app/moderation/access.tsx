import type React from 'react';
import { getSession, type Session } from '@/lib/auth.js';

/**
 * Console access guard. The T&S console reads via the service role (RLS-bypassing),
 * so access is gated here by a simple moderator allowlist check (env-driven). A
 * non-moderator gets an honest 403 panel rather than a redirect that leaks the
 * route's existence.
 */
export async function requireConsoleAccess(): Promise<
  { ok: true; session: Session } | { ok: false; element: React.JSX.Element }
> {
  const session = await getSession();
  if (session?.isModerator) return { ok: true, session };
  return {
    ok: false,
    element: (
      <main className="grid min-h-screen place-items-center bg-ink text-cream">
        <div className="max-w-md rounded-2xl border border-cream/10 bg-ink-soft p-8 text-center">
          <h1 className="text-xl font-semibold">Trust &amp; Safety console</h1>
          <p className="mt-2 text-sm text-cream/70">
            This area is restricted to authorised Trust &amp; Safety staff.
          </p>
        </div>
      </main>
    ),
  };
}
