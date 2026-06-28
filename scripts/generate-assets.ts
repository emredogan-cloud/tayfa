/**
 * Tayfa asset generation pipeline (mission §IMAGE GENERATION).
 *
 * Reads a manifest of asset specs (docs/design-prompts/manifest.json — authored
 * with ultra-detailed prompts) and generates production-grade visuals via the
 * OpenAI Images API (gpt-image-1), writing optimized WebP/PNG into
 * assets/generated/. Idempotent: skips assets that already exist unless --force.
 *
 * Usage:
 *   OPENAI_API_KEY=... pnpm tsx scripts/generate-assets.ts            # all (skip existing)
 *   ... scripts/generate-assets.ts --only=app-icon,marketing-hero    # subset
 *   ... scripts/generate-assets.ts --force                           # regenerate
 *   ... scripts/generate-assets.ts --dry-run                         # list only
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = join(ROOT, 'docs', 'design-prompts', 'manifest.json');

type ImageSize = '1024x1024' | '1536x1024' | '1024x1536' | 'auto';
type Background = 'transparent' | 'opaque' | 'auto';
type Format = 'webp' | 'png';

interface AssetSpec {
  id: string;
  prompt: string;
  size?: ImageSize;
  outfile: string; // relative to assets/generated/
  background?: Background;
  format?: Format;
  quality?: 'low' | 'medium' | 'high' | 'auto';
}

/** Fallback manifest used when docs/design-prompts/manifest.json is absent. */
const DEFAULT_MANIFEST: AssetSpec[] = [
  {
    id: 'app-icon',
    outfile: 'icon/app-icon.png',
    size: '1024x1024',
    background: 'opaque',
    format: 'png',
    quality: 'high',
    prompt:
      'A premium mobile app icon for "Tayfa", a social app about real-life small-group hangouts. ' +
      'Abstract mark of three-to-four interlocking rounded shapes forming a tight friendly crew/cluster, ' +
      'suggesting people coming together for an activity — NOT hearts, NOT a chat bubble (this is not a dating app). ' +
      'Warm confident gradient from coral-orange (#FF6B4A) to a deep plum (#3B2A55), soft inner glow, subtle long shadow, ' +
      'rounded-square iOS canvas, crisp vector geometry, Apple-HIG polish, modern, optimistic, high-end. Flat-but-dimensional, ' +
      'no text, centered, generous padding.',
  },
  {
    id: 'marketing-hero',
    outfile: 'marketing/hero.webp',
    size: '1536x1024',
    background: 'opaque',
    format: 'webp',
    quality: 'high',
    prompt:
      'Editorial hero image for a premium social app landing page. A small diverse group of four friends in their twenties ' +
      'laughing together on a sunny Kadıköy (Istanbul) waterfront with bikes, golden-hour light, candid documentary energy, ' +
      'genuine warmth, motion and life — clearly platonic friends doing an activity together, NOT a date. Cinematic depth of field, ' +
      'warm coral-and-teal grade, soft film grain, aspirational but real. Space on the left for headline text. No logos, no readable text, ' +
      'faces non-identifiable / turned or mid-laugh.',
  },
  {
    id: 'onboarding-taste',
    outfile: 'onboarding/taste-cards.webp',
    size: '1024x1536',
    background: 'opaque',
    format: 'webp',
    quality: 'high',
    prompt:
      'A vibrant, joyful illustration for an onboarding "pick your interests" screen of a premium social app. ' +
      'A playful collage of tappable taste cards floating in space — cycling, bouldering, vinyl records, specialty coffee, ' +
      'board games, film cameras — rendered as glossy rounded cards with soft shadows and a warm coral-to-plum gradient backdrop, ' +
      'subtle depth and bokeh, Apple-meets-Discord polish, optimistic and identity-affirming. Modern flat-3D style, no text.',
  },
  {
    id: 'safety-illustration',
    outfile: 'safety/safety-center.webp',
    size: '1024x1024',
    background: 'transparent',
    format: 'webp',
    quality: 'high',
    prompt:
      'A reassuring, trustworthy illustration for a safety center screen: an abstract protective shield merged with a small group ' +
      'of friendly rounded figures and a verified checkmark, conveying "verified people, safe meetups." Calm confident palette of teal ' +
      'and warm coral with a soft glow, premium, clean, modern flat-3D, no text, transparent background.',
  },
];

function parseArgs(argv: string[]): { only: string[] | null; force: boolean; dryRun: boolean } {
  const only = argv.find((a) => a.startsWith('--only='));
  return {
    only: only
      ? only
          .slice('--only='.length)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : null,
    force: argv.includes('--force'),
    dryRun: argv.includes('--dry-run'),
  };
}

function loadManifest(): AssetSpec[] {
  if (existsSync(MANIFEST)) {
    try {
      const parsed = JSON.parse(readFileSync(MANIFEST, 'utf8')) as AssetSpec[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.warn(`! Could not parse ${MANIFEST}, using default manifest:`, (e as Error).message);
    }
  }
  return DEFAULT_MANIFEST;
}

async function generateOne(spec: AssetSpec, apiKey: string): Promise<Buffer> {
  const body = {
    model: 'gpt-image-1',
    prompt: spec.prompt,
    n: 1,
    size: spec.size ?? '1024x1024',
    quality: spec.quality ?? 'high',
    background: spec.background ?? 'auto',
    output_format: spec.format ?? 'webp',
  };
  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI Images ${res.status}: ${text.slice(0, 400)}`);
  }
  const json = (await res.json()) as { data: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new Error('No image data returned');
  return Buffer.from(b64, 'base64');
}

async function main(): Promise<void> {
  const { only, force, dryRun } = parseArgs(process.argv.slice(2));
  const apiKey = process.env.OPENAI_API_KEY;
  const manifest = loadManifest().filter((s) => (only ? only.includes(s.id) : true));

  console.warn(`Tayfa asset generation — ${manifest.length} asset(s)${dryRun ? ' (dry run)' : ''}`);
  if (!dryRun && !apiKey) {
    console.error('OPENAI_API_KEY is required (set it in .env / the environment).');
    process.exit(1);
  }

  const outDir = join(ROOT, 'assets', 'generated');
  let made = 0;
  let skipped = 0;
  for (const spec of manifest) {
    // `outfile` may be repo-relative (assets/generated/…) or relative to outDir;
    // normalize so both forms land in the same place without double-nesting.
    const rel = spec.outfile.replace(/^assets\/generated\//, '');
    const dest = join(outDir, rel);
    if (dryRun) {
      console.warn(`  • ${spec.id} → assets/generated/${rel} [${spec.size ?? '1024x1024'}]`);
      continue;
    }
    if (existsSync(dest) && !force) {
      console.warn(`  = ${spec.id} exists, skipping (use --force to regenerate)`);
      skipped++;
      continue;
    }
    try {
      const buf = await generateOne(spec, apiKey!);
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, buf);
      console.warn(
        `  ✓ ${spec.id} → assets/generated/${rel} (${(buf.length / 1024).toFixed(0)} KB)`,
      );
      made++;
    } catch (e) {
      console.error(`  ✗ ${spec.id} failed: ${(e as Error).message}`);
    }
  }
  console.warn(`Done. ${made} generated, ${skipped} skipped.`);
}

void main();
