import type React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { getServiceDb } from '@/lib/db.js';
import { env } from '@/lib/env.js';

// ISR: the share page is public and cacheable — it never holds private data.
export const revalidate = 3600;

interface ShareData {
  id: string;
  title: string;
  category: string;
  startsAt: Date;
  goingCount: number;
  capacityMax: number;
  neighborhood: string | null;
  hostName: string;
}

/**
 * Loads ONLY the public, install-driving slice of an event. By selecting just
 * `geocell`/`neighborhood` (and never `location`/`address`), precise location
 * cannot leak through this page (RISK_ANALYSIS §location).
 */
async function loadShare(eventId: string): Promise<ShareData | null> {
  try {
    const db = getServiceDb();
    const [event] = await db
      .select({
        id: schema.event.id,
        title: schema.event.title,
        category: schema.event.category,
        startsAt: schema.event.startsAt,
        goingCount: schema.event.goingCount,
        capacityMax: schema.event.capacityMax,
        visibility: schema.event.visibility,
        deletedAt: schema.event.deletedAt,
        neighborhood: schema.profile.neighborhood,
        hostName: schema.profile.displayName,
      })
      .from(schema.event)
      .innerJoin(schema.profile, eq(schema.profile.userId, schema.event.hostId))
      .where(eq(schema.event.id, eventId))
      .limit(1);

    // Only PUBLIC events are shareable; gated/invite events 404 publicly.
    if (!event || event.deletedAt || event.visibility !== 'public') return null;
    return {
      id: event.id,
      title: event.title,
      category: event.category,
      startsAt: event.startsAt,
      goingCount: event.goingCount,
      capacityMax: event.capacityMax,
      neighborhood: event.neighborhood,
      hostName: event.hostName,
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  const data = await loadShare(eventId);
  const ogImage = `${env.appUrl()}/api/og/${eventId}`;

  if (!data) {
    return { title: 'Tayfa — Friends through doing, not swiping' };
  }

  const where = data.neighborhood ? ` in ${data.neighborhood}` : '';
  const title = `${data.title} · Tayfa`;
  const description = `A ${data.category} meetup${where}. Join the crew on Tayfa — verified, real-life, never a dating app.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', title, description, images: [ogImage] },
  };
}

function formatWhen(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Istanbul',
  }).format(d);
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<React.JSX.Element> {
  const { eventId } = await params;
  const data = await loadShare(eventId);
  if (!data) notFound();

  const spotsLeft = Math.max(0, data.capacityMax - data.goingCount);

  return (
    <main className="min-h-screen bg-aurora">
      <div className="container-tayfa flex min-h-screen flex-col items-center justify-center py-16">
        <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-cream shadow-lift ring-1 ring-ink/5">
          <div className="bg-ink px-8 py-6 text-cream">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wide">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-coral font-extrabold">
                T
              </span>
              Tayfa
            </div>
          </div>

          <div className="px-8 py-9">
            <span className="pill">{data.category}</span>
            <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
              {data.title}
            </h1>

            <dl className="mt-6 grid grid-cols-1 gap-3 text-ink-muted sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-muted/70">When</dt>
                <dd className="text-base font-medium text-ink">{formatWhen(data.startsAt)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-muted/70">Where</dt>
                {/* Neighborhood ONLY — the precise spot is shared in-app with
                    approved members shortly before start. */}
                <dd className="text-base font-medium text-ink">
                  {data.neighborhood ?? 'Istanbul'} · exact spot revealed in-app
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-muted/70">Host</dt>
                <dd className="text-base font-medium text-ink">{data.hostName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-ink-muted/70">Crew</dt>
                <dd className="text-base font-medium text-ink">
                  {data.goingCount} going · {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
                </dd>
              </div>
            </dl>

            <a
              href={`${env.appUrl()}/?utm_source=share&utm_medium=event&utm_content=${data.id}`}
              className="mt-8 flex w-full items-center justify-center rounded-2xl bg-coral px-6 py-4 text-base font-semibold text-cream shadow-card transition hover:bg-coral-deep"
            >
              Open in Tayfa to join
            </a>
            <p className="mt-3 text-center text-xs text-ink-muted">
              Verified members only · 18+ · You choose who sees you
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
