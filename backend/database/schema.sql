-- GitLock Complete Database Schema
-- Ready for PostgreSQL / Supabase / Neon / Cloud SQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    email character varying NOT NULL UNIQUE,
    full_name character varying,
    password_hash character varying,
    auth_provider character varying DEFAULT 'email',
    role character varying CHECK (role IN ('DEVELOPER', 'CLIENT', 'ADMIN')),
    mfa_secret character varying,
    reset_secret character varying,
    created_at timestamp with time zone DEFAULT now(),
    github_access_token text,
    google_id character varying,
    github_id character varying,
    avatar_url text,
    google_access_token text,
    bio text,
    payout_methods jsonb DEFAULT '[]'::jsonb,
    public_key text,
    wallet_address character varying(42)
);

CREATE TABLE IF NOT EXISTS public.projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title character varying NOT NULL,
    description text,
    budget numeric,
    client_id uuid REFERENCES public.users(id),
    developer_email character varying,
    developer_id uuid REFERENCES public.users(id),
    status character varying DEFAULT 'INVITE_SENT',
    created_at timestamp with time zone DEFAULT now(),
    pending_budget numeric,
    requirements text,
    attachments jsonb DEFAULT '[]'::jsonb,
    escrow_deal_id character varying(66),
    escrow_tx_hash character varying(66),
    escrow_amount numeric,
    escrow_funded boolean DEFAULT false,
    deployment_approved boolean DEFAULT false,
    transfer_verified boolean DEFAULT false,
    oracle_signature text,
    release_tx_hash character varying(66)
);

CREATE TABLE IF NOT EXISTS public.project_versions (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    encrypted_blob bytea NOT NULL,
    zip_hash character varying NOT NULL,
    commit_sha character varying,
    github_repo_url character varying,
    staging_url character varying,
    created_at timestamp with time zone DEFAULT now(),
    readme_preview text,
    repo_url text,
    encrypted_aes_key text
);

CREATE TABLE IF NOT EXISTS public.lock_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
    requester_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    request_type text NOT NULL,
    status text DEFAULT 'PENDING',
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    type character varying(50) DEFAULT 'GENERAL',
    reference_id text,
    link text,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    action character varying,
    details jsonb,
    timestamp timestamp with time zone DEFAULT now()
);