import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';
import {
  blockSchema,
  reportSchema,
  type BlockInput,
  type ReportInput,
} from '@tayfa/shared/schemas';
import type { Report } from '@tayfa/shared/types';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';

/**
 * Safety actions — report + block. These are NEVER paywalled and never gated on
 * anything. The BFF computes severity + SLA (REPORT_SLA_MINUTES) server-side and
 * routes safety-critical reports to the 30-minute queue. We surface the typed
 * analytics signal but never block the UI on it.
 */
export function useReport(): UseMutationResult<Report, Error, ReportInput> {
  return useMutation({
    mutationFn: (input: ReportInput) => api.post<Report>('/reports', reportSchema.parse(input)),
    onSuccess: (report) => {
      track('report_filed', { target_type: report.targetType, severity: report.severity });
    },
  });
}

export function useBlock(): UseMutationResult<{ blockedUserId: string }, Error, BlockInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BlockInput) =>
      api.post<{ blockedUserId: string }>('/blocks', blockSchema.parse(input)),
    onSuccess: (result) => {
      track('user_blocked', { target_user_id: result.blockedUserId });
      // A block changes who you should see — refresh discovery.
      void qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
