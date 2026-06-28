-- Tayfa — extensions (TECH_DECISIONS §3). Single Postgres: relational + geo + vector.
CREATE EXTENSION IF NOT EXISTS postgis;      -- geography(Point,4326), ST_DWithin
CREATE EXTENSION IF NOT EXISTS vector;       -- pgvector: interest embeddings, HNSW
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- gen_random_uuid, crypt
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- taste-card interest search
