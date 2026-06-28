import { withSentryConfig } from '@sentry/nextjs';

/**
 * Next.js config for the Tayfa web surface.
 *
 * Security posture (RISK_ANALYSIS): the web tier is the ONLY place that holds the
 * Supabase service role and may release precise location. Everything client-bound
 * is gated through the BFF Route Handlers under `app/api/*`. We ship strict
 * security headers and transpile the workspace packages so the spine's ESM
 * sources resolve without a prebuild step.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Lint runs as its own Turbo task (`next lint`); don't also fail the build on it
  // (the Turkish KVKK copy intentionally contains apostrophes). TYPE errors still
  // fail the build — `typescript.ignoreBuildErrors` stays false.
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  // The spine ships as TS source via package `exports`; let Next compile it.
  transpilePackages: ['@tayfa/shared', '@tayfa/db'],
  // ESM-style `.js` import specifiers (e.g. '@/lib/auth.js') must resolve to the
  // `.ts`/`.tsx` source under webpack, matching tsc's Bundler resolution.
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
  experimental: {
    // `next/og` ImageResponse + typed route params.
    typedRoutes: false,
  },
  // Precise coordinates never travel to the client; OG images are PII-free.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(self), camera=(), microphone=(), browsing-topics=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

// Sentry wraps the build to upload sourcemaps + instrument server/edge runtimes.
// All options are no-ops when SENTRY_* env is absent (mock-safe local/CI).
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  disableLogger: true,
  // Tunnel browser events through a same-origin route to dodge ad-blockers.
  tunnelRoute: '/monitoring',
});
