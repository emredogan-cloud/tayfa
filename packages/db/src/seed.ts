import { latLngToCell } from 'h3-js';
import { BEACHHEAD, GEOCELL_RESOLUTION } from '@tayfa/shared/constants';
import { MockEmbeddingProvider } from '@tayfa/shared/adapters';
import { createServiceClient } from './client.js';
import { embedTextOpenAI } from './embed.js';
import { city as cityTable, event as eventTable, interestTaxonomy } from './schema/index.js';

/**
 * Seed reference data + synthetic Istanbul events for local dev / the discovery
 * eval harness. Embeddings come from the deterministic mock provider so the data
 * is reproducible. Per RISK_ANALYSIS §anti-phantom, real production seeding uses
 * ambassador-hosted REAL events — this synthetic set is for development only.
 */

const TAXONOMY: { domain: (typeof interestTaxonomy.$inferInsert)['domain']; label: string }[] = [
  { domain: 'sport', label: 'Cycling' },
  { domain: 'sport', label: 'Bouldering' },
  { domain: 'sport', label: 'Padel' },
  { domain: 'sport', label: 'Running' },
  { domain: 'sport', label: 'Football' },
  { domain: 'hobby', label: 'Board Games' },
  { domain: 'hobby', label: 'Film Photography' },
  { domain: 'hobby', label: 'Pottery' },
  { domain: 'hobby', label: 'Hiking' },
  { domain: 'music_genre', label: 'Indie' },
  { domain: 'music_genre', label: 'Techno' },
  { domain: 'music_genre', label: 'Jazz' },
  { domain: 'music_genre', label: 'Turkish Rock' },
  { domain: 'artist', label: 'Tame Impala' },
  { domain: 'artist', label: 'Mor ve Ötesi' },
  { domain: 'tv_show', label: 'Severance' },
  { domain: 'tv_show', label: 'The Bear' },
  { domain: 'film', label: 'A24 Films' },
  { domain: 'cuisine', label: 'Specialty Coffee' },
  { domain: 'cuisine', label: 'Street Food' },
  { domain: 'cuisine', label: 'Natural Wine' },
  { domain: 'cause', label: 'Beach Cleanups' },
  { domain: 'game', label: 'Catan' },
  { domain: 'game', label: 'Chess' },
];

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const EVENT_TEMPLATES = [
  { title: 'Sunday Coastal Ride', category: 'sport' },
  { title: 'Bouldering at the Gym', category: 'sport' },
  { title: 'Board Game Night', category: 'hobby' },
  { title: 'Specialty Coffee Crawl', category: 'cuisine' },
  { title: 'Golden Hour Photo Walk', category: 'hobby' },
  { title: 'Kadıköy Beach Cleanup', category: 'cause' },
  { title: 'Vinyl & Natural Wine', category: 'music_genre' },
  { title: 'Morning Run Crew', category: 'sport' },
];

export async function seed(connectionString: string): Promise<void> {
  const { db, sql } = createServiceClient(connectionString);
  // Prefer the REAL OpenAI embedding when OPENAI_API_KEY is set (production
  // pipeline); fall back to the deterministic mock for keyless dev / CI.
  const mock = new MockEmbeddingProvider();
  let realEmbedFailed = false;
  const embed = async (text: string): Promise<number[]> => {
    if (realEmbedFailed) return mock.embed(text);
    try {
      return (await embedTextOpenAI(text)) ?? (await mock.embed(text));
    } catch (e) {
      // Graceful fallback (mission §P4: never crash). e.g. OpenAI quota/outage.
      realEmbedFailed = true;
      console.warn(
        `! real embedding unavailable (${(e as Error).message.slice(0, 80)}); using mock`,
      );
      return mock.embed(text);
    }
  };
  try {
    // City.
    const [istanbul] = await db
      .insert(cityTable)
      .values({
        name: BEACHHEAD.cityName,
        countryCode: BEACHHEAD.countryCode,
        centerLat: BEACHHEAD.seedCenter.lat,
        centerLng: BEACHHEAD.seedCenter.lng,
      })
      .onConflictDoNothing()
      .returning();

    // Taxonomy with deterministic embeddings.
    for (const t of TAXONOMY) {
      const embedding = await embed(`${t.domain} ${t.label}`);
      await db
        .insert(interestTaxonomy)
        .values({ domain: t.domain, label: t.label, slug: slugify(t.label), embedding })
        .onConflictDoNothing();
    }

    // Synthetic events scattered around Kadıköy geocells over the next 2 weeks.
    // A REAL meetup host is required in production; here we attach to a system uuid.
    const hostId = '00000000-0000-4000-8000-000000000000';
    await sql`INSERT INTO auth.users (id, phone) VALUES (${hostId}, '+900000000000')
              ON CONFLICT (id) DO NOTHING`;

    const center = BEACHHEAD.seedCenter;
    let created = 0;
    for (let i = 0; i < 60; i++) {
      const tmpl = EVENT_TEMPLATES[i % EVENT_TEMPLATES.length]!;
      const dLat = (i % 7) * 0.004 - 0.012;
      const dLng = ((i * 3) % 7) * 0.004 - 0.012;
      const lat = center.lat + dLat;
      const lng = center.lng + dLng;
      const geocell = latLngToCell(lat, lng, GEOCELL_RESOLUTION);
      const starts = new Date(Date.now() + (i + 1) * 6 * 60 * 60 * 1000);
      const ends = new Date(starts.getTime() + 2 * 60 * 60 * 1000);
      const embedding = await embed(`${tmpl.category} ${tmpl.title}`);
      await db.insert(eventTable).values({
        hostId,
        title: tmpl.title,
        category: tmpl.category,
        location: { lat, lng },
        geocell,
        venueName: 'Kadıköy',
        startsAt: starts,
        endsAt: ends,
        capacityMin: 2,
        capacityMax: 4 + (i % 4),
        goingCount: i % 3,
        embedding,
      });
      created++;
    }

    console.warn(
      `✓ seeded ${TAXONOMY.length} interests, ${created} events${istanbul ? ', 1 city' : ''}`,
    );
  } finally {
    await sql.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  seed(url)
    .then(() => process.exit(0))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
