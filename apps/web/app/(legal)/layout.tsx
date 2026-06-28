import type React from 'react';
import Link from 'next/link';

/**
 * Shared shell for the legal pages (privacy / terms / KVKK). Provides a readable
 * measure and consistent typographic rhythm via arbitrary-variant utilities so we
 * don't need a typography plugin.
 */
export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div className="min-h-screen bg-cream text-ink">
      <header className="border-b border-ink/10 bg-aurora">
        <div className="container-tayfa flex items-center justify-between py-5">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-coral text-cream">
              T
            </span>
            Tayfa
          </Link>
          <nav className="flex gap-5 text-sm font-medium text-ink-muted">
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
            <Link href="/kvkk" className="hover:text-ink">
              KVKK
            </Link>
          </nav>
        </div>
      </header>

      <article
        className="container-tayfa max-w-3xl py-14
          [&_h1]:font-display [&_h1]:text-4xl [&_h1]:font-extrabold [&_h1]:tracking-tight
          [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold
          [&_h3]:mt-6 [&_h3]:font-semibold
          [&_p]:mt-3 [&_p]:leading-relaxed [&_p]:text-ink-muted
          [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-6 [&_ul]:text-ink-muted
          [&_li]:leading-relaxed
          [&_a]:font-medium [&_a]:text-teal-deep [&_a]:underline
          [&_table]:mt-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm
          [&_th]:border [&_th]:border-ink/15 [&_th]:bg-ink/5 [&_th]:p-2 [&_th]:text-left
          [&_td]:border [&_td]:border-ink/15 [&_td]:p-2 [&_td]:align-top [&_td]:text-ink-muted"
      >
        {children}
      </article>

      <footer className="border-t border-ink/10 py-8">
        <div className="container-tayfa max-w-3xl text-xs text-ink-muted">
          Tayfa · Data hosted in the EU (Frankfurt) · <Link href="/">Back to home</Link>
        </div>
      </footer>
    </div>
  );
}
