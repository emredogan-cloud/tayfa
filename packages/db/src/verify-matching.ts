import postgres from 'postgres';
import { embedTextOpenAI } from './embed.js';

/**
 * Phase 4 verification: prove the PRODUCTION matching path works end-to-end —
 * real OpenAI embedding of a query → pgvector cosine ANN over seeded events →
 * semantically-ranked results. Run after `db:seed` with OPENAI_API_KEY set:
 *
 *   OPENAI_API_KEY=… DATABASE_URL=… tsx src/verify-matching.ts "cycling and specialty coffee"
 */
async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL required');
  const query = process.argv[2] ?? 'cycling and specialty coffee with indie music';

  const vec = await embedTextOpenAI(query);
  if (!vec) throw new Error('OPENAI_API_KEY required for real-embedding verification');

  const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });
  try {
    const literal = `[${vec.join(',')}]`;
    const rows = await sql<{ title: string; category: string; similarity: number }[]>`
      SELECT title, category,
             1 - (embedding <=> ${literal}::vector) AS similarity
      FROM event
      WHERE embedding IS NOT NULL AND deleted_at IS NULL
      ORDER BY embedding <=> ${literal}::vector
      LIMIT 8
    `;
    // eslint-disable-next-line no-console
    console.log(`\nQuery: "${query}"  — top matches by pgvector cosine:\n`);
    for (const [i, r] of rows.entries()) {
      // eslint-disable-next-line no-console
      console.log(`  ${i + 1}. ${(r.similarity * 100).toFixed(1)}%  ${r.title} (${r.category})`);
    }
  } finally {
    await sql.end();
  }
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
