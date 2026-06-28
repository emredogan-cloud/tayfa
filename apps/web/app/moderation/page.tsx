import type React from 'react';
import Link from 'next/link';
import { asc, inArray } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { REPORT_SLA_MINUTES } from '@tayfa/shared/constants';
import type { ReportSeverity, ReportStatus } from '@tayfa/shared/types';
import { getServiceDb } from '@/lib/db.js';
import { requireConsoleAccess } from './access.js';

export const dynamic = 'force-dynamic';

const OPEN_STATUSES: readonly ReportStatus[] = ['open', 'triaged', 'appealed'];

const SEVERITY_STYLE: Record<ReportSeverity, string> = {
  safety_critical: 'bg-coral text-cream',
  high: 'bg-amber-200 text-amber-900',
  standard: 'bg-ink/10 text-ink',
};

function minutesLeft(deadline: Date): number {
  return Math.round((deadline.getTime() - Date.now()) / 60_000);
}

/**
 * GET /moderation — the T&S queue (v0). Sorted by SLA DEADLINE ascending so the
 * most urgent (and overdue) reports surface first. The SLA itself is the spine's
 * `REPORT_SLA_MINUTES` (30m / 4h / 24h by severity), computed at file time and
 * stored on each report.
 */
export default async function ModerationQueuePage(): Promise<React.JSX.Element> {
  const access = await requireConsoleAccess();
  if (!access.ok) return access.element;

  const db = getServiceDb();
  const reports = await db
    .select({
      id: schema.report.id,
      targetType: schema.report.targetType,
      targetId: schema.report.targetId,
      reason: schema.report.reason,
      severity: schema.report.severity,
      status: schema.report.status,
      slaDeadline: schema.report.slaDeadline,
      createdAt: schema.report.createdAt,
    })
    .from(schema.report)
    .where(inArray(schema.report.status, [...OPEN_STATUSES]))
    .orderBy(asc(schema.report.slaDeadline))
    .limit(200);

  const overdue = reports.filter((r) => minutesLeft(r.slaDeadline) < 0).length;

  return (
    <main className="min-h-screen bg-sand text-ink">
      <header className="border-b border-ink/10 bg-cream">
        <div className="container-tayfa flex items-center justify-between py-5">
          <div>
            <h1 className="text-lg font-bold">Trust &amp; Safety — Queue</h1>
            <p className="text-sm text-ink-muted">
              {reports.length} open · {overdue} past SLA
            </p>
          </div>
          <div className="flex gap-2 text-xs text-ink-muted">
            {(Object.keys(REPORT_SLA_MINUTES) as ReportSeverity[]).map((s) => (
              <span key={s} className="pill">
                {s.replace('_', ' ')}: {REPORT_SLA_MINUTES[s]}m
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="container-tayfa py-8">
        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-cream shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-ink/5 text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">SLA</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5">
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-ink-muted">
                    Queue is clear. Nice.
                  </td>
                </tr>
              ) : (
                reports.map((r) => {
                  const left = minutesLeft(r.slaDeadline);
                  const isOverdue = left < 0;
                  return (
                    <tr key={r.id} className="hover:bg-ink/[0.03]">
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${SEVERITY_STYLE[r.severity]}`}
                        >
                          {r.severity.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{r.reason}</td>
                      <td className="px-4 py-3 text-ink-muted">
                        {r.targetType} ·{' '}
                        <span className="font-mono text-xs">{r.targetId.slice(0, 8)}</span>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{r.status}</td>
                      <td className="px-4 py-3">
                        <span
                          className={isOverdue ? 'font-semibold text-coral-deep' : 'text-ink-muted'}
                        >
                          {isOverdue ? `overdue ${Math.abs(left)}m` : `${left}m left`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/moderation/${r.id}`}
                          className="font-semibold text-teal-deep hover:underline"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
