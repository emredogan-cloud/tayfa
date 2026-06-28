-- Tayfa tables (Data Model §5). Matches the Drizzle schema in src/schema/*.
-- UUID PKs; created_at/updated_at everywhere; soft-delete on user content.

CREATE TABLE IF NOT EXISTS city (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(120) NOT NULL,
  country_code varchar(2) NOT NULL,
  center_lat double precision NOT NULL,
  center_lng double precision NOT NULL,
  timezone text NOT NULL DEFAULT 'Europe/Istanbul',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name varchar(40) NOT NULL,
  bio varchar(500),
  birthdate date NOT NULL,
  home_city_id uuid REFERENCES city(id),
  neighborhood varchar(80),
  avatar_url text,
  languages jsonb NOT NULL DEFAULT '["tr"]',
  verification_level verification_level NOT NULL DEFAULT 'none',
  reliability_score integer NOT NULL DEFAULT 70,
  safety_score integer NOT NULL DEFAULT 75,
  entitlement entitlement NOT NULL DEFAULT 'free',
  interest_embedding vector(1536),
  embedding_model text,
  embedding_version integer,
  geocell text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS device (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token text,
  platform platform NOT NULL,
  fingerprint_hash text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type verification_type NOT NULL,
  provider text NOT NULL DEFAULT 'persona',
  provider_ref text,
  status varchar(24) NOT NULL DEFAULT 'pending',
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS consent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category consent_category NOT NULL,
  granted boolean NOT NULL,
  consent_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category, consent_version)
);

CREATE TABLE IF NOT EXISTS block (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS interest_taxonomy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain interest_domain NOT NULL,
  label varchar(120) NOT NULL,
  slug varchar(140) NOT NULL UNIQUE,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interest_id uuid NOT NULL REFERENCES interest_taxonomy(id),
  weight double precision NOT NULL DEFAULT 1,
  source interest_source NOT NULL DEFAULT 'onboarding',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, interest_id)
);

CREATE TABLE IF NOT EXISTS event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title varchar(80) NOT NULL,
  description varchar(1000),
  category varchar(60) NOT NULL,
  location geography(Point,4326) NOT NULL,
  geocell text NOT NULL,
  venue_name varchar(120),
  address text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  capacity_min integer NOT NULL DEFAULT 2,
  capacity_max integer NOT NULL DEFAULT 6,
  going_count integer NOT NULL DEFAULT 0,
  visibility event_visibility NOT NULL DEFAULT 'public',
  status event_status NOT NULL DEFAULT 'open',
  women_only boolean NOT NULL DEFAULT false,
  verified_only boolean NOT NULL DEFAULT false,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT event_capacity_no_1on1 CHECK (capacity_min >= 2),
  CONSTRAINT event_capacity_order CHECK (capacity_max >= capacity_min),
  CONSTRAINT event_time_order CHECK (ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS event_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  interest_id uuid NOT NULL REFERENCES interest_taxonomy(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, interest_id)
);

CREATE TABLE IF NOT EXISTS event_member (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role event_member_role NOT NULL DEFAULT 'member',
  rsvp_status rsvp_status NOT NULL DEFAULT 'requested',
  joined_at timestamptz NOT NULL DEFAULT now(),
  checkin_at timestamptz,
  checkin_location geography(Point,4326),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, user_id)
);

CREATE TABLE IF NOT EXISTS crew (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL,
  cadence varchar(16) NOT NULL DEFAULT 'weekly',
  next_meetup_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS crew_member (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id uuid NOT NULL REFERENCES crew(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (crew_id, user_id)
);

CREATE TABLE IF NOT EXISTS crew_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  crew_id uuid NOT NULL REFERENCES crew(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (crew_id, event_id)
);

CREATE TABLE IF NOT EXISTS conversation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope conversation_scope NOT NULL,
  scope_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, scope_id)
);

CREATE TABLE IF NOT EXISTS conversation_member (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz,
  muted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS message (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body varchar(2000) NOT NULL,
  media_url text,
  moderation_status moderation_status NOT NULL DEFAULT 'clear',
  idempotency_key uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS report (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type report_target_type NOT NULL,
  target_id uuid NOT NULL,
  reason varchar(60) NOT NULL,
  severity report_severity NOT NULL,
  detail varchar(1000),
  evidence_url text,
  status report_status NOT NULL DEFAULT 'open',
  sla_deadline timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS moderation_action (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES report(id),
  target_user_id uuid,
  actor moderation_actor NOT NULL,
  action moderation_action_type NOT NULL,
  rationale text,
  confidence integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rating (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES event(id) ON DELETE CASCADE,
  vibe integer NOT NULL,
  showed_up boolean NOT NULL,
  would_meet_again boolean NOT NULL,
  private_safety_flag boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (rater_id, target_user_id, event_id),
  CONSTRAINT rating_vibe_range CHECK (vibe BETWEEN 1 AND 5)
);

CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  actor_type varchar(16) NOT NULL DEFAULT 'human',
  action varchar(80) NOT NULL,
  target_type varchar(40),
  target_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type varchar(60) NOT NULL,
  category varchar(24) NOT NULL,
  payload jsonb,
  sent_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product text NOT NULL,
  store subscription_store NOT NULL,
  entitlement entitlement NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'active',
  renews_at timestamptz,
  provider_txn_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS referral (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referee_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  code varchar(16) NOT NULL UNIQUE,
  state referral_state NOT NULL DEFAULT 'created',
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
