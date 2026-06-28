import { eq } from 'drizzle-orm';
import { schema } from '@tayfa/db';
import { profileSetupSchema } from '@tayfa/shared/schemas';
import { requireSession } from '@/lib/auth.js';
import { getServiceDb } from '@/lib/db.js';
import { apiHandler, jsonOk, ApiError, parseJson } from '@/lib/http.js';

export const runtime = 'nodejs';

/**
 * POST /api/profile — complete/update the signed-in user's profile (P1).
 *
 * The profile ROW is created at age-gate time (it carries the 18+ birthdate); this
 * endpoint fills in the public, editable fields. It is idempotent: re-POSTing the
 * same values is a harmless update. We never accept `verificationLevel`,
 * `entitlement`, or scores from the client — those are server-owned.
 */
export const POST = apiHandler(async (req: Request) => {
  const session = await requireSession();
  const input = await parseJson(req, profileSetupSchema);

  const db = getServiceDb();

  // exactOptionalPropertyTypes: only set columns the client actually provided.
  const updates: Partial<typeof schema.profile.$inferInsert> = {
    displayName: input.displayName,
    languages: [...input.languages],
    updatedAt: new Date(),
  };
  if (input.bio !== undefined) updates.bio = input.bio;
  if (input.neighborhood !== undefined) updates.neighborhood = input.neighborhood;
  if (input.homeCityId !== undefined) updates.homeCityId = input.homeCityId;

  const [row] = await db
    .update(schema.profile)
    .set(updates)
    .where(eq(schema.profile.userId, session.userId))
    .returning({
      userId: schema.profile.userId,
      displayName: schema.profile.displayName,
      bio: schema.profile.bio,
      neighborhood: schema.profile.neighborhood,
      avatarUrl: schema.profile.avatarUrl,
      verificationLevel: schema.profile.verificationLevel,
      reliabilityScore: schema.profile.reliabilityScore,
    });

  if (!row) {
    // No profile row → age gate hasn't been completed. The client must run the
    // 18+ gate first (which inserts the row with the validated birthdate).
    throw new ApiError(
      409,
      'profile_not_initialized',
      'Complete the age gate before setting up your profile',
    );
  }

  return jsonOk({ profile: row });
});
