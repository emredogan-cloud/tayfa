import type React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { MODERATION_ACTIONS } from '@tayfa/shared/types';
import { getServiceDb } from '@/lib/db.js';
import { requireConsoleAccess } from '../access.js';
import { resolveAppeal, resolveReport } from '../actions.js';

export const dynamic = 'force-dynamic';

/**
 * GET /moderation/[reportId] — report detail + actions. Shows the report, the
 * scam-language signal, prior moderation actions, and the immutable audit trail.
 * Actions are taken via the `resolveReport` Server Action, which re-checks
 * authorization and writes both a moderation_action and an audit_log row.
 */
export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}): Promise<React.JSX.Element> {
  const access = await requireConsoleAccess();
  if (!access.ok) return access.element;

  const { reportId } = await params;
  const db = getServiceDb();

  const [report] = await db
    .select()
    .from(schema.report)
    .where(eq(schema.report.id, reportId))
    .limit(1);
  if (!report) notFound();

  const [actions, audit] = await Promise.all([
    db
      .select()
      .from(schema.moderationAction)
      .where(eq(schema.moderationAction.reportId, reportId))
      .orderBy(desc(schema.moderationAction.createdAt)),
    db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.targetId, report.targetId))
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(20),
  ]);

  const isResolved = report.status === 'actioned' || report.status === 'dismissed';

  return (
    <main className="min-h-screen bg-sand text-ink">
      <header className="border-b border-ink/10 bg-cream">
        <div className="container-tayfa flex items-center justify-between py-5">
          <Link href="/moderation" className="text-sm font-semibold text-teal-deep hover:underline">
            ← Queue
          </Link>
          <span className="pill">{report.status}</span>
        </div>
      </header>

      <div className="container-tayfa grid gap-8 py-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold">Report · {report.reason}</h1>
              <span className="rounded-full bg-coral/10 px-3 py-1 text-xs font-semibold text-coral-deep">
                {report.severity.replace('_', ' ')}
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <Field label="Target type" value={report.targetType} />
              <Field label="Target id" value={report.targetId} mono />
              <Field label="Reporter id" value={report.reporterId} mono />
              <Field label="Filed" value={report.createdAt.toISOString()} />
              <Field label="SLA deadline" value={report.slaDeadline.toISOString()} />
              <Field label="Evidence" value={report.evidenceUrl ?? '—'} />
            </dl>
            {report.detail ? (
              <p className="mt-4 rounded-xl bg-ink/5 p-4 text-sm text-ink-muted">{report.detail}</p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-card">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
              Prior actions
            </h2>
            {actions.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">No actions yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {actions.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-lg bg-ink/5 px-3 py-2"
                  >
                    <span className="font-medium">
                      {a.actor} · {a.action}
                    </span>
                    <span className="text-xs text-ink-muted">{a.createdAt.toISOString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Audit-log note: every privileged action is recorded immutably. */}
          <div className="rounded-2xl border border-ink/10 bg-cream p-6 shadow-card">
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
              Audit trail (target)
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Append-only. Preserved for legal + evidence (RISK_ANALYSIS §3.4).
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {audit.map((e) => (
                <li key={e.id} className="rounded-lg bg-ink/5 px-3 py-2">
                  <span className="font-medium">{e.action}</span>
                  <span className="ml-2 text-xs text-ink-muted">{e.createdAt.toISOString()}</span>
                </li>
              ))}
              {audit.length === 0 ? <li className="text-ink-muted">No audit entries.</li> : null}
            </ul>
          </div>
        </section>

        <aside>
          <form
            action={resolveReport}
            className="sticky top-6 space-y-4 rounded-2xl border border-ink/10 bg-cream p-6 shadow-card"
          >
            <h2 className="text-sm font-bold uppercase tracking-wide text-ink-muted">
              Take action
            </h2>
            <input type="hidden" name="reportId" value={report.id} />

            <label className="block text-sm font-medium">
              Decision
              <select
                name="decision"
                defaultValue="dismiss"
                disabled={isResolved}
                className="mt-1 w-full rounded-xl border border-ink/15 bg-cream px-3 py-2 text-sm"
              >
                <option value="dismiss">Dismiss (no action)</option>
                {MODERATION_ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-medium">
              Rationale
              <textarea
                name="rationale"
                rows={4}
                disabled={isResolved}
                placeholder="Why this decision (recorded in the audit log)…"
                className="mt-1 w-full rounded-xl border border-ink/15 bg-cream px-3 py-2 text-sm"
              />
            </label>

            <button
              type="submit"
              disabled={isResolved}
              className="w-full rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-cream transition hover:bg-ink-soft disabled:opacity-50"
            >
              {isResolved ? 'Resolved' : 'Record decision'}
            </button>
            <p className="text-xs text-ink-muted">
              Reversible decisions only. Bans go through a second-reviewer flow in production.
            </p>
          </form>

          {report.status === 'appealed' ? (
            <form
              action={resolveAppeal}
              className="mt-4 space-y-4 rounded-2xl border border-ember/30 bg-cream p-6 shadow-card"
            >
              <h2 className="text-sm font-bold uppercase tracking-wide text-ember">
                Resolve appeal
              </h2>
              <p className="text-xs text-ink-muted">
                The member appealed this enforcement. Overturning reverses it (logged as a cleared
                action); upholding keeps it in force. Either way it&apos;s audited.
              </p>
              <input type="hidden" name="reportId" value={report.id} />
              <label className="block text-sm font-medium">
                Appeal decision
                <select
                  name="decision"
                  defaultValue="uphold"
                  className="mt-1 w-full rounded-xl border border-ink/15 bg-cream px-3 py-2 text-sm"
                >
                  <option value="uphold">Uphold (action stands)</option>
                  <option value="overturn">Overturn (reverse action)</option>
                </select>
              </label>
              <label className="block text-sm font-medium">
                Rationale
                <textarea
                  name="rationale"
                  rows={3}
                  placeholder="Why this appeal outcome (recorded in the audit log)…"
                  className="mt-1 w-full rounded-xl border border-ink/15 bg-cream px-3 py-2 text-sm"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-xl bg-ember px-4 py-3 text-sm font-semibold text-cream transition hover:opacity-90"
              >
                Resolve appeal
              </button>
            </form>
          ) : null}
        </aside>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}): React.JSX.Element {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-ink-muted/70">{label}</dt>
      <dd className={`mt-0.5 break-all text-ink ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}
