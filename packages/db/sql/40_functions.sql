-- Helper functions + triggers.

-- Keep updated_at fresh on every UPDATE.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT table_name FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'updated_at'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I', t || '_set_updated_at', t);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t || '_set_updated_at', t
    );
  END LOOP;
END $$;

-- is_event_member(event, user): used by chat/location RLS so a user only ever
-- sees rows for events they actually belong to.
CREATE OR REPLACE FUNCTION is_event_member(p_event_id uuid, p_user_id uuid)
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM event_member em
    WHERE em.event_id = p_event_id AND em.user_id = p_user_id
  )
$$;

-- is_conversation_member(conversation, user): chat visibility predicate.
CREATE OR REPLACE FUNCTION is_conversation_member(p_conversation_id uuid, p_user_id uuid)
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_member cm
    WHERE cm.conversation_id = p_conversation_id AND cm.user_id = p_user_id
  )
$$;

-- is_blocked(a, b): true if either user has blocked the other (total severance).
CREATE OR REPLACE FUNCTION is_blocked(p_a uuid, p_b uuid)
  RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM block b
    WHERE (b.blocker_id = p_a AND b.blocked_id = p_b)
       OR (b.blocker_id = p_b AND b.blocked_id = p_a)
  )
$$;

-- public_event_location(event): the ONLY location a non-approved client may read
-- — the geocell centroid, never the precise point (RISK_ANALYSIS §location).
CREATE OR REPLACE FUNCTION public_event_geojson(p_event_id uuid)
  RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('geocell', e.geocell, 'venue_name', e.venue_name)
  FROM event e WHERE e.id = p_event_id
$$;
