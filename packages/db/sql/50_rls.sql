-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security — deny-by-default + FORCE on EVERY table (TECH_DECISIONS
-- ADR-005, RISK_ANALYSIS §RLS). No policy ⇒ no access. auth.uid() is wrapped in
-- a scalar subquery so it is evaluated once per query, not once per row.
--
-- The precise `event.location` is members-only at the table level; discovery
-- reads the location-free `feed_event` view. This is the structural guarantee
-- that precise coordinates never reach a non-approved user.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable + FORCE RLS on all public tables (FORCE so even the table owner obeys).
DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Base table privileges (RLS still restricts which ROWS are visible).
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON
  profile, device, verification, consent, block, user_interest,
  event, event_member, crew, crew_member, crew_event,
  conversation, conversation_member, message, report, rating, referral
TO authenticated;
GRANT SELECT ON city, interest_taxonomy, event_interest TO anon, authenticated;

-- ── Reference data: world-readable, service-role writable ─────────────────────
CREATE POLICY city_read ON city FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY interest_read ON interest_taxonomy FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY event_interest_read ON event_interest FOR SELECT TO authenticated USING (true);

-- ── profile: own row only at the base table; public slice via the view below ──
CREATE POLICY profile_select_own ON profile FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));
CREATE POLICY profile_insert_own ON profile FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY profile_update_own ON profile FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ── device / verification / consent / user_interest: strictly own ─────────────
CREATE POLICY device_all_own ON device FOR ALL TO authenticated
  USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY verification_select_own ON verification FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));
CREATE POLICY verification_insert_own ON verification FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY consent_select_own ON consent FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));
CREATE POLICY consent_insert_own ON consent FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY user_interest_all_own ON user_interest FOR ALL TO authenticated
  USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ── block: the blocker manages their own blocks ──────────────────────────────
CREATE POLICY block_select_own ON block FOR SELECT TO authenticated
  USING (blocker_id = (select auth.uid()));
CREATE POLICY block_insert_own ON block FOR INSERT TO authenticated
  WITH CHECK (blocker_id = (select auth.uid()));
CREATE POLICY block_delete_own ON block FOR DELETE TO authenticated
  USING (blocker_id = (select auth.uid()));

-- ── event: precise rows are MEMBERS-ONLY (host or RSVP'd). Non-members use the
--    feed_event view. Blocked users never see each other's events. ────────────
CREATE POLICY event_select_member ON event FOR SELECT TO authenticated
  USING (
    host_id = (select auth.uid())
    OR is_event_member(id, (select auth.uid()))
  );
CREATE POLICY event_insert_host ON event FOR INSERT TO authenticated
  WITH CHECK (host_id = (select auth.uid()));
CREATE POLICY event_update_host ON event FOR UPDATE TO authenticated
  USING (host_id = (select auth.uid())) WITH CHECK (host_id = (select auth.uid()));

-- ── event_member: see your own memberships + co-members of your events ────────
CREATE POLICY event_member_select ON event_member FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    OR is_event_member(event_id, (select auth.uid()))
  );
CREATE POLICY event_member_insert_self ON event_member FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY event_member_update_self ON event_member FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));

-- ── crews: visible to their members ──────────────────────────────────────────
CREATE POLICY crew_member_select ON crew_member FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (SELECT 1 FROM crew_member cm WHERE cm.crew_id = crew_member.crew_id
               AND cm.user_id = (select auth.uid()))
  );
CREATE POLICY crew_member_insert_self ON crew_member FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY crew_select_member ON crew FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM crew_member cm WHERE cm.crew_id = crew.id
                 AND cm.user_id = (select auth.uid())));
CREATE POLICY crew_event_select_member ON crew_event FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM crew_member cm WHERE cm.crew_id = crew_event.crew_id
                 AND cm.user_id = (select auth.uid())));

-- ── chat: messages + conversations readable ONLY by conversation members ──────
CREATE POLICY conversation_select_member ON conversation FOR SELECT TO authenticated
  USING (is_conversation_member(id, (select auth.uid())));
CREATE POLICY conversation_member_select ON conversation_member FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    OR is_conversation_member(conversation_id, (select auth.uid()))
  );
CREATE POLICY conversation_member_update_self ON conversation_member FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY message_select_member ON message FOR SELECT TO authenticated
  USING (is_conversation_member(conversation_id, (select auth.uid())));
CREATE POLICY message_insert_member ON message FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (select auth.uid())
    AND is_conversation_member(conversation_id, (select auth.uid()))
  );

-- ── reports + ratings: reporter/rater owns their rows (private flags protected)─
CREATE POLICY report_select_own ON report FOR SELECT TO authenticated
  USING (reporter_id = (select auth.uid()));
CREATE POLICY report_insert_own ON report FOR INSERT TO authenticated
  WITH CHECK (reporter_id = (select auth.uid()));
CREATE POLICY rating_select_own ON rating FOR SELECT TO authenticated
  USING (rater_id = (select auth.uid()));
CREATE POLICY rating_insert_own ON rating FOR INSERT TO authenticated
  WITH CHECK (rater_id = (select auth.uid()));

-- ── growth: own notifications / subscriptions / referrals ─────────────────────
CREATE POLICY notification_select_own ON notification FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));
CREATE POLICY notification_update_own ON notification FOR UPDATE TO authenticated
  USING (user_id = (select auth.uid())) WITH CHECK (user_id = (select auth.uid()));
CREATE POLICY subscription_select_own ON subscription FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));
CREATE POLICY referral_select_own ON referral FOR SELECT TO authenticated
  USING (referrer_id = (select auth.uid()) OR referee_id = (select auth.uid()));
CREATE POLICY referral_insert_own ON referral FOR INSERT TO authenticated
  WITH CHECK (referrer_id = (select auth.uid()));

-- NOTE: moderation_action and audit_log have RLS enabled with NO policy ⇒ DENY
-- to all authenticated users. They are accessed exclusively by the service role
-- (BFF / T&S console), which bypasses RLS. This is the deny-by-default proof.

-- ── feed_event view: the location-free public discovery surface ───────────────
-- SECURITY DEFINER view (owned by a privileged role) so discovery works without
-- exposing the precise `location` column. It deliberately omits `location`.
CREATE OR REPLACE VIEW feed_event
  WITH (security_invoker = false) AS
  SELECT
    e.id, e.host_id, e.title, e.description, e.category,
    e.geocell, e.venue_name, e.starts_at, e.ends_at,
    e.capacity_min, e.capacity_max, e.going_count,
    e.visibility, e.status, e.women_only, e.verified_only
  FROM event e
  WHERE e.deleted_at IS NULL
    AND e.status = 'open'
    AND e.visibility IN ('public', 'interest_match');
GRANT SELECT ON feed_event TO authenticated, anon;

-- ── public_profile view: the safe slice of other users (no birthdate/PII) ─────
CREATE OR REPLACE VIEW public_profile
  WITH (security_invoker = false) AS
  SELECT
    p.user_id, p.display_name, p.bio, p.avatar_url,
    p.verification_level, p.reliability_score, p.neighborhood
  FROM profile p
  WHERE p.deleted_at IS NULL;
GRANT SELECT ON public_profile TO authenticated;
