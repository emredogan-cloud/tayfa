import type React from 'react';
import Link from 'next/link';
import { PRICING, BEACHHEAD } from '@tayfa/shared/constants';

/**
 * Marketing landing. The story is deliberately anti-dating-app: warmth, real
 * activity, verification, and control over visibility. Brand tokens live in
 * tailwind.config.ts; prices come from the shared PRICING config (never hardcoded).
 */

const STEPS = [
  {
    n: '01',
    title: 'Build your taste card',
    body: 'Pick the music, films, sports and hobbies you actually care about. Optionally import from Spotify, Apple Music or Letterboxd.',
  },
  {
    n: '02',
    title: 'Find a small group near you',
    body: 'We match you to 3–6 person hangouts around shared interests and your neighborhood — never a 1:1, never a swipe.',
  },
  {
    n: '03',
    title: 'Show up & meet your tayfa',
    body: 'The exact spot unlocks for approved members just before it starts. Check in, vibe, and build a crew you keep seeing.',
  },
];

const FAQS = [
  {
    q: 'Is Tayfa a dating app?',
    a: 'No. Tayfa is built for friendships and small-group hangouts around shared hobbies. There is no 1:1 matching and no swiping — the smallest group is two-plus people doing something together.',
  },
  {
    q: 'How do you keep it safe?',
    a: 'Everyone is 18+ and phone-verified; hosts complete free ID + liveness verification. You control who sees you, your precise location is never shared until just before a meetup with approved members, and blocking, reporting and a safety center are always free.',
  },
  {
    q: 'Who can see my location?',
    a: 'By default, others see only your neighborhood. The precise meeting spot is released to approved attendees in a short window before the event — and never to anyone you have not approved.',
  },
  {
    q: 'What costs money?',
    a: 'The core loop is free forever: discovering events, joining, group chat, verification, and every safety feature. Tayfa+ adds conveniences like unlimited crews and advanced filters — never anything related to your safety.',
  },
];

