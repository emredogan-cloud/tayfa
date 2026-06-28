import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

/**
 * Apply the authoritative SQL in `sql/` in lexical order. This is the deployment
 * artifact (extensions → auth shim → enums → tables → indexes → functions →
 * RLS). Idempotent: every statement is IF NOT EXISTS / OR REPLACE / guarded.
 */
const here = dirname(fileURLToPath(import.meta.url));
const sqlDir = join(here, '..', 'sql');

export async function runMigrations(connectionString: string): Promise<string[]> {
  const sql = postgres(connectionString, { max: 1, prepare: false, onnotice: () => {} });
  const applied: string[] = [];
  try {
    const files = readdirSync(sqlDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const file of files) {
      const content = readFileSync(join(sqlDir, file), 'utf8');
      await sql.unsafe(content);
      applied.push(file);

      console.warn(`✓ applied ${file}`);
    }
    return applied;
  } finally {
    await sql.end();
  }
}

// Run directly: `tsx src/migrate.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is required');
    process.exit(1);
  }
  runMigrations(url)
    .then((files) => {
      console.warn(`Done. Applied ${files.length} files.`);
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
