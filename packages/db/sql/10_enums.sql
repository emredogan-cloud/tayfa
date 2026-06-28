-- Postgres enums (Data Model §5). Mirror the const tuples in @tayfa/shared.
DO $$ BEGIN
  CREATE TYPE verification_level AS ENUM ('none','phone','id','id_live');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE verification_type AS ENUM ('phone','id','liveness'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE event_status AS ENUM ('draft','open','full','confirmed','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE event_visibility AS ENUM ('public','interest_match','invite'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE rsvp_status AS ENUM ('requested','approved','going','attended','no_show','left'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE event_member_role AS ENUM ('host','member'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE conversation_scope AS ENUM ('event','crew','dm'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE moderation_status AS ENUM ('pending','clear','flagged','removed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE report_target_type AS ENUM ('user','event','message'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE report_status AS ENUM ('open','triaged','actioned','dismissed','appealed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE report_severity AS ENUM ('safety_critical','high','standard'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE moderation_actor AS ENUM ('ai','human'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE moderation_action_type AS ENUM ('warn','remove','suspend','ban','clear'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE interest_domain AS ENUM ('music_genre','artist','tv_show','film','sport','hobby','cuisine','cause','game'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE interest_source AS ENUM ('onboarding','connected_account','inferred'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE consent_category AS ENUM ('location','marketing','connected_accounts','biometric_verification'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE subscription_store AS ENUM ('app_store','play_store','stripe'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE subscription_status AS ENUM ('active','in_trial','grace_period','expired','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE entitlement AS ENUM ('free','tayfa_plus'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE referral_state AS ENUM ('created','installed','activated','rewarded','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE platform AS ENUM ('ios','android','web'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