export default function LandingPage(): React.JSX.Element {
  const tr = PRICING.TR;

  return (
    <main className="bg-cream text-ink">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-30 border-b border-ink/5 bg-cream/80 backdrop-blur">
        <nav className="container-tayfa flex items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-coral text-cream">
              T
            </span>
            Tayfa
          </Link>
          <div className="hidden items-center gap-7 text-sm font-medium text-ink-muted sm:flex">
            <a href="#how" className="transition hover:text-ink">
              How it works
            </a>
            <a href="#safety" className="transition hover:text-ink">
              Safety
            </a>
            <a href="#faq" className="transition hover:text-ink">
              FAQ
            </a>
          </div>
          <a
            href="#get"
            className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-cream transition hover:bg-ink-soft"
          >
            Get the app
          </a>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="bg-aurora">
        <div className="container-tayfa grid gap-12 py-20 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="animate-fade-up">
            <span className="pill">Now in beta · {BEACHHEAD.cityName}</span>
            <h1 className="mt-5 font-display text-5xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl">
              Friends through{' '}
              <span className="relative whitespace-nowrap text-coral">
                doing,
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 12"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M2 9C50 3 150 3 198 9"
                    stroke="#1fb6a6"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{' '}
              not swiping.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-muted">
              Tayfa turns the things you love — your music, your teams, your weird little hobbies —
              into real-life, small-group hangouts with verified people nearby. No swiping. No 1:1
              pressure. Just your crew.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3" id="get">
              <a
                href="#get"
                className="rounded-2xl bg-coral px-6 py-3.5 text-base font-semibold text-cream shadow-card transition hover:bg-coral-deep"
              >
                Join the waitlist
              </a>
              <a
                href="#how"
                className="rounded-2xl border border-ink/15 px-6 py-3.5 text-base font-semibold text-ink transition hover:border-ink/40"
              >
                See how it works
              </a>
            </div>
            <p className="mt-5 text-sm text-ink-muted">
              18+ · Verified members · You choose who sees you · <strong>Not a dating app</strong>
            </p>
          </div>

          {/* Decorative event-card cluster */}
          <div className="relative animate-fade-up">
            <div className="rotate-2 rounded-3xl bg-ink p-6 text-cream shadow-lift">
              <div className="flex items-center gap-2 text-xs font-semibold text-coral-soft">
                <span className="grid h-6 w-6 place-items-center rounded-md bg-coral font-bold text-cream">
                  T
                </span>
                Vinyl listening night
              </div>
              <p className="mt-4 font-display text-2xl font-bold">Shoegaze &amp; filter coffee</p>
              <p className="mt-1 text-sm text-cream/60">Kadıköy · Sat 19:00 · 4 going · 2 spots</p>
              <div className="mt-5 flex -space-x-2">
                {['#ff6a5b', '#1fb6a6', '#f7c948', '#7c6cf0'].map((c) => (
                  <span
                    key={c}
                    className="h-8 w-8 rounded-full border-2 border-ink"
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>
            <div className="absolute -bottom-8 -left-4 w-56 -rotate-3 rounded-2xl bg-cream p-5 shadow-lift ring-1 ring-ink/5">
              <p className="text-xs font-semibold text-teal-deep">VERIFIED HOST</p>
              <p className="mt-1 font-display text-lg font-bold">Defne, 26</p>
              <p className="text-xs text-ink-muted">ID + liveness · 12 meetups hosted</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Value prop ── */}
      <section className="container-tayfa grid gap-6 py-20 sm:grid-cols-3">
        {[
          {
            t: 'Built around interests',
            d: 'Match on the bands, films and hobbies you actually love — not a headshot.',
          },
          {
            t: 'Small groups only',
            d: 'Every hangout is 3–6 people. No 1:1 pressure, no awkward dates.',
          },
          {
            t: 'Verified & in control',
            d: 'Real, 18+, verified members. Your precise location is yours until you say otherwise.',
          },
        ].map((v) => (
          <div
            key={v.t}
            className="rounded-2xl border border-ink/10 bg-sand p-7 transition hover:shadow-card"
          >
            <h3 className="font-display text-xl font-bold">{v.t}</h3>
            <p className="mt-2 text-ink-muted">{v.d}</p>
          </div>
        ))}
      </section>

      {/* ── How it works ── */}
      <section id="how" className="border-y border-ink/10 bg-ink py-20 text-cream">
        <div className="container-tayfa">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">How Tayfa works</h2>
          <p className="mt-3 max-w-2xl text-cream/60">
            Three steps from "I just moved here and know no one" to a crew you see every week.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <span className="font-display text-5xl font-extrabold text-coral/40">{s.n}</span>
                <h3 className="mt-3 font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-cream/70">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Safety ── */}
      <section id="safety" className="container-tayfa py-20">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <span className="pill">Safety first, always free</span>
            <h2 className="mt-4 font-display text-3xl font-extrabold sm:text-4xl">
              Meeting strangers should feel safe — so we engineered for it.
            </h2>
            <p className="mt-4 text-ink-muted">
              Safety is never behind a paywall. Verification, blocking, reporting, the safety
              center, and women-only / verified-only filters are free for everyone, forever.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                t: '18+ & verified',
                d: 'Hard age gate plus phone, ID and liveness verification for hosts — paid for by us, not you.',
              },
              {
                t: 'Location privacy',
                d: 'Others see a neighborhood, not a pin. The exact spot unlocks only for approved members, just before start.',
              },
              {
                t: 'Real accountability',
                d: 'Reliability and safety scores, mutual check-ins, and a 24/7 trust & safety team with strict response SLAs.',
              },
              {
                t: 'You set the terms',
                d: 'Women-only and verified-only events, one-tap block and report, and a safety center one tap away.',
              },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-card">
                <h3 className="font-display text-lg font-bold text-teal-deep">{c.t}</h3>
                <p className="mt-2 text-sm text-ink-muted">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ── */}
      <section className="border-y border-ink/10 bg-sand py-16">
        <div className="container-tayfa flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-extrabold">Free to find your people.</h2>
            <p className="mt-2 max-w-lg text-ink-muted">
              The whole core loop is free. Tayfa+ is optional —{' '}
              <strong>
                {tr.monthly} {tr.currency}/mo
              </strong>{' '}
              or {tr.annual} {tr.currency}/yr for conveniences like unlimited crews and advanced
              filters. Never anything to do with your safety.
            </p>
          </div>
          <a
            href="#get"
            className="shrink-0 rounded-2xl bg-coral px-6 py-3.5 font-semibold text-cream shadow-card transition hover:bg-coral-deep"
          >
            Join the waitlist
          </a>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="container-tayfa py-20">
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Questions, answered</h2>
        <div className="mt-10 divide-y divide-ink/10">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer items-center justify-between font-display text-lg font-semibold">
                {f.q}
                <span className="ml-4 text-coral transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 max-w-2xl text-ink-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-ink/10 bg-ink py-14 text-cream">
        <div className="container-tayfa grid gap-8 sm:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2 font-display text-lg font-extrabold">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-coral text-cream">
                T
              </span>
              Tayfa
            </div>
            <p className="mt-3 max-w-xs text-sm text-cream/60">
              Verified, location-based meetups built around what you love. Starting in{' '}
              {BEACHHEAD.cityName}. Not a dating app.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-cream/80">Legal</p>
            <ul className="mt-3 space-y-2 text-cream/60">
              <li>
                <Link href="/privacy" className="hover:text-cream">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-cream">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/kvkk" className="hover:text-cream">
                  KVKK Aydınlatma Metni
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-cream/80">Company</p>
            <ul className="mt-3 space-y-2 text-cream/60">
              <li>
                <a href="mailto:hello@tayfa.app" className="hover:text-cream">
                  Contact
                </a>
              </li>
              <li>
                <a href="mailto:safety@tayfa.app" className="hover:text-cream">
                  Trust &amp; Safety
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="container-tayfa mt-10 border-t border-cream/10 pt-6 text-xs text-cream/50">
          © {new Date().getFullYear()} Tayfa. Data hosted in the EU (Frankfurt). GDPR &amp; KVKK
          compliant.
        </div>
      </footer>
    </main>
  );
}
