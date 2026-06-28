import { ImageResponse } from 'next/og';
import { eq } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { getServiceDb } from '@/lib/db.js';

export const runtime = 'nodejs';
// Cache the generated card — it never contains time-sensitive or precise data.
export const revalidate = 3600;

/**
 * GET /api/og/[eventId] — dynamic Open Graph image (recap-card style).
 *
 * PRIVACY BY CONSTRUCTION: this card is public (it drives installs), so it carries
 * ONLY non-sensitive fields — title, category, neighborhood, date, going-count.
 * NEVER a precise pin, address, or any attendee PII (RISK_ANALYSIS §location).
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ eventId: string }> },
): Promise<ImageResponse> {
  const { eventId } = await ctx.params;

  let title = 'A Tayfa meetup';
  let category = 'Hangout';
  let neighborhood: string | null = null;
  let going = 0;
  let when = '';

  // Best-effort fetch — if the DB isn't available we still render a branded card.
  try {
    const db = getServiceDb();
    const [event] = await db
      .select({
        title: schema.event.title,
        category: schema.event.category,
        startsAt: schema.event.startsAt,
        goingCount: schema.event.goingCount,
        neighborhood: schema.profile.neighborhood,
        deletedAt: schema.event.deletedAt,
      })
      .from(schema.event)
      .innerJoin(schema.profile, eq(schema.profile.userId, schema.event.hostId))
      .where(eq(schema.event.id, eventId))
      .limit(1);
    if (event && !event.deletedAt) {
      title = event.title;
      category = event.category;
      neighborhood = event.neighborhood;
      going = event.goingCount;
      when = new Intl.DateTimeFormat('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone: 'Europe/Istanbul',
      }).format(event.startsAt);
    }
  } catch {
    // fall through to the generic branded card
  }

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px',
        background: 'linear-gradient(135deg, #15131f 0%, #2a2140 55%, #e8513f 140%)',
        color: '#fffdfa',
        fontFamily: 'sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: '#ff6a5b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
            fontWeight: 800,
          }}
        >
          T
        </div>
        <span style={{ fontSize: '30px', fontWeight: 700, letterSpacing: '-0.02em' }}>Tayfa</span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '24px',
            padding: '8px 18px',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.12)',
          }}
        >
          {category}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div
          style={{ fontSize: '78px', fontWeight: 800, lineHeight: 1.02, letterSpacing: '-0.03em' }}
        >
          {title}
        </div>
        <div style={{ display: 'flex', gap: '28px', fontSize: '30px', color: '#ffd9d2' }}>
          {neighborhood ? <span>{neighborhood}</span> : null}
          {when ? <span>{when}</span> : null}
          {going > 0 ? <span>{going} going</span> : null}
        </div>
      </div>

      <div style={{ fontSize: '28px', color: 'rgba(255,253,250,0.85)' }}>
        Friends through doing, not swiping.
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
