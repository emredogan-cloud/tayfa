import { EMBEDDING } from '@tayfa/shared/constants';

/**
 * Real OpenAI embedding (text-embedding-3-small, 1536-d, L2-normalized for
 * cosine). Used by the seed + offline matching verification so they exercise the
 * SAME production embedding the BFF uses (apps/web/lib/ai.ts). Raw fetch — no SDK.
 *
 * Returns `null` when no OPENAI_API_KEY is set so callers can fall back to the
 * deterministic mock embedding (keyless dev / CI).
 */
export async function embedTextOpenAI(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING.model, input: text }),
  });
  if (!res.ok) {
    throw new Error(`OpenAI embeddings ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  const vec = json.data?.[0]?.embedding;
  if (!vec || vec.length !== EMBEDDING.dimensions) {
    throw new Error(`Unexpected embedding shape (${vec?.length ?? 0} dims)`);
  }
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}
