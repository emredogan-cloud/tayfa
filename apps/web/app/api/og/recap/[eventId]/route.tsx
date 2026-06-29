import { ImageResponse } from 'next/og';
import { avg, eq } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { buildRecapCard } from '@tayfa/shared/domain';
import { getServiceDb } from '@/lib/db.js';

export const runtime = 'nodejs';
export const revalidate = 3600;

/**
 * GET /api/og/recap/[eventId] — shareable POST-MEETUP recap card (P6 virality).
 *
 * Built from `buildRecapCard` (domain) so privacy is enforced in one tested place:
 * NEIGHBORHOOD + counts + average vibe only — never a precise pin, address, or any
 * attendee name/PII (RISK_ANALYSIS §location, GROWTH §virality).
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ eventId: string }> },
): Promise<ImageResponse> {
  const { eventId } = await ctx.params;

  let title = 'A Tayfa meetup';
  let category = 'Hangout';
  let neighborhood: string | null = null;
  let attendeeCount = 0;
  let vibeAverage: number | undefined;

  try {
    const db = getServiceDb();
    const [event] = await db
      .select({
        title: schema.event.title,
        category: schema.event.category,
        goingCount: schema.event.goingCount,
        neighborhood: schema.profile.neighborhood,
      })
      .from(schema.event)
      .innerJoin(schema.profile, eq(schema.profile.userId, schema.event.hostId))
      .where(eq(schema.event.id, eventId))
      .limit(1);
    if (event) {
      title = event.title;
      category = event.category;
      neighborhood = event.neighborhood;
      attendeeCount = event.goingCount;
      const [vibe] = await db
        .select({ avg: avg(schema.rating.vibe) })
        .from(schema.rating)
        .where(eq(schema.rating.eventId, eventId));
      if (vibe?.avg) vibeAverage = Number(vibe.avg);
    }
  } catch {
    // fall through to a branded generic card
  }

  const card = buildRecapCard({
    title,
    neighborhood,
    attendeeCount,
    category,
    ...(vibeAverage !== undefined ? { vibeAverage } : {}),
  });

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
        <span style={{ fontSize: '30px', fontWeight: 700 }}>Tayfa</span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '24px',
            padding: '8px 18px',
            borderRadius: '999px',
            background: 'rgba(255,255,255,0.12)',
          }}
        >
          recap
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ fontSize: '74px', fontWeight: 800, lineHeight: 1.02 }}>{card.headline}</div>
        <div style={{ fontSize: '32px', color: '#ffd9d2' }}>{card.subline}</div>
        <div style={{ display: 'flex', gap: '40px', marginTop: '12px' }}>
          {card.stats.map((s) => (
            <div key={s.label} style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '40px', fontWeight: 800 }}>{s.value}</span>
              <span style={{ fontSize: '22px', color: 'rgba(255,253,250,0.7)' }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: '28px', color: 'rgba(255,253,250,0.85)' }}>
        Friends through doing, not swiping.
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
