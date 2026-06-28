-- Indexing & performance (Data Model §5). Geo = GiST; vector = HNSW (cosine).

-- Geospatial: "within Xkm" discovery (PostGIS ST_DWithin).
CREATE INDEX IF NOT EXISTS event_location_gix ON event USING gist (location);
CREATE INDEX IF NOT EXISTS event_member_checkin_gix ON event_member USING gist (checkin_location);

-- Interest ANN matching (HNSW, cosine ops). ef_construction/m tunable.
CREATE INDEX IF NOT EXISTS profile_embedding_hnsw
  ON profile USING hnsw (interest_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS event_embedding_hnsw
  ON event USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS interest_embedding_hnsw
  ON interest_taxonomy USING hnsw (embedding vector_cosine_ops);

-- Feed + bucketing.
CREATE INDEX IF NOT EXISTS event_feed_idx ON event (status, starts_at) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS event_geocell_idx ON event (geocell);
CREATE INDEX IF NOT EXISTS profile_geocell_idx ON profile (geocell);

-- Membership / ledger.
CREATE INDEX IF NOT EXISTS event_member_user_idx ON event_member (user_id, rsvp_status);
CREATE INDEX IF NOT EXISTS event_member_event_idx ON event_member (event_id);
CREATE INDEX IF NOT EXISTS message_conversation_idx ON message (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS conversation_member_user_idx ON conversation_member (user_id);

-- Interest search (taste cards).
CREATE INDEX IF NOT EXISTS interest_label_trgm ON interest_taxonomy USING gin (label gin_trgm_ops);

-- Safety queue SLA.
CREATE INDEX IF NOT EXISTS report_status_idx ON report (status, sla_deadline);
CREATE INDEX IF NOT EXISTS block_blocker_idx ON block (blocker_id);
CREATE INDEX IF NOT EXISTS block_blocked_idx ON block (blocked_id);
