import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { profileSetupSchema, type ProfileSetup } from '@tayfa/shared/schemas';
import { api } from '@/lib/api';
import { qk } from './keys';
import type { MyProfileResponse, PublicProfileResponse } from './types';

/** The signed-in user's own profile + reputation + trial-gating counts. */
export function useMyProfile(): UseQueryResult<MyProfileResponse, Error> {
  return useQuery({
    queryKey: qk.myProfile(),
    queryFn: ({ signal }) => api.get<MyProfileResponse>('/me/profile', undefined, signal),
  });
}

/** Another member's public slice (RLS-exposed subset). */
export function usePublicProfile(
  userId: string | undefined,
): UseQueryResult<PublicProfileResponse, Error> {
  return useQuery({
    queryKey: qk.publicProfile(userId ?? 'unknown'),
    enabled: Boolean(userId),
    queryFn: ({ signal }) => api.get<PublicProfileResponse>(`/users/${userId}`, undefined, signal),
  });
}

/** Edit profile (display name / bio / neighborhood). Validated by the shared schema. */
export function useUpdateProfile(): UseMutationResult<MyProfileResponse, Error, ProfileSetup> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileSetup) => {
      const valid = profileSetupSchema.parse(input);
      return api.patch<MyProfileResponse>('/me/profile', valid);
    },
    onSuccess: (next) => {
      qc.setQueryData(qk.myProfile(), next);
    },
  });
}
